import { useLayoutEffect, useMemo, useRef } from "react";
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
import type { ConnectionStatus } from "@/api/market-stream";
import { getDemoKlines } from "@/fixtures/market-data";

type CandlestickChartProps = {
  market: Market;
  interval: Interval;
  session: MarketStreamSession | null;
  epoch: number;
  connectionStatus: ConnectionStatus;
  demo?: boolean;
};

function showRecentCandles(chart: IChartApi, count: number, width: number) {
  const visibleCount = Math.max(30, Math.min(120, Math.floor(width / 8)));
  chart.timeScale().setVisibleLogicalRange({
    from: Math.max(0, count - visibleCount),
    to: count + 2,
  });
}

export function CandlestickChart({
  market,
  interval,
  session,
  epoch,
  connectionStatus,
  demo = false,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const barCountRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const syncedRef = useRef(false);
  const klines = useKlines(
    market.symbol,
    interval,
    session?.id ?? 0,
    epoch,
    !demo && session !== null,
  );
  const queryData =
    klines.data?.symbol === market.symbol &&
    klines.data.interval === interval &&
    klines.data.sessionId === session?.id &&
    klines.data.epoch === epoch
      ? klines.data
      : null;
  const data = useMemo(
    () => (demo ? getDemoKlines(market, interval) : queryData),
    [demo, market, interval, queryData],
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "#15171e" },
        textColor: "#8a93a3",
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: "#252932" },
        horzLines: { color: "#252932" },
      },
      rightPriceScale: { borderColor: "#292d37" },
      timeScale: { borderColor: "#292d37", timeVisible: true },
      crosshair: {
        vertLine: { color: "#4b5668" },
        horzLine: { color: "#4b5668" },
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

    const resizeChart = (width: number, height: number) => {
      chart.applyOptions({ width, height });
      if (barCountRef.current) {
        showRecentCandles(chart, barCountRef.current, width);
      }
    };
    const fallbackResize = () => {
      resizeChart(container.clientWidth, container.clientHeight);
    };
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(([entry]) => {
        if (entry)
          resizeChart(entry.contentRect.width, entry.contentRect.height);
      });
      observer.observe(container);
    } else {
      window.addEventListener("resize", fallbackResize);
    }

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", fallbackResize);
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
    if (!session) return;
    return session.subscribeCandles(({ candle, volume }) => {
      if (
        !syncedRef.current ||
        lastTimeRef.current === null ||
        candle.time < lastTimeRef.current
      )
        return;
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
    if (data && (demo || !klines.isError)) {
      const merged =
        demo || !session
          ? data
          : mergeChartKlines(data, session.bufferedCandles());
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
    demo,
  ]);

  const loading = !demo && (klines.isPending || (!data && !klines.isError));
  const empty = !demo && data?.candles.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative min-h-0 flex-1">
        <div
          ref={containerRef}
          className="h-full w-full"
          aria-label={`${market.symbol} ${interval} candlestick and volume chart`}
        />
        {data && !loading && !klines.isError && !empty && (
          <p className="absolute top-2 left-2 rounded bg-slate-950/80 px-2 py-1 text-[10px] text-slate-400">
            {demo
              ? "Offline fixture data"
              : connectionStatus === "connected"
                ? "Fresh snapshot · stream connected"
                : "Stale snapshot · waiting for stream"}
          </p>
        )}
        {(loading || (!demo && klines.isError) || empty) && (
          <div
            className="absolute inset-0 grid place-content-center gap-3 bg-card px-4 text-center text-sm text-slate-400"
            role="status"
          >
            <p>
              {loading
                ? "Loading candles…"
                : empty
                  ? "No candles are available for this market."
                  : "Candles unavailable."}
            </p>
            {!demo && klines.isError && (
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
    </div>
  );
}
