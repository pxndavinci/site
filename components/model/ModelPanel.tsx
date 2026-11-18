"use client";
// The "model UI": a small network that lights up per token, the token just
// produced, and the model's top-3 guesses with probability bars. It reads the
// bus only; it never touches the page text. Decorative, so aria-hidden.
import { useSyncExternalStore } from "react";
import { bus, serverState, type ModelState } from "./bus";

const LAYERS = 4;
const NODES = 5;
const W = 240;
const H = 120;
const x = (l: number) => 20 + (l * (W - 40)) / (LAYERS - 1);
const y = (n: number) => 14 + (n * (H - 28)) / (NODES - 1);

// Which neurons "fire" for a token: derived from its characters, so the same
// token always lights the same pattern, as a real network would.
function activations(token: string, step: number): boolean[][] {
  const seed = [...token].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, step + 7);
  return Array.from({ length: LAYERS }, (_, l) =>
    Array.from({ length: NODES }, (_, n) => ((seed >> ((l * NODES + n) % 29)) & 3) === 0 || n === (seed + l) % NODES),
  );
}

const show = (t: string) => (t.startsWith(" ") ? "·" + t.slice(1) : t); // make the leading space visible

function useModel(): ModelState {
  return useSyncExternalStore(bus.subscribe, bus.get, () => serverState);
}

function Net({ m }: { m: ModelState }) {
  const act = activations(m.token, m.step);
  const live = m.status === "generating";
  const edges = [];
  for (let l = 0; l < LAYERS - 1; l++)
    for (let a = 0; a < NODES; a++)
      for (let b = 0; b < NODES; b++) {
        const hot = live && act[l][a] && act[l + 1][b];
        edges.push(
          <line
            key={`${l}-${a}-${b}`}
            x1={x(l)}
            y1={y(a)}
            x2={x(l + 1)}
            y2={y(b)}
            className={hot ? "stroke-signal" : "stroke-console-line"}
            strokeWidth={hot ? 1.2 : 0.6}
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
            className={`transition-[fill] duration-100 ${live && on ? "fill-signal" : "fill-console-node"}`}
          />
        )),
      )}
    </svg>
  );
}

function TopKBars({ m }: { m: ModelState }) {
  const rows = m.topk.length ? m.topk : [{ token: "…", p: 0 }];
  return (
    <ol className="space-y-1.5">
      {rows.map((r, i) => (
        <li key={i} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-2">
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

/** Desktop: sticky panel beside the text. */
export function ModelPanel() {
  const m = useModel();
  return (
    <div aria-hidden="true" className="rounded-sm bg-console p-4 font-mono text-[11px] leading-5 text-console-muted">
      <div className="mb-3 flex justify-between">
        <span className="text-console-text">mini-gpt</span>
        <span>4 layers · demo</span>
      </div>
      <Net m={m} />
      <div className="mt-3 border-t border-console-line pt-3">
        <div className="mb-2">next token</div>
        <TopKBars m={m} />
      </div>
      <div className="mt-3 border-t border-console-line pt-2 tabular-nums">{statusLine(m)}</div>
      <p className="mt-3 text-console-muted">
        Replaying pre-written text for now. A nanoGPT I&apos;m training will write this page for real.
      </p>
    </div>
  );
}

/** Phone: a slim bar pinned to the bottom, only while tokens are streaming. */
export function ModelBar() {
  const m = useModel();
  const top = m.topk[0];
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-x-0 bottom-0 z-10 bg-console px-4 py-2 font-mono text-[11px] text-console-muted transition-opacity duration-500 lg:hidden ${
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
