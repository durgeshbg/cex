import type {
  CandlestickData,
  HistogramData,
  UTCTimestamp,
} from "lightweight-charts";
import type { BinanceKline } from "@/api/binance-types";
import type { BinanceKlineEvent } from "@/api/binance-stream-types";

export type ChartKlines = {
  candles: CandlestickData<UTCTimestamp>[];
  volume: HistogramData<UTCTimestamp>[];
};

export type StreamCandle = {
  eventTime: number;
  candle: CandlestickData<UTCTimestamp>;
  volume: HistogramData<UTCTimestamp>;
};

function volumeBar(
  time: UTCTimestamp,
  value: number,
  open: number,
  close: number,
): HistogramData<UTCTimestamp> {
  return {
    time,
    value,
    color: close >= open ? "#25bb8b66" : "#f0556166",
  };
}

export function toStreamCandle(event: BinanceKlineEvent): StreamCandle | null {
  const time = Math.floor(event.k.t / 1000);
  const [open, high, low, close, volume] = [
    event.k.o, event.k.h, event.k.l, event.k.c, event.k.v,
  ].map(Number);
  if (
    !Number.isSafeInteger(time) ||
    ![open, high, low, close, volume].every(Number.isFinite)
  ) return null;

  const candle = { time: time as UTCTimestamp, open, high, low, close };
  return {
    eventTime: event.E,
    candle,
    volume: volumeBar(candle.time, volume, open, close),
  };
}

export function mergeChartKlines(
  history: ChartKlines,
  buffered: StreamCandle[],
): ChartKlines {
  const byTime = new Map<
    number,
    { candle: CandlestickData<UTCTimestamp>; volume: HistogramData<UTCTimestamp> }
  >();
  history.candles.forEach((candle, index) => {
    byTime.set(candle.time, { candle, volume: history.volume[index] });
  });
  buffered.forEach(({ candle, volume }) => {
    byTime.set(candle.time, { candle, volume });
  });
  const sorted = [...byTime.entries()].sort(([a], [b]) => a - b).slice(-500);
  return {
    candles: sorted.map(([, value]) => value.candle),
    volume: sorted.map(([, value]) => value.volume),
  };
}

export function toChartKlines(raw: BinanceKline[]): ChartKlines {
  const byTime = new Map<
    number,
    {
      candle: CandlestickData<UTCTimestamp>;
      volume: HistogramData<UTCTimestamp>;
    }
  >();

  for (const row of raw) {
    const time = Math.floor(row[0] / 1000);
    const [open, high, low, close, volume] = row.slice(1, 6).map(Number);
    if (
      !Number.isSafeInteger(time) ||
      ![open, high, low, close, volume].every(Number.isFinite)
    ) continue;

    const candle = { time: time as UTCTimestamp, open, high, low, close };
    byTime.set(time, {
      candle,
      volume: volumeBar(candle.time, volume, open, close),
    });
  }

  const sorted = [...byTime.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, data]) => data);
  return {
    candles: sorted.map(({ candle }) => candle),
    volume: sorted.map(({ volume }) => volume),
  };
}
