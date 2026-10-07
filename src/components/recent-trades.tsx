import { useEffect } from "react";
import type { MarketStreamSession } from "@/api/market-stream";
import { Button } from "@/components/ui/button";
import { useRecentTrades } from "@/hooks/use-recent-trades";
import { formatPrice, type Market } from "@/models/market";
import { useTradesStore } from "@/store/trades-store";
import { gainClass, lossClass } from "@/lib/terminal-styles";

export function RecentTrades({ market, session, epoch }: {
  market: Market;
  session: MarketStreamSession | null;
  epoch: number;
}) {
  const seed = useRecentTrades(market.symbol, session?.id, epoch);
  const active = useTradesStore((state) => state.active);
  const trades = active?.sessionId === session?.id && active?.epoch === epoch
    ? active.trades : null;

  useEffect(() => {
    if (session && seed.data) session.hydrateTrades(seed.data, epoch);
  }, [session, seed.data, epoch]);

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col bg-[#0d1015]">
      <div className="px-4 pt-4 pb-3">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">Binance Spot · public trades</p>
        <h2 className="mt-1 text-sm font-semibold text-slate-100">Recent trades</h2>
      </div>
      <div className="grid grid-cols-[1fr_.8fr_.75fr_.7fr] gap-2 px-4 pb-2 text-[10px] text-slate-500">
        <span>Price</span>
        <span className="text-right">Qty ({market.baseAsset})</span>
        <span className="text-right">Time</span>
        <span className="text-right">Taker</span>
      </div>
      {trades ? (
        <div className="min-h-0 flex-1 overflow-y-auto lg:max-h-64 lg:flex-none xl:max-h-none xl:flex-1">
          {trades.map((trade) => (
            <div key={trade.id} className="grid grid-cols-[1fr_.8fr_.75fr_.7fr] gap-2 px-4 py-1 text-[11px] tabular-nums">
              <span className={trade.takerSide === "buy" ? gainClass : lossClass}>
                {formatPrice(trade.price, market.pricePrecision)}
              </span>
              <span className="text-right text-slate-300">{formatPrice(trade.quantity, market.quantityPrecision)}</span>
              <span className="text-right text-slate-500">{new Date(trade.time).toLocaleTimeString("en-US", { hour12: false })}</span>
              <span className={`text-right ${trade.takerSide === "buy" ? gainClass : lossClass}`}>
                {trade.takerSide === "buy" ? "Buy" : "Sell"}
              </span>
            </div>
          ))}
        </div>
      ) : seed.isError ? (
        <div className="space-y-2 px-4 py-6 text-xs text-slate-500" role="status">
          <p>Recent trades unavailable.</p>
          <Button variant="outline" size="sm" onClick={() => seed.refetch()}>Retry</Button>
        </div>
      ) : (
        <p className="px-4 py-6 text-xs text-slate-500" role="status">Waiting for recent trades…</p>
      )}
    </section>
  );
}
