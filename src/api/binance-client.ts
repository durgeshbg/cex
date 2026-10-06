import { exchangeInfoSchema, tickers24hrSchema } from "@/api/binance-types";

const BASE_URL = "https://data-api.binance.vision";

export class BinanceHttpError extends Error {
  readonly status: number;
  readonly retryAfterMs: number | null;
  readonly retryAt: number | null;

  constructor(
    status: number,
    message: string,
    retryAfterMs: number | null,
    retryAt: number | null,
  ) {
    super(message);
    this.name = "BinanceHttpError";
    this.status = status;
    this.retryAfterMs = retryAfterMs;
    this.retryAt = retryAt;
  }
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
}

async function getJson(path: string, signal: AbortSignal): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { signal });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error("Binance could not be reached from this browser.", {
      cause: error,
    });
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      msg?: unknown;
    } | null;
    const retryAfterMs =
      parseRetryAfter(response.headers.get("Retry-After")) ??
      (response.status === 418
        ? 5 * 60_000
        : response.status === 429
          ? 60_000
          : null);
    const message =
      typeof body?.msg === "string" ? body.msg : response.statusText;
    throw new BinanceHttpError(
      response.status,
      `Binance returned HTTP ${response.status}${message ? `: ${message}` : "."}`,
      retryAfterMs,
      retryAfterMs === null ? null : Date.now() + retryAfterMs,
    );
  }

  return response.json();
}

export async function getExchangeInfo(signal: AbortSignal) {
  return exchangeInfoSchema.parse(
    await getJson("/api/v3/exchangeInfo", signal),
  );
}

export async function getTickers24hr(signal: AbortSignal) {
  return tickers24hrSchema.parse(await getJson("/api/v3/ticker/24hr", signal));
}
