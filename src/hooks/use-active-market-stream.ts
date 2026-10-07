import { useEffect, useSyncExternalStore } from "react";
import { disconnectedStream, marketStreamManager } from "@/api/market-stream";
import type { Interval } from "@/store/market-store";

export function useActiveMarketStream(
  symbol: string | undefined,
  interval: Interval,
) {
  const snapshot = useSyncExternalStore(
    marketStreamManager.subscribe,
    marketStreamManager.getSnapshot,
    () => disconnectedStream,
  );

  useEffect(() => {
    if (!symbol) return;
    return marketStreamManager.acquire(symbol, interval);
  }, [symbol, interval]);

  return snapshot.session?.symbol === symbol
    ? snapshot
    : disconnectedStream;
}
