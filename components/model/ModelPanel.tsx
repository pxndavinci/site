"use client";
// The "model UI": a small network that lights up per token, the token just
// produced, and the model's top-3 guesses with probability bars. It reads the
// bus only; it never touches the page text. Decorative, so aria-hidden.
// Wide screens: a horizontal card pinned bottom-right, in the empty gutter
// beside the text (from 1280 px the gutter is wide enough that it never covers
// a word; measured: 1152 px overlapped the text by 32 px). Narrower: the slim bar along the bottom.
import { useEffect, useState, useSyncExternalStore } from "react";
import { bus, serverState, type ModelState } from "./bus";

const LAYERS = 4;
const NODES = 5;
const W = 240;
const H = 120;
const x = (l: number) => 16 + (l * (W - 84)) / (LAYERS - 1); // room on the right for the emitted token
const STEP_MS = 55; // one layer per 45 ms: a full forward pass reads as a wave, not a blink
const y = (n: number) => 14 + (n * (H - 28)) / (NODES - 1);

// Which neurons "fire" for a token: derived from its characters, so the same
// token always lights the same pattern, as a real network would.
function activations(token: string, step: number): boolean[][] {
  const seed = [...token].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, step + 7);
  return Array.from({ length: LAYERS }, (_, l) =>
    Array.from({ length: NODES }, (_, n) => ((seed >> ((l * NODES + n) % 29)) & 3) === 0 || n === (seed + l) % NODES),
  );
}

const show = (t: string) => t.trim();

// Is the wide layout active? The server (and hydration) assume yes, then the
// real answer takes over. Each panel only renders, and only subscribes to the
// token stream, on the layout where it is visible: the hidden one used to
// re-render 20 times a second for nothing.
const DESKTOP = "(min-width: 1280px)"; // keep in sync with xl:hidden in Bar
function useDesktop(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = matchMedia(DESKTOP);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => matchMedia(DESKTOP).matches,
    () => true,
  );
}

function useModel(): ModelState {
  return useSyncExternalStore(bus.subscribe, bus.get, () => serverState);
}

// Forward-pass wave: while tokens stream, a pulse walks the layers left to
// right (layer `phase` fires, the one before it fades), then the token pops out
// on the right. That is the order a real forward pass computes in.
function usePhase(live: boolean): number {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!live) return;
    let id = 0;
    const tick = (now: number) => {
      const next = Math.floor(now / STEP_MS) % (LAYERS + 1);
      setPhase((p) => (p === next ? p : next)); // same value → React skips the render
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [live]);
  return phase;
}

function Net({ m }: { m: ModelState }) {
  const live = m.status === "generating";
  const phase = usePhase(live);
  const act = activations(m.token, m.step - (m.step % 8)); // hold one pattern per pass, not per frame
  const fires = (l: number) => live && l === phase;
  const fading = (l: number) => live && l === phase - 1;
  const edges = [];
  for (let l = 0; l < LAYERS - 1; l++)
    for (let a = 0; a < NODES; a++)
      for (let b = 0; b < NODES; b++) {
        const hot = fading(l) && fires(l + 1) && act[l][a] && act[l + 1][b];
        edges.push(
          <line
            key={`${l}-${a}-${b}`}
            x1={x(l)}
            y1={y(a)}
            x2={x(l + 1)}
            y2={y(b)}
            className={hot ? "stroke-signal" : "stroke-console-line"}
            strokeWidth={hot ? 1.3 : 0.6}
          />,
        );
      }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="presentation">
      {edges}
      {act.map((layer, l) =>
        layer.map((on, n) => (
          <circle
            key={`${l}-${n}`}
            cx={x(l)}
            cy={y(n)}
            r={4.5}
            className={
              on && fires(l) ? "fill-signal" : on && fading(l) ? "fill-signal opacity-40" : "fill-console-node"
            }
          />
        )),
      )}
      <text
        x={x(LAYERS - 1) + 12}
        y={H / 2 + 4}
        className={`fill-console-text font-mono text-[15px] ${live && phase === LAYERS ? "opacity-100" : "opacity-0"}`}
      >
        {show(m.token).slice(0, 7)}
      </text>
    </svg>
  );
}

function TopKBars({ m }: { m: ModelState }) {
  const rows = m.topk.length ? m.topk : [{ token: "…", p: 0 }];
  return (
    <ol className="space-y-1.5">
      {rows.map((r, i) => (
        <li key={i} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-2">
          <span className={`truncate ${i === 0 ? "text-console-text" : "text-console-muted"}`}>{show(r.token)}</span>
          <span className="h-1.5 bg-console-line">
            <span
              className={`block h-full ${i === 0 ? "bg-signal" : "bg-console-muted"}`}
              style={{ width: `${Math.round(r.p * 100)}%` }}
            />
          </span>
          <span className="text-right tabular-nums text-console-muted">{r.p ? r.p.toFixed(2) : ""}</span>
        </li>
      ))}
    </ol>
  );
}

const statusLine = (m: ModelState) =>
  m.status === "static"
    ? "motion off · full text shown"
    : m.status === "waiting"
      ? "idle · scroll to generate"
      : m.status === "done"
        ? `done · ${m.step} tokens`
        : `${m.tokPerSec} tok/s · step ${m.step} · T ${m.temperature}`;

/** Wide screens: a horizontal card pinned to the bottom-right corner. */
export function ModelPanel() {
  return useDesktop() ? <Panel /> : null;
}

function Panel() {
  const m = useModel();
  return (
    <div
      aria-hidden="true"
      className="fixed right-6 bottom-6 z-10 w-[26rem] rounded-sm bg-console p-3.5 font-mono text-[11px] leading-5 text-console-muted shadow-lg"
    >
      <div className="mb-2 flex justify-between">
        <span className="text-console-text">mini-gpt</span>
        <span>4 layers · demo</span>
      </div>
      <div className="grid grid-cols-[9.5rem_1fr] items-center gap-4">
        <Net m={m} />
        <div>
          <div className="mb-1.5">next token</div>
          <TopKBars m={m} />
        </div>
      </div>
      <div className="mt-2 border-t border-console-line pt-1.5 tabular-nums">{statusLine(m)}</div>
      <p className="mt-1 text-console-muted">
        Replaying pre-written text for now. A nanoGPT I&apos;m training will write this page for real.
      </p>
    </div>
  );
}

/** Phone and small laptop: a slim bar pinned to the bottom, only while tokens are streaming. */
export function ModelBar() {
  return useDesktop() ? null : <Bar />;
}

function Bar() {
  const m = useModel();
  const top = m.topk[0];
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-x-0 bottom-0 z-10 bg-console px-4 py-2 font-mono text-[11px] text-console-muted transition-opacity duration-500 xl:hidden ${
        m.status === "generating" ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <span className="text-console-text">mini-gpt</span>
        <span className="w-24 truncate text-console-text">{top ? show(top.token) : ""}</span>
        <span className="h-1.5 flex-1 bg-console-line">
          <span className="block h-full bg-signal" style={{ width: `${Math.round((top?.p ?? 0) * 100)}%` }} />
        </span>
        <span className="tabular-nums">{m.tokPerSec} tok/s</span>
      </div>
    </div>
  );
}
