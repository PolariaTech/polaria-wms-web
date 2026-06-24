import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/config/env";

let browserClient: SupabaseClient | null = null;

function assertSupabaseConfig(): { url: string; anonKey: string } {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error(
      "Supabase no configurado: define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return { url: env.supabaseUrl, anonKey: env.supabaseAnonKey };
}

/** Cliente Supabase singleton para el navegador (lecturas RLS con JWT del API). */
export function createSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const { url, anonKey } = assertSupabaseConfig();
  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}

/** Sincroniza la sesión Supabase con los tokens emitidos por polaria-wms-api. */
export async function syncSupabaseAuthSession(
  accessToken: string | null,
  refreshToken: string | null,
): Promise<void> {
  if (!env.supabaseUrl || !env.supabaseAnonKey) return;

  const supabase = createSupabaseBrowserClient();

  if (!accessToken) {
    await supabase.auth.signOut();
    return;
  }

  await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken ?? "",
  });
}

/** Expuesto para tests: reinicia el singleton entre casos. */
export function resetSupabaseBrowserClientForTests(): void {
  browserClient = null;
}
