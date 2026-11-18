// Where the "model" numbers come from. The page text is fixed (it is in the
// HTML for SEO); a TokenSource only says, for each token of a section, what the
// model's top guesses were and with what probability.
//
// v0 = cannedSource: made-up but deterministic guesses.
// Later = a source backed by my own nanoGPT. Feed it the same text (teacher
// forcing: at each position the model sees the real text so far) and record its
// real top-k probabilities. Run that at build time into JSON, or call a live
// endpoint. Either way it implements this interface and nothing else changes.

export type TopK = { token: string; p: number };

export interface TokenSource {
  name: string;
  /** One TopK list per token; entry [0] is always the token actually shown. */
  topk(sectionId: string, tokens: string[]): Promise<TopK[][]>;
}

// Small deterministic hash (FNV-1a) → the same page always shows the same numbers.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Final avalanche (MurmurHash3 fmix32): FNV alone barely changes for "id:41"
  // vs "id:42", which bunched the unsure words together in one paragraph.
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}
const unit = (s: string) => hash(s) / 4294967295; // → [0, 1]

export const cannedSource: TokenSource = {
  name: "canned",
  async topk(sectionId, tokens) {
    // Distractors come from the section's own words, so the guesses look plausible.
    const pool = [...new Set(tokens.filter((t) => /\w{3,}/.test(t)))];
    const pick = (seed: string, not: string) => {
      if (pool.length < 3) return " the";
      let i = hash(seed) % pool.length;
      while (pool[i] === not) i = (i + 1) % pool.length;
      return pool[i];
    };

    return tokens.map((tok, i) => {
      const r = unit(`${sectionId}:${i}`);
      const isPunct = /^\s*[^\w\s]$/.test(tok);
      // Like a real model: punctuation is near-certain, most words are confident,
      // and about 1 word in 16 is a genuine coin-flip (those get the dotted underline).
      const p = isPunct ? 0.9 + 0.09 * r : r < 0.06 ? 0.24 + 3 * r : 0.55 + 0.42 * Math.sqrt(r);
      const rest = 1 - p;
      const a = pick(`${sectionId}:${i}:a`, tok);
      const b = pick(`${sectionId}:${i}:b`, tok);
      return [
        { token: tok, p },
        { token: a, p: rest * 0.58 },
        { token: b === a ? " and" : b, p: rest * 0.21 },
      ];
    });
  },
};
