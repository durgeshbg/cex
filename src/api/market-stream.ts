import {
  combinedEnvelopeSchema,
  klineEventSchema,
  tickerEventSchema,
} from "@/api/binance-stream-types";
import { toStreamCandle, type StreamCandle } from "@/models/klines";
import { toLiveTicker, type LiveTicker } from "@/models/ticker";
import type { Interval } from "@/store/market-store";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

let nextSessionId = 1;

export class MarketStreamSession {
  readonly id = nextSessionId++;
  readonly symbol: string;
  readonly interval: Interval;
  status: ConnectionStatus = "connecting";
  ticker: LiveTicker | null = null;
  epoch = 0;

  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private generation = 0;
  private attempts = 0;
  private openedAt = 0;
  private disposed = false;
  private readonly buffered = new Map<number, StreamCandle>();
  private readonly candleListeners = new Set<(candle: StreamCandle) => void>();
  private readonly notify: () => void;

  constructor(symbol: string, interval: Interval, notify: () => void) {
    this.symbol = symbol;
    this.interval = interval;
    this.notify = notify;
  }

  start() {
    this.connect(false);
  }

  bufferedCandles(): StreamCandle[] {
    return [...this.buffered.values()].sort(
      (a, b) => a.candle.time - b.candle.time,
    );
  }

  subscribeCandles(listener: (candle: StreamCandle) => void) {
    this.candleListeners.add(listener);
    return () => {
      this.candleListeners.delete(listener);
    };
  }

  dispose() {
    this.disposed = true;
    this.generation++;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    if (this.socket) {
      this.detach(this.socket);
      this.socket.close();
      this.socket = null;
    }
    this.buffered.clear();
    this.candleListeners.clear();
    this.status = "disconnected";
  }

  private connect(reconnect: boolean) {
    if (this.disposed) return;
    const generation = ++this.generation;
    this.status = reconnect ? "reconnecting" : "connecting";
    this.notify();

    const name = this.symbol.toLowerCase();
    const streams = `${name}@kline_${this.interval}/${name}@ticker`;
    let socket: WebSocket;
    try {
      socket = new WebSocket(
        `wss://data-stream.binance.vision:443/stream?streams=${encodeURIComponent(streams)}`,
      );
    } catch {
      this.status = "reconnecting";
      this.notify();
      this.scheduleReconnect();
      return;
    }
    this.socket = socket;

    socket.onopen = () => {
      if (!this.isCurrent(socket, generation)) return;
      this.openedAt = Date.now();
      if (reconnect) this.epoch++;
      this.status = "connected";
      this.notify();
    };
    socket.onmessage = (message) => {
      if (!this.isCurrent(socket, generation)) return;
      this.handleMessage(message.data);
    };
    socket.onerror = () => {
      if (this.isCurrent(socket, generation)) socket.close();
    };
    socket.onclose = () => {
      if (!this.isCurrent(socket, generation)) return;
      this.detach(socket);
      this.socket = null;
      if (this.openedAt && Date.now() - this.openedAt >= 30_000) {
        this.attempts = 0;
      }
      this.openedAt = 0;
      this.buffered.clear();
      this.ticker = null;
      this.status = "reconnecting";
      this.notify();
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    const base = Math.min(1000 * 2 ** Math.min(this.attempts++, 5), 30_000);
    const delay = Math.min(
      30_000,
      Math.round(base * (0.75 + Math.random() * 0.5)),
    );
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(true);
    }, delay);
  }

  private handleMessage(raw: unknown) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(String(raw));
    } catch {
      return;
    }
    const envelope = combinedEnvelopeSchema.safeParse(parsed);
    if (!envelope.success) return;
    if (envelope.data.stream === "!serverShutdown") {
      this.socket?.close();
      return;
    }

    const name = this.symbol.toLowerCase();
    if (envelope.data.stream === `${name}@kline_${this.interval}`) {
      const event = klineEventSchema.safeParse(envelope.data.data);
      if (
        !event.success ||
        event.data.s !== this.symbol ||
        event.data.k.i !== this.interval
      ) return;
      const candle = toStreamCandle(event.data);
      if (!candle) return;
      const prior = this.buffered.get(candle.candle.time);
      if (prior && prior.eventTime > candle.eventTime) return;
      this.buffered.set(candle.candle.time, candle);
      if (this.buffered.size > 600) {
        const oldest = this.buffered.keys().next().value;
        if (oldest !== undefined) this.buffered.delete(oldest);
      }
      this.candleListeners.forEach((listener) => listener(candle));
    } else if (envelope.data.stream === `${name}@ticker`) {
      const event = tickerEventSchema.safeParse(envelope.data.data);
      if (!event.success || event.data.s !== this.symbol) return;
      const ticker = toLiveTicker(event.data);
      if (!ticker || (this.ticker && ticker.eventTime < this.ticker.eventTime)) {
        return;
      }
      this.ticker = ticker;
      this.notify();
    }
  }

  private isCurrent(socket: WebSocket, generation: number) {
    return !this.disposed &&
      this.socket === socket &&
      this.generation === generation;
  }

  private detach(socket: WebSocket) {
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
  }
}

export type StreamSnapshot = {
  session: MarketStreamSession | null;
  status: ConnectionStatus;
  ticker: LiveTicker | null;
  epoch: number;
};

const disconnected: StreamSnapshot = {
  session: null,
  status: "disconnected",
  ticker: null,
  epoch: 0,
};

class MarketStreamManager {
  private active: MarketStreamSession | null = null;
  private leases = 0;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private snapshot: StreamSnapshot = disconnected;
  private readonly listeners = new Set<() => void>();

  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  acquire(symbol: string, interval: Interval) {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;

    if (
      !this.active ||
      this.active.symbol !== symbol ||
      this.active.interval !== interval
    ) {
      this.active?.dispose();
      const session = new MarketStreamSession(
        symbol,
        interval,
        () => this.publish(session),
      );
      this.active = session;
      this.leases = 0;
      this.publish(session);
      session.start();
    }
    const session = this.active;
    this.leases++;
    return () => {
      if (this.active !== session) return;
      this.leases--;
      if (this.leases > 0) return;
      // StrictMode's effect replay can reacquire this session before the timer runs.
      this.idleTimer = setTimeout(() => {
        this.idleTimer = null;
        if (this.active !== session || this.leases !== 0) return;
        session.dispose();
        this.active = null;
        this.snapshot = disconnected;
        this.listeners.forEach((listener) => listener());
      }, 0);
    };
  }

  private publish(session: MarketStreamSession) {
    if (this.active !== session) return;
    this.snapshot = {
      session,
      status: session.status,
      ticker: session.ticker,
      epoch: session.epoch,
    };
    this.listeners.forEach((listener) => listener());
  }
}

export const marketStreamManager = new MarketStreamManager();
export { disconnected as disconnectedStream };
