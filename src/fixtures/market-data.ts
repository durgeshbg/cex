export type Market = {
  symbol: string;
  baseAsset: string;
  price: string;
  change: string;
  volume: string;
};

export const markets: Market[] = [
  {
    symbol: "BTCUSDT",
    baseAsset: "BTC",
    price: "67,842.18",
    change: "+1.42%",
    volume: "1.84B",
  },
  {
    symbol: "ETHUSDT",
    baseAsset: "ETH",
    price: "3,786.64",
    change: "+0.87%",
    volume: "912.6M",
  },
  {
    symbol: "SOLUSDT",
    baseAsset: "SOL",
    price: "172.53",
    change: "-0.68%",
    volume: "428.1M",
  },
  {
    symbol: "BNBUSDT",
    baseAsset: "BNB",
    price: "591.80",
    change: "+0.31%",
    volume: "116.3M",
  },
  {
    symbol: "XRPUSDT",
    baseAsset: "XRP",
    price: "0.6184",
    change: "-1.21%",
    volume: "84.9M",
  },
  {
    symbol: "DOGEUSDT",
    baseAsset: "DOGE",
    price: "0.14327",
    change: "+2.08%",
    volume: "71.2M",
  },
];

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
  const last = Number(market.price.replaceAll(",", ""));
  const decimals = market.price.split(".")[1]?.length ?? 2;
  const step = Math.max(last * 0.00001, 10 ** -decimals);
  const formatPrice = (value: number) =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  const rows = (side: "ask" | "bid") =>
    bookAmounts.map((amount, index) => {
      const price = last + (side === "ask" ? 1 : -1) * step * (index + 1);
      return {
        price: formatPrice(price),
        amount: amount.toFixed(3),
        total: (price * amount).toLocaleString("en-US", {
          maximumFractionDigits: 2,
        }),
      };
    });

  return {
    asks: rows("ask").reverse(),
    bids: rows("bid"),
    trades: tradeAmounts.map((amount, index) => ({
      time: tradeTimes[index],
      price: formatPrice(last + (index % 2 === 0 ? 0 : -step * (index + 1))),
      amount: amount.toFixed(4),
      side: index % 2 === 0 ? "buy" : "sell",
    })),
  };
}

export const fixtureCandles = [
  [67815, 67870, 67788, 67842],
  [67842, 67895, 67831, 67876],
  [67876, 67890, 67810, 67828],
  [67828, 67858, 67816, 67851],
  [67851, 67914, 67836, 67896],
  [67896, 67904, 67843, 67861],
  [67861, 67936, 67852, 67918],
  [67918, 67925, 67867, 67880],
  [67880, 67948, 67871, 67931],
  [67931, 67968, 67911, 67954],
  [67954, 67962, 67898, 67912],
  [67912, 67943, 67904, 67932],
];
