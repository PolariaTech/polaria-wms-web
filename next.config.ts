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
  "/api/:path((?!pedido-proveedor$)(?!solicitud-compra$)(?!evidencia-transporte$)(?!ventas/leer-pedido$)(?!ventas/imprimir-orden$)(?!ventas/productos-catalogo$)(?!reportes/).*)";

const BASE_SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()",
  },
];

const SECURITY_HEADERS = [
  ...BASE_SECURITY_HEADERS,
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
];

/** Sin CORP: Safari en IP local (192.168.x) bloqueaba JS/fetch y el botón no se activaba. */
const CAPTURA_PUBLIC_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=*, microphone=(), geolocation=()",
  },
  { key: "Cache-Control", value: "no-store, must-revalidate" },
];

/** Permite embeber la vista de reportes en el mismo origen (dashboard). */
const EMBED_FRAME_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cache-Control", value: "no-store, must-revalidate" },
];

const nextConfig: NextConfig = {
  // El teléfono entra por LAN (p.ej. 192.168.80.11), no por localhost.
  // Next 16 bloquea /_next/* desde esa IP: el HTML carga, la foto se elige,
  // pero React no hidrata y “Subir y leer hoja” nunca se activa.
  allowedDevOrigins: [
    "192.168.80.11",
    "192.168.*.*",
    "10.*.*.*",
    "172.16.*.*",
    "172.17.*.*",
    "172.18.*.*",
    "172.19.*.*",
    "172.20.*.*",
    "172.21.*.*",
    "172.22.*.*",
    "172.23.*.*",
    "172.24.*.*",
    "172.25.*.*",
    "172.26.*.*",
    "172.27.*.*",
    "172.28.*.*",
    "172.29.*.*",
    "172.30.*.*",
    "172.31.*.*",
  ],
  // Evita que Turbopack use C:\Users\Daniel\Videos como root (hay package-lock.json padre).
  turbopack: {
    root: projectRoot,
  },
  serverExternalPackages: [
    "unpdf",
    "file-type",
    "mammoth",
    "openai",
    "chrono-node",
    "html-to-text",
    "mailparser",
    "ipp",
  ],
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
      { source: "/reportes-embed", headers: EMBED_FRAME_HEADERS },
      { source: "/reportes-embed/:path*", headers: EMBED_FRAME_HEADERS },
      { source: "/logo.png", headers: CAPTURA_PUBLIC_HEADERS },
      { source: "/captura-orden", headers: CAPTURA_PUBLIC_HEADERS },
      { source: "/captura-orden/:path*", headers: CAPTURA_PUBLIC_HEADERS },
      { source: "/_next/:path*", headers: BASE_SECURITY_HEADERS },
      { source: "/:path*", headers: BASE_SECURITY_HEADERS },
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
