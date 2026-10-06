import { Button } from "@/components/ui/button";
import { CandlestickChart } from "@/components/candlestick-chart";
import { MarketHeader } from "@/components/market-header";
import { MarketSidebar } from "@/components/market-sidebar";
import { OrderBook } from "@/components/order-book";
import { RecentTrades } from "@/components/recent-trades";
import { markets } from "@/fixtures/market-data";
import { intervals, useMarketStore } from "@/store/market-store";

function App() {
  const selectedSymbol = useMarketStore((state) => state.selectedSymbol);
  const selectedInterval = useMarketStore((state) => state.selectedInterval);
  const setSelectedSymbol = useMarketStore((state) => state.setSelectedSymbol);
  const setSelectedInterval = useMarketStore(
    (state) => state.setSelectedInterval,
  );
  const market =
    markets.find((item) => item.symbol === selectedSymbol) ?? markets[0];

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
          <span className="size-2 rounded-full bg-amber-400" />
          Fixture data <span className="hidden sm:inline">· no live feed</span>
        </div>
      </header>

      <MarketSidebar
        selectedSymbol={selectedSymbol}
        onSelect={setSelectedSymbol}
      />

      <div className="min-w-0">
        <MarketHeader market={market} />
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
            <span className="hidden text-[10px] text-slate-500 sm:inline">
              Candles · {selectedInterval} · fixture
            </span>
          </div>
          <div className="h-[300px] w-full sm:h-[400px] lg:h-[calc(100svh-174px)] lg:min-h-[360px]">
            <CandlestickChart
              symbol={market.symbol}
              interval={selectedInterval}
            />
          </div>
        </section>
      </div>

      <div className="grid min-w-0 grid-cols-1 border-t border-slate-800 sm:grid-cols-2 lg:col-span-2 xl:col-span-1 xl:grid-cols-1 xl:grid-rows-2 xl:border-t-0 xl:border-l">
        <OrderBook market={market} />
        <RecentTrades market={market} />
      </div>
    </main>
  );
}

export default App;
