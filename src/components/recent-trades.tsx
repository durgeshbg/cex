import { PanelHeading } from "@/components/panel-heading";
import { getMarketFixture } from "@/fixtures/market-data";
import type { Market } from "@/models/market";
import { gainClass, lossClass } from "@/lib/terminal-styles";

export function RecentTrades({ market }: { market: Market }) {
  const { trades } = getMarketFixture(market);
  return (
    <section className="min-w-0 bg-[#0d1015]">
      <PanelHeading title="Recent trades" />
      <div className="grid grid-cols-[1fr_.8fr_.75fr] gap-2 px-4 pb-2 text-[10px] text-slate-500">
        <span>Price</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Time</span>
      </div>
      {trades.map((trade, index) => (
        <div
          key={index}
          className="grid grid-cols-[1fr_.8fr_.75fr] gap-2 px-4 py-1 text-[11px] tabular-nums"
        >
          <span className={trade.side === "buy" ? gainClass : lossClass}>
            {trade.price}
          </span>
          <span className="text-right text-slate-300">{trade.amount}</span>
          <span className="text-right text-slate-500">{trade.time}</span>
        </div>
      ))}
    </section>
  );
}
