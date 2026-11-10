import type { FormEvent } from "react";
import type { CompradorListRow } from "@/modules/admin-panel";
import type { ProductoVentaOption } from "../../shared/types/sales.types";
import type { AutoPrintOvResult } from "../print/auto-print-ov-tras-emitir";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { CypherCompanionOtPicker } from "../components/modals/OrdenVentaCypherDrawer";
import type {
  DocumentoCorreccionApi,
  ResumenCorreccionApi,
} from "../utils/ot/aplicar-correccion-correo";
import type { OrdenTrabajoHija } from "../utils/origen/origen-correo-ordenes-trabajo";
import type { PropuestaCorreccionCorreoApi } from "../utils/ot/aplicar-correccion-correo";
import type {
  MovimientoAplicado,
  PropuestaReagrupacionApi,
  ResumenReagrupacion,
} from "../utils/ot/reagrupar-ordenes-trabajo";
import type { CampoDiscrepancia } from "../utils/pedido/map-pedido-extraido-to-form";
import type { SolicitudReagrupacion } from "../components/modals/OrdenVentaReagruparOtModal";
import type { DivisionReagrupacionApi } from "../services/reagrupar-ot.client";

export interface OrdenVentaCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  /** Tras confirmar (emitir) OK: folio para el modal de éxito (REQ-039). */
  onEmitSuccess?: (info: { idOrdenVenta: string; codigo: string }) => void;
  /** Feedback de autoimpresión tras Validar y enviar (éxito o error). */
  onAutoPrintResult?: (result: AutoPrintOvResult) => void;
  idOrdenVenta?: string | null;
  /** Folio conocido de la lista (REQ-109); refuerza el del detalle. */
  codigoVenta?: string | null;
  /** Cypher abierto en paralelo (mismo id): panel a la izquierda. */
  cypherOpen?: boolean;
  /** Abre/cierra Cypher de esta OV (botón +). */
  onToggleCypher?: () => void;
  /**
   * REQ-199: la OV ya tiene id (borrador tras archivo/mensaje o primer Guardar).
   * El listado fija editingId + puede abrir Cypher.
   */
  onOrdenIdReady?: (idOrdenVenta: string) => void;
  /**
   * Publica el selector de OT al Cypher compañero (por confirmar, varias OT).
   */
  onCompanionOtPickerChange?: (
    picker: CypherCompanionOtPicker | null,
  ) => void;
  /** Listado operador para avisar posible duplicado (REQ-151). */
  operadorRowsForDuplicado?: readonly OrdenVentaOperadorRow[];
  /** REQ-126: avisa al Cypher compañero el cliente vivo del formulario. */
  onCompanionIdCompradorChange?: (idComprador: string | null) => void;
  /**
   * REQ-188: la OV se abrió desde el «+» de Acciones con «Modificar con IA»; en cuanto
   * el formulario trae las OT se abre el chat de la instrucción.
   */
  abrirReagruparAlCargar?: boolean;
  /** Avisa que la apertura pedida arriba ya se atendió (o no aplica). */
  onReagruparAlCargarAtendido?: () => void;
  /**
   * REQ-180: otro operador tiene el soft-lock → formulario solo lectura.
   */
  soloLectura?: boolean;
  /** Nombre del editor activo (banner de solo lectura). */
  editLockHolderNombre?: string | null;
}

export type CaptureStep = "start" | "preview" | "pickOt" | "form";
export type StartMode = "first_time" | "scratch" | "docs";
export type PickerKind =
  | "comprador"
  | "producto"
  | "sugerencias"
  | "moneda"
  | "bodega"
  | null;

export interface LineaSugerenciaCatalogo {
  idProducto: string;
  nombre: string;
  codigo: string;
  idBodega: string;
  kgDisponible: number;
  unidadMedida: string;
  precioUnitario: number;
}

export interface LineaVentaForm {
  idProducto: string;
  nombre: string;
  codigo: string;
  idBodega: string;
  cantidadInput: string;
  cajasInput: string;
  presentacion: string;
  especificacion: string;
  descuentoPctInput: string;
  ivaPct: string;
  kgDisponible: number;
  unidadMedida: string;
  precioUnitario: number;
  precioInput: string;
  precioManual?: boolean;
  aliasCliente?: string;
  filledByIa?: boolean;
  /** Clave de orden de trabajo para paginar el formulario docs. */
  otId?: string;
  /** Sin producto de catálogo asignado (flujo Mateo / docs). */
  catalogPending?: boolean;
  /** Varios productos del catálogo se parecen. */
  catalogAmbiguo?: boolean;
  sugerencia?: LineaSugerenciaCatalogo | null;
  sugerenciasAlternativas?: LineaSugerenciaCatalogo[];
}

/** Reagrupación de OT con IA aplicada al formulario y aún sin guardar (REQ-125). */
export interface ReagrupacionAplicada {
  /** Estado previo, para Deshacer. */
  snapshot: { hijas: OrdenTrabajoHija[]; lineas: LineaVentaForm[] };
  instruccion: string;
  resumen: ResumenReagrupacion;
  movimientos: MovimientoAplicado[];
  otNuevas: Array<{ id: string; label: string }>;
  /** REQ-187: la aplicó «Corregir con el correo» (no el chat); cambia el texto y la bitácora. */
  correccion?: {
    resumen: ResumenCorreccionApi;
    documentos: DocumentoCorreccionApi[];
  };
}

