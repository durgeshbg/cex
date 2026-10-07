import { useQuery } from "@tanstack/react-query";
import { getRecentTrades } from "@/api/binance-client";
import { retryDelay, shouldRetry } from "@/api/query-retry";
import { fromRestTrade } from "@/models/trades";

export function useRecentTrades(symbol: string, sessionId: number | undefined, epoch: number) {
  return useQuery({
    queryKey: ["binance", "recent-trades", symbol, sessionId, epoch],
    queryFn: async ({ signal }) =>
      (await getRecentTrades(symbol, signal)).flatMap((raw) => {
        const trade = fromRestTrade(raw);
        return trade ? [trade] : [];
      }),
    enabled: sessionId !== undefined,
    staleTime: 10_000,
    gcTime: 60_000,
    refetchOnWindowFocus: false,
    retry: shouldRetry,
    retryDelay,
  });
}
