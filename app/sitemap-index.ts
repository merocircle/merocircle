import type { MetadataRoute } from "next";

export default function sitemapIndex(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://merocircle.app";
  const currentDate = new Date();

  return [
    {
      url: `${baseUrl}/sitemap.xml`,
      lastModified: currentDate,
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/sitemap-creators.xml`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
  ];
}
