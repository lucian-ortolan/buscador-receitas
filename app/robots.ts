// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://brasilreceitas.com.br/sitemap.xml",
    host: "https://brasilreceitas.com.br",
  };
}
