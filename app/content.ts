// All page copy lives here, apart from the markup, so editing the words never
// means touching a component. Every number below is sourced in the vault:
// vLLM → vault/venture/site/deadlines.md (W7 row) · job watch →
// vault/career/job-watch-design.md · Life OS → vault/venture/site/build-log.md ·
// LSM → vault/learn/github-oss/lsm-production-build.md.
//
// Employer rule (his call, 18 Nov 2026): no employer name, client, regulator or
// internal system names, and no absolute volumes. Generic outcomes only.

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
  "I'm a software engineer at a mortgage fintech in Chennai. I work on the platform that turns loan data into the monthly reports investors in US mortgage-backed securities rely on. It's mostly SQL Server and .NET, with Python where it helps, and the numbers have to be right to the cent.",
  "I studied AI and ML, spent my first years on backend and data work where mistakes cost real money, and now I'm going deeper on the systems side of AI: serving models on my own GPU, measuring them, and training a small GPT of my own.",
  "Outside work: anime, with Attack on Titan at the top. Books on psychology, negotiation and money (Chris Voss and Morgan Housel right now). Breaking Bad, Marvel, and films like Ford v Ferrari and Dunkirk. I lift, run, take photos, and keep a two-machine homelab that I break and fix more often than I'd admit.",
];

export type Milestone = { when: string; what: string; href?: string };

// The path so far: dated, real, and linked where there is something to see.
export const path: Milestone[] = [
  {
    when: "2023",
    what: "Built BookMyVax, a vaccine-booking web app, in five days with no Django before it.",
    href: "https://github.com/pxndavinci/bookmyvax",
  },
  {
    when: "2024",
    what: "B.Tech in Artificial Intelligence and Machine Learning, CGPA 8.95. Joined a mortgage fintech as an intern and got a pre-placement offer to stay full-time.",
  },
  {
    when: "2026",
    what: "Traced the calculation and rounding bugs behind the exceptions our monthly reports got back, and cut them by about 80%. Removed a manual month-end check the team ran every cycle.",
  },
  {
    when: "2026",
    what: "Built an AI agent for my team that knows our codebase and domain language and traces data issues to their root cause.",
  },
  {
    when: "Sep 2026",
    what: "Shipped a service-order app that a real laptop repair shop runs on: React and TypeScript, Express and Postgres, contract-first API, and deploys itself with rollback.",
    href: "https://github.com/pxndavinci/laptop-service-management",
  },
  {
    when: "Nov 2026",
    what: "Got vLLM serving on a new-generation GPU with the stock image and no source build, then benchmarked it.",
  },
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
    title: "My own agent workspace",
    body: "The setup I run Claude Code in every day: skills for recurring jobs (resume builds, research briefs, job-description reviews), hooks that keep its memory clean, and a layered memory that syncs across my machines, so every session starts knowing what the last one decided.",
    metrics: [
      { value: "15", label: "skills, each backed by its own scripts" },
      { value: "2", label: "machines sharing one memory, synced peer to peer" },
    ],
    next: "Next: evals, so a change to a skill is measured before it ships.",
  },
  {
    title: "A job search that runs 24/7",
    body: "Python watches about 48 public job boards, scores every new posting, picks the right resume and pre-fills the application. Claude writes only the answers that need judgment for that one job. Nothing is submitted until I approve it from my phone.",
    metrics: [
      { value: "~48", label: "job boards watched" },
      { value: "285", label: "relevant roles found on the first scan" },
      { value: "70+", label: "score a role needs before it reaches me" },
    ],
    next: "Next: a weekly report on which roles actually call back, fed into the scoring.",
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
