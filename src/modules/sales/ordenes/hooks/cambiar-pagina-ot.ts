import type { OrdenTrabajoHija } from "../utils/origen/origen-correo-ordenes-trabajo";
import {
  hidratarFormularioDesdeHija,
  type SettersHidratacionOt,
} from "./hidratar-formulario-desde-hija";

export type EntradaCambioPaginaOt = {
  nextPage: number;
  paginarPorOt: boolean;
  hijaFormActiva: OrdenTrabajoHija | null;
  ordenesTrabajoForm: OrdenTrabajoHija[];
  syncActiveOtFromForm: (opciones?: {
    propagarFechaOv?: boolean;
  }) => OrdenTrabajoHija[];
  applyOrdenesTrabajo: (next: OrdenTrabajoHija[]) => void;
  setFormOtPage: (page: number) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  settersHidratacion: SettersHidratacionOt;
};

/**
 * Persiste la OT activa, cambia de página e hidrata la destino en el mismo tick (REQ-374).
 */
export function ejecutarCambioPaginaOt(entrada: EntradaCambioPaginaOt): void {
  let hijasTrasSync = entrada.ordenesTrabajoForm;
  if (entrada.paginarPorOt && entrada.hijaFormActiva) {
    hijasTrasSync = entrada.syncActiveOtFromForm({ propagarFechaOv: false });
    entrada.applyOrdenesTrabajo(hijasTrasSync);
  }
  entrada.setFormOtPage(entrada.nextPage);
  entrada.setError(null);
  entrada.setSuccessMessage(null);
  if (!entrada.paginarPorOt || hijasTrasSync.length === 0) return;

  const paginaSegura = Math.min(
    Math.max(0, entrada.nextPage),
    hijasTrasSync.length - 1,
  );
  const hijaDestino = hijasTrasSync[paginaSegura];
  if (!hijaDestino) return;

  hidratarFormularioDesdeHija(hijaDestino, entrada.settersHidratacion, {
    forzarCamposOt: true,
  });
}
