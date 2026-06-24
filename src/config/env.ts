export const env = {
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "https://polaria-wms-api.onrender.com",
  mateoUrl:
    process.env.NEXT_PUBLIC_MATEO_URL ??
    "https://chatbot-mateo.vercel.app",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
} as const;

/** En el navegador usa el proxy `/api` de Next.js para evitar CORS en dev. */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "/api";
  }
  return env.apiBaseUrl;
}
