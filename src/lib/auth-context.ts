import type { AuthContext, AuthSession } from "@/types/auth";

/** Deriva el contexto de auth persistible a partir de GET /auth/me. */
export function buildAuthContextFromSession(session: AuthSession): AuthContext {
  return {
    scope: session.scope,
    codigoEmpresa: session.codigoEmpresa,
    codigoCuenta: session.codigoCuenta,
    idBodegas: session.idBodegas,
    nivelRol: session.nivelRol,
  };
}
