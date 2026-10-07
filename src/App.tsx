import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CandlestickChart } from "@/components/candlestick-chart";
import { MarketHeader } from "@/components/market-header";
import { MarketSidebar } from "@/components/market-sidebar";
import { OrderBook } from "@/components/order-book";
import { RecentTrades } from "@/components/recent-trades";
import { useMarkets } from "@/hooks/use-markets";
import { useActiveMarketStream } from "@/hooks/use-active-market-stream";
import { intervals, useMarketStore } from "@/store/market-store";

function App() {
  const [mobilePanel, setMobilePanel] = useState<
    "markets" | "chart" | "book" | "trades"
  >("chart");
  const { markets, status, error, retry } = useMarkets();
  const selectedSymbol = useMarketStore((state) => state.selectedSymbol);
  const selectedInterval = useMarketStore((state) => state.selectedInterval);
  const setSelectedSymbol = useMarketStore((state) => state.setSelectedSymbol);
  const setSelectedInterval = useMarketStore(
    (state) => state.setSelectedInterval,
  );
  const reconcileMarkets = useMarketStore((state) => state.reconcileMarkets);
  useEffect(() => {
    if (status === "ready") reconcileMarkets(markets.map((item) => item.symbol));
  }, [status, markets, reconcileMarkets]);
  const market =
    markets.find((item) => item.symbol === selectedSymbol) ??
    markets.find((item) => item.symbol === "BTCUSDT") ??
    markets[0];
  const stream = useActiveMarketStream(market?.symbol, selectedInterval);
  const connectionLabel =
    stream.status[0].toUpperCase() + stream.status.slice(1);

  return (
    <main className="min-h-svh bg-[#090b0f] text-slate-200 [font-variant-numeric:tabular-nums] lg:grid lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[248px_minmax(0,1fr)_316px]">
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-[#0d1015] px-4 lg:col-span-2 xl:col-span-3">
        <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
          <span className="grid size-6 place-items-center border border-amber-400 text-xs">
            B
          </span>
          Spot Terminal
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span
            className={`size-2 rounded-full ${stream.status === "connected" ? "bg-emerald-400" : stream.status === "disconnected" ? "bg-rose-400" : "bg-amber-400"}`}
          />
          {connectionLabel}{" "}
          <span className="hidden sm:inline">· Binance Spot stream</span>
        </div>
      </header>

      <nav
        className="grid grid-cols-4 border-b border-slate-800 bg-[#0d1015] lg:hidden"
        aria-label="Terminal panels"
      >
        {(["markets", "chart", "book", "trades"] as const).map((panel) => (
          <Button
            key={panel}
            variant="ghost"
            size="sm"
            aria-pressed={mobilePanel === panel}
            onClick={() => setMobilePanel(panel)}
            className={`rounded-none capitalize ${mobilePanel === panel ? "border-b border-amber-400 text-amber-400" : "text-slate-400"}`}
          >
            {panel}
          </Button>
        ))}
      </nav>

      <div className={`min-w-0 ${mobilePanel === "markets" ? "block" : "hidden"} lg:block`}>
        <MarketSidebar
          markets={markets}
          selectedSymbol={market?.symbol ?? selectedSymbol}
          onSelect={(symbol) => {
            setSelectedSymbol(symbol);
            setMobilePanel("chart");
          }}
          status={status}
          error={error}
          onRetry={retry}
        />
      </div>

      <div className={`min-w-0 ${mobilePanel === "chart" ? "block" : "hidden"} lg:block`}>
        <MarketHeader market={market} status={status} ticker={stream.ticker} />
        <section className="bg-[#0d1015]">
          <div className="flex h-12 items-center justify-between border-b border-slate-800 px-3 sm:px-4">
            <div className="flex gap-1" aria-label="Chart interval">
              {intervals.map((interval) => (
                <Button
                  key={interval}
                  variant="ghost"
                  size="sm"
                  aria-pressed={selectedInterval === interval}
                  onClick={() => setSelectedInterval(interval)}
                  className={`min-w-9 px-2 text-xs hover:bg-amber-400/10 hover:text-amber-400 ${selectedInterval === interval ? "bg-amber-400/10 text-amber-400" : "text-slate-400"}`}
                >
                  {interval}
                </Button>
              ))}
            </div>
            <span className="shrink-0 text-[10px] text-slate-500">
              <span className="hidden sm:inline">
                Candles · {selectedInterval} ·{" "}
              </span>
              {stream.status === "connected" ? "Live candles" : "REST snapshot"}
            </span>
          </div>
          <div className="h-[300px] w-full sm:h-[400px] lg:h-[calc(100svh-174px)] lg:min-h-[360px]">
            {market && stream.session?.interval === selectedInterval ? (
              <CandlestickChart
                market={market}
                interval={selectedInterval}
                session={stream.session}
                epoch={stream.epoch}
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-slate-500">
                {market
                  ? stream.session
                    ? "Switching chart interval…"
                    : "Connecting to market stream…"
                  : status === "loading"
                    ? "Waiting for market data…"
                    : "Chart unavailable"}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className={`min-h-[calc(100svh-85px)] min-w-0 grid-cols-1 border-t border-slate-800 lg:col-span-2 lg:grid lg:min-h-0 lg:grid-cols-2 xl:col-span-1 xl:h-[calc(100svh-56px)] xl:grid-cols-1 xl:grid-rows-[minmax(0,2fr)_minmax(0,1fr)] xl:overflow-hidden xl:border-t-0 xl:border-l ${mobilePanel === "book" || mobilePanel === "trades" ? "grid" : "hidden"}`}>
        {market ? (
          <>
            <div className={`min-h-0 ${mobilePanel === "book" ? "block" : "hidden"} lg:block`}>
              <OrderBook
                market={market}
                sessionId={stream.session?.id}
                epoch={stream.epoch}
                connectionStatus={stream.status}
              />
            </div>
            <div className={`min-h-0 ${mobilePanel === "trades" ? "block" : "hidden"} lg:block`}>
              <RecentTrades market={market} session={stream.session} epoch={stream.epoch} />
            </div>
          </>
        ) : (
          <p className="p-4 text-xs text-slate-500">
            Book and trades appear when a market is available.
          </p>
        )}
      </div>
    </main>
  );
}

export default App;
