"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  Paperclip,
  Plus,
  Replace,
  Save,
  Trash2,
  Upload,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  PolariaFormField,
  PolariaFormInput,
  PolariaFormSelect,
  POLARIA_FORM_INPUT_CLASS_COMPACT,
  POLARIA_FORM_SELECT_CLASS_COMPACT,
} from "@/components/shared/form/PolariaFormField";
import { PolariaDateInputDdMm } from "@/components/shared/form/PolariaDateInputDdMm";
import { PolariaConfirmDialog } from "@/components/shared/form/PolariaConfirmDialog";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import { usePolariaToast } from "@/components/shared/toast/PolariaToastProvider";
import { MateoIaLoadingScreen } from "@/components/mateo/MateoIaLoadingScreen";
import {
  formatDecimalInputEs,
  formatKgEs,
  formatPrecioEs,
  formatPrecioInputMx,
  parseDecimalEs,
  sanitizeDecimalInputEs,
  sanitizePrecioInputMx,
} from "@/lib/utils/decimal-es";
import { cn } from "@/lib/utils/cn";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  getCompradorAdmin,
  listBodegasExternasVinculadasAdmin,
  listBodegasInternasVinculadasAdmin,
  listCompradoresAdmin,
  CompradorCreateModal,
  listCompradorProductoAliasAdmin,
  type CompradorListRow,
} from "@/modules/admin-panel";
import type { CompradorAltaFicha } from "@/modules/admin-panel/compradores/utils/comprador-alta";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { useAuthStore } from "@/stores/auth.store";
import {
  CATALOGO_VENTA_EMPTY_MESSAGE,
  normalizeEstadoOrdenVenta,
} from "../../../shared/constants/sales-status";
import { fetchProductosVentaCatalogo } from "../../../shared/services/sales-catalog.api";
import { emitirOrdenVentaApi } from "../../../shared/services/sales-api.service";
import {
  postOrdenVentaLog,
  postOrdenVentaLogForOts,
} from "../../services/orden-venta-log.client";
import {
  aplicarReagrupacion,
  construirEstadoBaseApi,
  crearSnapshotReagrupacion,
  describirReagrupacionParaBitacora,
  firmaEstadoReagrupacion,
  puedeReagruparOt,
  type MovimientoAplicado,
  type PropuestaReagrupacionApi,
  type ResumenReagrupacion,
} from "../../utils/ot/reagrupar-ordenes-trabajo";
import {
  decidirAperturaReagruparAlCargar,
  reagruparModalAbierto,
} from "../../utils/ot/reagrupacion-modal-estado";
import { OrdenVentaReagruparOtModal } from "./OrdenVentaReagruparOtModal";
import {
  createOrdenVenta,
  fetchUltimosPreciosPorComprador,
  getCuentaIdBodegaDefault,
  getOrdenVentaDetalle,
  updateOrdenVenta,
} from "../../../shared/services/sales.service";
import {
  UNIDAD_MEDIDA_VENTA_DEFAULT,
  type OrdenVentaDetalleRow,
  type OrdenVentaLineaInput,
  type OrdenVentaOperadorRow,
  type ProductoVentaOption,
} from "../../../shared/types/sales.types";
import {
  autoPrintOrdenVentaTrasEmitir,
  fetchAutoImprimirFlag,
  type AutoPrintOvResult,
} from "../../print/auto-print-ov-tras-emitir";
import { stripLeadingProductoCodigo } from "../../../shared/utils/producto-venta-nombre";
import { NoIdentificadoBadge } from "../shared/NoIdentificadoBadge";
import { OrdenVentaCompradorPickerModal } from "../pickers/OrdenVentaCompradorPickerModal";
import { OrdenVentaProductoPickerModal } from "../pickers/OrdenVentaProductoPickerModal";
import { OrdenVentaSugerenciasPickerModal } from "../pickers/OrdenVentaSugerenciasPickerModal";
import { OrdenVentaTablePickerModal } from "../pickers/OrdenVentaTablePickerModal";
import { leerPedidoConIaApi } from "../../services/sales-ai.api";
import { OrdenTrabajoPreviewList } from "../orden-trabajo/OrdenTrabajoPreviewList";
import { OrdenTrabajoPager } from "../orden-trabajo/OrdenTrabajoPager";
import { OrigenPedidoSourceView } from "../shared/OrigenPedidoBodyView";
import { uploadOvAdjuntosClient } from "../../services/ov-adjuntos.client";
import {
  mergeOrigenAdjuntosWithEmlParts,
  nombresOrigenAdjuntos,
  origenAdjuntosFromEmlParts,
  parseOrigenArchivos,
  type OrigenAdjunto,
} from "../../utils/origen/origen-adjuntos";
import {
  buildOrdenVentaCapturaObservaciones,
  formatCapturaFecha,
  isAfterWarehouseCutoff,
  buildNotasLineasText,
  notaCapturaForLinea,
  parseOrdenVentaCapturaObservaciones,
  stripSurtidoFotoQrFromNotas,
  todayIsoDate,
  tomorrowIsoDate,
} from "../../utils/pedido/build-orden-venta-captura-observaciones";
import {
  assignOtIdsToFormLineas,
  filterLineasByOrdenTrabajoHija,
} from "../../utils/ot/filter-lineas-by-orden-trabajo";
import {
  resolveSkuVisible,
  resolveTextoProductoOrigen,
} from "../../utils/display/resolve-sku-visible";
import {
  buildOrigenCorreoFromOrdenesYLineas,
  createEmptyOrdenTrabajoHija,
  flattenOrdenesTrabajoToOrigenCorreo,
  groupOrigenCorreoToOrdenesTrabajo,
  parseOrigenCorreoJson,
  type OrigenCorreoRenglon,
  type OrdenTrabajoHija,
} from "../../utils/origen/origen-correo-ordenes-trabajo";
import { withNotasGeneralesOnHijas } from "../../utils/ot/notas-generales-ot";
import {
  isGarbageOcValue,
  resolveOrdenCompraLimpia,
  sanitizeOrigenCorreoNumeroPedido,
} from "../../utils/pedido/normalize-numero-pedido";
import {
  FECHA_ENTREGA_ATRASADA_WARNING,
  FECHA_ENTREGA_DEFAULT_WARNING,
  isFechaEntregaAtrasada,
  isFechaEntregaIsoValida,
  isVentanaDesdeMayorQueHasta,
  validatePedidoCabecera,
} from "../../utils/pedido/pedido-form-validation";
import {
  parseFechaOrigen,
  resolveFechaEntregaDesdeOrigen,
} from "../../utils/origen/materialize-ov-desde-origen";
import { formatIsoToDdMmYyyy } from "@/lib/utils/fecha-dd-mm-yyyy";
import { hasOtPagerRequiredBlocking } from "../../utils/ot/ot-pager-required";
import {
  findPrimeraRevisionPendiente,
  revisionFocusSelector,
  type RevisionPendiente,
} from "../../utils/ot/por-confirmar-revision-alert";
import { extractCorreoContactoDesdeTexto } from "../../utils/origen/correo-chrome";
import { findDuplicadosAgainstDraft } from "../../utils/match/find-potencial-duplicado-ov";
import { sanitizeTelefonoContacto } from "../../utils/pedido/sanitize-telefono-contacto";
import {
  cleanCorreoBodyForNotas,
  isCuerpoMensajeFormato,
  sanitizeNotasGeneralesPedido,
} from "../../utils/origen/texto-origen-pedido";
import {
  mapPedidoExtraidoToForm,
  type CampoDiscrepancia,
} from "../../utils/pedido/map-pedido-extraido-to-form";
import { rankProductosCatalogo } from "../../utils/match/find-closest-producto-catalogo";
import { buildMatchProductoLinea } from "../../utils/match/build-match-producto";
import { resolveCantidadPrecioParaPersistir } from "../../utils/pedido/persist-linea-avance";
import {
  rankCompradoresFromNombre,
  shouldAutoAssignComprador,
} from "../../utils/match/match-comprador-from-nombre";
import { buildPedidoExtraidoFromOrigenCorreo } from "../../utils/origen/pedido-from-origen-correo";
import { buildOrdenVentaPrefillFromComprador } from "../../utils/pedido/prefill-orden-venta-from-comprador";
import {
  formatCompradorOrdenVenta,
  resolveOrdenVentaLineaTitulo,
} from "../../utils/display/orden-venta-display";
import type { CypherCompanionOtPicker } from "./OrdenVentaCypherDrawer";

interface OrdenVentaCreateModalProps {
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
}

type CaptureStep = "start" | "preview" | "pickOt" | "form";
type StartMode = "first_time" | "scratch" | "docs";
type PickerKind =
  | "comprador"
  | "producto"
  | "sugerencias"
  | "moneda"
  | "bodega"
  | null;

function formatProductoNombreConSku(nombre: string, codigo: string): string {
  const name = nombre.trim();
  const sku = codigo.trim();
  if (!name) return sku && sku !== "—" ? `(${sku})` : "";
  if (!sku || sku === "—") return name;
  if (name.toLowerCase().includes(`(${sku.toLowerCase()})`)) return name;
  return `${name} (${sku})`;
}

const CATALOG_STATUS_TONE_CLASS = {
  teal: "text-polaria-teal",
  warning: "text-polaria-warning",
  danger: "text-polaria-danger",
} as const;

