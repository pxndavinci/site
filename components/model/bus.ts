// A tiny store shared by the streamer (writes) and the model panels (read).
// React's useSyncExternalStore subscribes to it, so only the panels re-render,
// at most once per animation frame, never the page text.
import type { TopK } from "./source";

export type ModelState = {
  status: "waiting" | "generating" | "done" | "static";
  step: number; // tokens generated so far, across the whole page
  token: string;
  topk: TopK[];
  tokPerSec: number;
  temperature: number;
};

let state: ModelState = {
  status: "waiting",
  step: 0,
  token: "",
  topk: [],
  tokPerSec: 0,
  temperature: 0.7,
};
const listeners = new Set<() => void>();

export const bus = {
  get: () => state,
  set(patch: Partial<ModelState>) {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

// Server render has no store; the panels start in "waiting".
export const serverState = state;
