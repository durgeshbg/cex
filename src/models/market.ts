import type {
  BinanceExchangeInfo,
  BinanceTicker24hr,
} from "@/api/binance-types";

export type Market = {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  lastPrice: number;
  price: string;
  change: string;
  volume: string;
  quoteVolume: number;
  pricePrecision: number;
  priceTick: number;
  quantityPrecision: number;
  quantityStep: number;
};

function precisionFromStep(step: string): number {
  const fraction = step.split(".")[1] ?? "";
  return fraction.replace(/0+$/, "").length;
}

export function formatPrice(value: number, precision: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}

export function toMarkets(
  exchangeInfo: BinanceExchangeInfo,
  tickers: BinanceTicker24hr[],
): Market[] {
  const tickerBySymbol = new Map(
    tickers.map((ticker) => [ticker.symbol, ticker]),
  );

  return exchangeInfo.symbols
    .flatMap((symbol) => {
      if (
        symbol.status !== "TRADING" ||
        !symbol.isSpotTradingAllowed ||
        symbol.quoteAsset !== "USDT"
      )
        return [];

      const ticker = tickerBySymbol.get(symbol.symbol);
      const priceFilter = symbol.filters.find(
        (filter) => filter.filterType === "PRICE_FILTER",
      );
      const lotFilter = symbol.filters.find(
        (filter) => filter.filterType === "LOT_SIZE",
      );
      const lastPrice = Number(ticker?.lastPrice);
      const quoteVolume = Number(ticker?.quoteVolume);
      const changePercent = Number(ticker?.priceChangePercent);
      if (
        !ticker ||
        !priceFilter?.tickSize ||
        !lotFilter?.stepSize ||
        !Number.isFinite(Number(priceFilter.tickSize)) ||
        Number(priceFilter.tickSize) <= 0 ||
        !Number.isFinite(Number(lotFilter.stepSize)) ||
        Number(lotFilter.stepSize) <= 0 ||
        !Number.isFinite(lastPrice) ||
        lastPrice <= 0 ||
        !Number.isFinite(quoteVolume) ||
        !Number.isFinite(changePercent)
      )
        return [];

      const pricePrecision = precisionFromStep(priceFilter.tickSize);
      const quantityPrecision = precisionFromStep(lotFilter.stepSize);
      return [
        {
          symbol: symbol.symbol,
          baseAsset: symbol.baseAsset,
          quoteAsset: symbol.quoteAsset,
          lastPrice,
          price: formatPrice(lastPrice, pricePrecision),
          change: `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`,
          volume: new Intl.NumberFormat("en-US", {
            notation: "compact",
            maximumFractionDigits: 2,
          }).format(quoteVolume),
          quoteVolume,
          pricePrecision,
          priceTick: Number(priceFilter.tickSize),
          quantityPrecision,
          quantityStep: Number(lotFilter.stepSize),
        },
      ];
    })
    .sort((a, b) => b.quoteVolume - a.quoteVolume);
}