/** Tooltip en portal fijo: no lo corta overflow de tablas/modales. */
function CatalogStatusHint({
  label,
  tone,
  size = "sm",
  children,
}: {
  label: string;
  tone: keyof typeof CATALOG_STATUS_TONE_CLASS;
  size?: "sm" | "md";
  children: ReactNode;
}) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tip = tipRef.current;
    if (!trigger || !tip) return;
    const rect = trigger.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const gap = 6;
    const pad = 8;
    let top = rect.bottom + gap;
    if (top + tipRect.height > window.innerHeight - pad) {
      top = rect.top - tipRect.height - gap;
    }
    top = Math.max(pad, top);
    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    left = Math.min(
      Math.max(pad, left),
      window.innerWidth - tipRect.width - pad,
    );
    setCoords({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    updatePosition();
    const onReposition = () => updatePosition();
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [open, updatePosition]);

  return (
    <>
      <span
        ref={triggerRef}
        tabIndex={0}
        aria-label={label}
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center outline-none",
          size === "md" ? "h-7 w-7" : null,
          CATALOG_STATUS_TONE_CLASS[tone],
        )}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </span>
      {open
        ? createPortal(
            <span
              ref={tipRef}
              role="tooltip"
              style={
                coords
                  ? { top: coords.top, left: coords.left }
                  : { top: 0, left: 0, visibility: "hidden" as const }
              }
              className="pointer-events-none fixed z-[300] w-max max-w-[16rem] rounded-lg border border-polaria-t-20 bg-polaria-bg px-2 py-1 text-center polaria-text-caption text-polaria-w shadow-lg"
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}

function collectSugerenciasLinea(
  linea: LineaVentaForm,
): LineaSugerenciaCatalogo[] {
  const out: LineaSugerenciaCatalogo[] = [];
  const seen = new Set<string>();
  for (const sug of [
    linea.sugerencia,
    ...(linea.sugerenciasAlternativas ?? []),
  ]) {
    if (!sug?.idProducto || seen.has(sug.idProducto)) continue;
    seen.add(sug.idProducto);
    out.push(sug);
  }
  return out;
}

interface LineaSugerenciaCatalogo {
  idProducto: string;
  nombre: string;
  codigo: string;
  idBodega: string;
  kgDisponible: number;
  unidadMedida: string;
  precioUnitario: number;
}

interface LineaVentaForm {
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
interface ReagrupacionAplicada {
  /** Estado previo, para Deshacer. */
  snapshot: { hijas: OrdenTrabajoHija[]; lineas: LineaVentaForm[] };
  instruccion: string;
  resumen: ResumenReagrupacion;
  movimientos: MovimientoAplicado[];
  otNuevas: Array<{ id: string; label: string }>;
}

const parseCantidadReagrupacion = (raw: string): number =>
  parseDecimalEs(raw) ?? 0;

function fieldControlClass(params: {
  field?: string;
  autoFields?: Set<string>;
  warnFields?: Set<string>;
  missingFields?: Set<string>;
  missing?: boolean;
}): string | undefined {
  const { field, autoFields, warnFields, missingFields, missing } = params;
  if (missing || (field && missingFields?.has(field))) {
    return "!border-polaria-danger-border !bg-polaria-danger-bg";
  }
  if (field && warnFields?.has(field)) {
    return "!border-polaria-warning-border !bg-polaria-warning-bg";
  }
  if (field && autoFields?.has(field)) {
    return "!border-polaria-teal/50 !bg-polaria-t-08";
  }
  return undefined;
}

const IVA_PCT_OPTIONS = [
  { value: "0", label: "0%" },
  { value: "8", label: "8%" },
  { value: "16", label: "16%" },
] as const;

const PRESENTACION_OPTIONS = [
  { value: "", label: "—" },
  { value: "Caja 1.5 kg", label: "Caja 1.5 kg" },
  { value: "Caja 20 kg", label: "Caja 20 kg" },
  { value: "Caja 21 kg", label: "Caja 21 kg" },
  { value: "Granel", label: "Granel" },
] as const;

const SUSTITUCIONES_OPTIONS = [
  { value: "", label: "—" },
  { value: "No — surtir parcial", label: "No — surtir parcial" },
  { value: "Sí, con aviso", label: "Sí, con aviso" },
  { value: "Sí, a criterio de almacén", label: "Sí, a criterio de almacén" },
] as const;

const SI_NO_OPTIONS = [
  { value: "", label: "—" },
  { value: "No", label: "No" },
  { value: "Sí", label: "Sí" },
] as const;

function lineAmounts(linea: LineaVentaForm): {
  bruto: number;
  descuento: number;
  base: number;
  iva: number;
  importe: number;
} {
  const cantidad = parseDecimalEs(linea.cantidadInput) ?? 0;
  const bruto = Math.max(0, cantidad) * linea.precioUnitario;
  const descuentoPct = Math.min(
    100,
    Math.max(0, parseDecimalEs(linea.descuentoPctInput) ?? 0),
  );
  const descuento = bruto * (descuentoPct / 100);
  const base = Math.max(0, bruto - descuento);
  const ivaPct = Math.max(0, Number(linea.ivaPct) || 0);
  const iva = base * (ivaPct / 100);
  return { bruto, descuento, base, iva, importe: base };
}


const PRIORIDAD_OPTIONS = [
  { value: "Normal", label: "Normal" },
  { value: "Urgente", label: "Urgente" },
  { value: "Programado", label: "Programado" },
] as const;

const MONEDA_OPTIONS = [
  { value: "MXN", label: "MXN" },
  { value: "USD", label: "USD" },
] as const;

function formatCompradorLabel(row: CompradorListRow): string {
  return row.comprador.trim();
}

interface BodegaDestinoOption {
  idBodega: string;
  label: string;
}

function formatBodegaDestinoOption(
  bodega: { idBodega: string; nombre: string; codigo: string },
  tipo: "interna" | "externa",
  incluirTipo: boolean,
): BodegaDestinoOption {
  const base = `${bodega.nombre} (${bodega.codigo})`;
  return {
    idBodega: bodega.idBodega,
    label: incluirTipo
      ? `${base} · ${tipo === "interna" ? "interna" : "externa"}`
      : base,
  };
}

function resolveBodegaDestinoInicial(
  destinoRows: BodegaDestinoOption[],
  idBodegaDefault: string | null,
): string {
  if (
    idBodegaDefault &&
    destinoRows.some((row) => row.idBodega === idBodegaDefault)
  ) {
    return idBodegaDefault;
  }
  if (destinoRows.length === 1) {
    return destinoRows[0]!.idBodega;
  }
  return "";
}

function sugerenciaToOption(
  sug: LineaSugerenciaCatalogo,
): ProductoVentaOption {
  return {
    idProducto: sug.idProducto,
    label: `${sug.nombre} (${sug.codigo})`,
    idCliente: null,
    idBodega: sug.idBodega,
    codigo: sug.codigo,
    nombre: sug.nombre,
    kgDisponible: sug.kgDisponible,
    precioUnitario: sug.precioUnitario,
    unidadMedida: sug.unidadMedida,
  };
}

function toLineaSugerencia(row: ProductoVentaOption): LineaSugerenciaCatalogo {
  return {
    idProducto: row.idProducto,
    nombre: row.nombre,
    codigo: row.codigo,
    idBodega: row.idBodega,
    kgDisponible: row.kgDisponible,
    precioUnitario: row.precioUnitario,
    unidadMedida: row.unidadMedida,
  };
}

/** Sugerencias de catálogo para un texto del cliente (Mateo / origen_correo). */
function suggestFromCatalogo(
  query: string,
  catalogo: readonly ProductoVentaOption[],
): {
  sugerencia: LineaSugerenciaCatalogo | null;
  sugerenciasAlternativas: LineaSugerenciaCatalogo[];
  catalogAmbiguo: boolean;
} {
  const ranked = rankProductosCatalogo(query, catalogo);
  const top = ranked.candidates[0];
  if (!top) {
    return {
      sugerencia: null,
      sugerenciasAlternativas: [],
      catalogAmbiguo: false,
    };
  }
  return {
    sugerencia: toLineaSugerencia(top.producto),
    sugerenciasAlternativas: ranked.candidates
      .slice(1)
      .map((c) => toLineaSugerencia(c.producto)),
    catalogAmbiguo: ranked.ambiguous,
  };
}

function applyProductoToLinea(
  linea: LineaVentaForm,
  row: ProductoVentaOption,
): LineaVentaForm {
  const keepPrecio =
    Boolean(linea.precioManual) &&
    linea.precioUnitario > 0 &&
    linea.precioInput.trim().length > 0;
  return {
    ...linea,
    idProducto: row.idProducto,
    nombre: stripLeadingProductoCodigo(row.nombre, row.codigo),
    codigo: row.codigo,
    idBodega: row.idBodega,
    kgDisponible: row.kgDisponible,
    unidadMedida: row.unidadMedida || UNIDAD_MEDIDA_VENTA_DEFAULT,
    precioUnitario: keepPrecio ? linea.precioUnitario : row.precioUnitario,
    precioInput: keepPrecio
      ? linea.precioInput
      : formatPrecioInput(row.precioUnitario),
    precioManual: keepPrecio,
    catalogPending: false,
    catalogAmbiguo: false,
    sugerencia: null,
    sugerenciasAlternativas: [],
    filledByIa: false,
  };
}

function formatPrecioInput(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "";
  return formatPrecioInputMx(value);
}

function CaptureSection({
  title,
  optional,
  children,
  footer,
}: {
  title: string;
  optional?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-polaria-t-20 bg-polaria-t-08">
      <h3 className="flex items-center justify-between gap-3 border-b border-polaria-w-08 px-4 py-2.5 polaria-text-label uppercase tracking-wide text-polaria-teal">
        <span>{title}</span>
        {optional ? (
          <span className="normal-case tracking-normal text-polaria-w-50">
            {optional}
          </span>
        ) : null}
      </h3>
      <div className="p-4">{children}</div>
      {footer}
    </section>
  );
}

function toDateInputValue(value: string | null | undefined): string {
  const raw = value?.trim() ?? "";
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  // BirchStreet / origen: "10/26/2026" → ISO (REQ-098 / REQ-110).
  return parseFechaOrigen(raw) ?? "";
}


export function OrdenVentaCreateModal({
  open,
  onClose,
  onCreated,
  onEmitSuccess,
  onAutoPrintResult,
  idOrdenVenta = null,
  codigoVenta = null,
  cypherOpen = false,
  onToggleCypher,
  abrirReagruparAlCargar = false,
  onReagruparAlCargarAtendido,
  onCompanionOtPickerChange,
  operadorRowsForDuplicado = [],
  onCompanionIdCompradorChange,
}: OrdenVentaCreateModalProps) {
  const { codigoCuenta } = useCompany();
  const { showToast } = usePolariaToast();
  const session = useAuthStore((state) => state.session);
  const idCreador = session?.idUsuario ?? "";
  const vendedorNombre = session?.nombre?.trim() ?? "";
  const editingId = idOrdenVenta?.trim() || "";
  const isEditing = Boolean(editingId);
  const [step, setStep] = useState<CaptureStep>("start");
  const [startMode, setStartMode] = useState<StartMode | null>(null);
  const [idComprador, setIdComprador] = useState("");
  const [compradorLabel, setCompradorLabel] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [ventanaDesde, setVentanaDesde] = useState("");
  const [ventanaHasta, setVentanaHasta] = useState("");
  const [prioridad, setPrioridad] = useState("Normal");
  const [moneda, setMoneda] = useState("MXN");
  const [ordenCompraHotel, setOrdenCompraHotel] = useState("");
  const [centroConsumo, setCentroConsumo] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [direccion, setDireccion] = useState("");
  const [anden, setAnden] = useState("");
  const [contacto, setContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [turno, setTurno] = useState("");
  const [horaSalida, setHoraSalida] = useState("");
  const [chofer, setChofer] = useState("");
  const [unidad, setUnidad] = useState("");
  const [aceptaSustituciones, setAceptaSustituciones] = useState("");
  const [requiereLote, setRequiereLote] = useState("");
  const [registrarTemperatura, setRegistrarTemperatura] = useState("");
  const [origenTexto, setOrigenTexto] = useState("");
  const [origenArchivoFiles, setOrigenArchivoFiles] = useState<File[]>([]);
  const [origenCorreoDraft, setOrigenCorreoDraft] = useState<
    OrigenCorreoRenglon[]
  >([]);
  const [ordenesTrabajoPreview, setOrdenesTrabajoPreview] = useState<
    OrdenTrabajoHija[]
  >([]);
  const [formOtPage, setFormOtPage] = useState(0);
  const [lineas, setLineas] = useState<LineaVentaForm[]>([]);
  const [reagruparOpen, setReagruparOpen] = useState(false);
  const [reagruparAplicada, setReagruparAplicada] =
    useState<ReagrupacionAplicada | null>(null);
  const [productosBase, setProductosBase] = useState<ProductoVentaOption[]>(
    [],
  );
  const [precioOverrideByProducto, setPrecioOverrideByProducto] = useState<
    Record<string, number>
  >({});
  const [equivalenciaByProducto, setEquivalenciaByProducto] = useState<
    Record<string, string>
  >({});
  const productos = useMemo(
    () =>
      productosBase.map((row) => {
        const override = precioOverrideByProducto[row.idProducto];
        const equivalencia = equivalenciaByProducto[row.idProducto]?.trim();
        if (override == null && !equivalencia) return row;
        return {
          ...row,
          ...(override != null ? { precioUnitario: override } : {}),
          ...(equivalencia ? { equivalencia } : { equivalencia: null }),
        };
      }),
    [equivalenciaByProducto, precioOverrideByProducto, productosBase],
  );
  const [compradores, setCompradores] = useState<CompradorListRow[]>([]);
  const [bodegasDestino, setBodegasDestino] = useState<BodegaDestinoOption[]>([]);
  const [idBodegaDestino, setIdBodegaDestino] = useState("");
  const [pendingEmitId, setPendingEmitId] = useState<string | null>(null);
  const [editingEstado, setEditingEstado] = useState<string | null>(null);
  /** Folio OV visible en header al editar (REQ-109). */
  const [editingCodigo, setEditingCodigo] = useState("");
  const folioVisible =
    editingCodigo.trim() || codigoVenta?.trim() || "";
  const [picker, setPicker] = useState<PickerKind>(null);
  /** Índice de línea a reemplazar en el picker de producto; null = agregar. */
  const [replaceLineaIndex, setReplaceLineaIndex] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formDataReady, setFormDataReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  /** Mensaje bajo Mateo (ej. Imprimiendo…) sin quitar la pantalla de carga. */
  const [mateoBusyMessage, setMateoBusyMessage] = useState<string | undefined>();
  const [isReadingIa, setIsReadingIa] = useState(false);
  const [isDocsDropActive, setIsDocsDropActive] = useState(false);
  /** Adjuntos ya persistidos (URL Cloudinary) al editar o tras subir. */
  const [origenAdjuntos, setOrigenAdjuntos] = useState<OrigenAdjunto[]>([]);
  /** PDFs/Excel reales dentro del .eml (misma lógica que el cypher). */
  const [emlInnerAdjuntos, setEmlInnerAdjuntos] = useState<OrigenAdjunto[]>([]);
  const [isCompradorCreateOpen, setIsCompradorCreateOpen] = useState(false);
  const [fichaComprador, setFichaComprador] = useState<CompradorAltaFicha | null>(
    null,
  );
  const [exigeOc, setExigeOc] = useState(false);
  /** Nombre de cliente que Mateo leyó cuando no hubo match exacto. */
  const [compradorNombreIa, setCompradorNombreIa] = useState<string | null>(
    null,
  );
  /** Sugerencias fuzzy de compradores (más cercanas al texto de Mateo). */
  const [compradorSugerencias, setCompradorSugerencias] = useState<
    CompradorListRow[]
  >([]);
  const [autoFields, setAutoFields] = useState<Set<string>>(() => new Set());
  const [warnFields, setWarnFields] = useState<Set<string>>(() => new Set());
  /** Tras cambiar cliente: recordar revisar dirección del correo/PDF. */
  const [avisoVerificarDireccion, setAvisoVerificarDireccion] = useState(false);
  const [missingFields, setMissingFields] = useState<Set<string>>(
    () => new Set(),
  );
  const [discrepancias, setDiscrepancias] = useState<CampoDiscrepancia[]>([]);
  const [confirmDiscrepanciasOpen, setConfirmDiscrepanciasOpen] =
    useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [confirmRemoveOtId, setConfirmRemoveOtId] = useState<string | null>(
    null,
  );
  const [addOtOpen, setAddOtOpen] = useState(false);
  const [addOtAlmacen, setAddOtAlmacen] = useState("");
  const [addOtNumeroPedido, setAddOtNumeroPedido] = useState("");
  const selectedCompradorIdRef = useRef("");
  const skipDiscrepanciaConfirmRef = useRef(false);
  const skipSaveConfirmRef = useRef(false);
  /** `draft` = icono disco (sigue Por confirmar); `emit` = Confirmar → Confirmada (REQ-133). */
  const submitIntentRef = useRef<"emit" | "draft">("emit");
  const docsFileInputRef = useRef<HTMLInputElement | null>(null);
  const bootstrapPromiseRef = useRef<Promise<void> | null>(null);
  const seededOtIdsRef = useRef<Set<string>>(new Set());
  const formScrollRef = useRef<HTMLDivElement | null>(null);
  const formScrollTopRef = useRef<number | null>(null);
  const revisionFocusRequestRef = useRef<RevisionPendiente | null>(null);
  const [cantidadFocusId, setCantidadFocusId] = useState<string | null>(null);

  const captureFormScroll = useCallback(() => {
    const scroller = formScrollRef.current;
    if (scroller) formScrollTopRef.current = scroller.scrollTop;
  }, []);

  const restoreFormScroll = useCallback(() => {
    const scroller = formScrollRef.current;
    const top = formScrollTopRef.current;
    if (!scroller || top == null) return;
    scroller.scrollTop = top;
    requestAnimationFrame(() => {
      scroller.scrollTop = top;
    });
  }, []);

  const hasProductos = productos.length > 0;
  const afterCutoff = isAfterWarehouseCutoff();
  const fechaEntregaAtrasada = isFechaEntregaAtrasada(
    fechaEntrega,
    todayIsoDate(),
  );
  /**
   * REQ-118: la fecha (y avisos) se calculan con el valor actual del form.
   * No reutilizar el snapshot de Mateo si el usuario ya cambió el campo.
   */
  /** Catálogo completo: el mismo SKU puede repetirse en varias líneas/OT. */
  const productosParaAgregar = productos;

  const productosParaPicker = useMemo(() => {
    if (replaceLineaIndex == null) return productosParaAgregar;
    const lineaActiva = lineas[replaceLineaIndex];
    // Al validar pendiente: catálogo completo, pero sugerencias primero.
    if (!lineaActiva?.catalogPending) return productosParaAgregar;
    const sugIds = collectSugerenciasLinea(lineaActiva).map(
      (s) => s.idProducto,
    );
    if (sugIds.length === 0) return productosParaAgregar;
    const rank = new Map(sugIds.map((id, i) => [id, i]));
    return [...productosParaAgregar].sort((a, b) => {
      const ra = rank.has(a.idProducto) ? rank.get(a.idProducto)! : 10_000;
      const rb = rank.has(b.idProducto) ? rank.get(b.idProducto)! : 10_000;
      if (ra !== rb) return ra - rb;
      return a.nombre.localeCompare(b.nombre, "es");
    });
  }, [lineas, productosParaAgregar, replaceLineaIndex]);

  const productoPickerPriorityIds = useMemo(() => {
    if (replaceLineaIndex == null) return [] as string[];
    const linea = lineas[replaceLineaIndex];
    if (!linea?.catalogPending) return [];
    return collectSugerenciasLinea(linea).map((s) => s.idProducto);
  }, [lineas, replaceLineaIndex]);

  /** Catálogo completo de clientes; arriba las sugerencias de Mateo (REQ-068). */
  const compradorPickerPriorityIds = useMemo(
    () =>
      !idComprador && compradorSugerencias.length > 0
        ? compradorSugerencias.map((row) => row.idComprador)
        : ([] as string[]),
    [compradorSugerencias, idComprador],
  );

  /** REQ-097: identidad comercial del cliente elegido (solo lectura). */
  const compradorCatalogo = useMemo(
    () =>
      idComprador
        ? (compradores.find((row) => row.idComprador === idComprador) ?? null)
        : null,
    [compradores, idComprador],
  );
  const codigoClienteCatalogo = compradorCatalogo?.codigo?.trim() || "";
  /** En catálogo: «D. Comercial» = apodo (no el nombre del picker Cliente). */
  const denominacionComercialCatalogo =
    compradorCatalogo?.apodo?.trim() || "";

  const puedeAgregarProducto = productosParaAgregar.length > 0;
  const hasCatalogPending = lineas.some(
    (linea) => linea.catalogPending || !linea.idProducto,
  );

  useEffect(() => {
    setLineas((prev) => {
      let changed = false;
      const next = prev.map((linea) => {
        if (linea.precioManual || !linea.idProducto || linea.catalogPending) {
          return linea;
        }
        const override = precioOverrideByProducto[linea.idProducto];
        if (override != null) {
          if (linea.precioUnitario === override) return linea;
          changed = true;
          return {
            ...linea,
            precioUnitario: override,
            precioInput: formatPrecioInput(override),
          };
        }
        const base = productosBase.find(
          (row) => row.idProducto === linea.idProducto,
        );
        if (!base || linea.precioUnitario === base.precioUnitario) {
          return linea;
        }
        changed = true;
        return {
          ...linea,
          precioUnitario: base.precioUnitario,
          precioInput: formatPrecioInput(base.precioUnitario),
        };
      });
      return changed ? next : prev;
    });
  }, [precioOverrideByProducto, productosBase]);

  const ordenesTrabajoForm = useMemo(() => {
    if (ordenesTrabajoPreview.length > 0) return ordenesTrabajoPreview;
    return groupOrigenCorreoToOrdenesTrabajo(origenCorreoDraft);
  }, [ordenesTrabajoPreview, origenCorreoDraft]);

  const avisosValidacion = useMemo((): CampoDiscrepancia[] => {
    const sinFecha = discrepancias.filter(
      (item) => item.fieldKey !== "fechaEntrega",
    );
    const avisos: CampoDiscrepancia[] = [...sinFecha];
    if (fechaEntregaAtrasada && isFechaEntregaIsoValida(fechaEntrega)) {
      avisos.push({
        campo: "Fecha de entrega",
        fieldKey: "fechaEntrega",
        db: "Hoy o posterior",
        ia: `${formatCapturaFecha(fechaEntrega)} · ${FECHA_ENTREGA_ATRASADA_WARNING}`,
      });
    } else {
      const fechaDefault = discrepancias.find(
        (item) =>
          item.fieldKey === "fechaEntrega" && item.db === "Leída del correo",
      );
      if (fechaDefault && warnFields.has("fechaEntrega")) {
        avisos.push({
          ...fechaDefault,
          ia: isFechaEntregaIsoValida(fechaEntrega)
            ? `${formatCapturaFecha(fechaEntrega)} · ${FECHA_ENTREGA_DEFAULT_WARNING}`
            : fechaDefault.ia,
        });
      }
    }

    // REQ-151: aviso de posible duplicado (OCC / cliente+día de creación).
    const occTokens = [
      ordenCompraHotel,
      ...ordenesTrabajoForm.map((h) => h.numeroPedido ?? ""),
    ].filter(Boolean);
    if (occTokens.length > 0 || compradorLabel.trim()) {
      const hits = findDuplicadosAgainstDraft({
        draft: {
          occTokens,
          comprador: compradorLabel,
          // Mismo criterio que el listado (`created_at`), no fecha de entrega.
          fecha: new Date().toISOString(),
          idOrdenVentaExcluir: editingId || null,
        },
        existentes: operadorRowsForDuplicado.map((row) => ({
          idOrdenVenta: row.idOrdenVenta,
          codigo: row.venta,
          occTodas: row.occTodas,
          comprador: row.comprador,
          fecha: row.fecha,
          estado: row.estado,
        })),
      });
      if (hits.length > 0) {
        avisos.push({
          campo: "Posible duplicado",
          fieldKey: "potencialDuplicado",
          db: "Revisar antes de confirmar",
          ia: `Puede ser la misma OV que ${hits
            .map((h) => h.codigo)
            .slice(0, 4)
            .join(", ")} (Mateo aún aprende).`,
        });
      }
    }

    return avisos;
  }, [
    compradorLabel,
    discrepancias,
    editingId,
    fechaEntrega,
    fechaEntregaAtrasada,
    operadorRowsForDuplicado,
    ordenCompraHotel,
    ordenesTrabajoForm,
    warnFields,
  ]);

  const avisoPotencialDuplicado = useMemo(
    () =>
      avisosValidacion.find((item) => item.fieldKey === "potencialDuplicado") ??
      null,
    [avisosValidacion],
  );

  /** Avisos de catálogo/fecha (sin Dup?): el diálogo de discrepancias Mateo. */
  const avisosCatalogoValidacion = useMemo(
    () =>
      avisosValidacion.filter(
        (item) => item.fieldKey !== "potencialDuplicado",
      ),
    [avisosValidacion],
  );

  const countProductosOt = useCallback((hija: OrdenTrabajoHija) => {
    return hija.renglones.filter(
      (row) =>
        (row.Producto ?? "").trim() ||
        (row["Codigo producto"] ?? "").trim(),
    ).length;
  }, []);

  // El grid de OT vive en Cypher: al editar nunca mostrar pickOt centrado.
  useEffect(() => {
    if (!open || !isEditing) return;
    if (step !== "pickOt") return;
    setFormOtPage(0);
    setStep("form");
    setError(null);
  }, [isEditing, open, step]);

  const applyOrdenesTrabajo = useCallback((next: OrdenTrabajoHija[]) => {
    setOrdenesTrabajoPreview(next);
    setOrigenCorreoDraft(flattenOrdenesTrabajoToOrigenCorreo(next));
    setFormOtPage((page) =>
      next.length === 0 ? 0 : Math.min(page, next.length - 1),
    );
  }, []);

  const handleAddOrdenTrabajo = useCallback(() => {
    const almacen = addOtAlmacen.trim();
    if (!almacen) {
      setError("Indica el centro de consumo de la nueva tarea.");
      return;
    }
    const nueva = createEmptyOrdenTrabajoHija({
      almacen,
      numeroPedido: addOtNumeroPedido.trim() || ordenCompraHotel.trim(),
      fecha: fechaEntrega.trim(),
    });
    const next = [...ordenesTrabajoForm, nueva];
    applyOrdenesTrabajo(next);
    setAddOtOpen(false);
    setAddOtAlmacen("");
    setAddOtNumeroPedido("");
    setError(null);
    const newIndex = next.findIndex((h) => h.id === nueva.id);
    setFormOtPage(newIndex >= 0 ? newIndex : next.length - 1);
    setStep("form");
  }, [
    addOtAlmacen,
    addOtNumeroPedido,
    applyOrdenesTrabajo,
    fechaEntrega,
    ordenCompraHotel,
    ordenesTrabajoForm,
  ]);

  const handleConfirmRemoveOrdenTrabajo = useCallback(() => {
    const otId = confirmRemoveOtId;
    if (!otId) return;
    const next = ordenesTrabajoForm.filter((hija) => hija.id !== otId);
    applyOrdenesTrabajo(next);
    setLineas((prev) => prev.filter((linea) => linea.otId !== otId));
    seededOtIdsRef.current.delete(otId);
    setConfirmRemoveOtId(null);
    setError(null);
    if (step === "pickOt") {
      if (next.length === 0) setStep("preview");
      else if (next.length === 1) setStep("form");
      setFormOtPage(0);
    }
  }, [applyOrdenesTrabajo, confirmRemoveOtId, ordenesTrabajoForm, step]);

  const previewHijas = ordenesTrabajoForm;

  const formOtSafePagePreview =
    previewHijas.length > 0
      ? Math.min(formOtPage, previewHijas.length - 1)
      : 0;

  const paginarPorOt =
    startMode === "docs" &&
    ordenesTrabajoForm.length > 1 &&
    lineas.some((linea) => Boolean(linea.otId));

  const formOtSafePage = paginarPorOt
    ? Math.min(formOtPage, ordenesTrabajoForm.length - 1)
    : 0;

  const hijaFormActiva = paginarPorOt
    ? (ordenesTrabajoForm[formOtSafePage] ?? null)
    : null;

  /** Escribe los campos del formulario en la OT activa (antes de guardar o cambiar de página). */
  const syncActiveOtFromForm = useCallback((): OrdenTrabajoHija[] => {
    // REQ-141: también con 1 OT, para que borrar notas sí limpie el origen.
    const targetHija =
      paginarPorOt && hijaFormActiva
        ? hijaFormActiva
        : !paginarPorOt && ordenesTrabajoForm.length === 1
          ? ordenesTrabajoForm[0]
          : null;
    if (!targetHija) return ordenesTrabajoForm;

    const almacen = centroConsumo.trim();
    const numeroPedido = ordenCompraHotel.trim();
    const fecha = fechaEntrega.trim();
    const responsableExterno = contacto.trim();
    const telefonoOt = telefono.trim();
    const correoOt = correo.trim();
    const direccionOt = direccion.trim();
    const andenOt = anden.trim();
    const ventanaDesdeOt = ventanaDesde.trim();
    const ventanaHastaOt = ventanaHasta.trim();
    const notasOt = observaciones.trim();
    const prioridadOt = prioridad.trim();

    return ordenesTrabajoForm.map((hija) => {
      // REQ-141 / REQ-112: notas y dirección son de la OV — propagar a todas las OT.
      if (hija.id !== targetHija.id) {
        return {
          ...hija,
          renglones: (
            hija.renglones.length > 0
              ? hija.renglones
              : [{ Producto: "", Cantidad: 0 }]
          ).map((row) => ({
            ...row,
            "Notas generales": notasOt,
            "Direccion entrega": direccionOt,
            Destino: direccionOt,
          })),
        };
      }
      const renglones = (
        hija.renglones.length > 0
          ? hija.renglones
          : [{ Producto: "", Cantidad: 0 }]
      ).map((row) => ({
        ...row,
        Almacen: almacen || row.Almacen,
        "Numero pedido":
          numeroPedido ||
          (isGarbageOcValue(row["Numero pedido"])
            ? ""
            : row["Numero pedido"] || ""),
        Fecha: fecha || row.Fecha,
        "Responsable externo":
          responsableExterno || row["Responsable externo"],
        "Telefono contacto": telefonoOt || row["Telefono contacto"],
        "Correo contacto": correoOt || row["Correo contacto"],
        "Direccion entrega": direccionOt,
        Destino: direccionOt,
        Anden: andenOt || row.Anden,
        "Ventana desde": ventanaDesdeOt || row["Ventana desde"],
        "Ventana hasta": ventanaHastaOt || row["Ventana hasta"],
        "Notas generales": notasOt,
        Prioridad: prioridadOt || row.Prioridad,
      }));
      const label =
        (numeroPedido && almacen
          ? `${numeroPedido} — ${almacen}`
          : almacen || numeroPedido) || hija.label;
      return {
        ...hija,
        almacen,
        numeroPedido,
        fecha,
        responsableExterno,
        label,
        renglones,
      };
    });
  }, [
    anden,
    centroConsumo,
    contacto,
    correo,
    direccion,
    fechaEntrega,
    hijaFormActiva,
    observaciones,
    ordenCompraHotel,
    ordenesTrabajoForm,
    paginarPorOt,
    prioridad,
    telefono,
    ventanaDesde,
    ventanaHasta,
  ]);

  const goToOtPage = useCallback(
    (nextPage: number) => {
      if (paginarPorOt && hijaFormActiva) {
        applyOrdenesTrabajo(syncActiveOtFromForm());
      }
      setFormOtPage(nextPage);
      setError(null);
      setSuccessMessage(null);
    },
    [
      applyOrdenesTrabajo,
      hijaFormActiva,
      paginarPorOt,
      syncActiveOtFromForm,
    ],
  );

  /** Estado actual del formulario para pedir una propuesta de reagrupación (REQ-125). */
  const obtenerSolicitudReagrupacion = useCallback(() => {
    const hijas = syncActiveOtFromForm();
    if (hijas.length === 0) return null;
    const { estadoBase } = construirEstadoBaseApi(
      hijas,
      lineas,
      parseCantidadReagrupacion,
    );
    return { estadoBase, firma: firmaEstadoReagrupacion(hijas, lineas) };
  }, [lineas, syncActiveOtFromForm]);

  /**
   * Aplica la propuesta como BORRADOR: mueve renglones y reasigna las líneas a la
   * vez, sin escribir en BD. Lanza si la propuesta no respeta las OT originales.
   */
  const handleAplicarReagrupacion = useCallback(
    (datos: { propuesta: PropuestaReagrupacionApi; instruccion: string }) => {
      const hijas = syncActiveOtFromForm();
      // Los ids de renglón son deterministas: se reconstruye el índice con el estado actual.
      const { indice } = construirEstadoBaseApi(
        hijas,
        lineas,
        parseCantidadReagrupacion,
      );
      const snapshot = crearSnapshotReagrupacion(hijas, lineas);
      const resultado = aplicarReagrupacion({
        hijas,
        lineas,
        propuesta: datos.propuesta,
        indice,
      });

      applyOrdenesTrabajo(resultado.hijas);
      setLineas(resultado.lineas);
      setFormOtPage(0);
      setReagruparAplicada({
        snapshot,
        instruccion: datos.instruccion,
        resumen: datos.propuesta.resumen,
        movimientos: resultado.movimientos,
        otNuevas: resultado.otNuevas,
      });
      setReagruparOpen(false);
      setError(null);
      showToast({
        title: "Órdenes de trabajo reorganizadas",
        content:
          "El cambio quedó como borrador. Guarda el pedido para conservarlo o pulsa Deshacer.",
        variant: "success",
        durationMs: 5000,
      });
    },
    [applyOrdenesTrabajo, lineas, showToast, syncActiveOtFromForm],
  );

  /** Deshacer: restaura OT y líneas como estaban antes de aplicar la reagrupación (R10). */
  const handleDeshacerReagrupacion = useCallback(() => {
    if (!reagruparAplicada) return;
    applyOrdenesTrabajo(reagruparAplicada.snapshot.hijas);
    setLineas(reagruparAplicada.snapshot.lineas);
    setReagruparAplicada(null);
    setError(null);
  }, [applyOrdenesTrabajo, reagruparAplicada]);

  useEffect(() => {
    if (!onCompanionOtPickerChange) return;

    const shouldPublish =
      open &&
      cypherOpen &&
      isEditing &&
      normalizeEstadoOrdenVenta(editingEstado) === "por_confirmar" &&
      ordenesTrabajoForm.length >= 1 &&
      (step === "pickOt" || step === "form");

    if (!shouldPublish) {
      onCompanionOtPickerChange(null);
      return;
    }

    const selectedIndex =
      ordenesTrabajoForm.length > 0
        ? Math.min(formOtPage, ordenesTrabajoForm.length - 1)
        : 0;

    onCompanionOtPickerChange({
      hijas: ordenesTrabajoForm.map((hija) => ({
        id: hija.id,
        label: hija.label,
        productosCount: countProductosOt(hija),
        totalCantidad: hija.totalCantidad,
        almacen: hija.almacen,
      })),
      selectedId: ordenesTrabajoForm[selectedIndex]?.id ?? null,
      onSelect: (id: string) => {
        const index = ordenesTrabajoForm.findIndex((hija) => hija.id === id);
        if (index < 0) return;
        setStep("form");
        goToOtPage(index);
      },
      onReagrupar: puedeReagruparOt(editingEstado, ordenesTrabajoForm.length)
        ? () => setReagruparOpen(true)
        : undefined,
    });

    return () => {
      onCompanionOtPickerChange(null);
    };
  }, [
    countProductosOt,
    cypherOpen,
    editingEstado,
    formOtPage,
    goToOtPage,
    isEditing,
    onCompanionOtPickerChange,
    open,
    ordenesTrabajoForm,
    step,
  ]);

  // REQ-188: «Modificar con IA» pedido desde el «+» de Acciones: abrir el chat en
  // cuanto el formulario trae las OT (y solo si la OV todavía lo permite).
  useEffect(() => {
    const decision = decidirAperturaReagruparAlCargar({
      pedida: abrirReagruparAlCargar,
      formularioAbierto: open,
      editando: isEditing,
      estadoOrdenVenta: editingEstado,
      cantidadOt: ordenesTrabajoForm.length,
    });
    if (decision === "ninguna" || decision === "esperar") return;
    if (decision === "abrir") setReagruparOpen(true);
    onReagruparAlCargarAtendido?.();
  }, [
    abrirReagruparAlCargar,
    editingEstado,
    isEditing,
    onReagruparAlCargarAtendido,
    open,
    ordenesTrabajoForm.length,
  ]);

  // REQ-126: Cypher fiscal usa el cliente del formulario (no solo el guardado).
  useEffect(() => {
    if (!onCompanionIdCompradorChange) return;
    if (!open || !cypherOpen) {
      onCompanionIdCompradorChange(null);
      return;
    }
    onCompanionIdCompradorChange(idComprador.trim() || null);
    return () => {
      onCompanionIdCompradorChange(null);
    };
  }, [cypherOpen, idComprador, onCompanionIdCompradorChange, open]);

  useEffect(() => {
    if (step !== "form" || startMode !== "docs") return;

    const hija =
      hijaFormActiva ??
      (ordenesTrabajoForm.length === 1 ? ordenesTrabajoForm[0] : null);
    if (!hija) return;

    const first = hija.renglones[0];
    const almacen =
      hija.almacen?.trim() ||
      first?.Almacen?.trim() ||
      first?.["Numero almacen"]?.trim() ||
      "";
    if (almacen) {
      setCentroConsumo(almacen);
    }
    const numeroPedidoHija = hija.numeroPedido?.trim() || "";
    // No reinyectar basura OCR (ej. rAutorizado) al cambiar de OT.
    if (numeroPedidoHija && !isGarbageOcValue(numeroPedidoHija)) {
      setOrdenCompraHotel(numeroPedidoHija);
    }
    const fechaHija = toDateInputValue(hija.fecha);
    const fechaIso = isFechaEntregaIsoValida(fechaHija) ? fechaHija : "";
    if (fechaIso) {
      setFechaEntrega(fechaIso);
    }
    const contactoHija =
      hija.responsableExterno?.trim() ||
      first?.["Responsable externo"]?.trim() ||
      "";
    if (contactoHija) {
      setContacto(contactoHija);
    }
    const telefonoHija = first?.["Telefono contacto"]?.trim() || "";
    if (telefonoHija) setTelefono(telefonoHija);
    const correoHija = first?.["Correo contacto"]?.trim() || "";
    if (correoHija) setCorreo(correoHija);
    // REQ-112: dirección es de la OV — no reinyectar al cambiar de OT.
    const andenHija = first?.Anden?.trim() || "";
    if (andenHija) setAnden(andenHija);
    const ventanaDesdeHija = first?.["Ventana desde"]?.trim() || "";
    if (ventanaDesdeHija) setVentanaDesde(ventanaDesdeHija);
    const ventanaHastaHija = first?.["Ventana hasta"]?.trim() || "";
    if (ventanaHastaHija) setVentanaHasta(ventanaHastaHija);
    // REQ-141: no reinyectar Notas generales al cambiar de OT (son de la OV).
    const prioridadHija = first?.Prioridad?.trim() || "";
    if (prioridadHija) setPrioridad(prioridadHija);

    setAutoFields((prev) => {
      const next = new Set(prev);
      if (almacen) next.add("centroConsumo");
      if (hija.numeroPedido?.trim()) next.add("ordenCompraHotel");
      if (fechaIso) next.add("fechaEntrega");
      if (contactoHija) next.add("contacto");
      if (telefonoHija) next.add("telefono");
      if (correoHija) next.add("correo");
      if (andenHija) next.add("anden");
      if (ventanaDesdeHija) next.add("ventanaDesde");
      if (ventanaHastaHija) next.add("ventanaHasta");
      return next;
    });
    setWarnFields((prev) => {
      const next = new Set(prev);
      next.delete("centroConsumo");
      next.delete("ordenCompraHotel");
      next.delete("fechaEntrega");
      next.delete("contacto");
      next.delete("telefono");
      next.delete("correo");
      next.delete("anden");
      next.delete("ventanaDesde");
      next.delete("ventanaHasta");
      return next;
    });
    setMissingFields((prev) => {
      const next = new Set(prev);
      next.delete("centroConsumo");
      next.delete("ordenCompraHotel");
      next.delete("fechaEntrega");
      next.delete("contacto");
      next.delete("telefono");
      next.delete("correo");
      next.delete("anden");
      next.delete("ventanaDesde");
      next.delete("ventanaHasta");
      return next;
    });
  }, [
    hijaFormActiva,
    ordenesTrabajoForm,
    startMode,
    step,
  ]);

  const lineasConIndice = useMemo(() => {
    const indexed = lineas.map((linea, index) => ({ linea, index }));
    if (!hijaFormActiva) return indexed;

    const byOtId = indexed.filter(
      ({ linea }) => linea.otId === hijaFormActiva.id,
    );
    if (byOtId.length > 0) return byOtId;

    // OT nueva/vacía o el resto ya tiene otId → no mezclar productos de otras tareas.
    const hijaSinProductos = hijaFormActiva.renglones.every(
      (row) =>
        !(row.Producto ?? "").trim() && !(row["Codigo producto"] ?? "").trim(),
    );
    if (hijaSinProductos || lineas.some((linea) => Boolean(linea.otId))) {
      return byOtId;
    }

    // Fallback: emparejar por nombre/código/cantidad (igual que el detalle).
    const wrapped = indexed.map(({ linea, index }) => ({
      index,
      linea,
      cantidad_pedida: parseDecimalEs(linea.cantidadInput) ?? 0,
      matchNombre: linea.aliasCliente || linea.nombre,
      matchCodigo: linea.codigo,
      producto: {
        sku: linea.codigo,
        descripcion: linea.aliasCliente || linea.nombre,
        metadatos_catalogo: null,
      },
    }));
    return filterLineasByOrdenTrabajoHija(wrapped, hijaFormActiva, {
      emptyFallback: "none",
    }).map(({ linea, index }) => ({ linea, index }));
  }, [hijaFormActiva, lineas]);

  // Si el filtro OT dejó la página vacía, materializa líneas desde origen_correo.
  useEffect(() => {
    if (!open) {
      seededOtIdsRef.current = new Set();
      return;
    }
    if (step !== "form" || !hijaFormActiva) return;
    if (hijaFormActiva.renglones.length === 0) return;
    if (seededOtIdsRef.current.has(hijaFormActiva.id)) return;

    const hasForOt = lineas.some(
      (linea) => linea.otId === hijaFormActiva.id,
    );
    if (hasForOt) {
      seededOtIdsRef.current.add(hijaFormActiva.id);
      return;
    }

    const seeded: LineaVentaForm[] = hijaFormActiva.renglones.map((row) => {
      const qty = parseDecimalEs(String(row.Cantidad ?? "")) ?? 0;
      const precio =
        typeof row.Precio === "number"
          ? row.Precio
          : (parseDecimalEs(String(row.Precio ?? "")) ?? 0);
      const nombre = row.Producto?.trim() || "Producto del correo";
      const codigo = row["Codigo producto"]?.trim() || "—";
      const query = [nombre, codigo !== "—" ? codigo : ""].filter(Boolean).join(" ");
      const suggested = suggestFromCatalogo(query, productos);
      return {
        idProducto: "",
        nombre,
        codigo,
        idBodega: suggested.sugerencia?.idBodega ?? "",
        cantidadInput: qty > 0 ? formatDecimalInputEs(qty) : "",
        cajasInput: "",
        presentacion: "",
        especificacion: "",
        descuentoPctInput: "",
        ivaPct: "0",
        kgDisponible: suggested.sugerencia?.kgDisponible ?? 0,
        unidadMedida:
          suggested.sugerencia?.unidadMedida || UNIDAD_MEDIDA_VENTA_DEFAULT,
        precioUnitario: precio,
        precioInput: formatPrecioInput(precio),
        precioManual: precio > 0,
        aliasCliente: nombre,
        filledByIa: true,
        otId: hijaFormActiva.id,
        catalogPending: true,
        catalogAmbiguo: suggested.catalogAmbiguo,
        sugerencia: suggested.sugerencia,
        sugerenciasAlternativas: suggested.sugerenciasAlternativas,
      };
    });

    seededOtIdsRef.current.add(hijaFormActiva.id);
    setLineas((prev) => [...prev, ...seeded]);
  }, [hijaFormActiva, lineas, open, productos, step]);

  // Recalcula sugerencias cuando el catálogo/equivalencias llegan o mejoran
  // (p. ej. después de elegir cliente, o si el match inicial falló por typo).
  useEffect(() => {
    if (!open || productos.length === 0) return;
    setLineas((prev) => {
      let changed = false;
      const next = prev.map((linea) => {
        if (!linea.catalogPending || linea.idProducto) return linea;
        const query = (linea.aliasCliente || linea.nombre || "").trim();
        if (!query) return linea;
        const suggested = suggestFromCatalogo(query, productos);
        if (!suggested.sugerencia) return linea;
        const samePrimary =
          linea.sugerencia?.idProducto === suggested.sugerencia.idProducto;
        const sameAlts =
          (linea.sugerenciasAlternativas?.length ?? 0) ===
            suggested.sugerenciasAlternativas.length &&
          (linea.sugerenciasAlternativas ?? []).every(
            (alt, i) =>
              alt.idProducto ===
              suggested.sugerenciasAlternativas[i]?.idProducto,
          );
        if (samePrimary && sameAlts) return linea;
        changed = true;
        return {
          ...linea,
          idBodega: linea.idBodega || suggested.sugerencia.idBodega,
          kgDisponible:
            linea.kgDisponible > 0
              ? linea.kgDisponible
              : suggested.sugerencia.kgDisponible,
          unidadMedida:
            linea.unidadMedida ||
            suggested.sugerencia.unidadMedida ||
            UNIDAD_MEDIDA_VENTA_DEFAULT,
          catalogAmbiguo: suggested.catalogAmbiguo,
          sugerencia: suggested.sugerencia,
          sugerenciasAlternativas: suggested.sugerenciasAlternativas,
        };
      });
      return changed ? next : prev;
    });
  }, [equivalenciaByProducto, open, productos]);

  const lineasParaTotales = useMemo(
    () => lineasConIndice.map(({ linea }) => linea),
    [lineasConIndice],
  );

  const otPagerNextBlocked = useMemo(() => {
    if (!paginarPorOt || step !== "form") return false;
    return hasOtPagerRequiredBlocking({
      idComprador,
      exigeOc,
      ordenCompraHotel,
      idBodegaDestino,
      fechaEntrega,
      todayIso: todayIsoDate(),
      ventanaDesde,
      ventanaHasta,
      lineasPagina: lineasConIndice.map(({ linea }) => ({
        cantidadInput: linea.cantidadInput,
        precioInput: linea.precioInput,
      })),
    });
  }, [
    exigeOc,
    fechaEntrega,
    idBodegaDestino,
    idComprador,
    lineasConIndice,
    ordenCompraHotel,
    paginarPorOt,
    step,
    ventanaDesde,
    ventanaHasta,
  ]);

  const esPorConfirmar =
    !isEditing ||
    editingEstado == null ||
    normalizeEstadoOrdenVenta(editingEstado) === "por_confirmar";

  const revisionPendiente = useMemo(() => {
    if (step !== "form" || !esPorConfirmar) return null;
    return findPrimeraRevisionPendiente({
      idComprador,
      exigeOc,
      ordenCompraHotel,
      fechaEntrega,
      todayIso: todayIsoDate(),
      ventanaDesde,
      ventanaHasta,
      hijas: ordenesTrabajoForm,
      lineas: lineas.map((linea) => ({
        otId: linea.otId,
        catalogPending: linea.catalogPending,
        idProducto: linea.idProducto,
        cantidadInput: linea.cantidadInput,
        precioInput: linea.precioInput,
        aliasCliente: linea.aliasCliente,
        nombre: linea.nombre,
      })),
    });
  }, [
    esPorConfirmar,
    exigeOc,
    fechaEntrega,
    idComprador,
    lineas,
    ordenCompraHotel,
    ordenesTrabajoForm,
    step,
    ventanaDesde,
    ventanaHasta,
  ]);

  const focusRevisionPendiente = useCallback((pendiente: RevisionPendiente) => {
    const selector = revisionFocusSelector(pendiente);
    if (!selector) return;
    const root = formScrollRef.current ?? document;
    const el = root.querySelector<HTMLElement>(selector);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    window.setTimeout(() => {
      el.focus({ preventScroll: true });
    }, 180);
  }, []);

  useLayoutEffect(() => {
    const pending = revisionFocusRequestRef.current;
    if (!pending || step !== "form") return;
    if (
      pending.otIndex != null &&
      paginarPorOt &&
      formOtSafePage !== pending.otIndex
    ) {
      return;
    }
    revisionFocusRequestRef.current = null;
    const timer = window.setTimeout(() => {
      focusRevisionPendiente(pending);
    }, 50);
    return () => window.clearTimeout(timer);
  }, [
    focusRevisionPendiente,
    formOtSafePage,
    lineasConIndice,
    paginarPorOt,
    step,
  ]);

  const subtotalVenta = useMemo(
    () =>
      lineasParaTotales.reduce(
        (sum, linea) => sum + lineAmounts(linea).bruto,
        0,
      ),
    [lineasParaTotales],
  );

  const descuentosVenta = useMemo(
    () =>
      lineasParaTotales.reduce(
        (sum, linea) => sum + lineAmounts(linea).descuento,
        0,
      ),
    [lineasParaTotales],
  );

  const ivaVenta = useMemo(
    () =>
      lineasParaTotales.reduce(
        (sum, linea) => sum + lineAmounts(linea).iva,
        0,
      ),
    [lineasParaTotales],
  );

  const totalVenta = useMemo(
    () => Math.max(0, subtotalVenta - descuentosVenta + ivaVenta),
    [descuentosVenta, ivaVenta, subtotalVenta],
  );

  /** REQ-148: suma $$$$ de todas las OT (el pie de productos suele ser solo la OT activa). */
  const mostrarTotalOv =
    ordenesTrabajoForm.length > 1 &&
    lineas.some((linea) => Boolean(linea.otId));

  const totalOvCompleta = useMemo(() => {
    if (!mostrarTotalOv) return 0;
    return lineas.reduce((sum, linea) => {
      const a = lineAmounts(linea);
      return sum + Math.max(0, a.bruto - a.descuento + a.iva);
    }, 0);
  }, [lineas, mostrarTotalOv]);

  // REQ-109: si la lista ya trae folio y el detalle aún no, mostrarlo.
  useEffect(() => {
    const fromLista = codigoVenta?.trim() || "";
    if (!fromLista) return;
    setEditingCodigo((prev) => prev.trim() || fromLista);
  }, [codigoVenta]);

  useEffect(() => {
    if (!open) return;

    setStep(isEditing ? "form" : "start");
    setStartMode(isEditing ? "scratch" : null);
    setIsCompradorCreateOpen(false);
    setIdComprador("");
    setCompradorLabel("");
    setCompradorNombreIa(null);
    setCompradorSugerencias([]);
    selectedCompradorIdRef.current = "";
    setFechaEntrega("");
    setVentanaDesde("");
    setVentanaHasta("");
    setPrioridad("Normal");
    setMoneda("MXN");
    setOrdenCompraHotel("");
    setCentroConsumo("");
    setObservaciones("");
    setDireccion("");
    setAnden("");
    setContacto("");
    setTelefono("");
    setCorreo("");
    setTurno("");
    setHoraSalida("");
    setChofer("");
    setUnidad("");
    setAceptaSustituciones("");
    setRequiereLote("");
    setRegistrarTemperatura("");
    setOrigenTexto("");
    setOrigenArchivoFiles([]);
    setOrigenCorreoDraft([]);
    setOrdenesTrabajoPreview([]);
    setFormOtPage(0);
    setLineas([]);
    setProductosBase([]);
    setPrecioOverrideByProducto({});
    setEquivalenciaByProducto({});
    setCompradores([]);
    setBodegasDestino([]);
    setIdBodegaDestino("");
    setPendingEmitId(null);
    setEditingEstado(null);
    setEditingCodigo("");
    setReagruparOpen(false);
    setReagruparAplicada(null);
    setPicker(null);
    setReplaceLineaIndex(null);
    setAutoFields(new Set());
    setWarnFields(new Set());
    setAvisoVerificarDireccion(false);
    setMissingFields(new Set());
    setDiscrepancias([]);
    setConfirmDiscrepanciasOpen(false);
    setConfirmSaveOpen(false);
    setIsReadingIa(false);
    skipDiscrepanciaConfirmRef.current = false;
    skipSaveConfirmRef.current = false;
    setCantidadFocusId(null);
    setError(null);
    setSuccessMessage(null);
    setIsSaving(false);
    submitIntentRef.current = "emit";
    setOrigenAdjuntos([]);
    setEmlInnerAdjuntos([]);
    setConfirmDiscardOpen(false);
    setFichaComprador(null);
    setExigeOc(false);

    if (!codigoCuenta) return;

    // Pedido nuevo: mostrar «¿Cómo quieres empezar?» al instante.
    // Edición: sí bloqueamos hasta tener detalle + catálogo.
    // OV externa por_confirmar: pantalla Mateo mientras interpreta origen_correo.
    setFormDataReady(false);
    if (isEditing) {
      setIsLoading(true);
      setIsReadingIa(true);
    } else {
      // Evita spinner residual de una edición/apertura previa.
      setIsLoading(false);
    }

    const bootstrap = Promise.all([
      fetchProductosVentaCatalogo(codigoCuenta),
      listCompradoresAdmin({ codigoCuenta }),
      listBodegasInternasVinculadasAdmin({ codigoCuenta }),
      listBodegasExternasVinculadasAdmin({ codigoCuenta }),
      getCuentaIdBodegaDefault(codigoCuenta),
      editingId
        ? getOrdenVentaDetalle({ codigoCuenta, idOrdenVenta: editingId })
        : Promise.resolve(null),
    ]).then(
        ([
          productoRows,
          compradorRows,
          internas,
          externas,
          idBodegaDefault,
          detalle,
        ]) => {
        setProductosBase(productoRows);
        setCompradores(compradorRows);
        const incluirTipo = internas.length > 0 && externas.length > 0;
        const destinoRows = [
          ...internas.map((bodega) =>
            formatBodegaDestinoOption(bodega, "interna", incluirTipo),
          ),
          ...externas.map((bodega) =>
            formatBodegaDestinoOption(bodega, "externa", incluirTipo),
          ),
        ];
        setBodegasDestino(destinoRows);
        setIdBodegaDestino(
          resolveBodegaDestinoInicial(destinoRows, idBodegaDefault),
        );

        if (!detalle) return;

        setEditingEstado(detalle.estado);
        setEditingCodigo(
          detalle.codigo?.trim() || codigoVenta?.trim() || "",
        );
        const idCompradorDetalle = detalle.id_comprador?.trim() || "";
        selectedCompradorIdRef.current = idCompradorDetalle;
        setIdComprador(idCompradorDetalle);
        const compradorRow = compradorRows.find(
          (row) => row.idComprador === idCompradorDetalle,
        );
        {
          const labelSinId = formatCompradorOrdenVenta(detalle);
          setCompradorLabel(
            compradorRow
              ? formatCompradorLabel(compradorRow)
              : labelSinId === "—"
                ? ""
                : labelSinId,
          );
        }
        setFechaEntrega(toDateInputValue(detalle.fecha_entrega));
        setVentanaDesde(detalle.ventana_desde?.trim() || "");
        setVentanaHasta(detalle.ventana_hasta?.trim() || "");
        setPrioridad(detalle.prioridad?.trim() || "Normal");
        setMoneda(detalle.moneda?.trim() || "MXN");
        const origenTextoLoad = (() => {
          const raw = detalle.origen_texto?.trim() || "";
          if (!raw) return "";
          return isCuerpoMensajeFormato(raw) ? raw : cleanCorreoBodyForNotas(raw);
        })();
        const occLimpia = resolveOrdenCompraLimpia(
          detalle.orden_compra_hotel,
          origenTextoLoad,
        );
        setOrdenCompraHotel(occLimpia);
        setCentroConsumo(detalle.centro_consumo?.trim() || "");
        const notasCanon = sanitizeNotasGeneralesPedido(
          stripSurtidoFotoQrFromNotas(detalle.notas_almacen ?? "") ||
            parseOrdenVentaCapturaObservaciones(detalle.observaciones)
              .observaciones,
          detalle.origen_texto,
        );
        setObservaciones(notasCanon);
        setDireccion(detalle.direccion_entrega?.trim() || "");
        setAnden(detalle.anden?.trim() || "");
        setContacto(detalle.contacto_entrega?.trim() || "");
        setTelefono(sanitizeTelefonoContacto(detalle.telefono_contacto));
        setCorreo(
          detalle.correo_contacto?.trim() ||
            extractCorreoContactoDesdeTexto(detalle.origen_texto) ||
            extractCorreoContactoDesdeTexto(detalle.observaciones) ||
            "",
        );
        setTurno(detalle.turno?.trim() || "");
        setHoraSalida(detalle.hora_salida?.trim() || "");
        setChofer(detalle.chofer?.trim() || "");
        setUnidad(detalle.unidad?.trim() || "");
        setAceptaSustituciones(detalle.acepta_sustituciones?.trim() || "");
        setRequiereLote(detalle.requiere_lote?.trim() || "");
        setRegistrarTemperatura(detalle.registrar_temperatura?.trim() || "");
        setOrigenTexto(origenTextoLoad);
        setOrigenAdjuntos(parseOrigenArchivos(detalle.origen_archivos));
        const origenCorreoRows = sanitizeOrigenCorreoNumeroPedido(
          parseOrigenCorreoJson(detalle.origen_correo),
          origenTextoLoad,
        );
        // REQ-141: origen no debe reinyectar notas ya borradas en la OV.
        const hijasEdit = withNotasGeneralesOnHijas(
          groupOrigenCorreoToOrdenesTrabajo(origenCorreoRows),
          notasCanon,
        );
        setOrigenCorreoDraft(flattenOrdenesTrabajoToOrigenCorreo(hijasEdit));
        setOrdenesTrabajoPreview(hijasEdit);
        if (detalle.id_bodega_destino?.trim()) {
          setIdBodegaDestino(detalle.id_bodega_destino.trim());
        }

        // Texto del cliente en el origen (caption bajo el campo), aunque ya esté matcheado.
        const nombreEscritoOrigen =
          origenCorreoRows
            .map((row) => row["Nombre cliente"]?.trim())
            .find((value): value is string => Boolean(value)) || null;
        if (nombreEscritoOrigen) {
          setCompradorNombreIa(nombreEscritoOrigen);
        }
        // Sin cliente de catálogo: mostrar el nombre del correo (no "—") + sugerencias.
        if (!idCompradorDetalle && nombreEscritoOrigen) {
          setCompradorLabel(nombreEscritoOrigen);
        }

        const esExternoPorConfirmar =
          normalizeEstadoOrdenVenta(detalle.estado) === "por_confirmar" &&
          origenCorreoRows.length > 0;

        // OV del tercero: Mateo interpreta origen_correo → formulario (1ª OT) + Cypher.
        if (esExternoPorConfirmar) {
          const pedido = buildPedidoExtraidoFromOrigenCorreo({
            origenCorreo: origenCorreoRows,
            origenTexto: detalle.origen_texto,
            notasAlmacen: detalle.notas_almacen,
          });

          const compradorRank = rankCompradoresFromNombre(
            pedido.nombreCliente,
            compradorRows,
          );
          const autoComprador = shouldAutoAssignComprador(
            compradorRank,
            pedido.nombreCliente,
          );
          // Si ya venía un comprador de materialización pero no es match exacto
          // del texto del cliente, no lo dejamos elegido: solo sugerencias.
          const detalleEsExacto =
            Boolean(autoComprador) &&
            autoComprador?.idComprador === idCompradorDetalle;
          let idCompradorForMap = detalleEsExacto ? idCompradorDetalle : "";
          let telefonoForMap = "";

          if (autoComprador) {
            handleSelectComprador(autoComprador, {
              keepNombreIa: Boolean(nombreEscritoOrigen),
              // No pisar Ship To del origen con la ficha del comprador.
              preservePedidoData: true,
            });
            idCompradorForMap = autoComprador.idComprador;
            telefonoForMap = autoComprador.telefono?.trim() || "";
          } else if (nombreEscritoOrigen) {
            selectedCompradorIdRef.current = "";
            setIdComprador("");
            setCompradorLabel(nombreEscritoOrigen);
            setCompradorSugerencias(
              compradorRank.candidates.map((c) => c.comprador).slice(0, 4),
            );
          }

          const prioridadOrigen = origenCorreoRows
            .map((r) => r.Prioridad?.trim())
            .find(Boolean);
          if (prioridadOrigen) setPrioridad(prioridadOrigen);

          const mapped = mapPedidoExtraidoToForm({
            pedido,
            productos: productoRows,
            ficha: {
              centroConsumo: detalle.centro_consumo?.trim() || "",
              ventanaDesde: detalle.ventana_desde?.trim() || "",
              ventanaHasta: detalle.ventana_hasta?.trim() || "",
              direccion: detalle.direccion_entrega?.trim() || "",
              anden: detalle.anden?.trim() || "",
              contacto: detalle.contacto_entrega?.trim() || "",
              telefono:
                detalle.telefono_contacto?.trim() || telefonoForMap || "",
              correo: detalle.correo_contacto?.trim() || "",
              aceptaSustituciones: detalle.acepta_sustituciones?.trim() || "",
              requiereLote: detalle.requiere_lote?.trim() || "",
              registrarTemperatura:
                detalle.registrar_temperatura?.trim() || "",
              observaciones:
                sanitizeNotasGeneralesPedido(
                  stripSurtidoFotoQrFromNotas(detalle.notas_almacen ?? "") ||
                    "",
                  detalle.origen_texto,
                ) || "",
            },
            tomorrowIso: tomorrowIsoDate(),
            todayIso: todayIsoDate(),
          });

          // Preferir ISO de BD; luego origen/adjuntos; luego mapped (puede ser mañana default).
          const fechaDb = toDateInputValue(detalle.fecha_entrega);
          const fechaMapped = isFechaEntregaIsoValida(mapped.fechaEntrega)
            ? mapped.fechaEntrega.trim()
            : "";
          const fechaOrigen = resolveFechaEntregaDesdeOrigen({
            origenCorreo: origenCorreoRows,
            hijas: hijasEdit,
          });
          setFechaEntrega(
            isFechaEntregaIsoValida(fechaDb)
              ? fechaDb
              : fechaOrigen || fechaMapped || "",
          );
          setCentroConsumo(mapped.centroConsumo);
          setObservaciones(mapped.observaciones);
          {
            const occMapped = resolveOrdenCompraLimpia(
              mapped.ordenCompraHotel,
              detalle.origen_texto ?? "",
            );
            // Si Mateo no propone y lo guardado era basura (rAutorizado), dejar vacío.
            if (occMapped) setOrdenCompraHotel(occMapped);
            else if (isGarbageOcValue(detalle.orden_compra_hotel)) {
              setOrdenCompraHotel("");
            }
          }
          setDireccion(mapped.direccion);
          setAnden(mapped.anden);
          setContacto(mapped.contacto);
          setTelefono(mapped.telefono);
          setCorreo(
            mapped.correo.trim() ||
              extractCorreoContactoDesdeTexto(detalle.origen_texto) ||
              "",
          );
          setVentanaDesde(mapped.ventanaDesde);
          setVentanaHasta(mapped.ventanaHasta);
          setAceptaSustituciones(mapped.aceptaSustituciones);
          setRequiereLote(mapped.requiereLote);
          setRegistrarTemperatura(mapped.registrarTemperatura);
          setAutoFields(mapped.autoFields);
          setWarnFields(mapped.warnFields);
          const nextMissing = new Set(mapped.missingFields);
          if (!autoComprador && !idCompradorForMap) {
            nextMissing.add("cliente");
          } else {
            nextMissing.delete("cliente");
          }
          if (!mapped.direccion.trim()) nextMissing.add("direccion");
          else nextMissing.delete("direccion");
          setMissingFields(nextMissing);
          setDiscrepancias(mapped.discrepancias);
          setLineas(
            mapped.lineas.map((linea) => ({
              idProducto: linea.idProducto,
              nombre: linea.nombre,
              codigo: linea.codigo,
              idBodega: linea.idBodega,
              cantidadInput: linea.cantidadInput,
              cajasInput: linea.cajasInput,
              presentacion: linea.presentacion,
              especificacion: linea.especificacion,
              descuentoPctInput: linea.descuentoPctInput,
              ivaPct: "0",
              kgDisponible: linea.kgDisponible,
              unidadMedida: linea.unidadMedida || UNIDAD_MEDIDA_VENTA_DEFAULT,
              precioUnitario: linea.precioUnitario,
              precioInput: formatPrecioInput(linea.precioUnitario),
              precioManual: linea.precioManual,
              aliasCliente: linea.aliasCliente,
              filledByIa: linea.filledByIa,
              otId: linea.otId,
              catalogPending: linea.catalogPending,
              catalogAmbiguo: linea.catalogAmbiguo,
              sugerencia: linea.sugerencia ?? null,
              sugerenciasAlternativas: linea.sugerenciasAlternativas ?? [],
            })),
          );
          setStartMode("docs");
          setFormOtPage(0);
          // Sin preview intermedio: formulario de la 1ª OT (Cypher se abre desde la lista).
          setStep("form");
        } else {
          const detalleLineas = detalle.lineas ?? [];
          const notasLineas = detalle.notas_lineas?.trim() || "";
          const lineasEditBase = detalleLineas.map((linea) => {
            const catalogo = productoRows.find(
              (row) => row.idProducto === linea.id_producto,
            );
            const skuFromOrigen = resolveSkuVisible({
              linea,
              origenRenglones: origenCorreoRows,
            });
            const skuRaw = linea.producto?.sku?.trim() || "";
            const skuUsable =
              skuRaw && !skuRaw.toUpperCase().startsWith("ARCH-")
                ? skuRaw
                : "";
            const codigo =
              catalogo?.codigo || skuUsable || skuFromOrigen || "";
            const nombreRaw =
              catalogo?.nombre || resolveOrdenVentaLineaTitulo(linea);
            const nombre = stripLeadingProductoCodigo(nombreRaw, codigo);
            const aliasCliente =
              resolveTextoProductoOrigen({
                linea,
                origenRenglones: origenCorreoRows,
              }) || undefined;
            return {
              idProducto: linea.id_producto,
              nombre,
              codigo,
              idBodega: catalogo?.idBodega || detalle.id_bodega,
              cantidadInput: formatDecimalInputEs(linea.cantidad_pedida),
              cajasInput:
                linea.cajas != null && linea.cajas > 0
                  ? formatDecimalInputEs(linea.cajas)
                  : "",
              presentacion: linea.presentacion?.trim() || "",
              especificacion: "",
              descuentoPctInput: "",
              ivaPct: "0",
              kgDisponible: catalogo?.kgDisponible ?? 0,
              unidadMedida:
                linea.unidad_medida?.trim() ||
                catalogo?.unidadMedida ||
                UNIDAD_MEDIDA_VENTA_DEFAULT,
              precioUnitario: linea.precio_unitario,
              precioInput: formatPrecioInput(linea.precio_unitario),
              precioManual: true as const,
              aliasCliente,
            };
          });
          const lineasConOt = assignOtIdsToFormLineas(
            lineasEditBase,
            hijasEdit,
            (raw) => parseDecimalEs(raw) ?? 0,
          );
          setLineas(
            lineasConOt.map((linea) => ({
              ...linea,
              especificacion: notaCapturaForLinea(notasLineas, {
                nombre: linea.nombre,
                cantidad: parseDecimalEs(linea.cantidadInput) ?? 0,
                otId: linea.otId,
                idProducto: linea.idProducto || null,
                allowUnscoped:
                  !linea.otId &&
                  lineasConOt.filter((l) => l.nombre === linea.nombre)
                    .length === 1,
              }),
            })),
          );

          if (hijasEdit.length > 0) {
            setStartMode("docs");
            setFormOtPage(0);
            // Selector de OT = Cypher; formulario siempre en la 1ª OT.
            setStep("form");
          }

          // Confirmada (u otro estado) sin comprador: mismo criterio visual que por_confirmar.
          if (!idCompradorDetalle && nombreEscritoOrigen) {
            const compradorRank = rankCompradoresFromNombre(
              nombreEscritoOrigen,
              compradorRows,
            );
            setCompradorSugerencias(
              compradorRank.candidates.map((c) => c.comprador).slice(0, 4),
            );
            setMissingFields((prev) => {
              const next = new Set(prev);
              next.add("cliente");
              return next;
            });
          }
        }

        if (idCompradorDetalle) {
          void getCompradorAdmin({
            codigoCuenta,
            idComprador: idCompradorDetalle,
          })
            .then((adminDetalle) => {
              if (selectedCompradorIdRef.current !== idCompradorDetalle) {
                return;
              }
              setFichaComprador(adminDetalle.ficha);
              const prefill = buildOrdenVentaPrefillFromComprador({
                ficha: adminDetalle.ficha,
                telefonoComprador: compradorRow?.telefono,
              });
              setExigeOc(prefill.exigeOc);
            })
            .catch(() => {
              if (selectedCompradorIdRef.current !== idCompradorDetalle) {
                return;
              }
              setFichaComprador(null);
              setExigeOc(false);
            });

          void Promise.all([
            listCompradorProductoAliasAdmin({
              codigoCuenta,
              idComprador: idCompradorDetalle,
            }),
            fetchUltimosPreciosPorComprador({
              codigoCuenta,
              idComprador: idCompradorDetalle,
            }).catch(() => ({}) as Record<string, number>),
          ])
            .then(([aliases, ultimos]) => {
              if (selectedCompradorIdRef.current !== idCompradorDetalle) {
                return;
              }
              const overrides: Record<string, number> = { ...ultimos };
              const equivalencias: Record<string, string> = {};
              for (const alias of aliases) {
                if (alias.precioOverride != null) {
                  overrides[alias.idProducto] = alias.precioOverride;
                }
                const nombreAlias = alias.alias?.trim();
                if (nombreAlias) {
                  equivalencias[alias.idProducto] = nombreAlias;
                }
              }
              setPrecioOverrideByProducto(overrides);
              setEquivalenciaByProducto(equivalencias);
            })
            .catch(() => {
              if (selectedCompradorIdRef.current !== idCompradorDetalle) {
                return;
              }
              setPrecioOverrideByProducto({});
              setEquivalenciaByProducto({});
            });
        }
      });

    bootstrapPromiseRef.current = bootstrap
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los datos del formulario.",
        );
      })
      .finally(() => {
        setFormDataReady(true);
        setIsLoading(false);
        setIsReadingIa(false);
      });
  }, [codigoCuenta, editingId, isEditing, open]);

  /** Espera catálogo/compradores/bodegas si aún no terminaron (pedido nuevo). */
  const ensureFormDataReady = useCallback(async () => {
    if (formDataReady) return true;
    setIsLoading(true);
    try {
      await bootstrapPromiseRef.current;
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [formDataReady]);

  const applyCompradorPrefill = useCallback(
    (
      row: CompradorListRow,
      ficha: CompradorAltaFicha,
      options?: {
        /**
         * REQ-069: al cambiar cliente (manual o con docs) no pisar centro,
         * ventana, entrega, etc. si el pedido/OT ya los tiene.
         */
        onlyEmpty?: boolean;
      },
    ) => {
      const prefill = buildOrdenVentaPrefillFromComprador({
        ficha,
        telefonoComprador: row.telefono,
      });
      const onlyEmpty = Boolean(options?.onlyEmpty);
      const take = (prev: string, next: string) =>
        onlyEmpty && prev.trim() ? prev : next;

      setFichaComprador(ficha);
      setExigeOc(prefill.exigeOc);
      setMoneda((prev) => take(prev, prefill.moneda));
      setCentroConsumo((prev) => take(prev, prefill.centroConsumo));
      setVentanaDesde((prev) => take(prev, prefill.ventanaDesde));
      setVentanaHasta((prev) => take(prev, prefill.ventanaHasta));
      setDireccion((prev) => take(prev, prefill.direccion));
      setAnden((prev) => take(prev, prefill.anden));
      setContacto((prev) => take(prev, prefill.contacto));
      setTelefono((prev) => take(prev, prefill.telefono));
      setCorreo((prev) => take(prev, prefill.correo));
      setAceptaSustituciones((prev) => take(prev, prefill.aceptaSustituciones));
      setRequiereLote((prev) => take(prev, prefill.requiereLote));
      setRegistrarTemperatura((prev) =>
        take(prev, prefill.registrarTemperatura),
      );
      setObservaciones((prev) => take(prev, prefill.observaciones));
    },
    [],
  );

  const applyDiscrepanciaFieldValue = useCallback(
    (fieldKey: string, value: string) => {
      const next = value.trim();
      switch (fieldKey) {
        case "fechaEntrega":
          setFechaEntrega(next);
          break;
        case "centroConsumo":
          setCentroConsumo(next);
          break;
        case "direccion":
          setDireccion(next);
          break;
        case "anden":
          setAnden(next);
          break;
        case "contacto":
          setContacto(next);
          break;
        case "telefono":
          setTelefono(next);
          break;
        case "correo":
          setCorreo(next);
          break;
        case "ventanaDesde":
          setVentanaDesde(next);
          break;
        case "ventanaHasta":
          setVentanaHasta(next);
          break;
        case "aceptaSustituciones":
          setAceptaSustituciones(next);
          break;
        case "requiereLote":
          setRequiereLote(next);
          break;
        case "registrarTemperatura":
          setRegistrarTemperatura(next);
          break;
        case "observaciones":
          setObservaciones(next);
          break;
        default:
          break;
      }
    },
    [],
  );

  /**
   * «Usar del catálogo» solo si Mateo no trajo el dato y el catálogo sí lo tiene.
   * Si Mateo ya llenó el pedido, no hace falta el botón (solo aviso informativo).
   * Excepción: fecha atrasada → «Usar hoy».
   */
  const canReemplazarDiscrepancia = useCallback((item: CampoDiscrepancia) => {
    if (item.fieldKey === "potencialDuplicado") return false;
    if (item.fieldKey === "fechaEntrega" && item.db === "Hoy o posterior") {
      return true;
    }
    const fichaVal = item.db?.trim() ?? "";
    if (!fichaVal || fichaVal === "—") return false;
    const pedidoVal = item.ia?.trim() ?? "";
    // Mateo ya escribió algo en el pedido → no ofrecer pisar con ficha.
    if (pedidoVal && pedidoVal !== "—") return false;
    return true;
  }, []);

  /** Aplica ficha (o hoy) al campo del formulario. */
  const handleReemplazarDiscrepancia = useCallback(
    (item: CampoDiscrepancia) => {
      if (!canReemplazarDiscrepancia(item)) return;

      const fichaValue =
        item.fieldKey === "fechaEntrega" && item.db === "Hoy o posterior"
          ? todayIsoDate()
          : item.db === "—"
            ? ""
            : item.db.trim();

      applyDiscrepanciaFieldValue(item.fieldKey, fichaValue);

      setDiscrepancias((prev) =>
        prev.filter((row) => row.fieldKey !== item.fieldKey),
      );
      setWarnFields((prev) => {
        if (!prev.has(item.fieldKey)) return prev;
        const next = new Set(prev);
        next.delete(item.fieldKey);
        return next;
      });
      setMissingFields((prev) => {
        if (!prev.has(item.fieldKey)) return prev;
        const next = new Set(prev);
        next.delete(item.fieldKey);
        return next;
      });
      setAutoFields((prev) => {
        const next = new Set(prev);
        next.add(item.fieldKey);
        return next;
      });
      // No cerrar el diálogo: el usuario ve el ítem desaparecer y decide
      // «Usar valores del pedido» o «Volver a editar». Cerrar al instante hacía parecer que no aplicaba.
    },
    [applyDiscrepanciaFieldValue, canReemplazarDiscrepancia],
  );

  const handleSelectComprador = useCallback(
    (
      row: CompradorListRow,
      options?: {
        /**
         * Compat: el prefill siempre es onlyEmpty (REQ-069 manual + docs).
         */
        preservePedidoData?: boolean;
        /** Conserva el nombre que Mateo leyó del pedido (caption bajo el campo). */
        keepNombreIa?: boolean;
        /**
         * Cambio hecho por el usuario (catálogo/sugerencias): avisar que revise
         * la dirección de entrega del correo/PDF.
         */
        verificarDireccionEntrega?: boolean;
      },
    ) => {
      const previousId = selectedCompradorIdRef.current;
      const fromDocumento =
        startMode === "docs" ||
        origenCorreoDraft.length > 0 ||
        Boolean(origenTexto.trim()) ||
        Boolean(direccion.trim());

      selectedCompradorIdRef.current = row.idComprador;
      setIdComprador(row.idComprador);
      setCompradorLabel(formatCompradorLabel(row));
      // REQ-117: no dejar OCC obligatorio del cliente anterior mientras carga la ficha.
      setExigeOc(false);
      if (!options?.keepNombreIa) {
        setCompradorNombreIa(null);
      }
      setCompradorSugerencias([]);
      setError(null);
      setMissingFields((prev) => {
        if (!prev.has("cliente")) return prev;
        const next = new Set(prev);
        next.delete("cliente");
        return next;
      });

      const clienteCambio =
        Boolean(previousId) && previousId !== row.idComprador;
      if (
        options?.verificarDireccionEntrega &&
        (clienteCambio || (fromDocumento && Boolean(direccion.trim())))
      ) {
        setAvisoVerificarDireccion(true);
        setWarnFields((prev) => {
          const next = new Set(prev);
          next.add("direccion");
          return next;
        });
      }

      // No vaciar entrega al cambiar cliente; onlyEmpty completa huecos.
      setTelefono((prev) => prev.trim() || row.telefono?.trim() || "");

      if (!codigoCuenta) return;

      void getCompradorAdmin({
        codigoCuenta,
        idComprador: row.idComprador,
      })
        .then((detalle) => {
          if (selectedCompradorIdRef.current !== row.idComprador) return;
          // REQ-069: manual y docs — no pisar centro/ventana/entrega ya puestos.
          applyCompradorPrefill(row, detalle.ficha, { onlyEmpty: true });
        })
        .catch(() => {
          if (selectedCompradorIdRef.current !== row.idComprador) return;
          setError(
            "Se seleccionó el cliente, pero no se pudieron cargar sus datos de alta.",
          );
        });

      void Promise.all([
        listCompradorProductoAliasAdmin({
          codigoCuenta,
          idComprador: row.idComprador,
        }),
        fetchUltimosPreciosPorComprador({
          codigoCuenta,
          idComprador: row.idComprador,
        }).catch(() => ({}) as Record<string, number>),
      ])
        .then(([aliases, ultimos]) => {
          if (selectedCompradorIdRef.current !== row.idComprador) return;
          // REQ-135: alias override gana; si no, último precio de ese cliente.
          const overrides: Record<string, number> = { ...ultimos };
          const equivalencias: Record<string, string> = {};
          for (const alias of aliases) {
            if (alias.precioOverride != null) {
              overrides[alias.idProducto] = alias.precioOverride;
            }
            const nombreAlias = alias.alias?.trim();
            if (nombreAlias) {
              equivalencias[alias.idProducto] = nombreAlias;
            }
          }
          setPrecioOverrideByProducto(overrides);
          setEquivalenciaByProducto(equivalencias);
        })
        .catch(() => {
          if (selectedCompradorIdRef.current !== row.idComprador) return;
          setPrecioOverrideByProducto({});
          setEquivalenciaByProducto({});
        });
    },
    [
      applyCompradorPrefill,
      codigoCuenta,
      direccion,
      origenCorreoDraft.length,
      origenTexto,
      startMode,
    ],
  );

  const handleSelectProducto = useCallback(
    (row: ProductoVentaOption) => {
      if (replaceLineaIndex != null) {
        const index = replaceLineaIndex;
        setLineas((prev) =>
          prev.map((linea, i) =>
            i === index ? applyProductoToLinea(linea, row) : linea,
          ),
        );
        setReplaceLineaIndex(null);
        setCantidadFocusId(row.idProducto);
        setError(null);
        setIdBodegaDestino((prev) => prev || row.idBodega);
        restoreFormScroll();
        return;
      }

      setCantidadFocusId(row.idProducto);
      const otId = hijaFormActiva?.id;
      setLineas((prev) => {
        return [
          ...prev,
          {
            idProducto: row.idProducto,
            nombre: stripLeadingProductoCodigo(row.nombre, row.codigo),
            codigo: row.codigo,
            idBodega: row.idBodega,
            cantidadInput: "",
            cajasInput: "",
            presentacion: "",
            especificacion: "",
            descuentoPctInput: "",
            ivaPct: "0",
            kgDisponible: row.kgDisponible,
            unidadMedida: row.unidadMedida || UNIDAD_MEDIDA_VENTA_DEFAULT,
            precioUnitario: row.precioUnitario,
            precioInput: formatPrecioInput(row.precioUnitario),
            otId,
            catalogPending: false,
            catalogAmbiguo: false,
            sugerencia: null,
            sugerenciasAlternativas: [],
          },
        ];
      });
      if (otId) {
        setOrdenesTrabajoPreview((prev) => {
          const base =
            prev.length > 0
              ? prev
              : groupOrigenCorreoToOrdenesTrabajo(origenCorreoDraft);
          const next = base.map((hija) => {
            if (hija.id !== otId) return hija;
            const sinPlaceholder = hija.renglones.filter(
              (renglon) =>
                (renglon.Producto ?? "").trim() ||
                (renglon["Codigo producto"] ?? "").trim(),
            );
            const renglon: OrigenCorreoRenglon = {
              _otId: hija.id,
              Almacen: hija.almacen,
              "Numero pedido": hija.numeroPedido,
              Fecha: hija.fecha,
              "Referencia pedido": hija.referenciaPedido,
              "Responsable externo": hija.responsableExterno,
              Producto: stripLeadingProductoCodigo(row.nombre, row.codigo),
              "Codigo producto": row.codigo,
              Cantidad: 0,
              Unidad: row.unidadMedida || UNIDAD_MEDIDA_VENTA_DEFAULT,
              Precio: row.precioUnitario,
            };
            const renglones = [...sinPlaceholder, renglon];
            return {
              ...hija,
              renglones,
              totalCantidad: renglones.reduce((sum, item) => {
                const qty =
                  typeof item.Cantidad === "number"
                    ? item.Cantidad
                    : Number(String(item.Cantidad ?? "").replace(",", ".")) ||
                      0;
                return sum + qty;
              }, 0),
            };
          });
          setOrigenCorreoDraft(flattenOrdenesTrabajoToOrigenCorreo(next));
          return next;
        });
      }
      setError(null);
      setIdBodegaDestino((prev) => prev || row.idBodega);
    },
    [
      hijaFormActiva?.id,
      origenCorreoDraft,
      replaceLineaIndex,
      restoreFormScroll,
    ],
  );

  const handleOpenReplaceProducto = useCallback(
    (index: number) => {
      captureFormScroll();
      setReplaceLineaIndex(index);
      setPicker("producto");
    },
    [captureFormScroll],
  );

  const handleOpenSugerenciasProducto = useCallback(
    (index: number) => {
      captureFormScroll();
      setReplaceLineaIndex(index);
      setPicker("sugerencias");
    },
    [captureFormScroll],
  );

  const handleAcceptSugerencia = useCallback(
    (index: number, sug?: LineaSugerenciaCatalogo | null) => {
      setLineas((prev) => {
        const linea = prev[index];
        const chosen = sug ?? linea?.sugerencia;
        if (!linea || !chosen) return prev;
        return prev.map((row, i) =>
          i === index
            ? applyProductoToLinea(row, sugerenciaToOption(chosen))
            : row,
        );
      });
      setError(null);
      setPicker(null);
      setReplaceLineaIndex(null);
      restoreFormScroll();
    },
    [restoreFormScroll],
  );

  useEffect(() => {
    if (!cantidadFocusId || picker !== null) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(
        `orden-venta-cantidad-${cantidadFocusId}`,
      );
      // preventScroll: si no, al validar producto el modal salta al primer ítem.
      el?.focus({ preventScroll: true });
      restoreFormScroll();
      setCantidadFocusId(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [cantidadFocusId, lineas, picker, restoreFormScroll]);

  const handleRemoveLinea = useCallback((index: number) => {
    setLineas((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  const clearFieldMarks = useCallback((field: string) => {
    setAutoFields((prev) => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
    setWarnFields((prev) => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
    setMissingFields((prev) => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
    // REQ-118: al editar el campo, quitar la discrepancia vieja (evita falsa alerta).
    setDiscrepancias((prev) => {
      if (!prev.some((row) => row.fieldKey === field)) return prev;
      return prev.filter((row) => row.fieldKey !== field);
    });
  }, []);

  const handleCantidadChange = useCallback((index: number, value: string) => {
    const nextValue = sanitizeDecimalInputEs(value);
    setLineas((prev) =>
      prev.map((linea, i) =>
        i === index
          ? { ...linea, cantidadInput: nextValue, filledByIa: false }
          : linea,
      ),
    );
  }, []);

  const handleCantidadBlur = useCallback((index: number, value: string) => {
    const parsed = parseDecimalEs(value);
    if (parsed == null || parsed <= 0) return;
    const formatted = formatDecimalInputEs(parsed);
    if (formatted === value) return;
    setLineas((prev) =>
      prev.map((linea, i) =>
        i === index ? { ...linea, cantidadInput: formatted } : linea,
      ),
    );
  }, []);

  const handleLineaFieldChange = useCallback(
    (
      index: number,
      field: "especificacion" | "descuentoPctInput" | "ivaPct",
      value: string,
    ) => {
      setLineas((prev) =>
        prev.map((linea, i) =>
          i === index
            ? { ...linea, [field]: value, filledByIa: false }
            : linea,
        ),
      );
    },
    [],
  );

  const handlePrecioChange = useCallback((index: number, value: string) => {
    const nextValue = sanitizePrecioInputMx(value);
    setLineas((prev) =>
      prev.map((linea, i) => {
        if (i !== index) return linea;
        const parsed = parseDecimalEs(nextValue);
        return {
          ...linea,
          precioInput: nextValue,
          precioUnitario: parsed != null && parsed > 0 ? parsed : 0,
          precioManual: true,
          filledByIa: false,
        };
      }),
    );
  }, []);

  const handlePrecioBlur = useCallback((index: number, value: string) => {
    const parsed = parseDecimalEs(value);
    if (parsed == null || parsed <= 0) return;
    const formatted = formatPrecioInputMx(parsed);
    if (formatted === value) return;
    setLineas((prev) =>
      prev.map((linea, i) =>
        i === index
          ? {
              ...linea,
              precioInput: formatted,
              precioUnitario: parsed,
            }
          : linea,
      ),
    );
  }, []);

  const openFormFromScratch = useCallback(() => {
    setStartMode("scratch");
    setError(null);
    void ensureFormDataReady().then((ok) => {
      if (ok) setStep("form");
    });
  }, [ensureFormDataReady]);

  const openFirstTimeFlow = useCallback(() => {
    setStartMode("first_time");
    setError(null);
    setIsCompradorCreateOpen(true);
    // Precarga en background mientras registran al comprador.
    void ensureFormDataReady();
  }, [ensureFormDataReady]);

  const handleCompradorCreatedForSale = useCallback(
    (created: CompradorListRow) => {
      setCompradores((prev) => {
        if (prev.some((row) => row.idComprador === created.idComprador)) {
          return prev;
        }
        return [...prev, created].sort((a, b) =>
          a.comprador.localeCompare(b.comprador, "es"),
        );
      });
      handleSelectComprador(created);
      setStartMode("scratch");
      setError(null);
      setIsCompradorCreateOpen(false);
      void ensureFormDataReady().then((ok) => {
        if (ok) setStep("form");
      });
    },
    [ensureFormDataReady, handleSelectComprador],
  );

  useEffect(() => {
    const eml = origenAdjuntos.find((item) => {
      const name = item.nombre.toLowerCase();
      const mime = (item.mime ?? "").toLowerCase();
      return (
        Boolean(item.path?.trim()) &&
        (name.endsWith(".eml") || mime.includes("message"))
      );
    });
    const emlPath = eml?.path?.trim() || "";
    if (!emlPath) {
      setEmlInnerAdjuntos([]);
      return;
    }

    let cancelled = false;
    void fetch(
      `/api/ov-adjuntos/eml-parts?path=${encodeURIComponent(emlPath)}`,
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("No se pudieron leer adjuntos del correo.");
        }
        const data = (await response.json()) as {
          parts?: Array<{
            index: number;
            nombre: string;
            mime: string;
            bytes: number;
          }>;
        };
        if (cancelled) return;
        setEmlInnerAdjuntos(
          origenAdjuntosFromEmlParts(emlPath, data.parts ?? []),
        );
      })
      .catch(() => {
        if (!cancelled) setEmlInnerAdjuntos([]);
      });

    return () => {
      cancelled = true;
    };
  }, [origenAdjuntos]);

  // Si OCC quedó vacía tras limpiar rAutorizado, recuperar REQUISICION # desde el .eml/PDFs.
  useEffect(() => {
    if (step !== "form" || !open) return;
    if (ordenCompraHotel.trim() && !isGarbageOcValue(ordenCompraHotel)) {
      return;
    }
    const paths = [
      ...new Set(
        origenAdjuntos
          .filter((item) => {
            if (!item.path?.trim()) return false;
            const name = item.nombre.toLowerCase();
            const mime = (item.mime ?? "").toLowerCase();
            return (
              name.endsWith(".eml") ||
              mime.includes("message") ||
              name.endsWith(".pdf")
            );
          })
          .map((item) => item.path!.trim()),
      ),
    ];
    if (paths.length === 0) return;

    let cancelled = false;
    void (async () => {
      const byAlmacen: Record<string, string> = {};
      const occs: string[] = [];
      for (const path of paths) {
        try {
          const response = await fetch(
            `/api/ov-adjuntos/resolve-occ?path=${encodeURIComponent(path)}`,
          );
          if (!response.ok) continue;
          const data = (await response.json()) as {
            occ?: string | null;
            byAlmacen?: Record<string, string>;
            occs?: string[];
          };
          if (cancelled) return;
          for (const [dep, req] of Object.entries(data.byAlmacen ?? {})) {
            if (dep && req && !isGarbageOcValue(req)) byAlmacen[dep] = req;
          }
          for (const v of data.occs ?? []) {
            if (v && !isGarbageOcValue(v)) occs.push(v);
          }
          const single = (data.occ ?? "").trim();
          if (single && !isGarbageOcValue(single)) occs.push(single);
        } catch {
          /* silencioso */
        }
      }
      if (cancelled) return;
      const uniqueOccs = [...new Set(occs)];
      const occ = uniqueOccs[0] ?? "";
      if (!occ) return;

      setOrdenCompraHotel((prev) =>
        prev.trim() && !isGarbageOcValue(prev) ? prev : occ,
      );

      if (Object.keys(byAlmacen).length === 0) {
        // Sin mapa por almacén: aplicar la misma OCC a hijas con basura/vacío.
        setOrdenesTrabajoPreview((prev) => {
          if (prev.length === 0) return prev;
          let changed = false;
          const next = prev.map((hija) => {
            const cur = hija.numeroPedido?.trim() || "";
            if (cur && !isGarbageOcValue(cur)) return hija;
            changed = true;
            return {
              ...hija,
              numeroPedido: occ,
              renglones: hija.renglones.map((row) => ({
                ...row,
                "Numero pedido": occ,
              })),
              label:
                occ && hija.almacen ? `${occ} — ${hija.almacen}` : hija.label,
            };
          });
          if (!changed) return prev;
          setOrigenCorreoDraft(flattenOrdenesTrabajoToOrigenCorreo(next));
          return next;
        });
        return;
      }

      setOrdenesTrabajoPreview((prev) => {
        if (prev.length === 0) return prev;
        let changed = false;
        const next = prev.map((hija) => {
          const alm = (hija.almacen || "").trim().toLowerCase();
          if (!alm) return hija;
          let matched = "";
          for (const [dep, req] of Object.entries(byAlmacen)) {
            const d = dep.trim().toLowerCase();
            if (!d || !req) continue;
            if (alm.includes(d) || d.includes(alm) || alm === d) {
              matched = req;
              break;
            }
            // Match por código corto (CBEEFB vs CBEEFE BEEF BAR).
            const code = alm.split(/\s+/)[0] ?? "";
            const depCode = d.split(/\s+/)[0] ?? "";
            if (
              code &&
              depCode &&
              (code.startsWith(depCode.slice(0, 5)) ||
                depCode.startsWith(code.slice(0, 5)))
            ) {
              matched = req;
              break;
            }
          }
          if (!matched) return hija;
          const cur = hija.numeroPedido?.trim() || "";
          if (cur === matched || (!isGarbageOcValue(cur) && cur)) {
            return hija;
          }
          changed = true;
          return {
            ...hija,
            numeroPedido: matched,
            renglones: hija.renglones.map((row) => ({
              ...row,
              "Numero pedido": matched,
            })),
            label:
              matched && hija.almacen
                ? `${matched} — ${hija.almacen}`
                : hija.label,
          };
        });
        if (!changed) return prev;
        setOrigenCorreoDraft(flattenOrdenesTrabajoToOrigenCorreo(next));
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [open, step, ordenCompraHotel, origenAdjuntos]);

  const origenArchivosNombres = useMemo(() => {
    const fromFiles = origenArchivoFiles.map((file) => file.name);
    const raw =
      fromFiles.length > 0
        ? fromFiles
        : nombresOrigenAdjuntos(
            mergeOrigenAdjuntosWithEmlParts(origenAdjuntos, emlInnerAdjuntos),
          );
    return [...new Set(raw.map((name) => name.trim()).filter(Boolean))];
  }, [origenArchivoFiles, origenAdjuntos, emlInnerAdjuntos]);

  const openFormFromDocs = useCallback(async () => {
    if (!codigoCuenta) {
      setError("No hay cuenta activa.");
      return;
    }
    if (!origenTexto.trim() && origenArchivoFiles.length === 0) {
      setError("Pega el texto del pedido o adjunta al menos un archivo.");
      return;
    }

    const ready = await ensureFormDataReady();
    if (!ready) return;

    setIsReadingIa(true);
    setError(null);

    try {
      const pedido = await leerPedidoConIaApi({
        codigoCuenta,
        cliente: compradorLabel || undefined,
        texto: origenTexto,
        archivos: origenArchivoFiles,
      });

      const compradorRank = rankCompradoresFromNombre(
        pedido.nombreCliente,
        compradores,
      );
      const autoComprador = shouldAutoAssignComprador(
        compradorRank,
        pedido.nombreCliente,
      );
      const nombreEscritoIa = pedido.nombreCliente?.trim() || null;
      // Siempre conserva lo que escribió/leyó del cliente (caption bajo el campo).
      if (nombreEscritoIa) {
        setCompradorNombreIa(nombreEscritoIa);
      }

      let fichaForMap = fichaComprador;
      let idCompradorForMap = idComprador;
      let telefonoForMap = telefono;

      // Solo auto-asigna con match exacto si el usuario aún no eligió uno.
      if (autoComprador && !idComprador) {
        handleSelectComprador(autoComprador, {
          keepNombreIa: Boolean(nombreEscritoIa),
          // Ficha solo rellena huecos vía map; no pisa Ship To del documento.
          preservePedidoData: true,
        });
        idCompradorForMap = autoComprador.idComprador;
        telefonoForMap = autoComprador.telefono?.trim() || telefono;
        try {
          const detalle = await getCompradorAdmin({
            codigoCuenta,
            idComprador: autoComprador.idComprador,
          });
          if (selectedCompradorIdRef.current === autoComprador.idComprador) {
            fichaForMap = detalle.ficha;
            setFichaComprador(detalle.ficha);
            const prefill = buildOrdenVentaPrefillFromComprador({
              ficha: detalle.ficha,
              telefonoComprador: autoComprador.telefono,
            });
            setExigeOc(prefill.exigeOc);
          }
        } catch {
          /* se mantiene el match; ficha puede quedar vacía */
        }
      } else if (!idComprador && nombreEscritoIa) {
        selectedCompradorIdRef.current = "";
        setIdComprador("");
        setCompradorLabel(nombreEscritoIa);
        setCompradorSugerencias(
          compradorRank.candidates.map((c) => c.comprador).slice(0, 4),
        );
        setFichaComprador(null);
        setExigeOc(false);
      } else if (!idComprador) {
        selectedCompradorIdRef.current = "";
        setIdComprador("");
        setCompradorLabel("");
        setCompradorNombreIa(null);
        setCompradorSugerencias([]);
        setFichaComprador(null);
        setExigeOc(false);
      }

      const fichaBase = fichaForMap
        ? buildOrdenVentaPrefillFromComprador({
            ficha: fichaForMap,
            telefonoComprador:
              compradores.find((row) => row.idComprador === idCompradorForMap)
                ?.telefono ?? telefonoForMap,
          })
        : {
            centroConsumo,
            ventanaDesde,
            ventanaHasta,
            direccion,
            anden,
            contacto,
            telefono: telefonoForMap,
            correo,
            aceptaSustituciones: "",
            requiereLote: "",
            registrarTemperatura: "",
            observaciones,
          };

      const mapped = mapPedidoExtraidoToForm({
        pedido,
        productos,
        ficha: {
          centroConsumo: fichaBase.centroConsumo,
          ventanaDesde: fichaBase.ventanaDesde,
          ventanaHasta: fichaBase.ventanaHasta,
          direccion: fichaBase.direccion,
          anden: fichaBase.anden,
          contacto: fichaBase.contacto,
          telefono: fichaBase.telefono,
          correo: fichaBase.correo,
          aceptaSustituciones: fichaBase.aceptaSustituciones,
          requiereLote: fichaBase.requiereLote,
          registrarTemperatura: fichaBase.registrarTemperatura,
          observaciones: fichaBase.observaciones,
        },
        tomorrowIso: tomorrowIsoDate(),
        todayIso: todayIsoDate(),
      });

      setFechaEntrega(mapped.fechaEntrega);
      setCentroConsumo(mapped.centroConsumo);
      setObservaciones(mapped.observaciones);
      {
        const occMapped = resolveOrdenCompraLimpia(
          mapped.ordenCompraHotel,
          origenTexto,
        );
        if (occMapped) setOrdenCompraHotel(occMapped);
        else if (isGarbageOcValue(ordenCompraHotel)) setOrdenCompraHotel("");
      }
      setDireccion(mapped.direccion);
      setAnden(mapped.anden);
      setContacto(mapped.contacto);
      setTelefono(mapped.telefono);
      setCorreo(
        mapped.correo.trim() ||
          extractCorreoContactoDesdeTexto(
            pedido.textoOrigen || origenTexto,
          ) ||
          "",
      );
      setVentanaDesde(mapped.ventanaDesde);
      setVentanaHasta(mapped.ventanaHasta);
      setAceptaSustituciones(mapped.aceptaSustituciones);
      setRequiereLote(mapped.requiereLote);
      setRegistrarTemperatura(mapped.registrarTemperatura);
      setAutoFields(mapped.autoFields);
      setWarnFields(mapped.warnFields);
      const nextMissing = new Set(mapped.missingFields);
      if (!autoComprador && !idCompradorForMap) {
        nextMissing.add("cliente");
      } else {
        nextMissing.delete("cliente");
      }
      if (!mapped.direccion.trim()) nextMissing.add("direccion");
      else nextMissing.delete("direccion");
      setMissingFields(nextMissing);
      setDiscrepancias(mapped.discrepancias);
      setLineas(
        mapped.lineas.map((linea) => ({
          idProducto: linea.idProducto,
          nombre: linea.nombre,
          codigo: linea.codigo,
          idBodega: linea.idBodega,
          cantidadInput: linea.cantidadInput,
          cajasInput: linea.cajasInput,
          presentacion: linea.presentacion,
          especificacion: linea.especificacion,
          descuentoPctInput: linea.descuentoPctInput,
          ivaPct: "0",
          kgDisponible: linea.kgDisponible,
          unidadMedida: linea.unidadMedida || UNIDAD_MEDIDA_VENTA_DEFAULT,
          precioUnitario: linea.precioUnitario,
          precioInput: formatPrecioInput(linea.precioUnitario),
          precioManual: linea.precioManual,
          aliasCliente: linea.aliasCliente,
          filledByIa: linea.filledByIa,
          otId: linea.otId,
          catalogPending: linea.catalogPending,
          catalogAmbiguo: linea.catalogAmbiguo,
          sugerencia: linea.sugerencia ?? null,
          sugerenciasAlternativas: linea.sugerenciasAlternativas ?? [],
        })),
      );

      const avisos: string[] = [];
      if (mapped.advertencia) avisos.push(mapped.advertencia);
      if (mapped.archivosNoLegibles.length > 0) {
        avisos.push(
          `No se pudieron leer: ${mapped.archivosNoLegibles.join(", ")}. Se guardan como respaldo.`,
        );
      }
      const pendingCatalog = mapped.lineas.filter(
        (linea) => linea.catalogPending,
      ).length;
      if (mapped.lineas.length === 0 && !mapped.advertencia) {
        avisos.push(
          "No se reconocieron productos del pedido. Revisa el mensaje y agrégalos a mano.",
        );
      } else if (pendingCatalog > 0) {
        avisos.push(
          pendingCatalog === 1
            ? "1 producto no identificado."
            : `${pendingCatalog} productos no identificados.`,
        );
      }
      if (!autoComprador && !idCompradorForMap) {
        const sugeridos = compradorRank.candidates.length;
        avisos.push(
          pedido.nombreCliente?.trim()
            ? sugeridos > 0
              ? `El cliente «${pedido.nombreCliente.trim()}» no coincide exacto: revisa la sugerencia o elige otro.`
              : `El cliente «${pedido.nombreCliente.trim()}» no está en clientes. Selecciónalo para continuar.`
            : "Selecciona el cliente para continuar.",
        );
      }

      setStartMode("docs");
      const origenRows = Array.isArray(pedido.origenCorreo)
        ? pedido.origenCorreo
        : [];
      setOrigenCorreoDraft(origenRows);
      setOrdenesTrabajoPreview(groupOrigenCorreoToOrdenesTrabajo(origenRows));
      setFormOtPage(0);
      // Persistir body del correo / mensaje para notas generales del PDF.
      if (pedido.textoOrigen?.trim()) {
        setOrigenTexto(pedido.textoOrigen.trim());
      } else if (origenTexto.trim()) {
        setOrigenTexto(
          isCuerpoMensajeFormato(origenTexto)
            ? origenTexto
            : cleanCorreoBodyForNotas(origenTexto),
        );
      }
      setStep(origenRows.length > 0 ? "preview" : "form");
      setError(avisos.length > 0 ? avisos.join(" ") : null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo leer el pedido. Intenta de nuevo.",
      );
    } finally {
      setIsReadingIa(false);
    }
  }, [
    anden,
    applyCompradorPrefill,
    centroConsumo,
    codigoCuenta,
    compradorLabel,
    compradores,
    contacto,
    correo,
    direccion,
    ensureFormDataReady,
    fichaComprador,
    handleSelectComprador,
    idComprador,
    observaciones,
    origenArchivoFiles,
    origenTexto,
    productos,
    telefono,
    ventanaDesde,
    ventanaHasta,
  ]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const intent = submitIntentRef.current;
      submitIntentRef.current = "emit";
      const isDraft = intent === "draft";
      setError(null);
      setSuccessMessage(null);

      if (!codigoCuenta || !hasProductos || step !== "form") {
        return;
      }

      const puedeGuardarSinCliente =
        isDraft && (isEditing || Boolean(pendingEmitId));

      if (!idComprador && !puedeGuardarSinCliente) {
        setError("Selecciona un cliente.");
        return;
      }

      if (
        !isDraft &&
        startMode === "docs" &&
        avisosCatalogoValidacion.length > 0 &&
        !skipDiscrepanciaConfirmRef.current
      ) {
        setConfirmDiscrepanciasOpen(true);
        return;
      }
      skipDiscrepanciaConfirmRef.current = false;

      if (!isDraft && exigeOc && !ordenCompraHotel.trim()) {
        setError(
          "Este cliente exige orden de compra para facturar. Captúrala en el pedido.",
        );
        return;
      }

      // Persistir cambios de la OT actual aunque no hayas recorrido las demás.
      // REQ-141: también con 1 OT (borrar notas debe llegar al origen).
      const hijasSynced = syncActiveOtFromForm();
      if (hijasSynced !== ordenesTrabajoForm) {
        applyOrdenesTrabajo(hijasSynced);
      }

      const lineasParaPersistir = isDraft
        ? lineas.filter((linea) => !linea.catalogPending && linea.idProducto)
        : lineas;

      if (
        !isDraft &&
        lineas.some((linea) => linea.catalogPending || !linea.idProducto)
      ) {
        setError(
          "Hay productos no identificados. Elige uno del catálogo o quita la línea.",
        );
        return;
      }

      // REQ-134: avance en OV existente puede ir sin líneas de catálogo (solo cabecera).
      const puedeAvanceSinLineas =
        isDraft && (isEditing || Boolean(pendingEmitId));

      if (lineasParaPersistir.length === 0 && !puedeAvanceSinLineas) {
        setError(
          isDraft
            ? "Identifica al menos un producto del catálogo para guardar el avance."
            : "Agrega al menos un producto a la venta.",
        );
        return;
      }

      let fechaEntregaPersist = isFechaEntregaIsoValida(fechaEntrega)
        ? fechaEntrega.trim()
        : parseFechaOrigen(fechaEntrega) ?? "";

      // REQ-110: si el campo se ve vacío pero el adjunto trae fecha, mostrarla (no confirmar a ciegas).
      if (!fechaEntregaPersist) {
        const desdeOrigen = resolveFechaEntregaDesdeOrigen({
          origenCorreo: origenCorreoDraft,
          hijas: ordenesTrabajoForm,
        });
        if (desdeOrigen) {
          fechaEntregaPersist = desdeOrigen;
          setFechaEntrega(desdeOrigen);
          setMissingFields((prev) => {
            const next = new Set(prev);
            next.delete("fechaEntrega");
            return next;
          });
          if (!isDraft) {
            setError(
              "Se tomó la fecha de entrega del pedido/adjuntos. Revísala y vuelve a confirmar.",
            );
            return;
          }
        }
      }

      if (!isDraft) {
        const cabeceraError = validatePedidoCabecera({
          fechaEntrega: fechaEntregaPersist,
          todayIso: todayIsoDate(),
          ventanaDesde,
          ventanaHasta,
        });
        if (cabeceraError) {
          setMissingFields((prev) => {
            const next = new Set(prev);
            for (const field of cabeceraError.fields) next.add(field);
            return next;
          });
          setError(cabeceraError.message);
          if (cabeceraError.fields.includes("fechaEntrega")) {
            const el = formScrollRef.current?.querySelector<HTMLElement>(
              '[data-ov-revision="fechaEntrega"]',
            );
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          return;
        }
      } else if (!fechaEntregaPersist.trim()) {
        fechaEntregaPersist = tomorrowIsoDate();
      }

      const bodegaDestinoLabel =
        bodegasDestino.find((row) => row.idBodega === idBodegaDestino)?.label ??
        "";

      const lineasParsed: OrdenVentaLineaInput[] = [];

      for (const linea of lineasParaPersistir) {
        const parsedQtyPrecio = resolveCantidadPrecioParaPersistir({
          isDraft,
          cantidadInput: linea.cantidadInput,
          precioInput: linea.precioInput,
          nombreProducto: linea.nombre,
        });
        if (!parsedQtyPrecio.ok) {
          setError(parsedQtyPrecio.error);
          return;
        }
        lineasParsed.push({
          idProducto: linea.idProducto,
          cantidadPedida: parsedQtyPrecio.cantidadPedida,
          idBodega: linea.idBodega,
          precioUnitario: parsedQtyPrecio.precioUnitario,
          cajas: (() => {
            const parsed = parseDecimalEs(linea.cajasInput);
            return parsed != null && parsed > 0 ? parsed : null;
          })(),
          presentacion: linea.presentacion.trim() || null,
          unidadMedida:
            linea.unidadMedida.trim() || UNIDAD_MEDIDA_VENTA_DEFAULT,
          matchProducto: buildMatchProductoLinea({
            textoCliente: linea.aliasCliente || linea.nombre,
            sugeridoMateo: linea.sugerencia
              ? {
                  idProducto: linea.sugerencia.idProducto,
                  nombre: linea.sugerencia.nombre,
                  codigo: linea.sugerencia.codigo,
                }
              : null,
            elegidoUsuario: {
              idProducto: linea.idProducto,
              nombre: linea.nombre,
              codigo: linea.codigo,
            },
          }),
        });
      }

      if (lineasParsed.length === 0 && !puedeAvanceSinLineas) {
        setError(
          isDraft
            ? "Identifica al menos un producto con cantidad y precio para guardar el avance."
            : "Agrega al menos un producto a la venta.",
        );
        return;
      }

      if (!isDraft && !skipSaveConfirmRef.current) {
        setConfirmSaveOpen(true);
        return;
      }
      skipSaveConfirmRef.current = false;

      setIsSaving(true);
      setMateoBusyMessage(undefined);

      const persistOrigenTexto =
        isEditing || startMode === "docs"
          ? isCuerpoMensajeFormato(origenTexto)
            ? origenTexto.trim()
            : cleanCorreoBodyForNotas(origenTexto)
          : "";

      let persistOrigenAdjuntos: OrigenAdjunto[] = origenAdjuntos;
      try {
        if (origenArchivoFiles.length > 0) {
          const uploaded = await uploadOvAdjuntosClient(
            origenArchivoFiles,
            codigoCuenta,
          );
          persistOrigenAdjuntos = uploaded;
          setOrigenAdjuntos(uploaded);
        } else if (isEditing) {
          persistOrigenAdjuntos = origenAdjuntos;
        } else if (startMode !== "docs") {
          persistOrigenAdjuntos = [];
        }
      } catch (uploadError) {
        setIsSaving(false);
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "No se pudieron subir los adjuntos.",
        );
        return;
      }

      const notasLineasText = buildNotasLineasText(
        lineas.map((linea) => ({
          nombre: linea.nombre,
          cantidad: parseDecimalEs(linea.cantidadInput) ?? 0,
          otId: linea.otId,
          idProducto: linea.idProducto || null,
          especificacion: linea.especificacion,
          descuentoPct: parseDecimalEs(linea.descuentoPctInput),
          ivaPct: linea.ivaPct,
        })),
      );

      const payload = {
        codigoCuenta,
        idBodega: lineasParsed[0]?.idBodega,
        idBodegaDestino,
        idComprador,
        lineas: lineasParsed,
        fechaEntrega: fechaEntregaPersist,
        ventanaDesde,
        ventanaHasta,
        prioridad,
        moneda,
        ordenCompraHotel,
        centroConsumo,
        vendedor: vendedorNombre,
        bodegaDestinoLabel,
        direccionEntrega: direccion,
        anden,
        contacto,
        telefono,
        correo,
        turno,
        horaSalida,
        chofer,
        unidad,
        aceptaSustituciones,
        requiereLote,
        registrarTemperatura,
        origenTexto: persistOrigenTexto,
        origenArchivos: persistOrigenAdjuntos,
        origenCorreo:
          hijasSynced.length > 0
            ? buildOrigenCorreoFromOrdenesYLineas({
                hijas: hijasSynced,
                lineas: lineas.map((linea) => ({
                  otId: linea.otId,
                  nombre: linea.nombre,
                  codigo: linea.codigo,
                  cantidad: parseDecimalEs(linea.cantidadInput) ?? 0,
                  unidadMedida:
                    linea.unidadMedida.trim() || UNIDAD_MEDIDA_VENTA_DEFAULT,
                  precioUnitario: parseDecimalEs(linea.precioInput) ?? 0,
                  aliasCliente: linea.aliasCliente,
                })),
              })
            : origenCorreoDraft,
        notasLineas: notasLineasText,
        notasAlmacen: sanitizeNotasGeneralesPedido(observaciones),
        observaciones: buildOrdenVentaCapturaObservaciones({
          fechaEntrega: fechaEntregaPersist,
          ventanaDesde,
          ventanaHasta,
          prioridad,
          moneda,
          bodegaDestino: bodegaDestinoLabel,
          ordenCompraHotel,
          centroConsumo,
          vendedor: vendedorNombre,
          observaciones,
          direccion,
          anden,
          contacto,
          telefono,
          correo,
          turno,
          horaSalida,
          chofer,
          unidad,
          aceptaSustituciones,
          requiereLote,
          registrarTemperatura,
          origenTexto: persistOrigenTexto,
          origenArchivos: nombresOrigenAdjuntos(persistOrigenAdjuntos),
          notasLineas: notasLineasText,
        }),
        idCreador: idCreador || null,
        guardarAvance: isDraft,
      };

      let idOrdenVenta = isEditing ? editingId : pendingEmitId;
      // Solo el botón principal (no el icono de avance) puede pasar a Confirmada.
      const shouldEmit =
        !isDraft && (!isEditing || editingEstado === "por_confirmar");
      let listRowForPrint: OrdenVentaOperadorRow | null = null;

      try {
        const autorLog =
          session?.nombre?.trim() ||
          payload.vendedor?.trim() ||
          "usuario";
        const otIds = ordenesTrabajoForm.map((ot) => ot.id);
        const otCount = otIds.length;

        if (isEditing && editingId) {
          listRowForPrint = await updateOrdenVenta({
            ...payload,
            idOrdenVenta: editingId,
          });
          idOrdenVenta = editingId;
          if (editingEstado === "por_confirmar") {
            setPendingEmitId(editingId);
          }
          void postOrdenVentaLogForOts({
            idOrdenVenta: editingId,
            codigoCuenta,
            accion: "actualizacion",
            mensaje: isDraft
              ? `Avance del pedido guardado por ${autorLog}.`
              : `Orden de trabajo editada por ${autorLog}.`,
            idUsuario: idCreador || null,
            autorNombre: session?.nombre ?? null,
            idBodega: payload.idBodega ?? null,
            idOrdenesTrabajo: otIds,
          });
        } else if (pendingEmitId) {
          listRowForPrint = await updateOrdenVenta({
            ...payload,
            idOrdenVenta: pendingEmitId,
          });
          idOrdenVenta = pendingEmitId;
          setEditingEstado("por_confirmar");
          void postOrdenVentaLogForOts({
            idOrdenVenta: pendingEmitId,
            codigoCuenta,
            accion: "actualizacion",
            mensaje: isDraft
              ? `Avance del pedido guardado por ${autorLog}.`
              : `Orden de trabajo editada por ${autorLog}.`,
            idUsuario: idCreador || null,
            autorNombre: session?.nombre ?? null,
            idBodega: payload.idBodega ?? null,
            idOrdenesTrabajo: otIds,
          });
        } else if (!idOrdenVenta) {
          listRowForPrint = await createOrdenVenta(payload);
          idOrdenVenta = listRowForPrint.idOrdenVenta;
          setPendingEmitId(idOrdenVenta);
          setEditingEstado("por_confirmar");
          void postOrdenVentaLogForOts({
            idOrdenVenta,
            codigoCuenta,
            accion: "creacion",
            mensaje: isDraft
              ? `Avance del pedido guardado por ${autorLog}.`
              : otCount > 1
                ? `Esta orden de trabajo fue creada por ${autorLog} (${otCount} órdenes de trabajo).`
                : `Esta orden de trabajo fue creada por ${autorLog}.`,
            idUsuario: idCreador || null,
            autorNombre: session?.nombre || payload.vendedor || null,
            idBodega: payload.idBodega ?? null,
            idOrdenesTrabajo: otIds,
            payloadExtra: otCount > 0 ? { ordenesTrabajo: otCount } : undefined,
          });
        }

        if (reagruparAplicada && idOrdenVenta) {
          const detalle = describirReagrupacionParaBitacora({
            autor: autorLog,
            instruccion: reagruparAplicada.instruccion,
            resumen: reagruparAplicada.resumen,
            movimientos: reagruparAplicada.movimientos,
            otNuevas: reagruparAplicada.otNuevas,
          });
          // Evento a nivel de OV (sin OT): se ve al filtrar por cualquier OT.
          void postOrdenVentaLog({
            idOrdenVenta,
            codigoCuenta,
            accion: "actualizacion",
            mensaje: detalle.mensaje,
            idUsuario: idCreador || null,
            autorNombre: session?.nombre ?? null,
            idBodega: payload.idBodega ?? null,
            idOrdenTrabajo: null,
            payloadExtra: detalle.payloadExtra,
          });
          setReagruparAplicada(null);
        }

        if (shouldEmit && !isDraft) {
          if (!idOrdenVenta) {
            throw new DomainServiceError(
              "La orden de venta no es válida.",
              "INVALID_ARGUMENT",
            );
          }

          let codigoEmitida = "";
          try {
            listRowForPrint = await emitirOrdenVentaApi(idOrdenVenta);
            codigoEmitida = listRowForPrint.venta?.trim() || "";
            // Bitácora de emisión: la escribe el API (por OT) al confirmar.
          } catch (emitErr: unknown) {
            // Si el pedido ya salió a bodega en un intento previo, no bloquear.
            const emitMessage =
              emitErr instanceof DomainServiceError ? emitErr.message : "";
            const maybeAlreadyEmitted =
              emitMessage.includes("por confirmar") ||
              emitMessage.includes("por_confirmar") ||
              emitMessage.includes("estado");

            if (!maybeAlreadyEmitted || !codigoCuenta) {
              throw emitErr;
            }

            const detalleEmit = await getOrdenVentaDetalle({
              codigoCuenta,
              idOrdenVenta,
            });
            if (detalleEmit.estado === "por_confirmar") {
              throw emitErr;
            }
            codigoEmitida =
              detalleEmit.codigo?.trim() || codigoEmitida;
          }

          onEmitSuccess?.({
            idOrdenVenta,
            codigo:
              listRowForPrint?.venta?.trim() ||
              codigoEmitida ||
              "OV",
          });

          // Autoimpresión: flag por API (service role); feedback visible al fallar.
          if (codigoCuenta) {
            let shouldAutoPrint = false;
            try {
              shouldAutoPrint = await fetchAutoImprimirFlag(codigoCuenta);
            } catch (flagErr) {
              console.error(
                "[ov] no se pudo leer autoimprimir:",
                flagErr instanceof Error ? flagErr.message : flagErr,
              );
              onAutoPrintResult?.({
                status: "error",
                message:
                  flagErr instanceof Error
                    ? flagErr.message
                    : "No se pudo leer la configuración de autoimpresión.",
              });
            }
            if (shouldAutoPrint) {
              setMateoBusyMessage("Imprimiendo…");
              const autoPrintResult = await autoPrintOrdenVentaTrasEmitir({
                codigoCuenta,
                idOrdenVenta: idOrdenVenta!,
                listRowFallback: listRowForPrint,
                autorNombre: session?.nombre ?? autorLog,
                idUsuario: idCreador || null,
                autoImprimirKnown: true,
              });
              if (autoPrintResult.status !== "skipped") {
                onAutoPrintResult?.(autoPrintResult);
              }
            }
          }
        }

        if (isDraft) {
          if (!fechaEntrega.trim() && fechaEntregaPersist) {
            setFechaEntrega(fechaEntregaPersist);
          }
          showToast({
            title: "Avance guardado",
            content:
              "El pedido sigue Por confirmar. Puedes seguir editándolo cuando quieras.",
            variant: "success",
            durationMs: 4500,
          });
          onCreated();
          onClose();
        } else {
          setPendingEmitId(null);
          onCreated();
          onClose();
        }
      } catch (err: unknown) {
        const message =
          err instanceof DomainServiceError
            ? err.message
            : isDraft
              ? "No se pudo guardar el avance."
              : isEditing && editingEstado !== "por_confirmar"
                ? "No se pudieron guardar los cambios."
                : idOrdenVenta
                  ? "No se pudo enviar el pedido a la bodega destino."
                  : "No se pudo crear la orden de venta.";
        setError(message);
      } finally {
        setIsSaving(false);
        setMateoBusyMessage(undefined);
      }
    },
    [
      anden,
      applyOrdenesTrabajo,
      bodegasDestino,
      centroConsumo,
      chofer,
      codigoCuenta,
      contacto,
      correo,
      direccion,
      avisosCatalogoValidacion,
      editingEstado,
      editingId,
      exigeOc,
      fechaEntrega,
      hasProductos,
      hijaFormActiva,
      horaSalida,
      idBodegaDestino,
      idComprador,
      idCreador,
      isEditing,
      lineas,
      moneda,
      observaciones,
      onAutoPrintResult,
      onClose,
      onCreated,
      onEmitSuccess,
      reagruparAplicada,
      showToast,
      ordenCompraHotel,
      origenAdjuntos,
      origenArchivoFiles,
      origenCorreoDraft,
      ordenesTrabajoForm,
      origenTexto,
      paginarPorOt,
      pendingEmitId,
      prioridad,
      session,
      startMode,
      step,
      syncActiveOtFromForm,
      telefono,
      turno,
      unidad,
      aceptaSustituciones,
      requiereLote,
      registrarTemperatura,
      vendedorNombre,
      ventanaDesde,
      ventanaHasta,
    ],
  );

  const emptyCatalogMessage = CATALOGO_VENTA_EMPTY_MESSAGE;

  const formDescription =
    startMode === "docs"
      ? "Desde mensaje o archivos · revisa y completa el pedido"
      : "Captura manual";

  const docsHasContent = Boolean(
    origenTexto.trim() || origenArchivoFiles.length > 0,
  );
  const docsReady =
    docsHasContent && productos.length > 0 && !isReadingIa;

  const hasCaptureProgress = useMemo(() => {
    if (step === "form" || step === "preview" || step === "pickOt") {
      return true;
    }
    if (startMode === "docs") {
      return Boolean(
        origenTexto.trim() ||
          origenArchivoFiles.length > 0 ||
          origenAdjuntos.length > 0,
      );
    }
    return false;
  }, [
    step,
    startMode,
    origenTexto,
    origenArchivoFiles.length,
    origenAdjuntos.length,
  ]);

  /**
   * ESC / salir: primero retrocede un paso del wizard; si ya no hay paso
   * anterior y hay progreso, pide confirmación antes de volver a Ventas.
   */
  const requestClose = useCallback(() => {
    if (
      picker != null ||
      isCompradorCreateOpen ||
      confirmDiscrepanciasOpen ||
      confirmSaveOpen ||
      confirmDiscardOpen
    ) {
      return;
    }

    // En edición: el picker de OT está en Cypher; ESC pide salir (no vuelve a pickOt).
    if (isEditing) {
      if (hasCaptureProgress) {
        setConfirmDiscardOpen(true);
        return;
      }
      onClose();
      return;
    }

    // Alta nueva desde mensaje/archivos: retroceso por pasos del wizard.
    if (step === "form") {
      if (startMode === "docs" && previewHijas.length > 0) {
        setStep("preview");
        setError(null);
        return;
      }
    } else if (step === "preview") {
      setStep("start");
      setStartMode("docs");
      setError(null);
      return;
    } else if (step === "start" && startMode === "docs" && !docsHasContent) {
      setStartMode(null);
      setError(null);
      return;
    }

    if (hasCaptureProgress) {
      setConfirmDiscardOpen(true);
      return;
    }

    onClose();
  }, [
    picker,
    isCompradorCreateOpen,
    confirmDiscrepanciasOpen,
    confirmSaveOpen,
    confirmDiscardOpen,
    step,
    startMode,
    previewHijas.length,
    isEditing,
    ordenesTrabajoForm.length,
    docsHasContent,
    hasCaptureProgress,
    onClose,
  ]);

  const appendDocsFiles = useCallback((files: FileList | File[]) => {
    const next = Array.from(files).slice(0, 8);
    if (next.length === 0) return;
    setOrigenArchivoFiles((prev) => {
      const merged = [...prev];
      for (const file of next) {
        if (merged.length >= 8) break;
        if (
          merged.some(
            (existing) =>
              existing.name === file.name && existing.size === file.size,
          )
        ) {
          continue;
        }
        merged.push(file);
      }
      return merged;
    });
  }, []);

  const showMateoLoading = open && (isReadingIa || isSaving);

  return (
    <>
      {showMateoLoading ? (
        <MateoIaLoadingScreen message={mateoBusyMessage} />
      ) : null}

      <PolariaFormModal
        open={open && !showMateoLoading}
        onClose={requestClose}
        scrollRegionRef={formScrollRef}
        title={
          isEditing && step === "pickOt"
            ? "Órdenes de trabajo"
            : isEditing
              ? folioVisible
                ? `Editar · ${folioVisible}`
                : "Editar pedido"
              : step === "form"
                ? folioVisible
                  ? `Pedido · ${folioVisible}`
                  : "Pedido"
                : step === "preview"
                  ? "Órdenes de trabajo detectadas"
                  : "Nuevo pedido"
        }
        description={
          isEditing && step === "pickOt"
            ? "Elige qué orden de trabajo quieres editar"
            : isEditing
              ? folioVisible
                ? `Folio ${folioVisible} — actualiza los datos del pedido`
                : "Actualiza los datos del pedido"
              : step === "form"
                ? formDescription
                : step === "preview"
                  ? "Previsualización antes de confirmar el formulario"
                  : startMode === "docs"
                    ? "Mateo lee el mensaje o los archivos del pedido"
                    : "¿Cómo quieres empezar?"
        }
        onSubmit={(event) => {
          submitIntentRef.current = "emit";
          void handleSubmit(event);
        }}
        error={error}
        isSubmitting={isSaving}
        submitDisabled={
          step === "preview" ||
          step === "pickOt" ||
          isLoading ||
          isSaving ||
          !hasProductos ||
          lineas.length === 0 ||
          hasCatalogPending
        }
        submitLabel={
          isEditing &&
          editingEstado !== "por_confirmar" &&
          !pendingEmitId
            ? "Actualizar"
            : "Confirmar"
        }
        compact
        size={step === "start" ? "lg" : "2xl"}
        layout={cypherOpen && isEditing ? "dock-left" : "center"}
        closeOnBackdrop={false}
        hideHeaderClose
        headerCenter={
          step === "form" && paginarPorOt && hijaFormActiva ? (
            <div className="min-w-0 max-w-full text-center">
              <p className="truncate polaria-text-body-sm font-semibold text-polaria-w">
                <span className="text-polaria-teal">
                  OT {formOtSafePage + 1}/{ordenesTrabajoForm.length}
                </span>
                <span className="mx-1.5 text-polaria-w-20">·</span>
                {hijaFormActiva.almacen?.trim() || hijaFormActiva.label}
              </p>
              <p className="truncate polaria-text-caption text-polaria-w-50">
                {hijaFormActiva.numeroPedido?.trim()
                  ? `OC ${hijaFormActiva.numeroPedido.trim()} · `
                  : null}
                Total OV ${formatPrecioEs(totalOvCompleta)}
              </p>
            </div>
          ) : undefined
        }
        headerTrailing={
          step === "form" ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                title="Guardar avance (sigue Por confirmar; no confirma el pedido)"
                aria-label="Guardar avance"
                disabled={
                  isSaving ||
                  isLoading ||
                  // Alta nueva: hace falta cliente o al menos un producto de catálogo.
                  // OV existente: siempre se puede guardar avance (REQ-134).
                  (!(isEditing || pendingEmitId) &&
                    !idComprador &&
                    !lineas.some(
                      (linea) =>
                        !linea.catalogPending && Boolean(linea.idProducto),
                    ))
                }
                onClick={() => {
                  submitIntentRef.current = "draft";
                  void handleSubmit({
                    preventDefault() {},
                  } as FormEvent<HTMLFormElement>);
                }}
                className={cn(
                  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition",
                  "border-polaria-t-20 bg-transparent text-polaria-teal hover:bg-polaria-t-08",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
                )}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Save className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                )}
              </button>
              {!cypherOpen && isEditing && onToggleCypher ? (
                <button
                  type="button"
                  title="Ver detalle Cypher"
                  aria-label="Abrir detalle Cypher"
                  onClick={() => onToggleCypher()}
                  className={cn(
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition",
                    "border-polaria-t-20 bg-transparent text-polaria-teal hover:bg-polaria-t-08",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
                  )}
                >
                  <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                </button>
              ) : null}
            </div>
          ) : !cypherOpen && isEditing && onToggleCypher ? (
            <button
              type="button"
              title="Ver detalle Cypher"
              aria-label="Abrir detalle Cypher"
              onClick={() => onToggleCypher()}
              className={cn(
                "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition",
                "border-polaria-t-20 bg-transparent text-polaria-teal hover:bg-polaria-t-08",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
              )}
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </button>
          ) : undefined
        }
        asForm={step === "form"}
        footerLeading={
          step === "pickOt" ? (
            <></>
          ) : step === "preview" && previewHijas.length > 1 ? (
            <OrdenTrabajoPager
              page={formOtSafePagePreview}
              total={previewHijas.length}
              onPrev={() => setFormOtPage((p) => Math.max(0, p - 1))}
              onNext={() =>
                setFormOtPage((p) =>
                  Math.min(Math.max(previewHijas.length - 1, 0), p + 1),
                )
              }
            />
          ) : step === "form" && paginarPorOt ? (
            <OrdenTrabajoPager
              page={formOtSafePage}
              total={ordenesTrabajoForm.length}
              label="Pedido OT"
              nextDisabled={otPagerNextBlocked}
              nextDisabledHint="Completa los campos obligatorios (*) para continuar"
              onPrev={() => goToOtPage(Math.max(0, formOtSafePage - 1))}
              onNext={() =>
                goToOtPage(
                  Math.min(ordenesTrabajoForm.length - 1, formOtSafePage + 1),
                )
              }
            />
          ) : undefined
        }
        footerCenter={
          reagruparAplicada || (step === "form" && revisionPendiente) ? (
            <div className="flex min-w-0 flex-wrap items-center justify-center gap-2">
              {reagruparAplicada ? (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-polaria-t-20 bg-polaria-t-08 px-2.5 py-1.5">
                  <span className="polaria-text-caption text-polaria-w">
                    {`Reorganizado con IA (${reagruparAplicada.resumen.antes} → ${reagruparAplicada.resumen.despues} OT). Guarda para conservarlo.`}
                  </span>
                  <button
                    type="button"
                    onClick={handleDeshacerReagrupacion}
                    title="Restaura las órdenes de trabajo como estaban antes (se pierden los cambios hechos después)"
                    className={cn(
                      "rounded-md border border-polaria-t-20 px-2 py-0.5",
                      "polaria-text-caption font-semibold text-polaria-teal transition hover:bg-polaria-t-08",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
                    )}
                  >
                    Deshacer
                  </button>
                </div>
              ) : null}
              {step === "form" && revisionPendiente ? (
                <button
                  type="button"
                  onClick={() => {
                    revisionFocusRequestRef.current = revisionPendiente;
                    if (
                      revisionPendiente.otIndex != null &&
                      paginarPorOt &&
                      ordenesTrabajoForm.length > 1 &&
                      formOtSafePage !== revisionPendiente.otIndex
                    ) {
                      goToOtPage(revisionPendiente.otIndex);
                      return;
                    }
                    focusRevisionPendiente(revisionPendiente);
                    revisionFocusRequestRef.current = null;
                  }}
                  className={cn(
                    "max-w-full cursor-pointer rounded-lg border border-polaria-warning-border bg-polaria-warning-bg px-2.5 py-1.5 text-left",
                    "polaria-text-caption font-medium text-polaria-warning hover:opacity-90",
                  )}
                  title="Ir al campo pendiente"
                >
                  <span className="line-clamp-2 break-words">
                    {revisionPendiente.message}
                  </span>
                </button>
              ) : null}
            </div>
          ) : undefined
        }
        footerAction={
          step === "pickOt" ? (
            <></>
          ) : step === "preview" ? (
            <button
              type="button"
              onClick={() => {
                setFormOtPage(0);
                setStep("form");
                setError(null);
              }}
              className={cn(
                "rounded-xl bg-polaria-teal px-5 py-2.5",
                "polaria-text-body-sm font-semibold text-polaria-on-teal transition hover:opacity-90",
              )}
            >
              Continuar al formulario
            </button>
          ) : step === "start" && startMode === "docs" ? (
            <button
              type="button"
              onClick={() => {
                void openFormFromDocs();
              }}
              disabled={!docsReady || isReadingIa}
              className={cn(
                "inline-flex min-w-[7rem] items-center justify-center gap-2 rounded-xl bg-polaria-teal px-5 py-2.5",
                "polaria-text-body-sm font-semibold text-polaria-on-teal transition hover:opacity-90",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {isReadingIa ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              Continuar
            </button>
          ) : step === "start" ? (
            <></>
          ) : step === "form" ? (
            <button
              type="submit"
              disabled={
                isLoading ||
                isSaving ||
                !hasProductos ||
                lineas.length === 0 ||
                hasCatalogPending ||
                !idComprador
              }
              className={cn(
                "inline-flex min-w-[7rem] items-center justify-center gap-2 rounded-xl bg-polaria-teal px-4 py-2.5",
                "polaria-text-body-sm font-semibold text-polaria-on-teal transition hover:opacity-90",
                "disabled:cursor-not-allowed disabled:opacity-60",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
              )}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {isEditing &&
              editingEstado !== "por_confirmar" &&
              !pendingEmitId
                ? "Actualizar"
                : "Confirmar"}
            </button>
          ) : undefined
        }
        closeOnEscape={
          picker === null &&
          !isCompradorCreateOpen &&
          !confirmDiscrepanciasOpen &&
          !confirmSaveOpen &&
          !confirmDiscardOpen &&
          !addOtOpen &&
          !confirmRemoveOtId
        }
        submitOnEnter={false}
      >
        {isLoading &&
        (isEditing || step !== "start" || startMode === "scratch") ? (
          <PolariaStatusLoading embedded className="py-4" />
        ) : null}

        {step === "start" &&
        startMode !== "docs" &&
        !(startMode === "scratch" && isLoading) ? (
          <div className="flex flex-row flex-wrap justify-center gap-3">
            <button
              type="button"
              aria-pressed={startMode === "first_time"}
              onClick={openFirstTimeFlow}
              className={cn(
                "relative flex size-[11rem] shrink-0 flex-col items-center justify-center rounded-2xl border px-4 py-4 text-center transition",
                "border-polaria-t-20 bg-polaria-t-08 hover:border-polaria-teal",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
              )}
            >
              <p className="polaria-text-card-title text-base text-polaria-w">
                Registrar comprador
              </p>
            </button>

            <button
              type="button"
              aria-pressed={startMode === "scratch"}
              onClick={openFormFromScratch}
              className={cn(
                "relative flex size-[11rem] shrink-0 flex-col items-center justify-center rounded-2xl border px-4 py-4 text-center transition",
                "border-polaria-t-20 bg-polaria-t-08 hover:border-polaria-teal",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
              )}
            >
              <p className="polaria-text-card-title text-base text-polaria-w">
                Venta nueva
              </p>
            </button>

            <button
              type="button"
              aria-pressed={false}
              onClick={() => {
                setStartMode("docs");
                setError(null);
              }}
              className={cn(
                "relative flex size-[11rem] shrink-0 flex-col items-center justify-center rounded-2xl border px-4 py-4 text-center transition",
                "border-polaria-t-20 bg-polaria-t-08 hover:border-polaria-teal",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
              )}
            >
              <p className="polaria-text-card-title text-base text-polaria-w">
                Tengo el mensaje o archivos
              </p>
            </button>
          </div>
        ) : null}

        {step === "start" && startMode === "docs" ? (
          <div className="flex flex-col gap-4">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setStartMode(null);
                  setError(null);
                }}
                className="self-start polaria-text-caption text-polaria-w-50 transition hover:text-polaria-teal"
              >
                ← Volver al inicio
              </button>
            ) : null}

            <section className="overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-t-08">
              <div className="flex items-center gap-2 border-b border-polaria-w-08 px-4 py-2.5">
                <UserRound
                  className="h-4 w-4 shrink-0 text-polaria-teal"
                  aria-hidden
                />
                <h3 className="polaria-text-label uppercase tracking-wide text-polaria-teal">
                  Cliente
                </h3>
                <span className="rounded-md border border-polaria-t-20 bg-polaria-bg/40 px-1.5 py-0.5 polaria-text-caption text-polaria-w-50">
                  opcional
                </span>
              </div>
              <div className="space-y-2 p-4">
                <JefeBodegaModalSearchField
                  id="orden-venta-docs-cliente"
                  value={compradorLabel}
                  placeholder="Selecciona el cliente (opcional)"
                  ariaLabel="Cliente"
                  compact
                  controlClassName={fieldControlClass({
                    field: "cliente",
                    missingFields,
                  })}
                  onSearchClick={() => setPicker("comprador")}
                />
                <p className="polaria-text-caption text-polaria-w-50">
                  Si el archivo trae el comprador y está en catálogo, Mateo lo
                  asigna solo. Si no, lo eliges después.
                </p>
                {!idComprador &&
                (Boolean(compradorNombreIa) ||
                  compradorSugerencias.length > 0) ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <NoIdentificadoBadge />
                    <button
                      type="button"
                      onClick={() => setPicker("comprador")}
                      className="rounded-lg border border-polaria-teal px-2 py-1 polaria-text-caption font-semibold text-polaria-teal transition hover:bg-polaria-t-08"
                    >
                      Elegir cliente
                    </button>
                  </div>
                ) : null}
              </div>
            </section>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <section className="flex min-h-[16rem] flex-col overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-t-08">
                <div className="flex items-center justify-between gap-2 border-b border-polaria-w-08 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <FileText
                      className="h-4 w-4 shrink-0 text-polaria-teal"
                      aria-hidden
                    />
                    <h3 className="polaria-text-label uppercase tracking-wide text-polaria-teal">
                      Mensaje
                    </h3>
                  </div>
                  {origenTexto.trim() ? (
                    <span className="rounded-md border border-polaria-t-20 bg-polaria-bg/50 px-1.5 py-0.5 polaria-text-caption font-semibold text-polaria-teal">
                      listo
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <textarea
                    id="orden-venta-docs-texto"
                    value={origenTexto}
                    onChange={(event) => setOrigenTexto(event.target.value)}
                    placeholder="Pega aquí el WhatsApp, correo o nota tal cual llegó. No lo resumas."
                    className={cn(
                      POLARIA_FORM_INPUT_CLASS_COMPACT,
                      "min-h-[10rem] flex-1 resize-y",
                    )}
                  />
                  <p className="polaria-text-caption text-polaria-w-50">
                    Texto crudo del cliente o del hotel.
                  </p>
                </div>
              </section>

              <section className="flex min-h-[16rem] flex-col overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-t-08">
                <div className="flex items-center justify-between gap-2 border-b border-polaria-w-08 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Paperclip
                      className="h-4 w-4 shrink-0 text-polaria-teal"
                      aria-hidden
                    />
                    <h3 className="polaria-text-label uppercase tracking-wide text-polaria-teal">
                      Archivos
                    </h3>
                  </div>
                  {origenArchivoFiles.length > 0 ? (
                    <span className="rounded-md border border-polaria-t-20 bg-polaria-bg/50 px-1.5 py-0.5 polaria-text-caption font-semibold text-polaria-teal">
                      {origenArchivoFiles.length} adjunto
                      {origenArchivoFiles.length === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <label
                    htmlFor="orden-venta-docs-archivos"
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDocsDropActive(true);
                    }}
                    onDragLeave={() => setIsDocsDropActive(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setIsDocsDropActive(false);
                      appendDocsFiles(event.dataTransfer.files);
                    }}
                    className={cn(
                      "flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition",
                      isDocsDropActive
                        ? "border-polaria-teal bg-polaria-teal/10 text-polaria-teal polaria-card-glow"
                        : "border-polaria-t-20 bg-polaria-bg/35 text-polaria-w-50 hover:border-polaria-teal hover:bg-polaria-t-08 hover:text-polaria-teal",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-full border",
                        isDocsDropActive
                          ? "border-polaria-teal bg-polaria-teal/15 text-polaria-teal"
                          : "border-polaria-t-20 bg-polaria-t-08 text-polaria-teal",
                      )}
                    >
                      <Upload className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="polaria-text-body-sm font-semibold text-polaria-w">
                      {isDocsDropActive
                        ? "Suelta los archivos aquí"
                        : "Arrastra o selecciona"}
                    </span>
                    <span className="max-w-[16rem] polaria-text-caption text-polaria-w-50">
                      PDF, Excel, CSV, Word, correos (.eml) y fotos
                    </span>
                    <input
                      id="orden-venta-docs-archivos"
                      ref={docsFileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.xlsx,.xls,.csv,.txt,.docx,.eml,.html,.htm,image/*"
                      className="sr-only"
                      onChange={(event) => {
                        appendDocsFiles(event.target.files ?? []);
                        event.target.value = "";
                      }}
                    />
                  </label>

                  {origenArchivoFiles.length > 0 ? (
                    <ul className="space-y-1.5">
                      {origenArchivoFiles.map((file) => (
                        <li
                          key={`${file.name}-${file.size}`}
                          className="flex items-center gap-2 rounded-xl border border-polaria-t-20 bg-polaria-bg/45 px-2.5 py-2"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-polaria-t-20 bg-polaria-t-08 text-polaria-teal">
                            <FileText className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1 truncate polaria-text-caption font-medium text-polaria-w">
                            {file.name}
                          </span>
                          <button
                            type="button"
                            aria-label={`Quitar ${file.name}`}
                            onClick={() =>
                              setOrigenArchivoFiles((prev) =>
                                prev.filter(
                                  (item) =>
                                    !(
                                      item.name === file.name &&
                                      item.size === file.size
                                    ),
                                ),
                              )
                            }
                            className="rounded-md p-1 text-polaria-w-50 transition hover:bg-polaria-w-08 hover:text-polaria-danger"
                          >
                            <X className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="polaria-text-caption text-polaria-w-50">
                      Otros formatos se guardan como respaldo sin leerse.
                    </p>
                  )}
                </div>
              </section>
            </div>

            {docsHasContent ? (
              <p className="rounded-xl border border-polaria-t-20 bg-polaria-teal/10 px-3 py-2.5 polaria-text-caption text-polaria-teal">
                Listo para Continuar: Mateo va a leer lo que pegaste o
                adjuntaste.
              </p>
            ) : (
              <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-2.5 polaria-text-caption text-polaria-w-50">
                Agrega un mensaje o al menos un archivo para continuar.
              </p>
            )}
          </div>
        ) : null}

        {step === "preview" && !isLoading ? (
          <div className="flex flex-col gap-3">
            <OrdenTrabajoPreviewList
              clienteLabel={compradorLabel}
              hijas={previewHijas}
              page={formOtSafePagePreview}
              onRemoveHija={(hijaId) => setConfirmRemoveOtId(hijaId)}
            />
            <button
              type="button"
              onClick={() => {
                setAddOtAlmacen("");
                setAddOtNumeroPedido(ordenCompraHotel.trim());
                setAddOtOpen(true);
                setError(null);
              }}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-2.5",
                "polaria-text-body-sm font-semibold text-polaria-w transition hover:border-polaria-teal",
              )}
            >
              <Plus className="h-4 w-4 text-polaria-teal" aria-hidden />
              Agregar tarea de almacén
            </button>
          </div>
        ) : null}

        {step === "pickOt" && !isLoading ? (
          cypherOpen ? (
            <div className="space-y-4">
              <p className="polaria-text-body-sm text-polaria-w-50">
                Esta venta tiene{" "}
                <span className="font-semibold text-polaria-teal">
                  {ordenesTrabajoForm.length} órdenes de trabajo
                </span>
                . Elige cuál quieres revisar en el panel Cypher a la derecha.
              </p>
              <button
                type="button"
                onClick={() => {
                  setAddOtAlmacen("");
                  setAddOtNumeroPedido(ordenCompraHotel.trim());
                  setAddOtOpen(true);
                  setError(null);
                }}
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-2.5",
                  "polaria-text-body-sm font-semibold text-polaria-w transition hover:border-polaria-teal",
                )}
              >
                <Plus className="h-4 w-4 text-polaria-teal" aria-hidden />
                Agregar tarea de almacén
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="polaria-text-body-sm text-polaria-w-50">
                Esta venta tiene{" "}
                <span className="font-semibold text-polaria-teal">
                  {ordenesTrabajoForm.length} órdenes de trabajo
                </span>
                . Elige cuál quieres editar, o agrega/elimina si faltan o sobran.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ordenesTrabajoForm.map((hija, index) => (
                  <div
                    key={hija.id}
                    className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-4"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setFormOtPage(index);
                        setStep("form");
                        setError(null);
                      }}
                      className={cn(
                        "w-full text-left transition",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
                      )}
                    >
                      <p className="polaria-text-body-sm font-semibold text-polaria-w">
                        {hija.label}
                      </p>
                      <p className="mt-1 polaria-text-caption text-polaria-w-50">
                        {countProductosOt(hija)} producto
                        {countProductosOt(hija) === 1 ? "" : "s"} ·{" "}
                        {formatKgEs(hija.totalCantidad)} kg
                      </p>
                      {hija.almacen ? (
                        <p className="mt-1 polaria-text-caption text-polaria-w-50">
                          {hija.almacen}
                        </p>
                      ) : null}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmRemoveOtId(hija.id)}
                      className="mt-3 polaria-text-caption text-polaria-w-50 transition hover:text-polaria-teal"
                    >
                      Eliminar tarea
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setAddOtAlmacen("");
                  setAddOtNumeroPedido(ordenCompraHotel.trim());
                  setAddOtOpen(true);
                  setError(null);
                }}
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-2.5",
                  "polaria-text-body-sm font-semibold text-polaria-w transition hover:border-polaria-teal",
                )}
              >
                <Plus className="h-4 w-4 text-polaria-teal" aria-hidden />
                Agregar tarea de almacén
              </button>
            </div>
          )
        ) : null}

        {step === "form" && !isLoading ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {ordenesTrabajoForm.length > 1 ? (
                hijaFormActiva ? (
                  <button
                    type="button"
                    onClick={() => setConfirmRemoveOtId(hijaFormActiva.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-2.5 py-1.5 polaria-text-caption font-semibold text-polaria-danger transition hover:opacity-90"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    Eliminar esta tarea
                  </button>
                ) : (
                  <span />
                )
              ) : ordenesTrabajoForm.length === 1 && hijaFormActiva ? (
                <button
                  type="button"
                  onClick={() => setConfirmRemoveOtId(hijaFormActiva.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-2.5 py-1.5 polaria-text-caption font-semibold text-polaria-danger transition hover:opacity-90"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  Eliminar tarea de almacén
                </button>
              ) : !isEditing ? (
                <button
                  type="button"
                  onClick={() => {
                    setStep("start");
                    setStartMode(null);
                    setError(null);
                  }}
                  className="polaria-text-caption text-polaria-w-50 transition hover:text-polaria-teal"
                >
                  ← Volver al inicio
                </button>
              ) : (
                <span />
              )}
              <p className="polaria-text-caption text-polaria-w-50">
                {afterCutoff
                  ? "Después del corte de las 17:00 — el almacén no tendrá a quién preguntarle hasta las 02:00"
                  : "Captura abierta"}
              </p>
            </div>

            {successMessage ? (
              <p
                role="status"
                className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3 polaria-text-body-sm text-polaria-teal"
              >
                {successMessage}
              </p>
            ) : null}

            {!hasProductos ? (
              <p className="rounded-xl border border-polaria-warning-border bg-polaria-warning-bg px-4 py-3 polaria-text-body-sm text-polaria-warning">
                {emptyCatalogMessage}
              </p>
            ) : null}

            {/* REQ-097: oculto (no eliminado) — Datos del pedido / Cliente quedan arriba. */}
            {startMode === "docs" &&
            (origenTexto.trim() || origenArchivosNombres.length > 0) ? (
              <div
                className="hidden"
                aria-hidden
                data-ov-origen-pedido="hidden"
              >
                <p className="polaria-text-label text-polaria-w">
                  De dónde salió este pedido
                </p>
                <div className="mt-2">
                  <OrigenPedidoSourceView
                    archivos={origenArchivosNombres}
                    tieneTexto={Boolean(origenTexto.trim())}
                  />
                </div>
                {vendedorNombre ? (
                  <p className="mt-2 polaria-text-caption text-polaria-w-50">
                    Capturado por {vendedorNombre}
                  </p>
                ) : null}
              </div>
            ) : null}

            {hasProductos ? (
              <>
                <CaptureSection title="Datos del pedido">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div data-ov-revision="cliente" className="sm:col-span-2">
                    <PolariaFormField
                      id="orden-venta-cliente"
                      label="Cliente: razón social"
                      compact
                      required
                    >
                      <>
                        {idComprador && compradorSugerencias.length === 0 ? (
                          <div className="relative flex items-stretch">
                            <input
                              id="orden-venta-cliente"
                              type="text"
                              value={compradorLabel}
                              title={compradorLabel || undefined}
                              readOnly
                              aria-label="Cliente: razón social"
                              className={cn(
                                POLARIA_FORM_INPUT_CLASS_COMPACT,
                                "w-full truncate pr-[6.75rem]",
                                "border-polaria-teal bg-polaria-t-08 ring-1 ring-polaria-teal/50",
                                "shadow-[0_0_22px_var(--teal-glow-strong)]",
                                fieldControlClass({
                                  field: "cliente",
                                  missingFields,
                                  missing: !idComprador,
                                }),
                              )}
                            />
                            <span className="absolute right-1 top-1/2 inline-flex -translate-y-1/2 items-center gap-1">
                              <CatalogStatusHint
                                label="Cliente: razón social coincide con el catálogo"
                                tone="teal"
                                size="md"
                              >
                                <CheckCircle2
                                  className="h-4 w-4"
                                  strokeWidth={2}
                                  aria-hidden
                                />
                              </CatalogStatusHint>
                              <button
                                type="button"
                                onClick={() => setPicker("comprador")}
                                title="Cambiar cliente"
                                aria-label="Cambiar cliente"
                                className="inline-flex items-center gap-1 rounded-lg border border-polaria-t-20 bg-polaria-t-08 px-2 py-1 polaria-text-caption font-medium text-polaria-teal transition hover:bg-polaria-t-20"
                              >
                                <Replace className="h-3 w-3" aria-hidden />
                                Cambiar
                              </button>
                            </span>
                          </div>
                        ) : !idComprador &&
                          (Boolean(compradorNombreIa) ||
                            compradorSugerencias.length > 0) ? (
                          <div className="relative flex items-stretch">
                            <input
                              id="orden-venta-cliente"
                              type="text"
                              value={
                                (compradorLabel && compradorLabel !== "—"
                                  ? compradorLabel
                                  : "") ||
                                compradorNombreIa ||
                                ""
                              }
                              title={
                                (compradorLabel && compradorLabel !== "—"
                                  ? compradorLabel
                                  : "") ||
                                compradorNombreIa ||
                                undefined
                              }
                              readOnly
                              aria-label="Cliente: razón social"
                              className={cn(
                                POLARIA_FORM_INPUT_CLASS_COMPACT,
                                "w-full truncate pr-[7.5rem]",
                                "!border-polaria-warning-border !bg-polaria-warning-bg",
                              )}
                            />
                            <span className="absolute right-1 top-1/2 inline-flex -translate-y-1/2 items-center gap-1">
                              <CatalogStatusHint
                                label="Cliente: razón social sin coincidencia exacta en el catálogo"
                                tone="warning"
                                size="md"
                              >
                                <AlertTriangle
                                  className="h-4 w-4"
                                  strokeWidth={2}
                                  aria-hidden
                                />
                              </CatalogStatusHint>
                              <button
                                type="button"
                                onClick={() => setPicker("comprador")}
                                title="Elegir cliente"
                                aria-label="Elegir cliente"
                                className="inline-flex items-center gap-1 rounded-lg border border-polaria-warning-border bg-polaria-warning-bg px-2 py-1 polaria-text-caption font-semibold text-polaria-warning transition hover:opacity-90"
                              >
                                Elegir
                              </button>
                            </span>
                          </div>
                        ) : (
                          <div className="relative flex items-stretch">
                            <input
                              id="orden-venta-cliente"
                              type="text"
                              value={compradorLabel}
                              title={compradorLabel || undefined}
                              readOnly
                              placeholder="Selecciona un cliente"
                              aria-label="Cliente: razón social"
                              className={cn(
                                POLARIA_FORM_INPUT_CLASS_COMPACT,
                                "w-full truncate pr-[7.5rem]",
                                "!border-polaria-danger-border !bg-polaria-danger-bg",
                              )}
                            />
                            <span className="absolute right-1 top-1/2 inline-flex -translate-y-1/2 items-center gap-1">
                              <CatalogStatusHint
                                label="Falta seleccionar cliente: razón social"
                                tone="danger"
                                size="md"
                              >
                                <XCircle
                                  className="h-4 w-4"
                                  strokeWidth={2}
                                  aria-hidden
                                />
                              </CatalogStatusHint>
                              <button
                                type="button"
                                onClick={() => setPicker("comprador")}
                                title="Elegir cliente"
                                aria-label="Elegir cliente"
                                className="inline-flex items-center gap-1 rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-2 py-1 polaria-text-caption font-semibold text-polaria-danger transition hover:opacity-90"
                              >
                                Elegir
                              </button>
                            </span>
                          </div>
                        )}
                        {compradorNombreIa?.trim() ? (
                          <p
                            className="mt-1.5 truncate text-[11px] leading-snug text-polaria-teal/80"
                            title={compradorNombreIa.trim()}
                          >
                            Solicitado:{" "}
                            <span className="text-polaria-w-50">
                              {compradorNombreIa.trim()}
                            </span>
                          </p>
                        ) : null}
                      </>
                </PolariaFormField>
                    </div>

                    <PolariaFormInput
                      id="orden-venta-codigo-cliente"
                      label="Código de cliente"
                      value={codigoClienteCatalogo}
                      readOnly
                      placeholder="—"
                      compact
                    />

                    <PolariaFormInput
                      id="orden-venta-denominacion-comercial"
                      label="Denominación comercial"
                      value={denominacionComercialCatalogo}
                      readOnly
                      placeholder="—"
                      fieldClassName="sm:col-span-2"
                      compact
                    />

                    <PolariaFormInput
                      id="orden-venta-oc-hotel"
                      label="Orden de compra del cliente"
                      value={ordenCompraHotel}
                      onChange={(event) => {
                        setOrdenCompraHotel(event.target.value);
                        clearFieldMarks("ordenCompraHotel");
                      }}
                      hint={
                        exigeOc
                          ? "Este cliente exige OC para facturar."
                          : undefined
                      }
                      required={exigeOc}
                      data-ov-revision="ordenCompra"
                      controlClassName={fieldControlClass({
                        field: "ordenCompraHotel",
                        autoFields,
                        warnFields,
                        missingFields,
                        missing: exigeOc && !ordenCompraHotel.trim(),
                      })}
                      compact
                    />

                    <PolariaFormInput
                      id="orden-venta-centro"
                      label="Centro de consumo"
                      value={centroConsumo}
                      onChange={(event) => {
                        setCentroConsumo(event.target.value);
                        clearFieldMarks("centroConsumo");
                      }}
                      controlClassName={fieldControlClass({
                        field: "centroConsumo",
                        autoFields,
                        warnFields,
                        missingFields,
                      })}
                      hint={
                        warnFields.has("centroConsumo")
                          ? `Registrado en ficha distinto al del pedido`
                          : undefined
                      }
                      compact
                    />

                    <div data-ov-revision="fechaEntrega">
                    <PolariaDateInputDdMm
                      id="orden-venta-fecha-entrega"
                      label="Fecha de entrega"
                      value={fechaEntrega}
                      required={esPorConfirmar}
                      onChange={(iso) => {
                        setFechaEntrega(iso);
                        clearFieldMarks("fechaEntrega");
                        if (iso.trim()) setError(null);
                      }}
                      hint={
                        isFechaEntregaAtrasada(fechaEntrega, todayIsoDate())
                          ? FECHA_ENTREGA_ATRASADA_WARNING
                          : missingFields.has("fechaEntrega")
                            ? "Obligatoria para confirmar"
                            : "Formato DD/MM/AAAA"
                      }
                      controlClassName={fieldControlClass({
                        field: "fechaEntrega",
                        autoFields,
                        warnFields: isFechaEntregaAtrasada(
                          fechaEntrega,
                          todayIsoDate(),
                        )
                          ? new Set([...warnFields, "fechaEntrega"])
                          : warnFields,
                        missingFields,
                        missing: !isFechaEntregaIsoValida(fechaEntrega),
                      })}
                      compact
                    />
                    </div>

                    <PolariaFormInput
                      id="orden-venta-ventana-desde"
                      label="Ventana de entrega — desde"
                      type="time"
                      value={ventanaDesde}
                      max={ventanaHasta || undefined}
                      onChange={(event) => {
                        setVentanaDesde(event.target.value);
                        clearFieldMarks("ventanaDesde");
                        if (
                          !isVentanaDesdeMayorQueHasta(
                            event.target.value,
                            ventanaHasta,
                          )
                        ) {
                          clearFieldMarks("ventanaHasta");
                        }
                      }}
                      data-ov-revision="ventanaDesde"
                      controlClassName={fieldControlClass({
                        field: "ventanaDesde",
                        autoFields,
                        warnFields,
                        missingFields,
                        missing: isVentanaDesdeMayorQueHasta(
                          ventanaDesde,
                          ventanaHasta,
                        ),
                      })}
                      compact
                    />

                    <PolariaFormInput
                      id="orden-venta-ventana-hasta"
                      label="Ventana de entrega — hasta"
                      type="time"
                      value={ventanaHasta}
                      min={ventanaDesde || undefined}
                      onChange={(event) => {
                        setVentanaHasta(event.target.value);
                        clearFieldMarks("ventanaHasta");
                        if (
                          !isVentanaDesdeMayorQueHasta(
                            ventanaDesde,
                            event.target.value,
                          )
                        ) {
                          clearFieldMarks("ventanaDesde");
                        }
                      }}
                      controlClassName={fieldControlClass({
                        field: "ventanaHasta",
                        autoFields,
                        warnFields,
                        missingFields,
                        missing: isVentanaDesdeMayorQueHasta(
                          ventanaDesde,
                          ventanaHasta,
                        ),
                      })}
                      compact
                    />

                    <PolariaFormSelect
                      id="orden-venta-prioridad"
                      label="Prioridad"
                      value={prioridad}
                      onChange={(event) => setPrioridad(event.target.value)}
                      options={PRIORIDAD_OPTIONS}
                      compact
                    />

                    <PolariaFormField
                      id="orden-venta-moneda"
                      label="Moneda"
                      compact
                    >
                      <JefeBodegaModalSearchField
                        id="orden-venta-moneda"
                        value={moneda}
                        placeholder="Selecciona una moneda"
                        ariaLabel="Moneda"
                        compact
                        onSearchClick={() => setPicker("moneda")}
                      />
                    </PolariaFormField>

                    <PolariaFormInput
                      id="orden-venta-observaciones"
                      label="Notas generales"
                      value={observaciones}
                      placeholder="Notas generales para almacén"
                      onChange={(event) => {
                        setObservaciones(event.target.value);
                        clearFieldMarks("observaciones");
                      }}
                      controlClassName={fieldControlClass({
                        field: "observaciones",
                        autoFields,
                        warnFields,
                        missingFields,
                      })}
                      compact
                      fieldClassName="sm:col-span-3"
                    />
                  </div>
                </CaptureSection>

                <CaptureSection title="Entrega">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <PolariaFormInput
                        id="orden-venta-direccion"
                        label="Dirección de entrega"
                        value={direccion}
                        onChange={(event) => {
                          setDireccion(event.target.value);
                          setAvisoVerificarDireccion(false);
                          clearFieldMarks("direccion");
                        }}
                        controlClassName={fieldControlClass({
                          field: "direccion",
                          autoFields,
                          warnFields,
                          missingFields,
                        })}
                        compact
                      />
                      {avisoVerificarDireccion ? (
                        <p className="mt-1.5 rounded-lg border border-polaria-warning-border bg-polaria-warning-bg px-3 py-2 polaria-text-caption text-polaria-warning">
                          Cambiaste el cliente. Revisa que la dirección de
                          entrega (la del correo o PDF) sea la correcta para este
                          pedido. Si no, corrígela aquí; se enviará la que
                          dejes en este campo.
                        </p>
                      ) : null}
                    </div>
                    <PolariaFormInput
                      id="orden-venta-contacto"
                      label="Contacto del cliente"
                      value={contacto}
                      onChange={(event) => {
                        setContacto(event.target.value);
                        clearFieldMarks("contacto");
                      }}
                      controlClassName={fieldControlClass({
                        field: "contacto",
                        autoFields,
                        warnFields,
                        missingFields,
                      })}
                      compact
                    />
                    <PolariaFormInput
                      id="orden-venta-telefono"
                      label="Teléfono del contacto"
                      type="tel"
                      value={telefono}
                      onChange={(event) => {
                        setTelefono(event.target.value);
                        clearFieldMarks("telefono");
                      }}
                      controlClassName={fieldControlClass({
                        field: "telefono",
                        autoFields,
                        warnFields,
                        missingFields,
                      })}
                      compact
                    />
                    <PolariaFormInput
                      id="orden-venta-correo"
                      label="Correo del contacto"
                      type="email"
                      value={correo}
                      onChange={(event) => {
                        setCorreo(event.target.value);
                        clearFieldMarks("correo");
                      }}
                      controlClassName={fieldControlClass({
                        field: "correo",
                        autoFields,
                        warnFields,
                        missingFields,
                      })}
                      compact
                    />
                </div>
                </CaptureSection>

                <div data-ov-revision="productos">
                <CaptureSection
                  title="Productos"
                  footer={
                    <div className="flex justify-end border-t border-polaria-t-20 bg-polaria-w-08 px-4 py-3">
                      <table className="text-right">
                        <tbody>
                          <tr>
                            <td className="pr-8 polaria-text-body-sm text-polaria-w-50">
                              Subtotal
                            </td>
                            <td className="font-mono polaria-text-body-sm text-polaria-w">
                              ${formatPrecioEs(subtotalVenta)}
                            </td>
                          </tr>
                          <tr>
                            <td className="pr-8 polaria-text-body-sm text-polaria-w-50">
                              Descuentos
                            </td>
                            <td className="font-mono polaria-text-body-sm text-polaria-w">
                              ${formatPrecioEs(descuentosVenta)}
                            </td>
                          </tr>
                          <tr>
                            <td className="pr-8 polaria-text-body-sm text-polaria-w-50">
                              IVA
                            </td>
                            <td className="font-mono polaria-text-body-sm text-polaria-w">
                              ${formatPrecioEs(ivaVenta)}
                            </td>
                          </tr>
                          <tr>
                            <td className="pt-2 pr-8 polaria-text-body-sm font-semibold text-polaria-w">
                              {mostrarTotalOv ? "Total OT" : "Total"}
                            </td>
                            <td className="pt-2 font-mono polaria-text-body-sm font-semibold text-polaria-teal">
                              ${formatPrecioEs(totalVenta)}
                            </td>
                          </tr>
                          {mostrarTotalOv ? (
                            <tr>
                              <td className="pt-1 pr-8 polaria-text-body-sm font-semibold text-polaria-w">
                                Total OV ({ordenesTrabajoForm.length} OT)
                              </td>
                              <td className="pt-1 font-mono polaria-text-body-sm font-semibold text-polaria-teal">
                                ${formatPrecioEs(totalOvCompleta)}
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  }
                >
                  <div className="overflow-x-hidden">
                    <table className="w-full table-fixed border-collapse text-left">
                    <colgroup>
                        <col />
                        <col style={{ width: "6.25rem" }} />
                        <col style={{ width: "4.25rem" }} />
                        <col style={{ width: "4.75rem" }} />
                        <col style={{ width: "4.25rem" }} />
                        <col style={{ width: "4.75rem" }} />
                        <col style={{ width: "5rem" }} />
                        <col style={{ width: "5.5rem" }} />
                        <col style={{ width: "2.25rem" }} />
                    </colgroup>
                      <thead>
                      <tr className="border-b border-polaria-t-20">
                          <th className="px-1 pb-2 text-left polaria-text-caption font-medium text-polaria-w-50">
                            Producto{" "}
                            <span className="font-bold text-polaria-danger">*</span>
                        </th>
                          <th className="px-1 pb-2 text-left polaria-text-caption font-medium text-polaria-w-50">
                            Especificación
                          </th>
                          <th className="px-1 pb-2 text-left polaria-text-caption font-medium text-polaria-w-50">
                            Cantidad{" "}
                            <span className="font-bold text-polaria-danger">*</span>
                        </th>
                          <th className="px-1 pb-2 text-left polaria-text-caption font-medium text-polaria-w-50">
                            Unidad
                        </th>
                          <th className="px-1 pb-2 text-left polaria-text-caption font-medium text-polaria-w-50">
                            Desc%
                          </th>
                          <th className="px-1 pb-2 text-left polaria-text-caption font-medium text-polaria-w-50">
                            Precio{" "}
                            <span className="font-bold text-polaria-danger">*</span>
                          </th>
                          <th className="px-1 pb-2 text-left polaria-text-caption font-medium text-polaria-w-50">
                            IVA
                          </th>
                          <th className="px-1 pb-2 text-left polaria-text-caption font-medium text-polaria-w-50">
                            Importe
                          </th>
                          <th className="px-0 pb-2 pr-1">
                          <span className="sr-only">Quitar</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                        {lineasConIndice.length === 0 ? (
                          <tr>
                            <td
                              colSpan={9}
                              className="px-1 py-4 text-center polaria-text-caption text-polaria-w-50"
                            >
                              Sin productos. Agrega al menos uno para crear la
                              venta.
                            </td>
                          </tr>
                        ) : (
                          lineasConIndice.map(({ linea, index }) => {
                            const { importe } = lineAmounts(linea);
                            const pending = Boolean(
                              linea.catalogPending || !linea.idProducto,
                            );
                            const tieneSugerenciasProducto =
                              collectSugerenciasLinea(linea).length > 0;
                            const productoError =
                              pending && !tieneSugerenciasProducto;
                            const productoWarn =
                              pending && tieneSugerenciasProducto;
                            const cantidadFocusKey =
                              linea.idProducto || `pending-${index}`;
                            const textoEscritoProducto =
                              linea.aliasCliente?.trim() || "";
                            const nombreVisible = formatProductoNombreConSku(
                              pending
                                ? linea.aliasCliente || linea.nombre
                                : linea.nombre,
                              linea.codigo,
                            );
                            return (
                              <tr
                                key={`ov-linea-${index}`}
                                className="border-b border-polaria-w-08 last:border-b-0"
                              >
                                <td className="px-1 py-2 align-middle">
                                  <div
                                    className={cn(
                                      "min-w-0 rounded-lg border px-2 py-1.5 ring-1",
                                      !pending &&
                                        "border-polaria-teal bg-polaria-t-08 ring-polaria-teal/50 shadow-[0_0_18px_var(--teal-glow-strong)]",
                                      productoWarn &&
                                        "border-polaria-warning bg-polaria-warning-bg ring-polaria-warning/50 shadow-[0_0_18px_var(--warning-border)]",
                                      productoError &&
                                        "border-polaria-danger bg-polaria-danger-bg ring-polaria-danger/50 shadow-[0_0_18px_var(--danger-border)]",
                                    )}
                                  >
                                    <div className="flex min-w-0 items-center gap-1.5">
                                      <p
                                        className="min-w-0 flex-1 truncate polaria-text-body-sm font-medium text-polaria-w"
                                        title={nombreVisible}
                                      >
                                        {nombreVisible}
                                      </p>
                                      {!pending ? (
                                        <CatalogStatusHint
                                          label="Producto coincide con el catálogo"
                                          tone="teal"
                                        >
                                          <CheckCircle2
                                            className="h-3.5 w-3.5 shrink-0"
                                            strokeWidth={2}
                                            aria-hidden
                                          />
                                        </CatalogStatusHint>
                                      ) : productoWarn ? (
                                        <CatalogStatusHint
                                          label="Producto sin coincidencia exacta en el catálogo"
                                          tone="warning"
                                        >
                                          <AlertTriangle
                                            className="h-3.5 w-3.5 shrink-0"
                                            strokeWidth={2}
                                            aria-hidden
                                          />
                                        </CatalogStatusHint>
                                      ) : (
                                        <CatalogStatusHint
                                          label="Producto no identificado: elige uno del catálogo"
                                          tone="danger"
                                        >
                                          <XCircle
                                            className="h-3.5 w-3.5 shrink-0"
                                            strokeWidth={2}
                                            aria-hidden
                                          />
                                        </CatalogStatusHint>
                                      )}
                                      <button
                                        type="button"
                                        data-ov-revision={`producto-${index}`}
                                        onClick={() => {
                                          // Validar o cambiar: siempre catálogo completo
                                          // (sugerencias van arriba si las hay).
                                          handleOpenReplaceProducto(index);
                                        }}
                                        title={
                                          linea.aliasCliente
                                            ? `Cliente: ${linea.aliasCliente}`
                                            : "Cambiar producto"
                                        }
                                        aria-label="Cambiar producto"
                                        className={cn(
                                          "inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 polaria-text-caption font-medium transition hover:opacity-90",
                                          productoError
                                            ? "border-polaria-danger bg-polaria-danger-bg text-polaria-danger"
                                            : productoWarn
                                              ? "border-polaria-warning bg-polaria-warning-bg text-polaria-warning"
                                              : "border-polaria-t-20 bg-polaria-t-08 text-polaria-w hover:bg-polaria-t-20",
                                        )}
                                      >
                                        <Replace
                                          className="h-3 w-3 shrink-0"
                                          aria-hidden
                                        />
                                        Cambiar
                                      </button>
                                    </div>
                                    {textoEscritoProducto ? (
                                      <p className="mt-1 break-words text-[11px] leading-snug text-polaria-teal/80">
                                        Solicitado:{" "}
                                        <span className="text-polaria-w-50">
                                          {textoEscritoProducto}
                                        </span>
                                      </p>
                                    ) : null}
                                  </div>
                                </td>
                                <td className="h-px px-1 py-2">
                                  <div className="flex h-full min-h-full items-stretch">
                                    <input
                                      aria-label={`Especificación de ${linea.nombre}`}
                                      type="text"
                                      value={linea.especificacion}
                                      onChange={(event) =>
                                        handleLineaFieldChange(
                                          index,
                                          "especificacion",
                                          event.target.value,
                                        )
                                      }
                                      className={cn(
                                        POLARIA_FORM_INPUT_CLASS_COMPACT,
                                        "h-full min-h-full px-2",
                                        linea.filledByIa &&
                                          linea.especificacion &&
                                          "!border-polaria-teal/50 !bg-polaria-t-08",
                                      )}
                                    />
                                  </div>
                                </td>
                                <td className="h-px px-1 py-2">
                                  <div className="flex h-full min-h-full items-stretch">
                                    <input
                                      id={`orden-venta-cantidad-${cantidadFocusKey}`}
                                      data-ov-revision={`cantidad-${index}`}
                                      aria-label={`Cantidad de ${linea.nombre}`}
                                      type="text"
                                      inputMode="decimal"
                                      autoComplete="off"
                                      value={linea.cantidadInput}
                                      placeholder="0"
                                      onChange={(event) =>
                                        handleCantidadChange(
                                          index,
                                          event.target.value,
                                        )
                                      }
                                      onBlur={(event) =>
                                        handleCantidadBlur(
                                          index,
                                          event.target.value,
                                        )
                                      }
                                      className={cn(
                                        POLARIA_FORM_INPUT_CLASS_COMPACT,
                                        "h-full min-h-full px-2 tabular-nums",
                                        fieldControlClass({
                                          missing:
                                            !linea.cantidadInput.trim() ||
                                            (parseDecimalEs(
                                              linea.cantidadInput,
                                            ) ?? 0) <= 0,
                                        }) ??
                                          (linea.filledByIa
                                            ? "!border-polaria-teal/50 !bg-polaria-t-08"
                                            : undefined),
                                      )}
                                    />
                                  </div>
                                </td>
                                <td className="h-px px-1 py-2">
                                  <div className="flex h-full min-h-full items-stretch">
                                    <input
                                      aria-label={`Unidad de ${linea.nombre}`}
                                      value={
                                        linea.unidadMedida ||
                                        UNIDAD_MEDIDA_VENTA_DEFAULT
                                      }
                                      disabled
                                      tabIndex={-1}
                                      className={cn(
                                        POLARIA_FORM_INPUT_CLASS_COMPACT,
                                        "h-full min-h-full px-1.5 text-center",
                                      )}
                                    />
                                  </div>
                                </td>
                                <td className="h-px px-1 py-2">
                                  <div className="flex h-full min-h-full items-stretch">
                                    <input
                                      aria-label={`Descuento % de ${linea.nombre}`}
                                      type="text"
                                      inputMode="decimal"
                                      value={linea.descuentoPctInput || "0"}
                                      disabled
                                      tabIndex={-1}
                                      className={cn(
                                        POLARIA_FORM_INPUT_CLASS_COMPACT,
                                        "h-full min-h-full",
                                      )}
                                    />
                                  </div>
                                </td>
                                <td className="h-px px-1 py-2">
                                  <div className="flex h-full min-h-full items-stretch">
                                    <input
                                      data-ov-revision={`precio-${index}`}
                                      aria-label={`Precio de ${linea.nombre}`}
                                      type="text"
                                      inputMode="decimal"
                                      autoComplete="off"
                                      value={linea.precioInput}
                                      placeholder=""
                                      onChange={(event) =>
                                        handlePrecioChange(
                                          index,
                                          event.target.value,
                                        )
                                      }
                                      onBlur={(event) =>
                                        handlePrecioBlur(
                                          index,
                                          event.target.value,
                                        )
                                      }
                                      className={cn(
                                        POLARIA_FORM_INPUT_CLASS_COMPACT,
                                        "h-full min-h-full px-2 tabular-nums",
                                        fieldControlClass({
                                          // REQ-135: vacío/0 permitido; solo marcar basura no numérica.
                                          missing:
                                            Boolean(linea.precioInput.trim()) &&
                                            ((parseDecimalEs(
                                              linea.precioInput,
                                            ) ?? -1) < 0),
                                        }),
                                      )}
                                    />
                                  </div>
                                </td>
                                <td className="h-px px-1 py-2">
                                  <div className="flex h-full min-h-full items-stretch">
                                    <select
                                      aria-label={`IVA de ${linea.nombre}`}
                                      value={linea.ivaPct}
                                      onChange={(event) =>
                                        handleLineaFieldChange(
                                          index,
                                          "ivaPct",
                                          event.target.value,
                                        )
                                      }
                                      className={cn(
                                        POLARIA_FORM_SELECT_CLASS_COMPACT,
                                        "h-full min-h-full",
                                      )}
                                    >
                                      {IVA_PCT_OPTIONS.map((option) => (
                                        <option
                                          key={option.value}
                                          value={option.value}
                                        >
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </td>
                                <td className="h-px px-1 py-2">
                                  <div className="flex h-full min-h-full items-center font-mono polaria-text-body-sm text-polaria-teal">
                                    ${formatPrecioEs(importe)}
                                  </div>
                                </td>
                                <td className="h-px px-0 py-2 pr-1">
                                  <div className="flex h-full min-h-full items-center justify-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveLinea(index)}
                                      className="rounded-lg p-1.5 text-polaria-w-50 transition hover:bg-polaria-w-08 hover:text-polaria-danger"
                                      aria-label={`Quitar ${linea.aliasCliente || linea.nombre}`}
                                    >
                                      <Trash2
                                        className="h-4 w-4"
                                        aria-hidden
                                      />
                                    </button>
                                  </div>
                                </td>
                        </tr>
                            );
                          })
                        )}
                    </tbody>
                  </table>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (puedeAgregarProducto) {
                        setReplaceLineaIndex(null);
                        setPicker("producto");
                      }
                    }}
                    disabled={!puedeAgregarProducto}
                    className={cn(
                      "mt-3 inline-flex items-center gap-1 rounded-xl border border-polaria-teal px-4 py-2",
                      "polaria-text-body-sm font-semibold text-polaria-teal transition hover:bg-polaria-t-08",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    Agregar producto
                  </button>
                </CaptureSection>
                </div>

                <div className="hidden" aria-hidden>
                  {lineas.map((linea, index) => (
                    <div key={`hidden-pack-${linea.idProducto}-${index}`}>
                      <input
                        aria-label={`Cajas de ${linea.nombre}`}
                        tabIndex={-1}
                        value={linea.cajasInput}
                        onChange={(event) =>
                          setLineas((prev) =>
                            prev.map((row, i) =>
                              i === index
                                ? { ...row, cajasInput: event.target.value }
                                : row,
                            ),
                          )
                        }
                      />
                      <select
                        aria-label={`Presentación de ${linea.nombre}`}
                        tabIndex={-1}
                        value={linea.presentacion}
                        onChange={(event) =>
                          setLineas((prev) =>
                            prev.map((row, i) =>
                              i === index
                                ? { ...row, presentacion: event.target.value }
                                : row,
                            ),
                          )
                        }
                      >
                        {PRESENTACION_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <PolariaFormSelect
                    id="orden-venta-sustituciones"
                    label="¿Acepta sustituciones?"
                    value={aceptaSustituciones}
                    onChange={(event) =>
                      setAceptaSustituciones(event.target.value)
                    }
                    options={SUSTITUCIONES_OPTIONS}
                    compact
                  />
                  <PolariaFormSelect
                    id="orden-venta-lote"
                    label="Requiere lote / trazabilidad"
                    value={requiereLote}
                    onChange={(event) => setRequiereLote(event.target.value)}
                    options={SI_NO_OPTIONS}
                    compact
                  />
                  <PolariaFormSelect
                    id="orden-venta-temp"
                    label="Registrar temperatura al entregar"
                    value={registrarTemperatura}
                    onChange={(event) =>
                      setRegistrarTemperatura(event.target.value)
                    }
                    options={SI_NO_OPTIONS}
                    compact
                  />
                </div>

              </>
            ) : null}
          </div>
        ) : null}
      </PolariaFormModal>

      <OrdenVentaCompradorPickerModal
        open={picker === "comprador"}
        onClose={() => setPicker(null)}
        compradores={compradores}
        priorityIds={compradorPickerPriorityIds}
        selectedId={idComprador}
        onSelect={(row) => {
          handleSelectComprador(row, {
            verificarDireccionEntrega: true,
            keepNombreIa: Boolean(compradorNombreIa),
            preservePedidoData: true,
          });
        }}
        title={
          !idComprador &&
          (Boolean(compradorNombreIa) || compradorSugerencias.length > 0)
            ? "Elegir cliente"
            : idComprador
              ? "Cambiar cliente"
              : "Seleccionar cliente"
        }
        description={
          !idComprador && compradorPickerPriorityIds.length > 0
            ? compradorNombreIa?.trim()
              ? `Catálogo completo. Arriba van primero las opciones más parecidas a «${compradorNombreIa.trim()}».`
              : "Catálogo completo. Arriba van primero las opciones más parecidas a lo del pedido."
            : "Catálogo completo de clientes de la cuenta."
        }
        dockWithCypher={cypherOpen && isEditing}
      />

      <OrdenVentaProductoPickerModal
        open={picker === "producto"}
        onClose={() => {
          setPicker(null);
          setReplaceLineaIndex(null);
        }}
        productos={productosParaPicker}
        priorityIds={productoPickerPriorityIds}
        selectedId={
          replaceLineaIndex != null
            ? lineas[replaceLineaIndex]?.idProducto || null
            : null
        }
        onSelect={handleSelectProducto}
        title={
          replaceLineaIndex != null &&
          lineas[replaceLineaIndex]?.catalogPending
            ? "Elegir producto"
            : replaceLineaIndex != null
              ? "Reemplazar producto"
              : "Seleccionar producto"
        }
        description={
          replaceLineaIndex != null &&
          lineas[replaceLineaIndex]?.catalogPending
            ? lineas[replaceLineaIndex]?.aliasCliente?.trim()
              ? `Catálogo completo. Arriba van primero las opciones más parecidas a «${lineas[replaceLineaIndex]!.aliasCliente!.trim()}».`
              : "Catálogo completo. Arriba van primero las opciones más parecidas a lo del pedido."
            : replaceLineaIndex != null
              ? "Elige el producto del catálogo para esta línea del pedido."
              : "Catálogo completo de productos de la cuenta."
        }
        dockWithCypher={cypherOpen && isEditing}
      />

      <OrdenVentaSugerenciasPickerModal
        open={picker === "sugerencias"}
        onClose={() => {
          setPicker(null);
          setReplaceLineaIndex(null);
        }}
        textoCliente={
          replaceLineaIndex != null
            ? lineas[replaceLineaIndex]?.aliasCliente ||
              lineas[replaceLineaIndex]?.nombre
            : null
        }
        sugerencias={
          replaceLineaIndex != null && lineas[replaceLineaIndex]
            ? collectSugerenciasLinea(lineas[replaceLineaIndex]!)
            : []
        }
        onSelect={(sug) => {
          if (replaceLineaIndex == null) return;
          handleAcceptSugerencia(replaceLineaIndex, sug);
        }}
        onOpenCatalogo={() => {
          const idx = replaceLineaIndex;
          if (idx == null) return;
          handleOpenReplaceProducto(idx);
        }}
        dockWithCypher={cypherOpen && isEditing}
      />

      <OrdenVentaTablePickerModal
        open={picker === "moneda"}
        onClose={() => setPicker(null)}
        title="Seleccionar moneda"
        description="Monedas disponibles para el pedido."
        columns={["Moneda"]}
        rows={MONEDA_OPTIONS.map((option) => ({
          id: option.value,
          cells: [option.label],
        }))}
        selectedId={moneda}
        searchPlaceholder="Buscar moneda"
        emptyLabel="No hay monedas disponibles."
        onSelect={(row) => setMoneda(row.id)}
        dockWithCypher={cypherOpen && isEditing}
      />

      <OrdenVentaTablePickerModal
        open={picker === "bodega"}
        onClose={() => setPicker(null)}
        title="Seleccionar bodega de origen"
        description="Bodegas disponibles de la cuenta."
        columns={["Bodega"]}
        rows={bodegasDestino.map((bodega) => ({
          id: bodega.idBodega,
          cells: [bodega.label],
        }))}
        selectedId={idBodegaDestino || null}
        searchPlaceholder="Buscar bodega"
        emptyLabel="No hay bodegas registradas."
        onSelect={(row) => setIdBodegaDestino(row.id)}
        dockWithCypher={cypherOpen && isEditing}
      />

      <CompradorCreateModal
        open={isCompradorCreateOpen}
        stackLevel="nested"
        dockWithCypher={cypherOpen && isEditing}
        onClose={() => {
          setIsCompradorCreateOpen(false);
          if (startMode === "first_time" && step === "start") {
            setStartMode(null);
          }
        }}
        onCreated={handleCompradorCreatedForSale}
      />

      <PolariaConfirmDialog
        open={confirmDiscrepanciasOpen}
        stackLevel="nested"
        onClose={() => setConfirmDiscrepanciasOpen(false)}
        onConfirm={() => {
          setConfirmDiscrepanciasOpen(false);
          // Una sola confirmación: "Usar valores del pedido" ya autoriza el envío.
          skipDiscrepanciaConfirmRef.current = true;
          skipSaveConfirmRef.current = true;
          void handleSubmit({
            preventDefault() {},
          } as FormEvent<HTMLFormElement>);
        }}
        title="Revisa diferencias antes de confirmar"
        description="Si continúas, queda lo de la columna «Definitivo». Revisa qué cambió:"
        confirmLabel="Aceptar"
        cancelLabel="Volver a editar"
        size="lg"
      >
        {avisosValidacion.length > 0 ? (
          <ul className="divide-y divide-polaria-w-08 rounded-xl border border-polaria-w-08">
            {avisosValidacion.map((item) => {
              const showReemplazar = canReemplazarDiscrepancia(item);
              const isFecha = item.fieldKey === "fechaEntrega";
              const reemplazarLabel =
                isFecha && item.db === "Hoy o posterior"
                  ? "Usar hoy"
                  : "Usar del catálogo";
              // REQ-105: columnas Inicial / Definitivo (todas las filas).
              const leftLabel = "Inicial";
              const rightLabel = "Definitivo";
              const leftValue =
                isFecha && item.db === "Leída del correo"
                  ? "Vacía / no leída del correo"
                  : isFecha && item.db === "Hoy o posterior"
                    ? "Fecha atrasada (catálogo pide hoy o posterior)"
                    : item.db || "—";
              return (
              <li key={item.fieldKey || item.campo} className="px-3 py-2.5 sm:px-3.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="polaria-text-caption font-semibold uppercase tracking-wide text-polaria-warning">
                    {item.campo}
                  </p>
                  {showReemplazar ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleReemplazarDiscrepancia(item);
                      }}
                      className={cn(
                        "rounded-lg border border-polaria-t-20 bg-polaria-t-08 px-2.5 py-1",
                        "polaria-text-caption font-semibold text-polaria-teal transition hover:opacity-90",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
                      )}
                    >
                      {reemplazarLabel}
                    </button>
                  ) : null}
                </div>
                <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 sm:gap-2">
                  <div>
                    <p className="polaria-text-caption text-polaria-w-20">
                      {leftLabel}
                    </p>
                    <p className="mt-0.5 line-clamp-3 break-words polaria-text-body-sm text-polaria-w-50">
                      {leftValue}
                    </p>
                  </div>
                  <div>
                    <p className="polaria-text-caption text-polaria-teal">
                      {rightLabel}
                    </p>
                    <p className="mt-0.5 line-clamp-3 break-words polaria-text-body-sm text-polaria-w">
                      {item.ia || "—"}
                    </p>
                  </div>
                </div>
              </li>
              );
            })}
          </ul>
        ) : (
          <p className="polaria-text-body-sm text-polaria-w-50">
            Si continúas, se usarán los valores de este pedido.
          </p>
        )}
      </PolariaConfirmDialog>

      <PolariaConfirmDialog
        open={confirmSaveOpen}
        stackLevel="nested"
        onClose={() => setConfirmSaveOpen(false)}
        onConfirm={() => {
          if (
            esPorConfirmar &&
            !isFechaEntregaIsoValida(fechaEntrega)
          ) {
            setConfirmSaveOpen(false);
            setMissingFields((prev) => new Set(prev).add("fechaEntrega"));
            setError("Ingresa la fecha de entrega.");
            return;
          }
          setConfirmSaveOpen(false);
          skipSaveConfirmRef.current = true;
          void handleSubmit({
            preventDefault() {},
          } as FormEvent<HTMLFormElement>);
        }}
        title={
          isEditing && editingEstado !== "por_confirmar"
            ? "¿Actualizar el pedido?"
            : "¿Confirmar el pedido?"
        }
        description={
          isEditing && editingEstado !== "por_confirmar"
            ? "Se actualizarán los datos del pedido."
            : "El pedido pasará a Confirmada y se enviará a bodega."
        }
        confirmLabel="Confirmar"
        cancelLabel={
          isEditing && editingEstado !== "por_confirmar" ? (
            "Revisar"
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Save className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
              Revisar
            </span>
          )
        }
      >
        {isFechaEntregaIsoValida(fechaEntrega) ? (
          <p className="polaria-text-body-sm text-polaria-w-50">
            Fecha de entrega:{" "}
            <span className="font-semibold text-polaria-w">
              {formatIsoToDdMmYyyy(fechaEntrega)}
            </span>
          </p>
        ) : null}
        {fechaEntregaAtrasada ? (
          <p className="rounded-xl border border-polaria-warning-border bg-polaria-warning-bg px-4 py-3 polaria-text-body-sm text-polaria-warning">
            {FECHA_ENTREGA_ATRASADA_WARNING}
          </p>
        ) : null}
        {avisoPotencialDuplicado ? (
          <p className="rounded-xl border border-polaria-warning-border bg-polaria-warning-bg px-4 py-3 polaria-text-body-sm text-polaria-warning">
            {avisoPotencialDuplicado.ia}
          </p>
        ) : null}
      </PolariaConfirmDialog>

      <PolariaConfirmDialog
        open={confirmDiscardOpen}
        stackLevel="nested"
        onClose={() => setConfirmDiscardOpen(false)}
        onConfirm={() => {
          setConfirmDiscardOpen(false);
          onClose();
        }}
        title="¿Salir del pedido?"
        description={
          ordenesTrabajoForm.length > 1
            ? "Se perderá el progreso capturado, incluidas las órdenes de trabajo."
            : "Se perderá el progreso capturado y volverás a Ventas."
        }
        confirmLabel="Salir"
        cancelLabel="Seguir editando"
      />

      <PolariaConfirmDialog
        open={addOtOpen}
        stackLevel="nested"
        onClose={() => {
          setAddOtOpen(false);
          setError(null);
        }}
        onConfirm={handleAddOrdenTrabajo}
        title="¿Agregar tarea de almacén?"
        description="Se creará una orden de trabajo adicional. Indica el centro de consumo y confirma."
        confirmLabel="Sí, agregar"
        cancelLabel="Cancelar"
      >
        <div className="flex flex-col gap-3">
          <PolariaFormInput
            id="orden-venta-add-ot-almacen"
            label="Centro de consumo"
            required
            value={addOtAlmacen}
            onChange={(event) => setAddOtAlmacen(event.target.value)}
            placeholder="Ej. BANQUETES, CANTINA…"
            autoFocus
          />
          <PolariaFormInput
            id="orden-venta-add-ot-numero-pedido"
            label="Orden de compra del cliente"
            value={addOtNumeroPedido}
            onChange={(event) => setAddOtNumeroPedido(event.target.value)}
            placeholder="Opcional"
          />
        </div>
      </PolariaConfirmDialog>

      <PolariaConfirmDialog
        open={Boolean(confirmRemoveOtId)}
        stackLevel="nested"
        onClose={() => setConfirmRemoveOtId(null)}
        onConfirm={handleConfirmRemoveOrdenTrabajo}
        title="¿Eliminar esta tarea de almacén?"
        description="Se quitará la tarea y sus productos de esta venta. Esta acción no se puede deshacer aquí."
        confirmLabel="Sí, eliminar"
        cancelLabel="Conservar"
      />

      <OrdenVentaReagruparOtModal
        open={reagruparModalAbierto({
          reagruparOpen,
          cypherOpen,
          isEditing,
          tieneOrdenVenta: Boolean(editingId),
        })}
        idOrdenVenta={editingId}
        folio={folioVisible}
        onClose={() => setReagruparOpen(false)}
        obtenerSolicitud={obtenerSolicitudReagrupacion}
        onAplicar={handleAplicarReagrupacion}
      />
    </>
  );
}
