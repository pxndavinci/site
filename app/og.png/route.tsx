// The preview card shown when the link is pasted into LinkedIn, Slack or
// WhatsApp. A route handler at /og.png, rendered once at build time into a real
// out/og.png file (a .png name, so nginx sends the right content type).
import { ImageResponse } from "next/og";
import { hero, site } from "../content";

export const dynamic = "force-static";
const size = { width: 1200, height: 630 };

export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        background: "#f8f5ef",
        color: "#2b2520",
      }}
    >
      <div style={{ fontSize: 26, color: "#6b625a", fontFamily: "monospace" }}>{hero.prompt}</div>
      <div style={{ fontSize: 84, marginTop: 24, fontWeight: 600 }}>{site.name}</div>
      <div style={{ fontSize: 36, marginTop: 24, lineHeight: 1.35, maxWidth: 980 }}>{hero.tagline}</div>
      <div style={{ fontSize: 24, marginTop: 48, color: "#a5452a", fontFamily: "monospace" }}>
        abishek.joatverse.com
      </div>
    </div>,
    size,
  );
}
