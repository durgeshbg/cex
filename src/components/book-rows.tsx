import { getMarketFixture } from "@/fixtures/market-data";
import { gainClass, lossClass } from "@/lib/terminal-styles";

type BookRowsProps = {
  rows: ReturnType<typeof getMarketFixture>["asks"];
  side: "ask" | "bid";
};

export function BookRows({ rows, side }: BookRowsProps) {
  return (
    <div className="space-y-0.5">
      {rows.map((row, index) => (
        <div
          key={`${side}-${index}`}
          className="relative grid grid-cols-[1.2fr_.8fr_1fr] gap-2 px-4 py-1 text-[11px] tabular-nums"
        >
          <span
            className={`absolute inset-y-0 right-0 ${side === "ask" ? "bg-rose-400/10" : "bg-emerald-400/10"}`}
            style={{ width: `${32 + index * 12}%` }}
          />
          <span
            className={`relative ${side === "ask" ? lossClass : gainClass}`}
          >
            {row.price}
          </span>
          <span className="relative text-right text-slate-300">
            {row.amount}
          </span>
          <span className="relative text-right text-slate-400">
            {row.total}
          </span>
        </div>
      ))}
    </div>
  );
}
