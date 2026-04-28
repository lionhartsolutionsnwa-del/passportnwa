import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/dashboard",
          "/auth",
          "/api",
          "/settings",
          "/notifications",
          "/welcome",
          "/unsubscribe",
          "/stamp",
          "/redemptions",
        ],
      },
    ],
    sitemap: "https://www.passportnwa.com/sitemap.xml",
    host: "https://www.passportnwa.com",
  };
}
