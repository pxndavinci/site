import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Newsreader } from "next/font/google";
import { site } from "./content";
import "./globals.css";

// next/font downloads the fonts at build time and serves them from this site:
// no request to Google from the visitor, and font-display: swap so text shows
// at once in a fallback font (fonts are the usual cause of a slow LCP).
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

// Metadata API: Next turns this object into <title>, <meta> and Open Graph tags.
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.title,
  description: site.description,
  alternates: { canonical: "/" },
  authors: [{ name: site.name, url: site.url }],
  openGraph: {
    type: "profile",
    url: site.url,
    siteName: site.name,
    title: site.title,
    description: site.description,
    locale: "en_IN",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: site.title }],
  },
  twitter: { card: "summary_large_image", title: site.title, description: site.description, images: ["/og.png"] },
};

export const viewport: Viewport = { themeColor: "#f8f5ef" };

// Runs before first paint. Turns the streaming effect on only when JS works and
// the visitor hasn't asked for less motion. Failsafe: if the app hasn't started
// within 4 s (a script error, say), drop the class so the text never stays hidden.
const streamGate = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){var d=document.documentElement;d.classList.add('stream');setTimeout(function(){if(!window.__streamReady)d.classList.remove('stream')},4000)}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: streamGate }} />
      </head>
      <body className="bg-paper font-serif text-ink antialiased">{children}</body>
    </html>
  );
}
