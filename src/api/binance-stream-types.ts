import { z } from "zod";

export const combinedEnvelopeSchema = z.object({
  stream: z.string(),
  data: z.unknown(),
});

export const klineEventSchema = z.object({
  e: z.literal("kline"),
  E: z.number(),
  s: z.string(),
  k: z.object({
    t: z.number(),
    i: z.string(),
    o: z.string(),
    h: z.string(),
    l: z.string(),
    c: z.string(),
    v: z.string(),
  }),
});

export const tickerEventSchema = z.object({
  e: z.literal("24hrTicker"),
  E: z.number(),
  s: z.string(),
  c: z.string(),
  P: z.string(),
  q: z.string(),
});

// Partial depth is a complete top-20 snapshot, not a depthUpdate delta.
export const partialDepthSchema = z.object({
  lastUpdateId: z.number(),
  bids: z.array(z.tuple([z.string(), z.string()])),
  asks: z.array(z.tuple([z.string(), z.string()])),
});

export const tradeEventSchema = z.object({
  e: z.literal("trade"),
  s: z.string(),
  t: z.number(),
  p: z.string(),
  q: z.string(),
  T: z.number(),
  m: z.boolean(),
});

export type BinanceKlineEvent = z.infer<typeof klineEventSchema>;
export type BinanceTickerEvent = z.infer<typeof tickerEventSchema>;
export type BinancePartialDepth = z.infer<typeof partialDepthSchema>;
export type BinanceTradeEvent = z.infer<typeof tradeEventSchema>;
