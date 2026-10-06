import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Staff screens, the API and personal order pages aren't for search results.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/kitchen", "/staff", "/order/status/"] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
