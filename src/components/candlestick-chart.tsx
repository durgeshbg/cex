import { useLayoutEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import { Button } from "@/components/ui/button";
import type { MarketStreamSession } from "@/api/market-stream";
import { useKlines } from "@/hooks/use-klines";
import { mergeChartKlines } from "@/models/klines";
import type { Market } from "@/models/market";
import type { Interval } from "@/store/market-store";

type CandlestickChartProps = {
  market: Market;
  interval: Interval;
  session: MarketStreamSession;
  epoch: number;
};

function showRecentCandles(chart: IChartApi, count: number, width: number) {
  const visibleCount = Math.max(30, Math.min(120, Math.floor(width / 8)));
  chart.timeScale().setVisibleLogicalRange({
    from: Math.max(0, count - visibleCount),
    to: count + 2,
  });
}

export function CandlestickChart({ market, interval, session, epoch }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const barCountRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const syncedRef = useRef(false);
  const klines = useKlines(market.symbol, interval, session.id, epoch);
  const data =
    klines.data?.symbol === market.symbol &&
    klines.data.interval === interval &&
    klines.data.sessionId === session.id &&
    klines.data.epoch === epoch
      ? klines.data
      : null;

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "#0d1015" },
        textColor: "#657083",
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: "#222834" },
        horzLines: { color: "#222834" },
      },
      rightPriceScale: { borderColor: "#20242c" },
      timeScale: { borderColor: "#20242c", timeVisible: true },
      crosshair: {
        vertLine: { color: "#3b4453" },
        horzLine: { color: "#3b4453" },
      },
    });
    const candles = chart.addSeries(CandlestickSeries, {
      upColor: "#25bb8b",
      downColor: "#f05561",
      borderVisible: false,
      wickUpColor: "#25bb8b",
      wickDownColor: "#f05561",
    });
    candles
      .priceScale()
      .applyOptions({ scaleMargins: { top: 0.08, bottom: 0.25 } });
    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    chartRef.current = chart;
    candlesRef.current = candles;
    volumeRef.current = volume;

    const observer = new ResizeObserver(([entry]) => {
      chart.applyOptions({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
      if (barCountRef.current) {
        showRecentCandles(chart, barCountRef.current, entry.contentRect.width);
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      chartRef.current = null;
      candlesRef.current = null;
      volumeRef.current = null;
      barCountRef.current = 0;
      lastTimeRef.current = null;
      syncedRef.current = false;
      chart.remove();
    };
  }, []);

  useLayoutEffect(() => {
    syncedRef.current = false;
    lastTimeRef.current = null;
    return session.subscribeCandles(({ candle, volume }) => {
      if (!syncedRef.current || lastTimeRef.current === null || candle.time < lastTimeRef.current) return;
      candlesRef.current?.update(candle);
      volumeRef.current?.update(volume);
      if (candle.time > lastTimeRef.current) {
        lastTimeRef.current = candle.time;
        barCountRef.current++;
      }
    });
  }, [session, epoch]);

  useLayoutEffect(() => {
    const chart = chartRef.current;
    const candles = candlesRef.current;
    const volume = volumeRef.current;
    if (!chart || !candles || !volume) return;

    candles.setData([]);
    volume.setData([]);
    barCountRef.current = 0;
    lastTimeRef.current = null;
    syncedRef.current = false;
    candles.applyOptions({
      priceFormat: {
        type: "price",
        precision: market.pricePrecision,
        minMove: market.priceTick,
      },
    });
    if (data && !klines.isError) {
      const merged = mergeChartKlines(data, session.bufferedCandles());
      candles.setData(merged.candles);
      volume.setData(merged.volume);
      barCountRef.current = merged.candles.length;
      lastTimeRef.current = merged.candles.at(-1)?.time ?? null;
      syncedRef.current = true;
      if (barCountRef.current) {
        showRecentCandles(
          chart,
          barCountRef.current,
          containerRef.current?.clientWidth ?? 0,
        );
      }
    }
  }, [
    data,
    klines.isError,
    market.pricePrecision,
    market.priceTick,
    market.symbol,
    interval,
    session,
    epoch,
  ]);

  const loading = klines.isPending || (!data && !klines.isError);
  const empty = data?.candles.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative min-h-0 flex-1">
        <div
          ref={containerRef}
          className="h-full w-full"
          aria-label={`${market.symbol} ${interval} candlestick and volume chart`}
        />
        {(loading || klines.isError || empty) && (
          <div
            className="absolute inset-0 grid place-content-center gap-3 bg-[#0d1015] px-4 text-center text-sm text-slate-400"
            role="status"
          >
            <p>
              {loading
                ? "Loading candles…"
                : empty
                  ? "No candles are available for this market."
                  : "Candles unavailable."}
            </p>
            {klines.isError && (
              <>
                <p className="max-w-sm text-xs text-slate-500">
                  {klines.error.message}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void klines.refetch()}
                >
                  Retry
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      <a
        href="https://www.tradingview.com/"
        target="_blank"
        rel="noreferrer"
        className="shrink-0 border-t border-slate-800 px-3 py-1 text-[10px] text-slate-500 hover:text-slate-300"
      >
        TradingView Lightweight Charts™ · © 2025 TradingView, Inc.
      </a>
    </div>
  );
}
