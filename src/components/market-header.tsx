import { HeaderStat } from "@/components/header-stat";
import { formatPrice, type Market } from "@/models/market";
import type { LiveTicker } from "@/models/ticker";
import { gainClass, labelClass, lossClass } from "@/lib/terminal-styles";

export function MarketHeader({
  market,
  status,
  ticker,
}: {
  market?: Market;
  status: "loading" | "ready" | "empty" | "error";
  ticker?: LiveTicker | null;
}) {
  const live = ticker?.symbol === market?.symbol ? ticker : null;
  const change = live
    ? `${live.changePercent >= 0 ? "+" : ""}${live.changePercent.toFixed(2)}%`
    : market?.change;
  const volume = live
    ? new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 2,
      }).format(live.quoteVolume)
    : market?.volume;
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-b border-slate-800 bg-[#0b0e13] px-4 py-4 sm:px-5">
      <div>
        <p className={labelClass}>
          Spot · Binance {live ? "live ticker" : "REST snapshot"}
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-100">
          {market ? (
            <>
              {market.baseAsset}
              <span className="font-normal text-slate-500">/USDT</span>
            </>
          ) : status === "loading" ? (
            "Loading markets…"
          ) : status === "empty" ? (
            "No USDT markets"
          ) : (
            "Market data unavailable"
          )}
        </h1>
      </div>
      {market && (
        <div className="flex flex-wrap gap-5 sm:gap-7">
          <HeaderStat
            label="Last price"
            value={live ? formatPrice(live.lastPrice, market.pricePrecision) : market.price}
          />
          <HeaderStat
            label="24h change"
            value={change ?? market.change}
            color={(change ?? market.change).startsWith("+") ? gainClass : lossClass}
          />
          <HeaderStat
            label="24h volume"
            value={volume ?? market.volume}
            className="hidden sm:grid"
          />
        </div>
      )}
    </header>
  );
}
