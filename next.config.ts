import type { NextConfig } from "next";

// output: "export" turns `next build` into plain HTML/CSS/JS in out/.
// No Node server runs in production: nginx (or any CDN) serves the files.
const config: NextConfig = {
  output: "export",
  images: { unoptimized: true }, // the image optimizer needs a server; we have none
  poweredByHeader: false,
};

export default config;
