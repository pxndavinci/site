"use client";
// The portrait "generates" itself the way a diffusion model samples an image:
// it starts as pure Gaussian noise and, step by step, the noise is removed.
// Today this is a replay: we already have the final image, so each step is
// computed from it with the real formula instead of by a trained network.
//
//   x_t = √ᾱ_t · x̂₀ + √(1−ᾱ_t) · ε
//
//   x_t  the image the visitor sees at step t
//   x̂₀   the model's current guess of the clean image. Early guesses are
//        blurry: diffusion models settle the coarse shapes first and the fine
//        detail last, so we use a heavily blurred x̂₀ early and a sharp one late.
//   ε    one fixed noise sample (DDIM-style sampling keeps it fixed, so the
//        picture sharpens smoothly instead of flickering)
//   ᾱ_t  how much signal survives at step t, from the cosine noise schedule
//        (Nichol & Dhariwal, 2021): ~0 at the start, 1 at the end.
//
// A new seed each page load means the noise, and so the path to the image,
// differs every visit. The swap point for a real model: replace x̂₀ with the
// network's prediction at each step; the drawing code stays the same.
import { useEffect, useRef, useSyncExternalStore } from "react";
import { bus } from "./bus";

const RES = 128; // the "model's" resolution; the canvas is scaled up by CSS
const STEPS = 50;
const DURATION_MS = 1800;
// Ease-out over the steps: the early, all-noise steps rush past and the reveal
// (where shapes and then detail appear) gets most of the time. Real samplers
// look like static for their first half too; nobody wants to watch that.
const stepsDone = (u: number) => Math.round(STEPS * (1 - (1 - Math.min(1, u)) ** 2));
const LEVELS = 5; // blur levels for x̂₀: 128 → 4 px, coarse to fine

const s = 0.008;
const f = (t: number) => Math.cos(((t + s) / (1 + s)) * (Math.PI / 2)) ** 2;
const alphaBar = (t: number) => f(t) / f(0); // t runs 1 (all noise) → 0 (clean)

// mulberry32: a tiny seeded random generator, so one seed = one noise sample.
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The image at RES, blurred to `LEVELS + 1` strengths, as floats in [-1, 1]
// (the range diffusion models work in). Blur = shrink then scale back up.
function pyramid(img: HTMLImageElement): Float32Array[] {
  const paper = getComputedStyle(document.body).backgroundColor;
  const out: Float32Array[] = [];
  const small = document.createElement("canvas");
  const big = document.createElement("canvas");
  big.width = big.height = RES;
  const bctx = big.getContext("2d", { willReadFrequently: true })!;
  for (let l = 0; l <= LEVELS; l++) {
    const n = RES >> l;
    small.width = small.height = n;
    const sctx = small.getContext("2d")!;
    // The portrait has a transparent background: the "model" generates the
    // whole square, so composite it on the page colour first. The last frame
    // then matches the page and the <img> fades in without a seam.
    sctx.fillStyle = paper;
    sctx.fillRect(0, 0, n, n);
    sctx.drawImage(img, 0, 0, n, n);
    bctx.imageSmoothingQuality = "high";
    bctx.drawImage(small, 0, 0, RES, RES);
    const px = bctx.getImageData(0, 0, RES, RES).data;
    const f32 = new Float32Array(RES * RES * 3);
    for (let i = 0, j = 0; i < px.length; i += 4, j += 3) {
      f32[j] = px[i] / 127.5 - 1;
      f32[j + 1] = px[i + 1] / 127.5 - 1;
      f32[j + 2] = px[i + 2] / 127.5 - 1;
    }
    out.push(f32);
  }
  return out;
}

export function DiffusionPortrait({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const on = useSyncExternalStore(
    bus.subscribe,
    () => bus.get().enabled,
    () => true,
  );
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const caption = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = box.current!;
    const say = (t: string) => caption.current && (caption.current.textContent = t);
    el.classList.remove("running", "done");
    if (!on || !document.documentElement.classList.contains("stream")) {
      say("");
      return;
    }
    let raf = 0;
    let stopped = false;

    const start = async () => {
      await img.current!.decode().catch(() => {});
      if (stopped) return;
      const x0 = pyramid(img.current!);
      const seed = (Math.random() * 2 ** 31) | 0;
      const rand = rng(seed);
      // ε: one standard-normal value per pixel and channel (Box–Muller).
      const eps = new Float32Array(RES * RES * 3);
      for (let i = 0; i < eps.length; i++)
        eps[i] = Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());

      const ctx = canvas.current!.getContext("2d")!;
      const frame = ctx.createImageData(RES, RES);
      const px = frame.data;
      for (let i = 3; i < px.length; i += 4) px[i] = 255;

      const draw = (k: number) => {
        const t = k / STEPS;
        const a = Math.sqrt(alphaBar(t));
        const b = Math.sqrt(1 - alphaBar(t));
        // Coarse to fine: blend the two nearest blur levels for this t.
        const lv = Math.min(LEVELS, t * LEVELS * 1.2);
        const lo = Math.floor(lv);
        const hi = Math.min(LEVELS, lo + 1);
        const w = lv - lo;
        const A = x0[lo];
        const B = x0[hi];
        for (let i = 0, j = 0; j < eps.length; i += 4, j += 3)
          for (let c = 0; c < 3; c++) {
            const guess = A[j + c] * (1 - w) + B[j + c] * w;
            px[i + c] = (a * guess + b * eps[j + c] + 1) * 127.5; // the byte array clamps to 0–255 itself
          }
        ctx.putImageData(frame, 0, 0);
        say(
          k > 0 ? `denoising · step ${STEPS - k}/${STEPS}` : `sampled · ${STEPS} steps · seed ${seed % 10000} · demo`,
        );
      };

      draw(STEPS);
      el.classList.add("running");
      const t0 = performance.now();
      let last = STEPS;
      const tick = (now: number) => {
        if (stopped) return;
        const k = STEPS - stepsDone((now - t0) / DURATION_MS);
        if (k !== last) draw((last = k)); // only redraw when the step changes
        if (k > 0) raf = requestAnimationFrame(tick);
        else el.classList.add("done"); // the sharp <img> fades in over the 128 px canvas
      };
      raf = requestAnimationFrame(tick);
    };

    // Run once the portrait is on screen (it is, in the hero, on most visits).
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        io.disconnect();
        start();
      }
    });
    io.observe(el);
    return () => {
      stopped = true;
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [on]);

  return (
    <figure className={className}>
      <div ref={box} className="portrait">
        <canvas ref={canvas} width={RES} height={RES} aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image optimiser */}
        <img ref={img} src={src} alt={alt} width={560} height={560} decoding="async" />
      </div>
      <figcaption
        aria-hidden="true"
        className="mt-2 h-4 font-mono text-[10px] whitespace-nowrap text-ink-muted tabular-nums"
      >
        <span ref={caption} />
      </figcaption>
    </figure>
  );
}
