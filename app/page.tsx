// The homepage. A server component: it runs at build time and emits plain
// HTML with every word in it. The only client JavaScript is the streamer and
// the model panel (components/model).
import { ModelBar, ModelPanel } from "@/components/model/ModelPanel";
import { StreamController } from "@/components/model/StreamController";
import { StreamText } from "@/components/model/StreamText";
import { about, building, footer, hero, links, site } from "./content";

// schema.org Person: tells search engines who this page is about.
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  url: site.url,
  jobTitle: "Software Engineer",
  address: { "@type": "PostalAddress", addressLocality: "Chennai", addressCountry: "IN" },
  sameAs: ["https://github.com/pxndavinci", "https://www.linkedin.com/in/abisheknallathambi"],
};

function Label({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p className="mb-5 font-mono text-xs text-ink-muted">
      <span className="text-ink">{n}</span> {children}
    </p>
  );
}

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <StreamController />

      <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-16">
        <main className="max-w-[40rem] pb-24">
          <header className="flex justify-between py-8 font-mono text-xs text-ink-muted">
            <span>abishek.joatverse.com</span>
            <nav className="flex gap-4">
              <a href="#about" className="hover:text-ink">
                about
              </a>
              <a href="#building" className="hover:text-ink">
                building
              </a>
              <a href="#contact" className="hover:text-ink">
                contact
              </a>
            </nav>
          </header>

          <section id="hero" data-stream-section className="pt-10 pb-16 sm:pt-16">
            <p className="mb-4 font-mono text-xs text-ink-muted">{hero.prompt}</p>
            <h1 className="text-5xl leading-[1.05] font-medium tracking-tight sm:text-6xl">{site.name}</h1>
            <StreamText as="p" text={hero.tagline} className="mt-6 text-xl leading-relaxed sm:text-2xl" />
            <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
              <a
                href="/Abishek_Nallathambi_Resume.pdf"
                className="text-accent underline decoration-1 underline-offset-4 hover:decoration-2"
              >
                Resume (PDF)
              </a>
              <a href="https://github.com/pxndavinci" className="hover:text-accent">
                GitHub
              </a>
              <a href="https://www.linkedin.com/in/abisheknallathambi" className="hover:text-accent">
                LinkedIn
              </a>
            </p>
          </section>

          <section id="about" data-stream-section className="border-t border-paper-edge py-14">
            <Label n="01">about</Label>
            <div className="space-y-5 text-lg leading-relaxed">
              {about.map((p, i) => (
                <StreamText key={i} as="p" text={p} />
              ))}
            </div>
          </section>

          <section id="building" className="border-t border-paper-edge py-14">
            <Label n="02">now building</Label>
            <div className="space-y-14">
              {building.map((proj, i) => (
                <article key={proj.title} id={`build-${i}`} data-stream-section>
                  <StreamText as="h2" text={proj.title} className="text-2xl leading-snug font-medium" />
                  <StreamText as="p" text={proj.body} className="mt-3 text-lg leading-relaxed" />
                  <dl className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-x-6 gap-y-4 border-l-2 border-paper-edge pl-4">
                    {proj.metrics.map((m) => (
                      <div key={m.label}>
                        <dt className="sr-only">{m.label}</dt>
                        <dd>
                          <StreamText as="span" text={m.value} className="block font-mono text-xl tabular-nums" />
                          <StreamText as="span" text={m.label} className="block text-sm leading-snug text-ink-muted" />
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <StreamText as="p" text={proj.next} className="mt-4 text-base text-ink-muted italic" />
                </article>
              ))}
            </div>
          </section>

          <section id="contact" data-stream-section className="border-t border-paper-edge py-14">
            <Label n="03">contact</Label>
            <ul className="space-y-3 text-lg">
              {links.map((l) => (
                <li key={l.label} className="grid grid-cols-[6rem_1fr] items-baseline gap-4">
                  <span className="font-mono text-xs text-ink-muted">{l.label}</span>
                  <a
                    href={l.href}
                    className="break-all text-accent underline decoration-1 underline-offset-4 hover:decoration-2"
                  >
                    <StreamText text={l.value} />
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <footer
            id="footer"
            data-stream-section
            data-temp="1.3"
            className="border-t border-paper-edge pt-10 text-ink-muted"
          >
            <p className="font-mono text-xs">sampled at T 1.3 ↓</p>
            <StreamText as="p" text={footer.tease} className="mt-2 text-base italic" />
            <StreamText as="p" text={footer.more} className="mt-6 font-mono text-xs" />
          </footer>
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-24 mt-24">
            <ModelPanel />
          </div>
        </aside>
      </div>
      <ModelBar />
    </>
  );
}
