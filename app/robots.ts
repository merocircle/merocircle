import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://merocircle.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/", 
          "/creator/", 
          "/explore", 
          "/about",
          "/auth",
          "/login",
          "/signup",
          "/signup/creator"
        ],
        disallow: [
          "/api/",
          "/home",
          "/settings",
          "/dashboard",
          "/chat",
          "/notifications",
          "/profile",
          "/payment/",
          "/unsubscribe",
          "/create-post",
          "/creator-studio",
          "/admin/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/creator/", "/explore", "/about", "/auth"],
        crawlDelay: 1,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
