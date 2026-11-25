import type { OrdenTrabajoHija } from "../utils/origen/origen-correo-ordenes-trabajo";
import { diasEntregaDistintosEnHijas } from "../utils/ot/fechas-entrega-entre-ot";
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

function diaEntregaDeHija(hija: OrdenTrabajoHija | undefined): string {
  return hija ? (diasEntregaDistintosEnHijas([hija])[0] ?? "") : "";
}

/**
 * Persiste la OT activa. Si el usuario cambió la fecha de entrega en esta OT,
 * se aplica a todas las OT de la OV (REQ-423); si no, no se pisan las hermanas (REQ-374).
 */
function sincronizarOtActivaAlPaginar(
  entrada: EntradaCambioPaginaOt,
  hijaActiva: OrdenTrabajoHija,
): OrdenTrabajoHija[] {
  const sinPropagar = entrada.syncActiveOtFromForm({ propagarFechaOv: false });
  const hijaTrasSync = sinPropagar.find((hija) => hija.id === hijaActiva.id);
  const fechaCambiada =
    diaEntregaDeHija(hijaTrasSync) !== diaEntregaDeHija(hijaActiva);
  if (!fechaCambiada) return sinPropagar;
  return entrada.syncActiveOtFromForm({ propagarFechaOv: true });
}

/**
 * Persiste la OT activa, cambia de página e hidrata la destino en el mismo tick (REQ-374).
 * REQ-423: un cambio de fecha en una OT se propaga a todas las OT de la OV.
 */
export function ejecutarCambioPaginaOt(entrada: EntradaCambioPaginaOt): void {
  let hijasTrasSync = entrada.ordenesTrabajoForm;
  if (entrada.paginarPorOt && entrada.hijaFormActiva) {
    hijasTrasSync = sincronizarOtActivaAlPaginar(
      entrada,
      entrada.hijaFormActiva,
    );
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
