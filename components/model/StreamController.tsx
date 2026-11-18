"use client";
// Reveals each section's tokens when it scrolls into view, fast: a whole
// section finishes in 0.3–0.9 s. It writes progress to the bus, which drives
// the model panel. Nothing renders here; it only toggles classes.
//
// Off switch: the inline script in layout.tsx adds the "stream" class to <html>
// only when JS runs and the visitor hasn't asked for reduced motion. Without
// that class every token is visible and this component does nothing.
import { useEffect } from "react";
import { bus } from "./bus";
import { cannedSource, type TokenSource } from "./source";

const MS_PER_TOKEN = 5; // ~200 tokens/s on screen
const MIN_MS = 300;
const MAX_MS = 900;

export function StreamController({ source = cannedSource }: { source?: TokenSource }) {
  useEffect(() => {
    const html = document.documentElement;
    if (!html.classList.contains("stream")) {
      bus.set({ status: "static" });
      return;
    }
    (window as unknown as { __streamReady: boolean }).__streamReady = true;

    // One blinking caret, moved to wherever the newest token is.
    const caret = document.createElement("span");
    caret.className = "caret";
    caret.setAttribute("aria-hidden", "true");

    let running = 0;
    let cancelled = false;

    async function run(section: HTMLElement) {
      const spans = [...section.querySelectorAll<HTMLElement>(".t")];
      const tokens = spans.map((s) => s.textContent ?? "");
      const topk = await source.topk(section.id, tokens);
      const temperature = Number(section.dataset.temp ?? 0.7);
      const duration = Math.min(MAX_MS, Math.max(MIN_MS, tokens.length * MS_PER_TOKEN));
      const start = performance.now();
      let shown = 0;
      running++;

      const frame = (now: number) => {
        if (cancelled) return;
        const target = Math.min(tokens.length, Math.ceil(((now - start) / duration) * tokens.length));
        const fresh = target - shown;
        for (; shown < target; shown++) spans[shown].classList.add("on");
        const last = spans[shown - 1];
        if (last) last.after(caret);
        const elapsed = Math.max(1, now - start);
        bus.set({
          status: "generating",
          step: bus.get().step + Math.max(0, fresh), // sections can stream in parallel; count all
          token: tokens[shown - 1] ?? "",
          topk: topk[shown - 1] ?? [],
          tokPerSec: Math.round((shown / elapsed) * 1000),
          temperature,
        });
        if (shown < tokens.length) requestAnimationFrame(frame);
        else if (--running === 0) bus.set({ status: "done" });
      };
      requestAnimationFrame(frame);
    }

    // Start a section once 10% of it is on screen; each section runs once.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          run(e.target as HTMLElement);
        }
      },
      { threshold: 0.1 },
    );
    document.querySelectorAll<HTMLElement>("[data-stream-section]").forEach((s) => io.observe(s));

    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [source]);

  return null;
}
