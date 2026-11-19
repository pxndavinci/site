"use client";
// The top-bar switch: mini-gpt on (the page is written token by token and the
// portrait denoises) or off (full text and the finished image, no motion).
// One flip does three things: the "stream" class on <html> (CSS shows or hides
// tokens), bus.enabled (the streamer and portrait re-run), and localStorage
// (the inline script in layout.tsx reads it before the next page's first paint).
import { useSyncExternalStore } from "react";
import { bus } from "./bus";

export function ModelSwitch() {
  const on = useSyncExternalStore(
    bus.subscribe,
    () => bus.get().enabled,
    () => true,
  );
  const flip = () => {
    const next = !on;
    document.documentElement.classList.toggle("stream", next);
    try {
      localStorage.setItem("mini-gpt", next ? "on" : "off");
    } catch {} // private mode can refuse storage; the switch still works for this visit
    bus.set({ enabled: next });
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={flip}
      title={on ? "Turn off: show the finished page, no animation" : "Turn on: let mini-gpt write the page"}
      className="flex items-center gap-2 hover:text-ink"
    >
      mini-gpt
      <span
        aria-hidden="true"
        className={`relative inline-block h-3.5 w-6 rounded-full transition-colors ${on ? "bg-signal-ink" : "bg-ink-muted"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-2.5 w-2.5 rounded-full bg-paper transition-transform ${on ? "translate-x-2.5" : ""}`}
        />
      </span>
    </button>
  );
}
