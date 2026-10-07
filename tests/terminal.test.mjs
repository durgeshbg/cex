import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

let vite;
let mergeChartKlines;
let mergeTrades;
let MarketStreamSession;

before(async () => {
  vite = await createServer({ configFile: "vite.config.ts", server: { middlewareMode: true }, appType: "custom" });
  ({ mergeChartKlines } = await vite.ssrLoadModule("/src/models/klines.ts"));
  ({ mergeTrades } = await vite.ssrLoadModule("/src/models/trades.ts"));
  ({ MarketStreamSession } = await vite.ssrLoadModule("/src/api/market-stream.ts"));
});

after(async () => {
  await vite?.close();
});

test("candle history merges buffered updates by open time, sorted and unique", () => {
  const candle = (time, close) => ({ time, open: close - 1, high: close + 1, low: close - 2, close });
  const volume = (time, value) => ({ time, value, color: "green" });
  const history = {
    candles: [candle(20, 21), candle(10, 11), candle(20, 22)],
    volume: [volume(20, 2), volume(10, 1), volume(20, 3)],
  };
  const result = mergeChartKlines(history, [
    { candle: candle(15, 16), volume: volume(15, 4) },
    { candle: candle(20, 23), volume: volume(20, 5) },
    { candle: candle(5, 6), volume: volume(5, 1) },
  ]);
  assert.deepEqual(result.candles.map(({ time }) => time), [5, 10, 15, 20]);
  assert.equal(result.candles.at(-1).close, 23);
  assert.equal(result.volume.at(-1).value, 5);
});

test("trade merge deduplicates IDs, prefers live updates, sorts newest first, and caps at 100", () => {
  const seed = Array.from({ length: 100 }, (_, index) => ({ id: index + 1, price: 1, quantity: 1, time: index, takerSide: "buy" }));
  const live = [
    { id: 100, price: 9, quantity: 2, time: 200, takerSide: "sell" },
    { id: 101, price: 10, quantity: 3, time: 201, takerSide: "buy" },
  ];
  const result = mergeTrades(seed, live);
  assert.equal(result.length, 100);
  assert.equal(result[0].id, 101);
  assert.equal(result[1].id, 100);
  assert.equal(result[1].price, 9);
  assert.equal(new Set(result.map(({ id }) => id)).size, result.length);
});

test("socket reconnect ignores obsolete callbacks and disposal detaches handlers and timers", () => {
  const originalWebSocket = globalThis.WebSocket;
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  const timers = new Map();
  const cleared = [];
  let timerId = 0;
  class FakeWebSocket {
    static OPEN = 1;
    static CONNECTING = 0;
    static instances = [];
    readyState = 0;
    onopen = null;
    onmessage = null;
    onerror = null;
    onclose = null;
    constructor(url) { this.url = url; FakeWebSocket.instances.push(this); }
    send() {}
    close() { this.readyState = 3; }
  }
  try {
    globalThis.WebSocket = FakeWebSocket;
    globalThis.setTimeout = (callback) => { const id = ++timerId; timers.set(id, callback); return id; };
    globalThis.clearTimeout = (id) => { cleared.push(id); timers.delete(id); };
    const session = new MarketStreamSession("BTCUSDT", "1m", () => {});
    session.start();
    const first = FakeWebSocket.instances[0];
    const obsoleteOpen = first.onopen;
    first.onopen();
    first.readyState = 3;
    first.onclose();
    const reconnectTimer = [...timers.keys()][0];
    assert.ok(reconnectTimer);
    timers.get(reconnectTimer)();
    const second = FakeWebSocket.instances[1];
    assert.equal(session.status, "reconnecting");
    obsoleteOpen();
    assert.equal(session.status, "reconnecting");
    const secondHandlers = [second.onopen, second.onmessage, second.onerror, second.onclose];
    second.onopen();
    session.dispose();
    assert.equal(second.readyState, 3);
    assert.deepEqual([second.onopen, second.onmessage, second.onerror, second.onclose], [null, null, null, null]);
    assert.ok(secondHandlers.every((handler) => typeof handler === "function"));

    const pendingSession = new MarketStreamSession("ETHUSDT", "5m", () => {});
    pendingSession.start();
    const pendingSocket = FakeWebSocket.instances[2];
    pendingSocket.readyState = 3;
    pendingSocket.onclose();
    const pendingTimer = [...timers.keys()].at(-1);
    assert.ok(pendingTimer);
    pendingSession.dispose();
    assert.ok(cleared.includes(pendingTimer));
    assert.ok(cleared.length >= 1);
  } finally {
    globalThis.WebSocket = originalWebSocket;
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  }
});
