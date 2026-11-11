import { acquireOvEditLock } from "../../services/ov-edit-lock.service";

export type AperturaEdicionOv = {
  soloLectura: boolean;
  holderNombre: string | null;
};

/**
 * REQ-180: intenta soft-lock antes de abrir el formulario.
 * Si falla la BD (migración pendiente), abre en edición para no bloquear operación.
 */
export async function abrirEdicionOvConLock(params: {
  codigoCuenta: string;
  idOrdenVenta: string;
  idUsuario: string | null | undefined;
  nombreUsuario: string | null | undefined;
}): Promise<AperturaEdicionOv> {
  const idUsuario = params.idUsuario?.trim() || "";
  if (!idUsuario) {
    return { soloLectura: false, holderNombre: null };
  }
  try {
    const result = await acquireOvEditLock({
      codigoCuenta: params.codigoCuenta,
      idOrdenVenta: params.idOrdenVenta,
      idUsuario,
      nombreUsuario: params.nombreUsuario?.trim() || "Usuario",
    });
    return {
      soloLectura: result.mode === "soloLectura",
      holderNombre: result.holderNombre,
    };
  } catch {
    return { soloLectura: false, holderNombre: null };
  }
}
