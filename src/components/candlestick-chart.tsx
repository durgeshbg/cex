import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  type UTCTimestamp,
} from "lightweight-charts";
import { fixtureCandles } from "@/fixtures/market-data";
import type { Market } from "@/models/market";

type CandlestickChartProps = { market: Market; interval: string };

export function CandlestickChart({ market, interval }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const lastPrice = market.lastPrice;
    const intervalSeconds =
      { "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "1d": 86400 }[interval] ??
      60;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "#0d1015" },
        textColor: "#657083",
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
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#25bb8b",
      downColor: "#f05561",
      borderVisible: false,
      wickUpColor: "#25bb8b",
      wickDownColor: "#f05561",
      priceFormat: {
        type: "price",
        precision: market.pricePrecision,
        minMove: market.priceTick,
      },
    });
    series.setData(
      fixtureCandles.map(([open, high, low, close], index) => ({
        time: (1_728_000_000 + index * intervalSeconds) as UTCTimestamp,
        open: (open * lastPrice) / 67842.18,
        high: (high * lastPrice) / 67842.18,
        low: (low * lastPrice) / 67842.18,
        close: (close * lastPrice) / 67842.18,
      })),
    );
    chart.timeScale().fitContent();

    const observer = new ResizeObserver(([entry]) => {
      chart.applyOptions({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
      chart.timeScale().fitContent();
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
      chart.remove();
    };
  }, [market, interval]);

  return (
    <div
      className="h-full w-full"
      ref={containerRef}
      aria-label={`${market.symbol} ${interval} fixture candlestick chart`}
    />
  );
}
