import { create } from "zustand";

export const intervals = ["1m", "5m", "15m", "1h", "1d"] as const;
export type Interval = (typeof intervals)[number];

type MarketState = {
  selectedSymbol: string;
  selectedInterval: Interval;
  setSelectedSymbol: (symbol: string) => void;
  setSelectedInterval: (interval: Interval) => void;
};

export const useMarketStore = create<MarketState>((set) => ({
  selectedSymbol: "BTCUSDT",
  selectedInterval: "1m",
  setSelectedSymbol: (selectedSymbol) => set({ selectedSymbol }),
  setSelectedInterval: (selectedInterval) => set({ selectedInterval }),
}));
