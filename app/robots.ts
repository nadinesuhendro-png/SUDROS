// AKSI: BUAT FILE BARU
// PATH: app/robots.ts

import type { MetadataRoute } from "next";

const SITE_URL = "https://www.sudros.id";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/dashboard",
          "/dashboard/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/orders",
          "/orders/",
          "/join-anchor/",
          "/go/",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

