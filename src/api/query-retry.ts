import { BinanceHttpError } from "@/api/binance-client";
import { ZodError } from "zod";

export function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ZodError) return false;
  if (error instanceof BinanceHttpError) {
    if (error.status === 418) return false;
    if (error.status === 429) {
      return (
        failureCount < 1 &&
        error.retryAfterMs !== null &&
        error.retryAfterMs <= 30_000
      );
    }
    if (error.status < 500) return false;
  }
  return failureCount < 2;
}

export function retryDelay(attempt: number, error: Error): number {
  if (error instanceof BinanceHttpError && error.status === 429) {
    return error.retryAfterMs ?? 30_000;
  }
  return Math.min(1000 * 2 ** attempt, 4000);
}