export interface BodegaDestinoOption {
  idBodega: string;
  label: string;
}

export const IVA_PCT_OPTIONS = [
  { value: "0", label: "0%" },
  { value: "8", label: "8%" },
  { value: "16", label: "16%" },
] as const;

export const PRESENTACION_OPTIONS = [
  { value: "", label: "—" },
  { value: "Caja 1.5 kg", label: "Caja 1.5 kg" },
  { value: "Caja 20 kg", label: "Caja 20 kg" },
  { value: "Caja 21 kg", label: "Caja 21 kg" },
  { value: "Granel", label: "Granel" },
] as const;

export const SUSTITUCIONES_OPTIONS = [
  { value: "", label: "—" },
  { value: "No — surtir parcial", label: "No — surtir parcial" },
  { value: "Sí, con aviso", label: "Sí, con aviso" },
  { value: "Sí, a criterio de almacén", label: "Sí, a criterio de almacén" },
] as const;

export const SI_NO_OPTIONS = [
  { value: "", label: "—" },
  { value: "No", label: "No" },
  { value: "Sí", label: "Sí" },
] as const;

export const PRIORIDAD_OPTIONS = [
  { value: "Normal", label: "Normal" },
  { value: "Urgente", label: "Urgente" },
  { value: "Programado", label: "Programado" },
] as const;

export const MONEDA_OPTIONS = [
  { value: "MXN", label: "MXN" },
  { value: "USD", label: "USD" },
] as const;

export interface OrdenVentaModalDialogsProps {
  confirmDiscrepanciasOpen: boolean;
  setConfirmDiscrepanciasOpen: (value: boolean) => void;
  skipDiscrepanciaConfirmRef: { current: boolean };
  skipSaveConfirmRef: { current: boolean };
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  avisosValidacion: CampoDiscrepancia[];
  canReemplazarDiscrepancia: (item: CampoDiscrepancia) => boolean;
  handleReemplazarDiscrepancia: (item: CampoDiscrepancia) => void;
  confirmSaveOpen: boolean;
  setConfirmSaveOpen: (value: boolean) => void;
  esPorConfirmar: boolean;
  fechaEntrega: string;
  setMissingFields: (value: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setError: (value: string | null) => void;
  isEditing: boolean;
  editingEstado: string | null;
  fechaEntregaAtrasada: boolean;
  avisoPotencialDuplicado: { ia: string } | null;
  confirmDiscardOpen: boolean;
  setConfirmDiscardOpen: (value: boolean) => void;
  onClose: () => void;
  ordenesTrabajoForm: { length: number };
  confirmRemoveOtId: string | null;
  setConfirmRemoveOtId: (value: string | null) => void;
  handleConfirmRemoveOrdenTrabajo: () => void;
  addOtOpen: boolean;
  setAddOtOpen: (value: boolean) => void;
  addOtAlmacen: string;
  setAddOtAlmacen: (value: string) => void;
  addOtNumeroPedido: string;
  setAddOtNumeroPedido: (value: string) => void;
  handleAddOrdenTrabajo: () => void;
  reagruparOpen: boolean;
  cypherOpen: boolean;
  editingId: string;
  folioVisible: string;
  setReagruparOpen: (value: boolean) => void;
  obtenerSolicitudReagrupacion: () => SolicitudReagrupacion | null;
  handleAplicarReagrupacion: (datos: {
    propuesta: PropuestaReagrupacionApi;
    instruccion: string;
  }) => void;
  handleAplicarCorreccionCorreo: (
    propuesta: PropuestaCorreccionCorreoApi,
  ) => void;
  handleDividirOrden: (division: DivisionReagrupacionApi) => Promise<void>;
}

export interface OrdenVentaModalPickersProps {
  picker: string | null;
  setPicker: (
    value: "comprador" | "producto" | "sugerencias" | "moneda" | "bodega" | null,
  ) => void;
  compradores: CompradorListRow[];
  compradorPickerPriorityIds: string[];
  idComprador: string;
  handleSelectComprador: (
    row: CompradorListRow,
    options?: {
      verificarDireccionEntrega?: boolean;
      keepNombreIa?: boolean;
      preservePedidoData?: boolean;
    },
  ) => void;
  compradorNombreIa: string | null;
  compradorSugerencias: unknown[];
  cypherOpen: boolean;
  isEditing: boolean;
  pendingEmitId: string | null;
  productosParaPicker: ProductoVentaOption[];
  productoPickerPriorityIds: string[];
  replaceLineaIndex: number | null;
  setReplaceLineaIndex: (value: number | null) => void;
  lineas: LineaVentaForm[];
  handleSelectProducto: (row: ProductoVentaOption) => void;
  handleAcceptSugerencia: (index: number, sug: LineaSugerenciaCatalogo) => void;
  handleOpenReplaceProducto: (index: number) => void;
  moneda: string;
  setMoneda: (value: string) => void;
  bodegasDestino: BodegaDestinoOption[];
  idBodegaDestino: string;
  setIdBodegaDestino: (value: string) => void;
  isCompradorCreateOpen: boolean;
  setIsCompradorCreateOpen: (value: boolean) => void;
  startMode: StartMode | null;
  step: CaptureStep;
  setStartMode: (value: StartMode | null) => void;
  handleCompradorCreatedForSale: (created: CompradorListRow) => void;
}
