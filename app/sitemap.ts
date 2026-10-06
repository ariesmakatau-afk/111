import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/menu", "/catering", "/story", "/parea", "/visit"].map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: path === "/menu" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
