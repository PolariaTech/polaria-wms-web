import type { AuthSession, NivelRol } from "@/types/auth/auth";

/** Valores de `RolNivel` que devuelve el API (español / snake). */
const API_NIVEL_ROL_TO_WEB: Record<string, NivelRol> = {
  plataforma: "platform",
  platform: "platform",
  empresa: "empresa",
  cuenta: "cuenta",
  bodega: "bodega",
};

/** Normaliza `nivelRol` del API al tipo web (`plataforma` → `platform`). */
export function normalizeNivelRol(raw: string): NivelRol {
  const mapped = API_NIVEL_ROL_TO_WEB[raw];
  if (mapped) {
    return mapped;
  }

  return raw as NivelRol;
}

/** Respuesta cruda de GET /auth/me antes de normalizar `nivelRol`. */
export type AuthSessionApi = Omit<AuthSession, "nivelRol"> & {
  nivelRol: string;
};

/** Aplica normalización de `nivelRol` antes de persistir `AuthSession`. */
export function normalizeAuthSession(session: AuthSessionApi): AuthSession {
  return {
    ...session,
    nivelRol: normalizeNivelRol(session.nivelRol),
  };
}
