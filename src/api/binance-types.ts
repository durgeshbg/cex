import { z } from "zod";

const symbolFilterSchema = z.object({
  filterType: z.string(),
  tickSize: z.string().optional(),
  stepSize: z.string().optional(),
});

export const exchangeInfoSchema = z.object({
  symbols: z.array(
    z.object({
      symbol: z.string(),
      status: z.string(),
      baseAsset: z.string(),
      quoteAsset: z.string(),
      isSpotTradingAllowed: z.boolean(),
      filters: z.array(symbolFilterSchema),
    }),
  ),
});

export const tickers24hrSchema = z.array(
  z.object({
    symbol: z.string(),
    lastPrice: z.string(),
    priceChangePercent: z.string(),
    quoteVolume: z.string(),
  }),
);

export type BinanceExchangeInfo = z.infer<typeof exchangeInfoSchema>;
export type BinanceTicker24hr = z.infer<typeof tickers24hrSchema>[number];
