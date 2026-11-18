import type { MetadataRoute } from "next";
import { site } from "./content";

// Static export needs routes like this one fixed at build time.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: site.url, lastModified: new Date(), changeFrequency: "weekly", priority: 1 }];
}
