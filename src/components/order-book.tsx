import { BookRows } from "@/components/book-rows";
import type { ConnectionStatus } from "@/api/market-stream";
import { formatPrice, type Market } from "@/models/market";
import { useOrderBookStore } from "@/store/order-book-store";

type OrderBookProps = {
  market: Market;
  sessionId: number | undefined;
  epoch: number;
  connectionStatus: ConnectionStatus;
};

export function OrderBook({ market, sessionId, epoch, connectionStatus }: OrderBookProps) {
  const activeBook = useOrderBookStore((state) => state.book);
  const book = connectionStatus === "connected" &&
    activeBook?.sessionId === sessionId &&
    activeBook?.epoch === epoch
      ? activeBook.snapshot
      : null;
  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col border-b border-slate-800 bg-[#0d1015] lg:border-b-0 xl:border-b">
      <div className="px-4 pt-4 pb-3">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">Binance Spot · partial depth</p>
        <h2 className="mt-1 text-sm font-semibold text-slate-100">Order book · Top 20 levels</h2>
      </div>
      <div className="grid grid-cols-[1.2fr_.8fr_1fr] gap-2 px-4 pb-2 text-[10px] text-slate-500">
        <span>Price (USDT)</span>
        <span className="text-right">Qty ({market.baseAsset})</span>
        <span className="text-right">Cumulative ({market.baseAsset})</span>
      </div>
      {book ? (
        <>
          <BookRows rows={book.asks} side="ask" market={market} />
          <div className="my-2 border-y border-slate-800 px-4 py-2 text-xs text-slate-300 tabular-nums">
            Spread {book.spread === null ? "—" : formatPrice(book.spread, market.pricePrecision)}
            {book.spreadPercent !== null && ` (${book.spreadPercent.toFixed(3)}%)`}
          </div>
          <BookRows rows={book.bids} side="bid" market={market} />
        </>
      ) : (
        <p className="px-4 py-8 text-xs text-slate-500" role="status">
          {connectionStatus === "reconnecting" || connectionStatus === "disconnected"
            ? "Book stale — waiting for a fresh snapshot…"
            : "Waiting for the first depth snapshot…"}
        </p>
      )}
    </section>
  );
}
