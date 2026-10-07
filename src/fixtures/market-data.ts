import { formatPrice, type Market } from "@/models/market";
import type { ChartKlines } from "@/models/klines";
import type { Interval } from "@/store/market-store";
import type { BookSnapshot } from "@/models/order-book";
import type { Trade } from "@/models/trades";

const bookAmounts = [0.184, 0.036, 0.621, 0.097, 0.318];
const tradeAmounts = [0.0124, 0.0861, 0.0048, 0.0302, 0.155, 0.0271];
const tradeTimes = [
  "14:28:43",
  "14:28:41",
  "14:28:39",
  "14:28:37",
  "14:28:34",
  "14:28:32",
];

export const demoMarkets: Market[] = [
  {
    symbol: "BTCUSDT", baseAsset: "BTC", quoteAsset: "USDT",
    lastPrice: 65000, price: "65,000.00", change: "+1.25%",
    volume: "1.2B", quoteVolume: 1_200_000_000,
    pricePrecision: 2, priceTick: 0.01, quantityPrecision: 5, quantityStep: 0.00001,
  },
  {
    symbol: "ETHUSDT", baseAsset: "ETH", quoteAsset: "USDT",
    lastPrice: 3200, price: "3,200.00", change: "-0.42%",
    volume: "420M", quoteVolume: 420_000_000,
    pricePrecision: 2, priceTick: 0.01, quantityPrecision: 4, quantityStep: 0.0001,
  },
];

export function getMarketFixture(market: Market) {
  const last = market.lastPrice;
  const step = market.priceTick;
  const rows = (side: "ask" | "bid") =>
    Array.from({ length: 20 }, (_, index) => {
      const amount = bookAmounts[index % bookAmounts.length];
      const price = last + (side === "ask" ? 1 : -1) * step * (index + 1);
      const quantity = Math.max(amount, market.quantityStep);
      return {
        price: formatPrice(price, market.pricePrecision),
        amount: quantity.toFixed(market.quantityPrecision),
        total: (price * quantity).toLocaleString("en-US", {
          maximumFractionDigits: 2,
        }),
      };
    });

  return {
    asks: rows("ask"),
    bids: rows("bid"),
    trades: tradeAmounts.map((amount, index) => ({
      time: tradeTimes[index],
      price: formatPrice(
        last + (index % 2 === 0 ? 0 : -step * (index + 1)),
        market.pricePrecision,
      ),
      amount: Math.max(amount, market.quantityStep).toFixed(
        market.quantityPrecision,
      ),
      side: index % 2 === 0 ? "buy" : "sell",
    })),
  };
}

export function getFixtureBook(market: Market): BookSnapshot {
  const fixture = getMarketFixture(market);
  let bidTotal = 0;
  let askTotal = 0;
  const bids = fixture.bids.map(({ price, amount }) => {
    const quantity = Number(amount);
    bidTotal += quantity;
    return { price: Number(price.replaceAll(",", "")), quantity, cumulativeQuantity: bidTotal };
  });
  const asks = fixture.asks.map(({ price, amount }) => {
    const quantity = Number(amount);
    askTotal += quantity;
    return { price: Number(price.replaceAll(",", "")), quantity, cumulativeQuantity: askTotal };
  });
  const spread = asks.length && bids.length ? asks[0].price - bids[0].price : null;
  return {
    lastUpdateId: 0, bids, asks, spread,
    spreadPercent: spread === null ? null : spread / asks[0].price * 100,
  };
}

export function getFixtureTrades(market: Market): Trade[] {
  return getMarketFixture(market).trades.map((trade, index) => ({
    id: index + 1,
    price: Number(trade.price.replaceAll(",", "")),
    quantity: Number(trade.amount),
    time: Date.parse("2025-01-01T" + trade.time + "Z"),
    takerSide: trade.side as "buy" | "sell",
  }));
}

export function getDemoKlines(market: Market, interval: Interval): ChartKlines {
  const offsets = [-0.012, -0.006, -0.009, -0.002, 0.004, 0.008, 0.003, 0.011, 0.006, 0.014, 0.009, 0];
  const secondsByInterval: Record<Interval, number> = {
    "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "1d": 86400,
  };
  const step = secondsByInterval[interval];
  const now = Math.floor(Date.now() / 1000 / step) * step;
  const candles = offsets.map((offset, index) => {
    const previousOffset = offsets[Math.max(0, index - 1)];
    const open = market.lastPrice * (1 + previousOffset);
    const close = market.lastPrice * (1 + offset);
    const time = (now - (offsets.length - index) * step) as ChartKlines["candles"][number]["time"];
    return {
      time, open, high: Math.max(open, close) * 1.002,
      low: Math.min(open, close) * 0.998, close,
    };
  });
  return {
    candles,
    volume: candles.map((candle, index) => ({
      time: candle.time,
      value: 0.2 + (index % 5) * 0.17,
      color: candle.close >= candle.open ? "#25bb8b66" : "#f0556166",
    })),
  };
}
