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
import { demoMarkets } from "@/fixtures/market-data";

function App() {
  const [mobilePanel, setMobilePanel] = useState<
    "markets" | "chart" | "book" | "trades"
  >("chart");
  const [offlineDemo, setOfflineDemo] = useState(false);
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
  const availableMarkets = offlineDemo ? demoMarkets : markets;
  const market =
    availableMarkets.find((item) => item.symbol === selectedSymbol) ??
    availableMarkets.find((item) => item.symbol === "BTCUSDT") ??
    availableMarkets[0];
  const stream = useActiveMarketStream(
    offlineDemo ? undefined : market?.symbol,
    selectedInterval,
  );
  const connectionLabel =
    stream.status[0].toUpperCase() + stream.status.slice(1);
  const liveUnavailable =
    status === "error" ||
    status === "empty" ||
    (stream.session !== null &&
      (stream.status === "disconnected" || stream.status === "reconnecting"));

  return (
    <main className="min-h-svh space-y-2 bg-background p-2 text-foreground [font-variant-numeric:tabular-nums] lg:grid lg:h-svh lg:grid-cols-[220px_minmax(0,1fr)] lg:grid-rows-[48px_minmax(0,1fr)] lg:gap-2 lg:space-y-0 lg:overflow-hidden xl:grid-cols-[248px_minmax(0,1fr)_316px]">
      <header className="flex min-h-12 flex-wrap items-center justify-between gap-y-2 rounded-xl border border-border bg-card px-4 py-2 lg:col-span-2 xl:col-span-3">
        <div className="flex items-center gap-2.5 text-sm font-bold tracking-tight text-foreground">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-xs font-black text-primary-foreground">
            B
          </span>
          Spot Terminal
          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-primary">SPOT</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span
            className={`size-2 rounded-full ${stream.status === "connected" ? "bg-emerald-400" : stream.status === "disconnected" ? "bg-rose-400" : "bg-primary"}`}
          />
          <span aria-label={offlineDemo ? "Offline fixture demo" : `Binance Spot stream ${stream.status}`}>
            {offlineDemo ? "Offline fixture demo" : connectionLabel}
            <span className="hidden sm:inline"> · Binance Spot stream</span>
          </span>
          {(offlineDemo || liveUnavailable) && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setOfflineDemo(!offlineDemo)}
            >
              {offlineDemo ? "Exit offline demo" : "Use offline fixture demo"}
            </Button>
          )}
        </div>
      </header>

      <nav
        className="grid grid-cols-4 rounded-xl border border-border bg-card p-1 lg:hidden"
        aria-label="Terminal panels"
      >
        {(["markets", "chart", "book", "trades"] as const).map((panel) => (
          <Button
            key={panel}
            variant="ghost"
            size="sm"
            aria-pressed={mobilePanel === panel}
            onClick={() => setMobilePanel(panel)}
            className={`capitalize ${mobilePanel === panel ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}
          >
            {panel}
          </Button>
        ))}
      </nav>

      <div className={`min-w-0 overflow-hidden rounded-xl border border-border bg-card lg:min-h-0 ${mobilePanel === "markets" ? "block" : "hidden"} lg:block`}>
        <MarketSidebar
          markets={availableMarkets}
          selectedSymbol={market?.symbol ?? selectedSymbol}
          onSelect={(symbol) => {
            setSelectedSymbol(symbol);
            setMobilePanel("chart");
          }}
          status={offlineDemo ? "ready" : status}
          error={offlineDemo ? null : error}
          onRetry={retry}
        />
      </div>

      <div className={`min-w-0 overflow-hidden rounded-xl border border-border bg-card lg:min-h-0 lg:flex-col ${mobilePanel === "chart" ? "block" : "hidden"} lg:flex`}>
        <MarketHeader
          market={market}
          status={offlineDemo ? "ready" : status}
          ticker={stream.ticker}
          demo={offlineDemo}
        />
        <section className="flex min-h-0 flex-col bg-card lg:flex-1">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3 sm:px-4">
            <div className="flex gap-1" aria-label="Chart interval">
              {intervals.map((interval) => (
                <Button
                  key={interval}
                  variant="ghost"
                  size="sm"
                  aria-pressed={selectedInterval === interval}
                  onClick={() => setSelectedInterval(interval)}
                  className={`min-w-9 px-2 text-xs hover:bg-primary/10 hover:text-primary ${selectedInterval === interval ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}
                >
                  {interval}
                </Button>
              ))}
            </div>
            <span className="shrink-0 text-[10px] text-slate-500">
              <span className="hidden sm:inline">
                Candles · {selectedInterval} ·{" "}
              </span>
              {offlineDemo
                ? "Fixture candles"
                : stream.status === "connected"
                  ? "Stream open"
                  : "REST snapshot"}
            </span>
          </div>
          <div className="h-[calc(100svh-260px)] min-h-[320px] w-full sm:h-[440px] lg:min-h-0 lg:flex-1">
            {market && (offlineDemo || stream.session?.interval === selectedInterval) ? (
              <CandlestickChart
                market={market}
                interval={selectedInterval}
                session={offlineDemo ? null : stream.session}
                epoch={stream.epoch}
                connectionStatus={stream.status}
                demo={offlineDemo}
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

      <div className={`min-h-[calc(100svh-85px)] min-w-0 grid-cols-1 gap-2 lg:col-span-2 lg:grid lg:min-h-0 lg:grid-cols-2 xl:col-span-1 xl:h-full xl:grid-cols-1 xl:grid-rows-[minmax(0,1.8fr)_minmax(0,1fr)] xl:overflow-hidden ${mobilePanel === "book" || mobilePanel === "trades" ? "grid" : "hidden"}`}>
        {market ? (
          <>
            <div className={`min-h-0 overflow-hidden rounded-xl border border-border bg-card ${mobilePanel === "book" ? "block" : "hidden"} lg:block`}>
              <OrderBook
                market={market}
                sessionId={stream.session?.id}
                epoch={stream.epoch}
                connectionStatus={stream.status}
                demo={offlineDemo}
              />
            </div>
            <div className={`min-h-0 overflow-hidden rounded-xl border border-border bg-card ${mobilePanel === "trades" ? "block" : "hidden"} lg:block`}>
              <RecentTrades
                market={market}
                session={offlineDemo ? null : stream.session}
                epoch={stream.epoch}
                demo={offlineDemo}
                connectionStatus={stream.status}
              />
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
