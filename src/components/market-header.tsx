import { HeaderStat } from "@/components/header-stat";
import type { Market } from "@/fixtures/market-data";
import { gainClass, labelClass, lossClass } from "@/lib/terminal-styles";

export function MarketHeader({ market }: { market: Market }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-b border-slate-800 bg-[#0b0e13] px-4 py-4 sm:px-5">
      <div>
        <p className={labelClass}>Spot · Fixture market</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-100">
          {market.baseAsset}
          <span className="font-normal text-slate-500">/USDT</span>
        </h1>
      </div>
      <div className="flex flex-wrap gap-5 sm:gap-7">
        <HeaderStat label="Last price" value={market.price} />
        <HeaderStat
          label="24h change"
          value={market.change}
          color={market.change.startsWith("+") ? gainClass : lossClass}
        />
        <HeaderStat
          label="24h volume"
          value={market.volume}
          className="hidden sm:grid"
        />
      </div>
    </header>
  );
}
