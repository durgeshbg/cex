import { create } from "zustand";
import type { BookSnapshot } from "@/models/order-book";

type ActiveBook = {
  sessionId: number;
  epoch: number;
  snapshot: BookSnapshot;
};

type OrderBookState = { book: ActiveBook | null };

export const useOrderBookStore = create<OrderBookState>(() => ({ book: null }));

let pendingFrame: number | null = null;
let pendingBook: ActiveBook | null = null;

export function queueOrderBook(book: ActiveBook) {
  pendingBook = book;
  if (pendingFrame !== null) return;
  pendingFrame = requestAnimationFrame(() => {
    pendingFrame = null;
    useOrderBookStore.setState({ book: pendingBook });
    pendingBook = null;
  });
}

export function clearOrderBook() {
  if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
  pendingFrame = null;
  pendingBook = null;
  useOrderBookStore.setState({ book: null });
}
