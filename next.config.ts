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

/** Excluye route handlers locales de n8n; el resto de /api/* se proxya a Nest. */
export const NEST_API_REWRITE_SOURCE =
  "/api/:path((?!pedido-proveedor$)(?!solicitud-compra$)(?!evidencia-transporte$).*)";

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
];

const nextConfig: NextConfig = {
  // Evita que Turbopack use C:\Users\Daniel\Videos como root (hay package-lock.json padre).
  turbopack: {
    root: projectRoot,
  },
  async rewrites() {
    return {
      afterFiles: [
        {
          source: NEST_API_REWRITE_SOURCE,
          destination: `${apiBaseUrl}/:path*`,
        },
      ],
    };
  },
  async redirects() {
    return [
      {
        source: "/dashboard/integracion-cuenta",
        destination: "/dashboard/bodega-externa",
        permanent: true,
      },
      {
        source: "/dashboard/integracion-cuenta/integracion",
        destination: "/dashboard/bodega-externa/integracion",
        permanent: true,
      },
    ];
  },
  async headers() {
    const noStore = [
      { key: "Cache-Control", value: "no-store, must-revalidate" },
    ];

    const shellHeaders = [...noStore, ...SECURITY_HEADERS];

    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      { source: "/configurador", headers: shellHeaders },
      { source: "/configurador/:path*", headers: shellHeaders },
      { source: "/dashboard", headers: shellHeaders },
      { source: "/dashboard/:path*", headers: shellHeaders },
      { source: "/platform", headers: shellHeaders },
      { source: "/platform/:path*", headers: shellHeaders },
      { source: "/login", headers: shellHeaders },
      { source: "/auth/:path*", headers: shellHeaders },
    ];
  },
};

export default nextConfig;
