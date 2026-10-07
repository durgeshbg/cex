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

export type BinanceKlineEvent = z.infer<typeof klineEventSchema>;
export type BinanceTickerEvent = z.infer<typeof tickerEventSchema>;
