import { formatPrice, type Market } from "@/models/market";

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

export function getMarketFixture(market: Market) {
  const last = market.lastPrice;
  const step = market.priceTick;
  const rows = (side: "ask" | "bid") =>
    bookAmounts.map((amount, index) => {
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
    asks: rows("ask").reverse(),
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
