import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://merocircle.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/creator/", "/explore", "/about"],
        disallow: [
          "/api/",
          "/home",
          "/settings",
          "/dashboard",
          "/chat",
          "/notifications",
          "/profile",
          "/signup/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
