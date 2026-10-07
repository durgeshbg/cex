import type {
  CandlestickData,
  HistogramData,
  UTCTimestamp,
} from "lightweight-charts";
import type { BinanceKline } from "@/api/binance-types";

export type ChartKlines = {
  candles: CandlestickData<UTCTimestamp>[];
  volume: HistogramData<UTCTimestamp>[];
};

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
      volume: {
        time: candle.time,
        value: volume,
        color: close >= open ? "#25bb8b66" : "#f0556166",
      },
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
