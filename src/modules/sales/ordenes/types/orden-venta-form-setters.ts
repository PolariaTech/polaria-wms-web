import type { Dispatch, SetStateAction } from "react";
import type { CompradorListRow } from "@/modules/admin-panel";
import type { CompradorAltaFicha } from "@/modules/admin-panel/compradores/utils/comprador-alta";
import type { ProductoVentaOption } from "../../shared/types/sales.types";
import type { OrigenAdjunto } from "../utils/origen/origen-adjuntos";
import type { OrdenTrabajoHija, OrigenCorreoRenglon } from "../utils/origen/origen-correo-ordenes-trabajo";
import type { CampoDiscrepancia } from "../utils/pedido/map-pedido-extraido-to-form";
import type {
  BodegaDestinoOption,
  ReagrupacionAplicada,
} from "./orden-venta-create-modal.types";

/** Setters del modal OV extraídos para no superar 300 líneas en form-estado. */
export type OrdenVentaFormSetters = {
  setAnden: Dispatch<SetStateAction<string>>;
  setAutoFields: Dispatch<SetStateAction<Set<string>>>;
  setBodegasDestino: Dispatch<SetStateAction<BodegaDestinoOption[]>>;
  setCantidadFocusId: Dispatch<SetStateAction<string | null>>;
  setChofer: Dispatch<SetStateAction<string>>;
  setCompradorLabel: Dispatch<SetStateAction<string>>;
  setCompradorNombreIa: Dispatch<SetStateAction<string | null>>;
  setCompradorSugerencias: Dispatch<SetStateAction<CompradorListRow[]>>;
  setCompradores: Dispatch<SetStateAction<CompradorListRow[]>>;
  setDiscrepancias: Dispatch<SetStateAction<CampoDiscrepancia[]>>;
  setEditingCodigo: Dispatch<SetStateAction<string>>;
  setEditingEstado: Dispatch<SetStateAction<string | null>>;
  setEmlInnerAdjuntos: Dispatch<SetStateAction<OrigenAdjunto[]>>;
  setEquivalenciaByProducto: Dispatch<SetStateAction<Record<string, string[]>>>;
  setExigeOc: Dispatch<SetStateAction<boolean>>;
  setFechaCreacion: Dispatch<SetStateAction<string>>;
  setFichaComprador: Dispatch<SetStateAction<CompradorAltaFicha | null>>;
  setFormDataReady: Dispatch<SetStateAction<boolean>>;
  setHoraSalida: Dispatch<SetStateAction<string>>;
  setIdComprador: Dispatch<SetStateAction<string>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setIsReadingIa: Dispatch<SetStateAction<boolean>>;
  setIsSaving: Dispatch<SetStateAction<boolean>>;
  setMateoBusyMessage: Dispatch<SetStateAction<string | undefined>>;
  setOrdenCargadaId: Dispatch<SetStateAction<string | null>>;
  setOrdenesTrabajoPreview: Dispatch<SetStateAction<OrdenTrabajoHija[]>>;
  setOrigenAdjuntos: Dispatch<SetStateAction<OrigenAdjunto[]>>;
  setOrigenCorreoDraft: Dispatch<SetStateAction<OrigenCorreoRenglon[]>>;
  setPendingEmitId: Dispatch<SetStateAction<string | null>>;
  setPrecioOverrideByProducto: Dispatch<SetStateAction<Record<string, number>>>;
  setProductosBase: Dispatch<SetStateAction<ProductoVentaOption[]>>;
  setReagruparAplicada: Dispatch<SetStateAction<ReagrupacionAplicada | null>>;
  setSuccessMessage: Dispatch<SetStateAction<string | null>>;
  setTurno: Dispatch<SetStateAction<string>>;
  setUnidad: Dispatch<SetStateAction<string>>;
  setWarnFields: Dispatch<SetStateAction<Set<string>>>;
};
