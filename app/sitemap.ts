// app/sitemap.ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  return [
    {
      url: "https://brasilreceitas.com.br/",
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://brasilreceitas.com.br/buscar",
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];
}
