import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

function normalizeApiBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

const apiBaseUrl = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL ??
    "https://polaria-wms-api.onrender.com",
);

const nextConfig: NextConfig = {
  // Evita que Turbopack use C:\Users\Daniel\Videos como root (hay package-lock.json padre).
  turbopack: {
    root: projectRoot,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiBaseUrl}/:path*`,
      },
    ];
  },
  async headers() {
    const noStore = [
      { key: "Cache-Control", value: "no-store, must-revalidate" },
    ];

    return [
      { source: "/configurador", headers: noStore },
      { source: "/configurador/:path*", headers: noStore },
      { source: "/dashboard", headers: noStore },
      { source: "/dashboard/:path*", headers: noStore },
      { source: "/platform", headers: noStore },
      { source: "/platform/:path*", headers: noStore },
    ];
  },
};

export default nextConfig;
