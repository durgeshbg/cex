import { useEffect, useState } from "react";
import { Search, Star } from "lucide-react";
import { BinanceHttpError } from "@/api/binance-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gainClass, labelClass, lossClass } from "@/lib/terminal-styles";
import type { Market } from "@/models/market";
import { useMarketStore } from "@/store/market-store";

type MarketSidebarProps = {
  markets: Market[];
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
  status: "loading" | "ready" | "empty" | "error";
  error: Error | null;
  onRetry: () => void;
};

export function MarketSidebar({
  markets,
  selectedSymbol,
  onSelect,
  status,
  error,
  onRetry,
}: MarketSidebarProps) {
  const [search, setSearch] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [now, setNow] = useState(0);
  const favorites = useMarketStore((state) => state.favorites);
  const toggleFavorite = useMarketStore((state) => state.toggleFavorite);
  const retryAt = error instanceof BinanceHttpError ? error.retryAt : null;
  const waitSeconds =
    retryAt && now ? Math.max(0, Math.ceil((retryAt - now) / 1000)) : 0;

  useEffect(() => {
    if (!retryAt) return;
    const firstTick = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(timer);
    };
  }, [retryAt]);

  const visibleMarkets = markets.filter((market) =>
    (!favoritesOnly || favorites.includes(market.symbol)) &&
    `${market.baseAsset}/${market.quoteAsset} ${market.symbol}`.toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  return (
    <aside className="flex min-h-0 flex-col bg-card lg:h-full">
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <div>
          <p className={labelClass}>Markets</p>
          <h2 className="mt-1 text-sm font-semibold text-slate-100">
            USDT pairs
          </h2>
        </div>
        <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
          Spot
        </span>
      </div>
      <label className="relative mx-3 mb-3 block">
        <span className="sr-only">Search markets</span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-2.5 left-2.5 size-3.5 text-slate-500"
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search markets"
          className="h-9 border-border bg-muted pl-8 text-xs text-foreground placeholder:text-muted-foreground"
        />
      </label>
      <div className="flex gap-1 px-3 pb-3">
        <Button variant={favoritesOnly ? "ghost" : "secondary"} size="sm"
          aria-pressed={!favoritesOnly} onClick={() => setFavoritesOnly(false)}>All</Button>
        <Button variant={favoritesOnly ? "secondary" : "ghost"} size="sm"
          aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly(true)}>
          <Star className="size-3" /> Favorites ({favorites.length})
        </Button>
      </div>
      <div className="hidden grid-cols-[1fr_1fr_56px] gap-1 px-4 pb-2 text-[10px] text-slate-500 sm:grid">
        <span>Pair</span>
        <span className="text-right">Last price</span>
        <span className="text-right">24h</span>
      </div>
      <div className="grid max-h-56 min-h-0 auto-rows-min content-start grid-cols-2 overflow-y-auto sm:max-h-[420px] sm:grid-cols-1 lg:max-h-none lg:flex-1">
        {status === "loading" && (
          <p className="col-span-full px-4 py-6 text-center text-xs text-slate-500">
            Loading Binance markets…
          </p>
        )}
        {status === "error" && (
          <div className="col-span-full space-y-3 px-4 py-6 text-center text-xs text-slate-400">
            <p>
              {error instanceof BinanceHttpError &&
              (error.status === 429 || error.status === 418)
                ? `Binance rate limited requests${waitSeconds ? `. Retry in ${waitSeconds}s.` : "."}`
                : (error?.message ?? "Binance market data is unavailable.")}
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={Boolean(retryAt && (now === 0 || waitSeconds > 0))}
              onClick={onRetry}
            >
              Retry
            </Button>
          </div>
        )}
        {visibleMarkets.map((market) => (
          <div key={market.symbol} className="relative min-w-0 px-2 py-0.5">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => onSelect(market.symbol)}
            aria-pressed={market.symbol === selectedSymbol}
            className={`h-auto w-full justify-start rounded-lg py-2.5 pr-9 pl-2.5 text-left hover:bg-muted ${
              market.symbol === selectedSymbol
                ? "border-primary/30 bg-primary/12"
                : "border-transparent"
            }`}
          >
            <span className="grid w-full grid-cols-[1fr_1fr] items-center gap-1 sm:grid-cols-[1fr_1fr_56px]">
              <span className="text-xs font-semibold text-slate-100">
                {market.baseAsset}
                <span className="ml-1 text-[10px] font-normal text-slate-500">
                  /USDT
                </span>
              </span>
              <span className="text-right text-[11px] text-slate-200 tabular-nums">
                {market.price}
              </span>
              <span
                className={`hidden text-right text-[11px] tabular-nums sm:block ${market.change.startsWith("+") ? gainClass : lossClass}`}
              >
                {market.change}
              </span>
            </span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${favorites.includes(market.symbol) ? "Remove" : "Add"} ${market.baseAsset}/USDT ${favorites.includes(market.symbol) ? "from" : "to"} favorites`}
            aria-pressed={favorites.includes(market.symbol)}
            onClick={() => toggleFavorite(market.symbol)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 hover:text-primary"
          >
            <Star className={`size-3.5 ${favorites.includes(market.symbol) ? "fill-primary text-primary" : ""}`} />
          </Button>
          </div>
        ))}
        {status === "empty" && (
          <p className="col-span-full px-4 py-6 text-center text-xs text-slate-500">
            No trading Spot USDT markets are available.
          </p>
        )}
        {status === "ready" && visibleMarkets.length === 0 && (
          <p className="col-span-full px-4 py-6 text-center text-xs text-slate-500">
            {favoritesOnly && favorites.length === 0 ? "No favorites yet. Star a market from All." : "No matching markets."}
          </p>
        )}
      </div>
    </aside>
  );
}
