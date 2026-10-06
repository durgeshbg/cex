import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { markets } from "@/fixtures/market-data";
import { gainClass, labelClass, lossClass } from "@/lib/terminal-styles";

type MarketSidebarProps = {
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
};

export function MarketSidebar({
  selectedSymbol,
  onSelect,
}: MarketSidebarProps) {
  const [search, setSearch] = useState("");
  const visibleMarkets = markets.filter((market) =>
    market.symbol.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <aside className="flex min-h-0 flex-col border-b border-slate-800 bg-[#0d1015] lg:border-r lg:border-b-0">
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <div>
          <p className={labelClass}>Markets</p>
          <h2 className="mt-1 text-sm font-semibold text-slate-100">
            USDT pairs
          </h2>
        </div>
        <span className="rounded border border-amber-800/70 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
          Fixture
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
          className="h-9 border-slate-700 bg-[#151920] pl-8 text-xs text-slate-100 placeholder:text-slate-500"
        />
      </label>
      <div className="hidden grid-cols-[1fr_1fr_56px] gap-1 px-4 pb-2 text-[10px] text-slate-500 sm:grid">
        <span>Pair</span>
        <span className="text-right">Last price</span>
        <span className="text-right">24h</span>
      </div>
      <div className="grid max-h-56 grid-cols-2 overflow-y-auto sm:max-h-none sm:grid-cols-1">
        {visibleMarkets.map((market) => (
          <Button
            key={market.symbol}
            variant="ghost"
            size="lg"
            onClick={() => onSelect(market.symbol)}
            aria-pressed={market.symbol === selectedSymbol}
            className={`h-auto w-full justify-start rounded-none border-l-2 px-3 py-3 text-left hover:bg-slate-800/60 sm:px-4 ${
              market.symbol === selectedSymbol
                ? "border-amber-400 bg-slate-800/70"
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
        ))}
        {visibleMarkets.length === 0 && (
          <p className="col-span-full px-4 py-6 text-center text-xs text-slate-500">
            No fixture markets found.
          </p>
        )}
      </div>
    </aside>
  );
}
