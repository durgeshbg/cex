import { create } from "zustand";
import type { Trade } from "@/models/trades";

type ActiveTrades = { sessionId: number; epoch: number; trades: Trade[] };

export const useTradesStore = create<{ active: ActiveTrades | null }>(() => ({ active: null }));

let frame: number | null = null;
let pending: ActiveTrades | null = null;

export function queueTrades(active: ActiveTrades) {
  pending = active;
  if (frame !== null) return;
  frame = requestAnimationFrame(() => {
    frame = null;
    useTradesStore.setState({ active: pending });
    pending = null;
  });
}

export function clearTrades() {
  if (frame !== null) cancelAnimationFrame(frame);
  frame = null;
  pending = null;
  useTradesStore.setState({ active: null });
}
