import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { OrdenVentaOperadorRow } from "../../../shared/types/sales.types";
import type {
  BusyAction,
  OvFeedback,
  RunScoped,
} from "./ov-impresion-feedback";

/** Piezas compartidas por los hooks de impresión, previsualización y fotos de una OV. */
export interface OvAccionesCtx {
  codigoCuenta: string | null;
  runScoped: RunScoped;
  /** Bloqueo síncrono: una sola acción pesada (imprimir/previsualizar/fotos) a la vez. */
  printingLockRef: MutableRefObject<boolean>;
  setBusyAction: Dispatch<SetStateAction<BusyAction | null>>;
  setFeedback: Dispatch<SetStateAction<OvFeedback | null>>;
  showFeedback: (item: { ok: boolean; title: string; detail: string }) => void;
  marcarCorreoNoEnviado: (idOrdenVenta: string) => void;
  quitarCorreoNoEnviado: (idOrdenVenta: string) => void;
  rowsRef: MutableRefObject<OrdenVentaOperadorRow[]>;
}
