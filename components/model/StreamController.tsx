"use client";
// Reveals each section's tokens when it scrolls into view, fast: a whole
// section finishes in 0.3–0.9 s. Three effects, all from one idea (the model
// choosing each word), and all without moving the layout:
//
//   1. Candidate flicker: at the writing edge, the model's runner-up word shows
//      faintly for a frame, then the chosen word lands in its place.
//   2. Probability ink: each word settles from the model's colour into ink;
//      the less sure the model was, the slower it settles. Coin-flip words keep
//      a dotted underline, and hovering one shows the top-3 guesses.
//   3. Progress goes to the bus, which drives the panel's forward-pass wave.
//
// Off switch: the inline script in layout.tsx adds the "stream" class to <html>
// only when JS runs and the visitor hasn't asked for reduced motion. Without
// that class every token is visible and this component does nothing.
import { useEffect } from "react";
import { bus } from "./bus";
import { cannedSource, type TokenSource, type TopK } from "./source";

const MS_PER_TOKEN = 5; // ~200 tokens/s on screen
const MIN_MS = 300;
const MAX_MS = 900;
const DOUBT_BELOW = 0.45; // a word the model was this unsure of keeps its underline

const show = (t: string) => (t.startsWith(" ") ? t.slice(1) : t);

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

    // One ghost for the candidate flicker. Absolutely positioned over the next
    // (still hidden) token, so it never pushes text around.
    const ghost = document.createElement("span");
    ghost.className = "ghost";
    ghost.setAttribute("aria-hidden", "true");

    // One tooltip for the coin-flip words; the guesses live in a WeakMap.
    const guesses = new WeakMap<Element, TopK[]>();
    const tip = document.createElement("div");
    tip.className = "guess-tip";
    tip.setAttribute("aria-hidden", "true");
    document.body.append(tip);
    const onOver = (e: MouseEvent) => {
      const el = (e.target as Element).closest?.(".doubt");
      const topk = el && guesses.get(el);
      if (!el || !topk) return;
      tip.innerHTML =
        `<div class="guess-head">mini-gpt weighed (demo)</div>` +
        topk
          .map(
            (g, i) =>
              `<div class="guess-row${i === 0 ? " picked" : ""}"><span>${show(g.token).replace(/</g, "&lt;")}</span><i style="width:${Math.round(g.p * 60)}px"></i><b>${g.p.toFixed(2)}</b></div>`,
          )
          .join("");
      const r = el.getBoundingClientRect();
      tip.style.left = `${Math.min(r.left, window.innerWidth - 200)}px`;
      tip.style.top = `${r.bottom + 6}px`;
      tip.classList.add("open");
    };
    const onOut = (e: MouseEvent) => {
      if ((e.target as Element).closest?.(".doubt")) tip.classList.remove("open");
    };
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    window.addEventListener("scroll", () => tip.classList.remove("open"), { passive: true });

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
      section.classList.add("live"); // lets CSS-only effects (the timeline rail) start with the text

      const land = (i: number) => {
        const span = spans[i];
        const p = topk[i]?.[0]?.p ?? 1;
        // Probability ink: confident words settle in ~200 ms, unsure ones take up to ~750 ms.
        span.style.setProperty("--settle", `${Math.round(200 + (1 - p) * 700)}ms`);
        if (p < DOUBT_BELOW && /\w{5,}/.test(tokens[i])) {
          span.classList.add("doubt");
          guesses.set(span, topk[i]);
        }
        span.classList.add("on");
      };

      const frame = (now: number) => {
        if (cancelled) return;
        const target = Math.min(tokens.length, Math.ceil(((now - start) / duration) * tokens.length));
        const fresh = target - shown;
        for (; shown < target; shown++) land(shown);
        const last = spans[shown - 1];
        if (last) last.after(caret);

        // Candidate flicker: the runner-up for the NEXT token, drawn where it will land.
        const next = spans[shown];
        const alt = topk[shown]?.[1]?.token;
        if (next && alt) {
          const box = section.getBoundingClientRect();
          const at = next.getBoundingClientRect();
          ghost.textContent = alt;
          ghost.style.font = getComputedStyle(next).font;
          ghost.style.transform = `translate(${at.left - box.left}px, ${at.top - box.top}px)`;
          if (ghost.parentElement !== section) section.append(ghost);
        } else if (ghost.parentElement === section) ghost.remove();

        bus.set({
          status: "generating",
          step: bus.get().step + Math.max(0, fresh), // sections can stream in parallel; count all
          token: tokens[shown - 1] ?? "",
          topk: topk[shown - 1] ?? [],
          tokPerSec: Math.round((shown / Math.max(1, now - start)) * 1000),
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
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      tip.remove();
    };
  }, [source]);

  return null;
}
