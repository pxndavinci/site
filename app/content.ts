// All page copy lives here, apart from the markup, so editing the words never
// means touching a component. Every number below is sourced in the vault:
// vLLM → vault/venture/site/deadlines.md (W7 row) · job watch →
// vault/career/job-watch-design.md · Life OS → vault/venture/site/build-log.md.

export const site = {
  url: "https://abishek.joatverse.com",
  name: "Abishek Nallathambi",
  title: "Abishek Nallathambi: backend engineer moving into AI",
  description:
    "Backend engineer at a fintech in Chennai, moving into AI: GenAI, agents and the infrastructure that serves models. What I'm building, with real numbers.",
};

export const hero = {
  prompt: 'prompt: "who is abishek?"',
  tagline:
    "I build backend systems at a fintech, and I'm moving into AI: GenAI, agents, and the infrastructure that serves models.",
};

export const about = [
  "I'm a software engineer at Sagent Lending Technologies in Chennai. I work on GNMA investor reporting, the system that turns loan data into the monthly reports Ginnie Mae accepts for US mortgage-backed securities. It's mostly SQL Server and .NET, with Python where it helps.",
  "This year I traced the calculation and rounding bugs behind the exceptions Ginnie Mae sends back each month and fixed them, which cut them by about 80%, from roughly 1,000 a month to 200. I also built an AI agent for my team that knows the platform's code and business terms and helps trace data issues to their root cause.",
  "I studied Artificial Intelligence and Machine Learning at Rajalakshmi Engineering College (B.Tech, 2024, CGPA 8.95). Now I'm going deeper on the systems side of AI: serving models on my own GPU, measuring them, and training a small GPT of my own.",
  "Outside work: anime (Attack on Titan, always), books, Breaking Bad and Marvel, photography, and running.",
];

export type Project = {
  title: string;
  body: string;
  metrics: { value: string; label: string }[];
  next: string;
};

export const building: Project[] = [
  {
    title: "Serving an LLM on my own GPU, measured",
    body: "Qwen3-0.6B on vLLM, running on the RTX 5070 Ti in my homelab, benchmarked with vllm bench serve: 512 tokens in, 128 out, 200 prompts per run. My first saturated run hit the prefix cache, which hid about 20% of throughput and 2.7× of tail latency, so every run now gets a fresh seed.",
    metrics: [
      { value: "13 ms", label: "time to first token, p50, at 1 req/s" },
      { value: "1,011", label: "output tokens/s at 8 req/s" },
      { value: "5,456", label: "output tokens/s with 200 requests at once" },
    ],
    next: "Next: my own continuous batcher with a paged KV cache, run against vLLM on the same workload.",
  },
  {
    title: "A job search that runs 24/7",
    body: "Python watches about 48 public job boards, scores every new posting, picks the right resume and pre-fills the application. Claude writes only the answers that need judgment for that one job. Nothing is submitted until I approve it from my phone.",
    metrics: [
      { value: "~48", label: "job boards watched" },
      { value: "285", label: "relevant roles found on the first scan" },
      { value: "70+", label: "score a role needs before it reaches me" },
    ],
    next: "Next: LinkedIn and more portals, and a weekly report on what actually gets callbacks.",
  },
  {
    title: "Life OS",
    body: "One place to run my day: routine, tasks, notes and search, on my own server. The Postgres schema is done. It keeps every version of a plan instead of overwriting it, and database constraints make sure two versions can never overlap. I proved every constraint by making it fail before merging.",
    metrics: [{ value: "11", label: "Postgres tables, versioned (SCD Type 2)" }],
    next: "Next: the Go API on top of it.",
  },
];

export const links = [
  { label: "GitHub", value: "github.com/pxndavinci", href: "https://github.com/pxndavinci" },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/abisheknallathambi",
    href: "https://www.linkedin.com/in/abisheknallathambi",
  },
  {
    label: "Email",
    value: "abisheknallathambi13@gmail.com",
    href: "mailto:abisheknallathambi13@gmail.com",
  },
  {
    label: "Resume",
    value: "PDF, 1 page",
    href: "/Abishek_Nallathambi_Resume.pdf",
  },
];

export const footer = {
  tease:
    "Hey, yes you are correct, it is mostly vibe coded XD. But the idea is mine :) I just used the new tech we have, don't judge blindly ;)",
  more: "More sections coming: books, anime, photography, each written in its own style.",
};
