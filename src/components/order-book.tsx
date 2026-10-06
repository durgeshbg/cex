import { BookRows } from "@/components/book-rows";
import { PanelHeading } from "@/components/panel-heading";
import { getMarketFixture, type Market } from "@/fixtures/market-data";

export function OrderBook({ market }: { market: Market }) {
  const { asks, bids } = getMarketFixture(market);
  return (
    <section className="min-w-0 border-b border-slate-800 bg-[#0d1015] lg:border-b-0 xl:border-b">
      <PanelHeading title="Order book" />
      <div className="grid grid-cols-[1.2fr_.8fr_1fr] gap-2 px-4 pb-2 text-[10px] text-slate-500">
        <span>Price (USDT)</span>
        <span className="text-right">Amount ({market.baseAsset})</span>
        <span className="text-right">Total</span>
      </div>
      <BookRows rows={asks} side="ask" />
      <div className="my-2 border-y border-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 tabular-nums">
        {market.price}
      </div>
      <BookRows rows={bids} side="bid" />
    </section>
  );
}
