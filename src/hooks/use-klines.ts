import { useQuery } from "@tanstack/react-query";
import { getKlines } from "@/api/binance-client";
import { retryDelay, shouldRetry } from "@/api/query-retry";
import { toChartKlines } from "@/models/klines";
import type { Interval } from "@/store/market-store";

export function useKlines(symbol: string, interval: Interval, sessionId: number, epoch: number) {
  return useQuery({
    queryKey: ["binance", "klines", symbol, interval, sessionId, epoch],
    queryFn: async ({ signal }) => ({
      symbol,
      interval,
      sessionId,
      epoch,
      ...toChartKlines(await getKlines(symbol, interval, signal)),
    }),
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: shouldRetry,
    retryDelay,
  });
}
