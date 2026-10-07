import { create } from "zustand";

export const intervals = ["1m", "5m", "15m", "1h", "1d"] as const;
export type Interval = (typeof intervals)[number];

const storageKey = "spot-terminal-preferences-v1";

function restoredPreferences() {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    return {
      selectedSymbol: typeof raw?.selectedSymbol === "string" ? raw.selectedSymbol : "BTCUSDT",
      selectedInterval: intervals.find((value) => value === raw?.selectedInterval) ?? "1m",
      favorites: Array.isArray(raw?.favorites)
        ? [...new Set<string>(raw.favorites.filter((value: unknown): value is string => typeof value === "string"))]
        : [],
    };
  } catch {
    return { selectedSymbol: "BTCUSDT", selectedInterval: "1m" as Interval, favorites: [] as string[] };
  }
}

type MarketState = {
  selectedSymbol: string;
  selectedInterval: Interval;
  favorites: string[];
  setSelectedSymbol: (symbol: string) => void;
  setSelectedInterval: (interval: Interval) => void;
  toggleFavorite: (symbol: string) => void;
  reconcileMarkets: (symbols: string[]) => void;
};

export const useMarketStore = create<MarketState>((set) => ({
  ...restoredPreferences(),
  setSelectedSymbol: (selectedSymbol) => set({ selectedSymbol }),
  setSelectedInterval: (selectedInterval) => set({ selectedInterval }),
  toggleFavorite: (symbol) => set((state) => ({
    favorites: state.favorites.includes(symbol)
      ? state.favorites.filter((item) => item !== symbol)
      : [...state.favorites, symbol],
  })),
  reconcileMarkets: (symbols) => set((state) => {
    const available = new Set(symbols);
    const selectedSymbol = available.has(state.selectedSymbol)
      ? state.selectedSymbol : available.has("BTCUSDT") ? "BTCUSDT" : symbols[0];
    const favorites = state.favorites.filter((symbol) => available.has(symbol));
    return selectedSymbol === state.selectedSymbol && favorites.length === state.favorites.length
      ? state : { selectedSymbol, favorites };
  }),
}));

useMarketStore.subscribe((state, previous) => {
  if (state.selectedSymbol === previous.selectedSymbol &&
    state.selectedInterval === previous.selectedInterval &&
    state.favorites === previous.favorites) return;
  try {
    localStorage.setItem(storageKey, JSON.stringify({
      selectedSymbol: state.selectedSymbol,
      selectedInterval: state.selectedInterval,
      favorites: state.favorites,
    }));
  } catch { /* Storage can be unavailable in private browsing. */ }
});
