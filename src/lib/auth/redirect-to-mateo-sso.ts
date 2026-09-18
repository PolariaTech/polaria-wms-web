import { env } from "@/config/env";
import { markMateoSsoExit } from "@/lib/auth/mateo-sso-exit";
import { removeAuthFromLocalStorage } from "@/lib/auth/auth-storage";
import { logoutWithToken, mateoHandoff } from "@/modules/auth";
import { useAuthStore } from "@/stores/auth.store";

export function buildMateoSsoUrl(code: string): string {
  const mateoBaseUrl = env.mateoUrl.replace(/\/$/, "");
  return `${mateoBaseUrl}/auth/sso?code=${encodeURIComponent(code)}`;
}

/** Handoff a Mateo y limpia la sesión WMS. El caller navega a la URL. */
export async function startMateoSsoExit(): Promise<string> {
  const accessToken = useAuthStore.getState().accessToken;
  const { code } = await mateoHandoff();
  const mateoUrl = buildMateoSsoUrl(code);

  markMateoSsoExit();
  useAuthStore.getState().clearAuthSilently();
  removeAuthFromLocalStorage();

  if (accessToken) {
    void logoutWithToken(accessToken).catch(() => {
      // La navegación a Mateo no debe bloquearse por el logout remoto.
    });
  }

  return mateoUrl;
}

export async function redirectToMateoSso(): Promise<void> {
  window.location.href = await startMateoSsoExit();
}
