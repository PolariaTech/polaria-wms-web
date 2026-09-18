export type AccesoProductoCuenta = "wms" | "mateo" | "ambos";

export function accesoProductoFromFlags(
  accesoWms: boolean,
  accesoMateo: boolean,
): AccesoProductoCuenta {
  if (accesoWms && accesoMateo) return "ambos";
  if (accesoMateo && !accesoWms) return "mateo";
  return "wms";
}

export function flagsFromAccesoProducto(acceso: AccesoProductoCuenta): {
  accesoWms: boolean;
  accesoMateo: boolean;
} {
  return {
    accesoWms: acceso === "wms" || acceso === "ambos",
    accesoMateo: acceso === "mateo" || acceso === "ambos",
  };
}

export function accesoProductoLabel(acceso: AccesoProductoCuenta): string {
  if (acceso === "mateo") return "Mateo IA";
  if (acceso === "ambos") return "WMS y Mateo IA";
  return "WMS";
}

export function sessionHasWmsAccess(session: {
  scope: "platform" | "tenant";
  accesoWms?: boolean;
}): boolean {
  if (session.scope === "platform") return true;
  return session.accesoWms !== false;
}

export function sessionHasMateoAccess(session: {
  scope: "platform" | "tenant";
  accesoMateo?: boolean;
}): boolean {
  if (session.scope === "platform") return true;
  return session.accesoMateo !== false;
}

export function sessionIsMateoOnly(session: {
  scope: "platform" | "tenant";
  accesoWms?: boolean;
  accesoMateo?: boolean;
}): boolean {
  return (
    session.scope === "tenant" &&
    sessionHasMateoAccess(session) &&
    !sessionHasWmsAccess(session)
  );
}
