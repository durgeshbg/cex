import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getExchangeInfo, getTickers24hr } from "@/api/binance-client";
import { retryDelay, shouldRetry } from "@/api/query-retry";
import { toMarkets } from "@/models/market";

export type MarketStatus = "loading" | "ready" | "empty" | "error";

export function useMarkets() {
  const exchange = useQuery({
    queryKey: ["binance", "exchange-info"],
    queryFn: ({ signal }) => getExchangeInfo(signal),
    staleTime: 60 * 60_000,
    gcTime: 2 * 60 * 60_000,
    refetchOnWindowFocus: false,
    retry: shouldRetry,
    retryDelay,
  });

  const tickers = useQuery({
    queryKey: ["binance", "ticker-24hr"],
    queryFn: ({ signal }) => getTickers24hr(signal),
    enabled: exchange.isSuccess,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: shouldRetry,
    retryDelay,
  });

  const markets = useMemo(
    () =>
      exchange.data && tickers.data
        ? toMarkets(exchange.data, tickers.data)
        : [],
    [exchange.data, tickers.data],
  );
  const error = exchange.error ?? tickers.error;
  const status: MarketStatus = error
    ? "error"
    : exchange.isPending || tickers.isPending
      ? "loading"
      : markets.length
        ? "ready"
        : "empty";

  return {
    markets: status === "error" ? [] : markets,
    status,
    error,
    retry: () => (exchange.isError ? exchange.refetch() : tickers.refetch()),
  };
}
