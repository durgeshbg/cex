import type { BinancePartialDepth } from "@/api/binance-stream-types";

export type BookLevel = {
  price: number;
  quantity: number;
  cumulativeQuantity: number;
};

export type BookSnapshot = {
  lastUpdateId: number;
  bids: BookLevel[];
  asks: BookLevel[];
  spread: number | null;
  spreadPercent: number | null;
};

function toLevels(raw: BinancePartialDepth["bids"], descending: boolean): BookLevel[] {
  let cumulativeQuantity = 0;
  return raw
    .map(([rawPrice, rawQuantity]) => ({
      price: Number(rawPrice),
      quantity: Number(rawQuantity),
    }))
    .filter(({ price, quantity }) =>
      Number.isFinite(price) && price > 0 && Number.isFinite(quantity) && quantity > 0,
    )
    .sort((a, b) => descending ? b.price - a.price : a.price - b.price)
    .slice(0, 20)
    .map(({ price, quantity }) => ({
      price,
      quantity,
      cumulativeQuantity: (cumulativeQuantity += quantity),
    }));
}

export function toBookSnapshot(raw: BinancePartialDepth): BookSnapshot {
  const bids = toLevels(raw.bids, true);
  const asks = toLevels(raw.asks, false);
  const spread = bids.length && asks.length ? asks[0].price - bids[0].price : null;
  return {
    lastUpdateId: raw.lastUpdateId,
    bids,
    asks,
    spread,
    spreadPercent: spread === null ? null : spread / asks[0].price * 100,
  };
}
