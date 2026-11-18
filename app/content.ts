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
  tagline: "Backend engineer at a fintech, moving into AI: GenAI, agents, and the infrastructure that serves models.",
};

// Voice: content-engine Mode D (vault/content-ideas/_style/style-profile.md + ai-tells.md).
export const about = [
  "I'm a backend engineer at a mortgage fintech in Chennai.",
  "My day job is the reporting platform behind US mortgage-backed securities. Loan data comes in, monthly investor reports go out, and every number has to match to the cent. Mostly SQL Server and .NET, Python whenever it saves me time.",
  "Somewhere in the middle of all that, I wanted to know what actually happens inside an LLM when it answers. So now I serve models on my own GPU, measure them until the numbers make sense, and I'm training a small GPT of my own. Slowly :)",
  "Outside work: anime (Attack on Titan, and I will defend that ranking), books on psychology and money (Voss and Housel right now), Breaking Bad, Marvel, Ford v Ferrari. I lift, I run, I take photos, and I keep a two-machine homelab that I break more often than I'd like to admit.",
];

export type Milestone = { when: string; what: string; href?: string };

// The path so far: dated, real, and linked where there is something to see.
export const path: Milestone[] = [
  {
    when: "2023",
    what: "Built BookMyVax, a vaccine-booking web app in Django. Never touched Django before that week. Shipped it in five days.",
    href: "https://github.com/pxndavinci/bookmyvax",
  },
  {
    when: "2024",
    what: "B.Tech in AI and ML, CGPA 8.95. Joined a mortgage fintech as an intern and stayed full-time on a pre-placement offer.",
  },
  {
    when: "2026",
    what: "Hunted down the calculation and rounding bugs behind the exceptions our monthly reports kept getting back. Most of them stopped coming back. Also retired a manual month-end check the team ran every single cycle.",
  },
  {
    when: "2026",
    what: "Built an AI agent for my team. It knows our code and our domain words, and it goes looking for the root cause when the data looks wrong.",
  },
  {
    when: "Sep 2026",
    what: "Shipped a service-order app for a real laptop repair shop, and the shop runs on it. React and TypeScript in front, Express and Postgres behind, and it rolls itself back if a deploy goes wrong.",
    href: "https://github.com/pxndavinci/laptop-service-management",
  },
  {
    when: "Nov 2026",
    what: "Got vLLM serving on a brand-new GPU generation. Expected a source build. The stock image just worked.",
  },
];

export type Project = {
  title: string;
  body: string[];
  metrics: { value: string; label: string }[];
  next: string;
};

export const building: Project[] = [
  {
    title: "Serving an LLM on my own GPU, and measuring it",
    body: [
      "Qwen3-0.6B on vLLM, on the RTX 5070 Ti in my homelab. 512 tokens in, 128 out, 200 prompts per run.",
      "My first full-load run looked great. Too great. The prompts were repeats, so the prefix cache was quietly doing the work and hid about 20% of throughput and 2.7× of the tail latency. Every run gets a fresh seed now.",
    ],
    metrics: [
      { value: "13 ms", label: "time to first token, p50, at 1 req/s" },
      { value: "1,011", label: "output tokens/s at 8 req/s" },
      { value: "5,456", label: "output tokens/s with 200 requests at once" },
    ],
    next: "Next: my own continuous batcher with a paged KV cache, against vLLM on the same workload. I expect to lose. I want to know by how much.",
  },
  {
    title: "My agent workspace",
    body: [
      "Claude Code is where most of my work starts now, so I built a proper workspace around it.",
      "Skills for the jobs I repeat, like resume builds and reading job descriptions. Hooks that stop its memory from rotting. One memory synced across my machines, so a new session starts knowing what the last one decided.",
    ],
    metrics: [
      { value: "15", label: "skills, each backed by its own scripts" },
      { value: "2", label: "machines sharing one memory, synced peer to peer" },
    ],
    next: "Next: evals. A change to a skill should prove itself before it ships.",
  },
  {
    title: "A job search that runs while I sleep",
    body: [
      "Python watches about 48 public job boards and scores every new posting. Anything that clears the bar gets the right resume and a pre-filled form.",
      "Claude only writes the answers that need judgment for that one job. And nothing goes out until I approve it on my phone.",
    ],
    metrics: [
      { value: "~48", label: "job boards watched" },
      { value: "285", label: "relevant roles found on the first scan" },
      { value: "70+", label: "score a role needs before it reaches me" },
    ],
    next: "Next: a weekly report on which roles actually call back, fed into the scoring.",
  },
  {
    title: "Life OS",
    body: [
      "One place to run my day: routine, tasks, notes, search. On my own server.",
      "The Postgres schema is done. It never overwrites a plan, it keeps every version, and the database itself refuses two versions that overlap. Before merging, I made every constraint fail on purpose, just to watch it fail.",
    ],
    metrics: [{ value: "11", label: "Postgres tables, versioned (SCD Type 2)" }],
    next: "Next: the Go API on top.",
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
  more: "More sections coming: books, anime, photography. Each one gets its own look.",
};
