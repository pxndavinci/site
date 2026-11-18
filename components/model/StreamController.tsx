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

const MS_PER_TOKEN = 10; // ~100 tokens/s on screen; MAX_MS still caps long sections at 0.9 s
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

    // One blinking caret, placed once at the end of a finished section. While a
    // section streams, the ghost marks the writing edge instead: moving an
    // inline caret every frame nudged the text after it (layout shift).
    const caret = document.createElement("span");
    caret.className = "caret";
    caret.setAttribute("aria-hidden", "true");

    // One ghost for the candidate flicker (see the frame loop).
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
      let lastEmit = 0;
      let pending = 0; // tokens landed since the last panel update
      running++;
      section.classList.add("live"); // lets CSS-only effects (the timeline rail) start with the text

      // At most one "unsure" word per section, never in the hero: more than that
      // starts to read like spell-check squiggles instead of a model's doubt.
      let doubtAt = -1;
      if (section.id !== "hero")
        tokens.forEach((tok, i) => {
          const p = topk[i]?.[0]?.p ?? 1;
          if (p < DOUBT_BELOW && /\w{5,}/.test(tok) && (doubtAt < 0 || p < topk[doubtAt][0].p)) doubtAt = i;
        });

      const land = (i: number) => {
        const span = spans[i];
        const p = topk[i]?.[0]?.p ?? 1;
        // Probability ink: confident words settle in ~200 ms, unsure ones take up to ~750 ms.
        span.style.setProperty("--settle", `${Math.round(200 + (1 - p) * 700)}ms`);
        if (i === doubtAt) {
          span.classList.add("doubt");
          guesses.set(span, topk[i]);
        }
        span.classList.add("on");
      };

      const frame = (now: number) => {
        if (cancelled) return;
        const target = Math.min(tokens.length, Math.ceil(((now - start) / duration) * tokens.length));
        pending += Math.max(0, target - shown);
        for (; shown < target; shown++) land(shown);

        // Candidate flicker: the runner-up for the NEXT token, inserted right
        // before it. The ghost is position:absolute with no offsets, so the
        // browser draws it exactly where the next word will land, in that
        // paragraph's font, without taking space and without us measuring layout.
        const next = spans[shown];
        const alt = topk[shown]?.[1]?.token;
        if (next && alt) {
          ghost.textContent = alt;
          if (ghost.nextSibling !== next) next.before(ghost);
        } else ghost.remove();

        const done = shown >= tokens.length;
        if (done) spans[tokens.length - 1]?.after(caret);
        // The panel only needs ~14 updates a second; every frame cost main-thread time.
        if (done || now - lastEmit > 70) {
          lastEmit = now;
          const landed = pending;
          pending = 0;
          bus.set({
            status: "generating",
            step: bus.get().step + landed, // sections can stream in parallel; count all
            token: tokens[shown - 1] ?? "",
            topk: topk[shown - 1] ?? [],
            tokPerSec: Math.round((shown / Math.max(1, now - start)) * 1000),
            temperature,
          });
        }
        if (!done) requestAnimationFrame(frame);
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
