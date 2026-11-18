// Splits text into GPT-style tokens: each word carries its leading space
// (" backend"), and every punctuation mark is its own token. Joining the tokens
// back gives the original text exactly, so the HTML still holds the real
// sentence for search engines and screen readers.
//
// A real BPE tokenizer (what nanoGPT uses) splits rarer words into pieces;
// when the real model lands, its tokenizer replaces this function.
const TOKEN = /\s*(?:[A-Za-z0-9'’]+|[^\sA-Za-z0-9'’])/g;

export function tokenize(text: string): string[] {
  return text.trim().match(TOKEN) ?? [];
}
