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
  enabled: boolean; // the top-bar switch: false = full text and final image, no motion
  speed: number; // tokens/s from the panel slider; REAL_TIME = top stop
};

// The slider's top stop, "real time": the fastest the page can be written.
// Today (replay) that is the natural pace, each section in 0.3–0.9 s, so long
// sections reach ~200 tok/s. Once the nanoGPT runs in the visitor's browser,
// real time = whatever their device actually generates (no artificial cap).
// Below the top stop, the page streams at exactly the slider's rate.
export const REAL_TIME = 200;

let state: ModelState = {
  status: "waiting",
  step: 0,
  token: "",
  topk: [],
  tokPerSec: 0,
  temperature: 0.7,
  enabled: true,
  speed: REAL_TIME,
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
