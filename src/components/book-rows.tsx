import { gainClass, lossClass } from "@/lib/terminal-styles";
import { formatPrice, type Market } from "@/models/market";
import type { BookLevel } from "@/models/order-book";

type BookRowsProps = {
  rows: BookLevel[];
  side: "ask" | "bid";
  market: Market;
};

export function BookRows({ rows, side, market }: BookRowsProps) {
  const maxCumulative = rows.at(-1)?.cumulativeQuantity ?? 0;
  return (
    <div className="min-h-0 flex-1 overflow-y-auto lg:max-h-48 lg:flex-none xl:max-h-none xl:flex-1">
      {rows.map((row) => (
        <div
          key={row.price}
          className="relative grid grid-cols-[1.2fr_.8fr_1fr] gap-2 px-4 py-1 text-[11px] tabular-nums"
        >
          <span
            className={`absolute inset-y-0 right-0 ${side === "ask" ? "bg-rose-400/10" : "bg-emerald-400/10"}`}
            style={{ width: `${maxCumulative ? row.cumulativeQuantity / maxCumulative * 100 : 0}%` }}
          />
          <span
            className={`relative ${side === "ask" ? lossClass : gainClass}`}
          >
            {formatPrice(row.price, market.pricePrecision)}
          </span>
          <span className="relative text-right text-slate-300">
            {formatPrice(row.quantity, market.quantityPrecision)}
          </span>
          <span className="relative text-right text-slate-400">
            {formatPrice(row.cumulativeQuantity, market.quantityPrecision)}
          </span>
        </div>
      ))}
    </div>
  );
}
