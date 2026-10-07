import type { BinanceTickerEvent } from "@/api/binance-stream-types";

export type LiveTicker = {
  symbol: string;
  eventTime: number;
  lastPrice: number;
  changePercent: number;
  quoteVolume: number;
};

export function toLiveTicker(event: BinanceTickerEvent): LiveTicker | null {
  const lastPrice = Number(event.c);
  const changePercent = Number(event.P);
  const quoteVolume = Number(event.q);
  if (![lastPrice, changePercent, quoteVolume].every(Number.isFinite) || lastPrice <= 0) return null;
  return { symbol: event.s, eventTime: event.E, lastPrice, changePercent, quoteVolume };
}
