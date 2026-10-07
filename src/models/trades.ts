import type { BinanceRecentTrade } from "@/api/binance-types";
import type { BinanceTradeEvent } from "@/api/binance-stream-types";

export type Trade = {
  id: number;
  price: number;
  quantity: number;
  time: number;
  takerSide: "buy" | "sell";
};

function toTrade(id: number, rawPrice: string, rawQuantity: string, time: number, buyerIsMaker: boolean): Trade | null {
  const price = Number(rawPrice);
  const quantity = Number(rawQuantity);
  if (!Number.isSafeInteger(id) || !Number.isFinite(price) || price <= 0 ||
    !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(time)) return null;
  // The maker rests in the book: buyer-is-maker means the taker sold; otherwise the taker bought.
  return { id, price, quantity, time, takerSide: buyerIsMaker ? "sell" : "buy" };
}

export function fromRestTrade(raw: BinanceRecentTrade) {
  return toTrade(raw.id, raw.price, raw.qty, raw.time, raw.isBuyerMaker);
}

export function fromStreamTrade(raw: BinanceTradeEvent) {
  return toTrade(raw.t, raw.p, raw.q, raw.T, raw.m);
}

export function mergeTrades(seed: Trade[], live: Trade[]): Trade[] {
  const byId = new Map(seed.map((trade) => [trade.id, trade]));
  live.forEach((trade) => byId.set(trade.id, trade));
  return [...byId.values()].sort((a, b) => b.id - a.id).slice(0, 100);
}
