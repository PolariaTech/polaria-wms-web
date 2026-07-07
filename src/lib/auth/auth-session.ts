import type { AuthSession } from "@/types/auth/auth";

export function getSessionDisplayName(session: AuthSession): string {
  return session.nombre;
}

export function getSessionUsername(session: AuthSession): string {
  return session.username;
}

export function getSessionRolNombre(session: AuthSession): string {
  return session.nombreRol;
}

export function getSessionDomainLabel(session: AuthSession): string {
  if (session.razonSocialEmpresa) return session.razonSocialEmpresa;
  if (session.codigoEmpresa) return session.codigoEmpresa;
  if (session.nombreComercialCuenta) return session.nombreComercialCuenta;
  if (session.codigoCuenta) return session.codigoCuenta;
  return "polaria.tech";
}

export function getSessionInitial(session: AuthSession): string {
  return session.nombre.charAt(0).toUpperCase() || "?";
}
