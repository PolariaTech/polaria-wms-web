"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  PolariaFormField,
  PolariaFormInput,
  PolariaFormSelect,
  POLARIA_FORM_INPUT_CLASS_COMPACT,
  POLARIA_FORM_SELECT_CLASS_COMPACT,
} from "@/components/shared/form/PolariaFormField";
import { PolariaConfirmDialog } from "@/components/shared/form/PolariaConfirmDialog";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { formatKgEs, formatPrecioEs, parseDecimalEs } from "@/lib/utils/decimal-es";
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
  CATALOGO_VENTA_SIN_STOCK_MESSAGE,
} from "../../shared/constants/sales-status";
import { fetchProductosVentaCatalogo } from "../../shared/services/sales-catalog.api";
import { emitirOrdenVentaApi } from "../../shared/services/sales-api.service";
import {
  createOrdenVenta,
  getOrdenVentaDetalle,
} from "../../shared/services/sales.service";
import type { ProductoVentaOption } from "../../shared/types/sales.types";
import { OrdenVentaCompradorPickerModal } from "./OrdenVentaCompradorPickerModal";
import { OrdenVentaProductoPickerModal } from "./OrdenVentaProductoPickerModal";
import { leerPedidoConIaApi } from "../services/sales-ai.api";
import {
  buildOrdenVentaCapturaObservaciones,
  isAfterWarehouseCutoff,
  tomorrowIsoDate,
} from "../utils/build-orden-venta-captura-observaciones";
import {
  mapPedidoExtraidoToForm,
  type CampoDiscrepancia,
} from "../utils/map-pedido-extraido-to-form";
import { buildOrdenVentaPrefillFromComprador } from "../utils/prefill-orden-venta-from-comprador";

interface OrdenVentaCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type CaptureStep = "start" | "form";
type StartMode = "first_time" | "scratch" | "docs";
type PickerKind = "comprador" | "producto" | null;

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
  precioUnitario: number;
  aliasCliente?: string;
  filledByIa?: boolean;
}

function fieldControlClass(params: {
  field?: string;
  autoFields?: Set<string>;
  warnFields?: Set<string>;
  missing?: boolean;
}): string | undefined {
  const { field, autoFields, warnFields, missing } = params;
  if (missing) {
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

const PRESENTACION_OPTIONS = [
  { value: "", label: "—" },
  { value: "Caja 1.5 kg", label: "Caja 1.5 kg" },
  { value: "Caja 20 kg", label: "Caja 20 kg" },
  { value: "Caja 21 kg", label: "Caja 21 kg" },
  { value: "Granel", label: "Granel" },
] as const;

const IVA_PCT_OPTIONS = [
  { value: "0", label: "0%" },
  { value: "8", label: "8%" },
  { value: "16", label: "16%" },
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

const TURNO_OPTIONS = [
  { value: "", label: "—" },
  { value: "PM", label: "PM" },
  { value: "Noche / AM", label: "Noche / AM" },
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

function formatCompradorLabel(row: CompradorListRow): string {
  return `${row.codigo} — ${row.comprador}`;
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

export function OrdenVentaCreateModal({
  open,
  onClose,
  onCreated,
}: OrdenVentaCreateModalProps) {
  const { codigoCuenta } = useCompany();
  const session = useAuthStore((state) => state.session);
  const idCreador = session?.idUsuario ?? "";
  const vendedorNombre = session?.nombre?.trim() ?? "";

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
  const [turno, setTurno] = useState("");
  const [horaSalida, setHoraSalida] = useState("");
  const [chofer, setChofer] = useState("");
  const [unidad, setUnidad] = useState("");
  const [aceptaSustituciones, setAceptaSustituciones] = useState("");
  const [requiereLote, setRequiereLote] = useState("");
  const [registrarTemperatura, setRegistrarTemperatura] = useState("");
  const [origenTexto, setOrigenTexto] = useState("");
  const [origenArchivoFiles, setOrigenArchivoFiles] = useState<File[]>([]);
  const [lineas, setLineas] = useState<LineaVentaForm[]>([]);
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
  const [picker, setPicker] = useState<PickerKind>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReadingIa, setIsReadingIa] = useState(false);
  const [isDocsDropActive, setIsDocsDropActive] = useState(false);
  const [showFiscal, setShowFiscal] = useState(false);
  const [isCompradorCreateOpen, setIsCompradorCreateOpen] = useState(false);
  const [fichaComprador, setFichaComprador] = useState<CompradorAltaFicha | null>(
    null,
  );
  const [exigeOc, setExigeOc] = useState(false);
  const [autoFields, setAutoFields] = useState<Set<string>>(() => new Set());
  const [warnFields, setWarnFields] = useState<Set<string>>(() => new Set());
  const [discrepancias, setDiscrepancias] = useState<CampoDiscrepancia[]>([]);
  const [confirmDiscrepanciasOpen, setConfirmDiscrepanciasOpen] =
    useState(false);
  const selectedCompradorIdRef = useRef("");
  const skipDiscrepanciaConfirmRef = useRef(false);
  const docsFileInputRef = useRef<HTMLInputElement | null>(null);

  const hasProductos = productos.length > 0;
  const hasCompradores = compradores.length > 0;
  const afterCutoff = isAfterWarehouseCutoff();

  const productosParaAgregar = useMemo(
    () =>
      productos.filter(
        (producto) =>
          !lineas.some((linea) => linea.idProducto === producto.idProducto),
      ),
    [lineas, productos],
  );

  const puedeAgregarProducto = productosParaAgregar.length > 0;

  useEffect(() => {
    setLineas((prev) => {
      let changed = false;
      const next = prev.map((linea) => {
        const override = precioOverrideByProducto[linea.idProducto];
        if (override != null) {
          if (linea.precioUnitario === override) return linea;
          changed = true;
          return { ...linea, precioUnitario: override };
        }
        const base = productosBase.find(
          (row) => row.idProducto === linea.idProducto,
        );
        if (!base || linea.precioUnitario === base.precioUnitario) {
          return linea;
        }
        changed = true;
        return { ...linea, precioUnitario: base.precioUnitario };
      });
      return changed ? next : prev;
    });
  }, [precioOverrideByProducto, productosBase]);

  const subtotalVenta = useMemo(
    () => lineas.reduce((sum, linea) => sum + lineAmounts(linea).bruto, 0),
    [lineas],
  );

  const descuentosVenta = useMemo(
    () => lineas.reduce((sum, linea) => sum + lineAmounts(linea).descuento, 0),
    [lineas],
  );

  const ivaVenta = useMemo(
    () => lineas.reduce((sum, linea) => sum + lineAmounts(linea).iva, 0),
    [lineas],
  );

  const totalVenta = useMemo(
    () => Math.max(0, subtotalVenta - descuentosVenta + ivaVenta),
    [descuentosVenta, ivaVenta, subtotalVenta],
  );

  const pesoTotalKg = useMemo(
    () =>
      lineas.reduce((sum, linea) => {
        const cantidad = parseDecimalEs(linea.cantidadInput) ?? 0;
        return sum + Math.max(0, cantidad);
      }, 0),
    [lineas],
  );

  useEffect(() => {
    if (!open) return;

    setStep("start");
    setStartMode(null);
    setIsCompradorCreateOpen(false);
    setIdComprador("");
    setCompradorLabel("");
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
    setTurno("");
    setHoraSalida("");
    setChofer("");
    setUnidad("");
    setAceptaSustituciones("");
    setRequiereLote("");
    setRegistrarTemperatura("");
    setOrigenTexto("");
    setOrigenArchivoFiles([]);
    setLineas([]);
    setProductosBase([]);
    setPrecioOverrideByProducto({});
    setEquivalenciaByProducto({});
    setCompradores([]);
    setBodegasDestino([]);
    setIdBodegaDestino("");
    setPendingEmitId(null);
    setPicker(null);
    setAutoFields(new Set());
    setWarnFields(new Set());
    setDiscrepancias([]);
    setConfirmDiscrepanciasOpen(false);
    setIsReadingIa(false);
    skipDiscrepanciaConfirmRef.current = false;
    setError(null);
    setIsSaving(false);
    setShowFiscal(false);
    setFichaComprador(null);
    setExigeOc(false);

    if (!codigoCuenta) return;

    setIsLoading(true);

    void Promise.all([
      fetchProductosVentaCatalogo(codigoCuenta),
      listCompradoresAdmin({ codigoCuenta }),
      listBodegasInternasVinculadasAdmin({ codigoCuenta }),
      listBodegasExternasVinculadasAdmin({ codigoCuenta }),
    ])
      .then(([productoRows, compradorRows, internas, externas]) => {
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
        if (destinoRows.length === 1) {
          setIdBodegaDestino(destinoRows[0]!.idBodega);
        }
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los datos del formulario.",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [codigoCuenta, open]);

  const applyCompradorPrefill = useCallback(
    (row: CompradorListRow, ficha: CompradorAltaFicha) => {
      const prefill = buildOrdenVentaPrefillFromComprador({
        ficha,
        telefonoComprador: row.telefono,
      });
      setFichaComprador(ficha);
      setExigeOc(prefill.exigeOc);
      setMoneda(prefill.moneda);
      setCentroConsumo(prefill.centroConsumo);
      setVentanaDesde(prefill.ventanaDesde);
      setVentanaHasta(prefill.ventanaHasta);
      setDireccion(prefill.direccion);
      setAnden(prefill.anden);
      setContacto(prefill.contacto);
      setTelefono(prefill.telefono);
      setAceptaSustituciones(prefill.aceptaSustituciones);
      setRequiereLote(prefill.requiereLote);
      setRegistrarTemperatura(prefill.registrarTemperatura);
      setObservaciones(prefill.observaciones);
    },
    [],
  );

  const handleSelectComprador = useCallback(
    (row: CompradorListRow) => {
      selectedCompradorIdRef.current = row.idComprador;
    setIdComprador(row.idComprador);
    setCompradorLabel(formatCompradorLabel(row));
      setTelefono(row.telefono?.trim() || "");
      setFichaComprador(null);
      setExigeOc(false);
    setError(null);
      setPrecioOverrideByProducto({});
      setEquivalenciaByProducto({});

      if (!codigoCuenta) return;

      void getCompradorAdmin({
        codigoCuenta,
        idComprador: row.idComprador,
      })
        .then((detalle) => {
          if (selectedCompradorIdRef.current !== row.idComprador) return;
          applyCompradorPrefill(row, detalle.ficha);
        })
        .catch(() => {
          if (selectedCompradorIdRef.current !== row.idComprador) return;
          setError(
            "Se seleccionó el cliente, pero no se pudieron cargar sus datos de alta.",
          );
        });

      void listCompradorProductoAliasAdmin({
        codigoCuenta,
        idComprador: row.idComprador,
      })
        .then((aliases) => {
          if (selectedCompradorIdRef.current !== row.idComprador) return;
          const overrides: Record<string, number> = {};
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
    [applyCompradorPrefill, codigoCuenta],
  );

  const handleSelectProducto = useCallback((row: ProductoVentaOption) => {
    setLineas((prev) => {
      if (prev.some((linea) => linea.idProducto === row.idProducto)) {
        return prev;
      }
      return [
        ...prev,
        {
          idProducto: row.idProducto,
          nombre: row.nombre,
          codigo: row.codigo,
          idBodega: row.idBodega,
          cantidadInput: "",
          cajasInput: "",
          presentacion: "",
          especificacion: "",
          descuentoPctInput: "",
          ivaPct: "16",
          kgDisponible: row.kgDisponible,
          precioUnitario: row.precioUnitario,
        },
      ];
    });
    setError(null);
    setIdBodegaDestino((prev) => prev || row.idBodega);
  }, []);

  const handleRemoveLinea = useCallback((index: number) => {
    setLineas((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  const handleCantidadChange = useCallback((index: number, value: string) => {
    setLineas((prev) =>
      prev.map((linea, i) =>
        i === index ? { ...linea, cantidadInput: value } : linea,
      ),
    );
  }, []);

  const handleLineaFieldChange = useCallback(
    (
      index: number,
      field:
        | "cajasInput"
        | "presentacion"
        | "especificacion"
        | "descuentoPctInput"
        | "ivaPct",
      value: string,
    ) => {
      setLineas((prev) =>
        prev.map((linea, i) =>
          i === index ? { ...linea, [field]: value } : linea,
        ),
      );
    },
    [],
  );

  const openFormFromScratch = useCallback(() => {
    setStartMode("scratch");
    setStep("form");
    setError(null);
  }, []);

  const openFirstTimeFlow = useCallback(() => {
    setStartMode("first_time");
    setError(null);
    setIsCompradorCreateOpen(true);
  }, []);

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
      setStep("form");
      setError(null);
      setIsCompradorCreateOpen(false);
    },
    [handleSelectComprador],
  );

  const origenArchivos = useMemo(
    () => origenArchivoFiles.map((file) => file.name),
    [origenArchivoFiles],
  );

  const openFormFromDocs = useCallback(async () => {
    if (!codigoCuenta) {
      setError("No hay cuenta activa.");
      return;
    }
    if (!idComprador) {
      setError("Selecciona un cliente.");
      return;
    }
    if (!origenTexto.trim() && origenArchivoFiles.length === 0) {
      setError("Pega el texto del pedido o adjunta al menos un archivo.");
      return;
    }

    setIsReadingIa(true);
    setError(null);

    try {
      const pedido = await leerPedidoConIaApi({
        codigoCuenta,
        cliente: compradorLabel || idComprador,
        texto: origenTexto,
        archivos: origenArchivoFiles,
      });

      const fichaBase = fichaComprador
        ? buildOrdenVentaPrefillFromComprador({
            ficha: fichaComprador,
            telefonoComprador:
              compradores.find((row) => row.idComprador === idComprador)
                ?.telefono ?? telefono,
          })
        : {
            centroConsumo,
            ventanaDesde,
            ventanaHasta,
            direccion,
            anden,
            contacto,
            telefono,
            aceptaSustituciones,
            requiereLote,
            registrarTemperatura,
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
          aceptaSustituciones: fichaBase.aceptaSustituciones,
          requiereLote: fichaBase.requiereLote,
          registrarTemperatura: fichaBase.registrarTemperatura,
          observaciones: fichaBase.observaciones,
        },
        tomorrowIso: tomorrowIsoDate(),
      });

      setFechaEntrega(mapped.fechaEntrega);
      setCentroConsumo(mapped.centroConsumo);
      setObservaciones(mapped.observaciones);
      setDireccion(mapped.direccion);
      setAnden(mapped.anden);
      setContacto(mapped.contacto);
      setTelefono(mapped.telefono);
      setVentanaDesde(mapped.ventanaDesde);
      setVentanaHasta(mapped.ventanaHasta);
      setAceptaSustituciones(mapped.aceptaSustituciones);
      setRequiereLote(mapped.requiereLote);
      setRegistrarTemperatura(mapped.registrarTemperatura);
      setAutoFields(mapped.autoFields);
      setWarnFields(mapped.warnFields);
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
          ivaPct: linea.ivaPct,
          kgDisponible: linea.kgDisponible,
          precioUnitario: linea.precioUnitario,
          aliasCliente: linea.aliasCliente,
          filledByIa: linea.filledByIa,
        })),
      );

      const avisos: string[] = [];
      if (mapped.advertencia) avisos.push(mapped.advertencia);
      if (mapped.archivosNoLegibles.length > 0) {
        avisos.push(
          `No se pudieron leer: ${mapped.archivosNoLegibles.join(", ")}. Se guardan como respaldo.`,
        );
      }
      if (mapped.lineas.length === 0 && !mapped.advertencia) {
        avisos.push(
          "No se reconocieron productos del catálogo. Revisa el pedido y agrégalos a mano.",
        );
      }

      setStartMode("docs");
      setStep("form");
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
    aceptaSustituciones,
    anden,
    centroConsumo,
    codigoCuenta,
    compradorLabel,
    compradores,
    contacto,
    direccion,
    fichaComprador,
    idComprador,
    observaciones,
    origenArchivoFiles,
    origenTexto,
    productos,
    registrarTemperatura,
    requiereLote,
    telefono,
    ventanaDesde,
    ventanaHasta,
  ]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);

      if (!codigoCuenta || !hasProductos || step !== "form") {
        return;
      }

      if (!idComprador) {
        setError("Selecciona un cliente.");
        return;
      }

      if (
        startMode === "docs" &&
        discrepancias.length > 0 &&
        !skipDiscrepanciaConfirmRef.current
      ) {
        setConfirmDiscrepanciasOpen(true);
        return;
      }
      skipDiscrepanciaConfirmRef.current = false;

      if (exigeOc && !ordenCompraHotel.trim()) {
        setError(
          "Este cliente exige orden de compra para facturar. Captúrala en el pedido.",
        );
        return;
      }

      if (lineas.length === 0) {
        setError("Agrega al menos un producto a la venta.");
        return;
      }

      if (!idBodegaDestino) {
        setError("Selecciona una bodega destino.");
        return;
      }

      const bodegaDestinoLabel =
        bodegasDestino.find((row) => row.idBodega === idBodegaDestino)?.label ??
        "";

      const lineasParsed: Array<{
        idProducto: string;
        cantidadPedida: number;
        idBodega: string;
      }> = [];

      for (const linea of lineas) {
        const cantidadKg = parseDecimalEs(linea.cantidadInput);
        if (cantidadKg === null || cantidadKg <= 0) {
          setError(`Ingresa una cantidad válida para ${linea.nombre}.`);
          return;
        }
        if (cantidadKg > linea.kgDisponible) {
          setError(
            `No puedes vender más de ${formatKgEs(linea.kgDisponible)} kg de ${linea.nombre}. Disponible en stock: ${formatKgEs(linea.kgDisponible)} kg.`,
          );
          return;
        }
        lineasParsed.push({
          idProducto: linea.idProducto,
          cantidadPedida: cantidadKg,
          idBodega: linea.idBodega,
        });
      }

      setIsSaving(true);

      let idOrdenVenta = pendingEmitId;

      try {
        if (!idOrdenVenta) {
          const notasLineasText = lineas
            .flatMap((linea) => {
              const bits: string[] = [];
              if (linea.presentacion.trim()) {
                bits.push(linea.presentacion.trim());
              }
              if (linea.especificacion.trim()) {
                bits.push(linea.especificacion.trim());
              }
              if (linea.cajasInput.trim()) {
                bits.push(`${linea.cajasInput.trim()} cajas`);
              }
              const descPct = parseDecimalEs(linea.descuentoPctInput);
              if (descPct != null && descPct > 0) {
                bits.push(`desc ${descPct}%`);
              }
              if (linea.ivaPct && linea.ivaPct !== "0") {
                bits.push(`IVA ${linea.ivaPct}%`);
              }
              if (bits.length === 0) return [];
              return [`${linea.nombre}: ${bits.join(" · ")}`];
            })
            .join("\n");

          const created = await createOrdenVenta({
          codigoCuenta,
            idBodega: lineasParsed[0]?.idBodega,
            idBodegaDestino,
          idComprador,
            lineas: lineasParsed,
            fechaEntrega,
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
            turno,
            horaSalida,
            chofer,
            unidad,
            aceptaSustituciones,
            requiereLote,
            registrarTemperatura,
            origenTexto: startMode === "docs" ? origenTexto : "",
            origenArchivos: startMode === "docs" ? origenArchivos : [],
            notasLineas: notasLineasText,
            notasAlmacen: observaciones,
            observaciones: buildOrdenVentaCapturaObservaciones({
              fechaEntrega,
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
              turno,
              horaSalida,
              chofer,
              unidad,
              aceptaSustituciones,
              requiereLote,
              registrarTemperatura,
              origenTexto: startMode === "docs" ? origenTexto : "",
              origenArchivos: startMode === "docs" ? origenArchivos : [],
              notasLineas: notasLineasText,
            }),
          idCreador: idCreador || null,
        });
          idOrdenVenta = created.idOrdenVenta;
          setPendingEmitId(idOrdenVenta);
        }

        try {
          await emitirOrdenVentaApi(idOrdenVenta);
        } catch (emitErr: unknown) {
          // Si el pedido ya salió a bodega en un intento previo, no bloquear.
          const emitMessage =
            emitErr instanceof DomainServiceError ? emitErr.message : "";
          const maybeAlreadyEmitted =
            emitMessage.includes("borrador") ||
            emitMessage.includes("estado");

          if (!maybeAlreadyEmitted || !codigoCuenta) {
            throw emitErr;
          }

          const detalle = await getOrdenVentaDetalle({
            codigoCuenta,
            idOrdenVenta,
          });
          if (
            detalle.estado === "borrador" ||
            detalle.estado === "cancelada" ||
            detalle.estado === "cerrada"
          ) {
            throw emitErr;
          }
        }

        setPendingEmitId(null);
        onCreated();
        onClose();
      } catch (err: unknown) {
        const message =
          err instanceof DomainServiceError
            ? err.message
            : idOrdenVenta
              ? "No se pudo enviar el pedido a la bodega destino."
              : "No se pudo crear la orden de venta.";
        setError(message);
      } finally {
        setIsSaving(false);
      }
    },
    [
      aceptaSustituciones,
      anden,
      centroConsumo,
      chofer,
      codigoCuenta,
      contacto,
      direccion,
      exigeOc,
      fechaEntrega,
      hasProductos,
      horaSalida,
      idBodegaDestino,
      idComprador,
      idCreador,
      lineas,
      moneda,
      observaciones,
      onClose,
      onCreated,
      ordenCompraHotel,
      origenArchivos,
      origenTexto,
      pendingEmitId,
      bodegasDestino,
      prioridad,
      registrarTemperatura,
      requiereLote,
      startMode,
      discrepancias,
      step,
      telefono,
      turno,
      unidad,
      vendedorNombre,
      ventanaDesde,
      ventanaHasta,
    ],
  );

  const emptyCatalogMessage = hasCompradores
    ? CATALOGO_VENTA_SIN_STOCK_MESSAGE
    : CATALOGO_VENTA_EMPTY_MESSAGE;

  const formDescription =
    startMode === "docs"
      ? "Desde mensaje o archivos · revisa y completa el pedido"
      : "Captura manual";

  const docsReady =
    Boolean(idComprador) &&
    Boolean(origenTexto.trim() || origenArchivoFiles.length > 0) &&
    productos.length > 0 &&
    !isReadingIa;

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

  return (
    <>
      <PolariaFormModal
        open={open}
        onClose={onClose}
        title={step === "form" ? "Pedido" : "Nuevo pedido"}
        description={
          step === "form"
            ? formDescription
            : startMode === "docs"
              ? "Tengo el mensaje o archivos"
              : "¿Cómo quieres empezar?"
        }
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        error={error}
        isSubmitting={isSaving}
        submitDisabled={isLoading || !hasProductos || lineas.length === 0}
        submitLabel="Validar y enviar"
        compact
        size={step === "start" ? "lg" : "2xl"}
        hideHeaderClose
        asForm={step === "form"}
        footerAction={step === "start" ? <></> : undefined}
        closeOnEscape={picker === null && !isCompradorCreateOpen}
      >
        {isLoading ? (
          <p className="polaria-text-body-sm text-polaria-w-50">Cargando…</p>
        ) : null}

        {step === "start" && !isLoading && startMode !== "docs" ? (
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
                Primera vez
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

        {step === "start" && !isLoading && startMode === "docs" ? (
          <div className="flex flex-col gap-3">
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

            <div className="rounded-2xl border border-polaria-t-20 bg-polaria-t-08 p-4">
            <PolariaFormField
                id="orden-venta-docs-cliente"
                label="Cliente"
                hint="De esto dependen los precios y la traducción de nombres de producto."
              compact
                required
            >
              <JefeBodegaModalSearchField
                  id="orden-venta-docs-cliente"
                value={compradorLabel}
                  placeholder="Selecciona el cliente"
                  ariaLabel="Cliente"
                  compact
                  controlClassName={fieldControlClass({
                    missing: !idComprador,
                  })}
                onSearchClick={() => setPicker("comprador")}
              />
            </PolariaFormField>

              <div className="mt-3">
                <PolariaFormField
                  id="orden-venta-docs-texto"
                  label="Texto del pedido"
                  hint="Pega aquí el mensaje tal cual llegó. No lo resumas."
                  compact
                >
                  <textarea
                    id="orden-venta-docs-texto"
                    value={origenTexto}
                    onChange={(event) => setOrigenTexto(event.target.value)}
                    placeholder="Pega aquí el mensaje tal cual llegó. No lo resumas."
                    className={cn(
                      POLARIA_FORM_INPUT_CLASS_COMPACT,
                      "min-h-[6.5rem] resize-y",
                    )}
                  />
                </PolariaFormField>
              </div>

              <div className="mt-3">
                <PolariaFormField
                  id="orden-venta-docs-archivos"
                  label="Archivos"
                  hint="Se leen PDF, Excel, CSV, Word y fotos. Otros formatos se guardan como respaldo sin leerse."
                  compact
                >
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
                      "block cursor-pointer rounded-xl border border-dashed px-4 py-4 text-center",
                      "polaria-text-body-sm transition",
                      isDocsDropActive
                        ? "border-polaria-teal bg-polaria-t-08 text-polaria-teal"
                        : "border-polaria-t-20 bg-polaria-w-08 text-polaria-w-50 hover:border-polaria-teal hover:text-polaria-teal",
                    )}
                  >
                    Arrastra o selecciona archivos
                    <input
                      id="orden-venta-docs-archivos"
                      ref={docsFileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.xlsx,.xls,.csv,.txt,.docx,image/*"
                      className="sr-only"
                      onChange={(event) => {
                        appendDocsFiles(event.target.files ?? []);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {origenArchivoFiles.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {origenArchivoFiles.map((file) => (
                        <li
                          key={`${file.name}-${file.size}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-polaria-w-08 bg-polaria-w-08 px-2 py-1 polaria-text-caption text-polaria-w"
                        >
                          <span>{file.name}</span>
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
                            className="text-polaria-w-50 transition hover:text-polaria-danger"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </PolariaFormField>
              </div>

              <button
                type="button"
                onClick={() => {
                  void openFormFromDocs();
                }}
                disabled={!docsReady}
                className={cn(
                  "mt-4 rounded-xl bg-polaria-teal px-5 py-2.5",
                  "polaria-text-body-sm font-semibold text-polaria-bg transition hover:opacity-90",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                {isReadingIa ? "Leyendo el pedido…" : "Leer y llenar el formulario"}
              </button>
            </div>
          </div>
        ) : null}

        {step === "form" && !isLoading ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
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
              <p className="polaria-text-caption text-polaria-w-50">
                {afterCutoff
                  ? "Después del corte de las 17:00 — el almacén no tendrá a quién preguntarle hasta las 02:00"
                  : "Captura abierta"}
              </p>
            </div>

            {!hasProductos ? (
              <p className="rounded-xl border border-polaria-warning-border bg-polaria-warning-bg px-4 py-3 polaria-text-body-sm text-polaria-warning">
                {emptyCatalogMessage}
              </p>
            ) : null}

            {startMode === "docs" && (origenTexto.trim() || origenArchivos.length > 0) ? (
              <div className="rounded-xl border border-polaria-t-20 bg-polaria-w-08 px-4 py-3">
                <p className="polaria-text-label text-polaria-w">
                  De dónde salió este pedido
                </p>
                {origenTexto.trim() ? (
                  <p className="mt-2 border-l-2 border-polaria-teal pl-3 polaria-text-body-sm text-polaria-w">
                    «{origenTexto.trim()}»
                  </p>
                ) : null}
                {origenArchivos.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {origenArchivos.map((name) => (
                      <span
                        key={name}
                        className="rounded-lg border border-polaria-w-08 bg-polaria-t-08 px-2 py-1 polaria-text-caption text-polaria-w-50"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                ) : null}
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
                    <PolariaFormField
                      id="orden-venta-cliente"
                      label="Cliente"
                      compact
                      required
                      className="sm:col-span-2"
                    >
                      <JefeBodegaModalSearchField
                        id="orden-venta-cliente"
                        value={compradorLabel}
                        placeholder="Selecciona un cliente"
                        ariaLabel="Cliente"
                        compact
                        controlClassName={fieldControlClass({
                          missing: !idComprador,
                        })}
                        onSearchClick={() => setPicker("comprador")}
                  />
                </PolariaFormField>

                    <PolariaFormInput
                      id="orden-venta-oc-hotel"
                      label="Orden de compra del hotel"
                      value={ordenCompraHotel}
                      onChange={(event) => setOrdenCompraHotel(event.target.value)}
                      hint={
                        exigeOc
                          ? "Este cliente exige OC para facturar."
                          : undefined
                      }
                      required={exigeOc}
                      controlClassName={fieldControlClass({
                        missing: exigeOc && !ordenCompraHotel.trim(),
                      })}
                      compact
                    />

                    <PolariaFormInput
                      id="orden-venta-centro"
                      label="Centro de consumo / cocina"
                      value={centroConsumo}
                      onChange={(event) => {
                        setCentroConsumo(event.target.value);
                        setAutoFields((prev) => {
                          const next = new Set(prev);
                          next.delete("centroConsumo");
                          return next;
                        });
                        setWarnFields((prev) => {
                          const next = new Set(prev);
                          next.delete("centroConsumo");
                          return next;
                        });
                      }}
                      controlClassName={fieldControlClass({
                        field: "centroConsumo",
                        autoFields,
                        warnFields,
                      })}
                      hint={
                        warnFields.has("centroConsumo")
                          ? `Registrado en ficha distinto al del pedido`
                          : undefined
                      }
                      compact
                    />

                    <PolariaFormInput
                      id="orden-venta-vendedor"
                      label="Vendedor"
                      value={vendedorNombre || "—"}
                      readOnly
                      compact
                    />

                    <PolariaFormInput
                      id="orden-venta-fecha-entrega"
                      label="Fecha de entrega"
                      type="date"
                      value={fechaEntrega}
                      onChange={(event) => setFechaEntrega(event.target.value)}
                      controlClassName={fieldControlClass({
                        field: "fechaEntrega",
                        autoFields,
                        warnFields,
                        missing: !fechaEntrega,
                      })}
                      compact
                    />

                    <PolariaFormInput
                      id="orden-venta-ventana-desde"
                      label="Ventana de entrega — desde"
                      type="time"
                      value={ventanaDesde}
                      onChange={(event) => setVentanaDesde(event.target.value)}
                      controlClassName={fieldControlClass({
                        field: "ventanaDesde",
                        autoFields,
                        warnFields,
                      })}
                      compact
                    />

                    <PolariaFormInput
                      id="orden-venta-ventana-hasta"
                      label="Ventana de entrega — hasta"
                      type="time"
                      value={ventanaHasta}
                      onChange={(event) => setVentanaHasta(event.target.value)}
                      controlClassName={fieldControlClass({
                        field: "ventanaHasta",
                        autoFields,
                        warnFields,
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

                    <PolariaFormSelect
                      id="orden-venta-moneda"
                      label="Moneda"
                      value={moneda}
                      onChange={(event) => setMoneda(event.target.value)}
                      options={MONEDA_OPTIONS}
                      compact
                    />

                    <PolariaFormSelect
                      id="orden-venta-bodega-destino"
                      label="Bodega destino"
                      value={idBodegaDestino}
                      onChange={(event) => setIdBodegaDestino(event.target.value)}
                      options={[
                        { value: "", label: "Selecciona una bodega" },
                        ...bodegasDestino.map((bodega) => ({
                          value: bodega.idBodega,
                          label: bodega.label,
                        })),
                      ]}
                      required
                      controlClassName={fieldControlClass({
                        missing: !idBodegaDestino,
                      })}
                      compact
                      fieldClassName="sm:col-span-2"
                    />

                    <PolariaFormInput
                      id="orden-venta-observaciones"
                      label="Observaciones"
                      value={observaciones}
                      placeholder="Notas para almacén"
                      onChange={(event) => setObservaciones(event.target.value)}
                      controlClassName={fieldControlClass({
                        field: "observaciones",
                        autoFields,
                        warnFields,
                      })}
                      compact
                      fieldClassName="sm:col-span-3"
                    />
                  </div>
                </CaptureSection>

                <CaptureSection title="Entrega">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <PolariaFormInput
                      id="orden-venta-direccion"
                      label="Dirección de entrega"
                      value={direccion}
                      onChange={(event) => setDireccion(event.target.value)}
                      controlClassName={fieldControlClass({
                        field: "direccion",
                        autoFields,
                        warnFields,
                      })}
                      compact
                      fieldClassName="sm:col-span-2"
                    />
                    <PolariaFormInput
                      id="orden-venta-anden"
                      label="Andén / punto de recepción"
                      value={anden}
                      onChange={(event) => setAnden(event.target.value)}
                      controlClassName={fieldControlClass({
                        field: "anden",
                        autoFields,
                        warnFields,
                      })}
                      compact
                    />
                    <PolariaFormInput
                      id="orden-venta-contacto"
                      label="Contacto en el hotel"
                      value={contacto}
                      onChange={(event) => setContacto(event.target.value)}
                      controlClassName={fieldControlClass({
                        field: "contacto",
                        autoFields,
                        warnFields,
                      })}
                      compact
                    />
                    <PolariaFormInput
                      id="orden-venta-telefono"
                      label="Teléfono del contacto"
                      type="tel"
                      value={telefono}
                      onChange={(event) => setTelefono(event.target.value)}
                      controlClassName={fieldControlClass({
                        field: "telefono",
                        autoFields,
                        warnFields,
                      })}
                      compact
                    />
                    <PolariaFormSelect
                      id="orden-venta-turno"
                      label="Turno que prepara"
                      value={turno}
                      onChange={(event) => setTurno(event.target.value)}
                      options={TURNO_OPTIONS}
                      compact
                    />
                    <PolariaFormInput
                      id="orden-venta-hora-salida"
                      label="Hora sugerida de salida"
                      type="time"
                      value={horaSalida}
                      onChange={(event) => setHoraSalida(event.target.value)}
                      compact
                    />
                    <PolariaFormInput
                      id="orden-venta-chofer"
                      label="Chofer"
                      value={chofer}
                      placeholder="Por asignar"
                      onChange={(event) => setChofer(event.target.value)}
                      compact
                    />
                    <PolariaFormInput
                      id="orden-venta-unidad"
                      label="Unidad"
                      value={unidad}
                      onChange={(event) => setUnidad(event.target.value)}
                      compact
                    />
                </div>
                </CaptureSection>

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
                              Total
                            </td>
                            <td className="pt-2 font-mono polaria-text-body-sm font-semibold text-polaria-teal">
                              ${formatPrecioEs(totalVenta)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  }
                >
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[72rem] border-collapse text-left">
                    <colgroup>
                        <col style={{ width: "14rem" }} />
                        <col style={{ width: "6.5rem" }} />
                        <col style={{ width: "5rem" }} />
                        <col style={{ width: "5.5rem" }} />
                        <col style={{ width: "8.5rem" }} />
                        <col style={{ width: "8.5rem" }} />
                        <col style={{ width: "5.5rem" }} />
                        <col style={{ width: "6.5rem" }} />
                        <col style={{ width: "5.5rem" }} />
                        <col style={{ width: "6rem" }} />
                        <col style={{ width: "2.75rem" }} />
                    </colgroup>
                      <thead>
                      <tr className="border-b border-polaria-t-20">
                          <th className="px-1 pb-2 text-left polaria-text-caption font-medium text-polaria-w-50">
                            Producto{" "}
                            <span className="font-bold text-polaria-danger">*</span>
                        </th>
                          <th className="px-1 pb-2 text-left polaria-text-caption font-medium text-polaria-w-50">
                            Cant.{" "}
                            <span className="font-bold text-polaria-danger">*</span>
                        </th>
                          <th className="px-1 pb-2 text-left polaria-text-caption font-medium text-polaria-w-50">
                            Unidad
                        </th>
                          <th className="px-1 pb-2 text-left polaria-text-caption font-medium text-polaria-w-50">
                            Cajas
                          </th>
                          <th className="px-1 pb-2 text-left polaria-text-caption font-medium text-polaria-w-50">
                            Prese.
                          </th>
                          <th className="px-1 pb-2 text-left polaria-text-caption font-medium text-polaria-w-50">
                            Especi.
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
                          <th className="px-1 pb-2">
                          <span className="sr-only">Quitar</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                        {lineas.length === 0 ? (
                          <tr>
                            <td
                              colSpan={11}
                              className="px-1 py-4 text-center polaria-text-caption text-polaria-w-50"
                            >
                              Sin productos. Agrega al menos uno para crear la
                              venta.
                            </td>
                          </tr>
                        ) : (
                          lineas.map((linea, index) => {
                            const { importe } = lineAmounts(linea);
                            return (
                              <tr
                                key={linea.idProducto}
                          className="border-b border-polaria-w-08 last:border-b-0"
                        >
                                <td className="px-1 py-2 align-top">
                            <p className="truncate polaria-text-body-sm font-medium text-polaria-w">
                              {linea.nombre}
                            </p>
                            <p className="polaria-text-caption text-polaria-w-50">
                                    {linea.codigo}
                            </p>
                                  {linea.aliasCliente ? (
                                    <p className="mt-1 polaria-text-caption text-polaria-teal">
                                      Cliente escribió «{linea.aliasCliente}»
                                    </p>
                                  ) : null}
                          </td>
                                <td className="px-1 py-2 align-top">
                                  <input
                                    aria-label={`Cantidad de ${linea.nombre}`}
                                    type="text"
                                    inputMode="decimal"
                                    value={linea.cantidadInput}
                                    placeholder="0"
                                    onChange={(event) =>
                                      handleCantidadChange(
                                        index,
                                        event.target.value,
                                      )
                                    }
                                    className={cn(
                                      POLARIA_FORM_INPUT_CLASS_COMPACT,
                                      fieldControlClass({
                                        missing:
                                          !linea.cantidadInput.trim() ||
                                          (parseDecimalEs(linea.cantidadInput) ??
                                            0) <= 0,
                                      }) ??
                                        (linea.filledByIa
                                          ? "!border-polaria-teal/50 !bg-polaria-t-08"
                                          : undefined),
                                    )}
                                  />
                                  <p className="mt-1 polaria-text-caption text-polaria-w-50">
                                    Disp. {formatKgEs(linea.kgDisponible)} kg
                                  </p>
                          </td>
                                <td className="px-1 py-2 align-top">
                                  <input
                                    aria-label={`Unidad de ${linea.nombre}`}
                                    value="kg"
                                    readOnly
                                    className={POLARIA_FORM_INPUT_CLASS_COMPACT}
                                  />
                          </td>
                                <td className="px-1 py-2 align-top">
                                  <input
                                    aria-label={`Cajas de ${linea.nombre}`}
                                    type="text"
                                    inputMode="numeric"
                                    value={linea.cajasInput}
                                    onChange={(event) =>
                                      handleLineaFieldChange(
                                        index,
                                        "cajasInput",
                                        event.target.value,
                                      )
                                    }
                                    className={cn(
                                      POLARIA_FORM_INPUT_CLASS_COMPACT,
                                      linea.filledByIa &&
                                        linea.cajasInput &&
                                        "!border-polaria-teal/50 !bg-polaria-t-08",
                                    )}
                                  />
                                </td>
                                <td className="px-1 py-2 align-top">
                                  <select
                                    aria-label={`Presentación de ${linea.nombre}`}
                                    value={linea.presentacion}
                                    onChange={(event) =>
                                      handleLineaFieldChange(
                                        index,
                                        "presentacion",
                                        event.target.value,
                                      )
                                    }
                                    className={cn(
                                      POLARIA_FORM_SELECT_CLASS_COMPACT,
                                      linea.filledByIa &&
                                        linea.presentacion &&
                                        "!border-polaria-teal/50 !bg-polaria-t-08",
                                    )}
                                  >
                                    {PRESENTACION_OPTIONS.map((option) => (
                                      <option
                                        key={option.value || "empty"}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-1 py-2 align-top">
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
                                      linea.filledByIa &&
                                        linea.especificacion &&
                                        "!border-polaria-teal/50 !bg-polaria-t-08",
                                    )}
                                  />
                                </td>
                                <td className="px-1 py-2 align-top">
                                  <input
                                    aria-label={`Descuento % de ${linea.nombre}`}
                                    type="text"
                                    inputMode="decimal"
                                    value={linea.descuentoPctInput}
                                    placeholder="0"
                                    onChange={(event) =>
                                      handleLineaFieldChange(
                                        index,
                                        "descuentoPctInput",
                                        event.target.value,
                                      )
                                    }
                                    className={POLARIA_FORM_INPUT_CLASS_COMPACT}
                                  />
                                </td>
                                <td className="px-1 py-2 align-top">
                                  <input
                                    aria-label={`Precio de ${linea.nombre}`}
                                    value={`$${formatPrecioEs(linea.precioUnitario)}`}
                                    readOnly
                                    className={POLARIA_FORM_INPUT_CLASS_COMPACT}
                                  />
                                </td>
                                <td className="px-1 py-2 align-top">
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
                                    className={POLARIA_FORM_SELECT_CLASS_COMPACT}
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
                                </td>
                                <td className="px-1 py-2 align-top font-mono polaria-text-body-sm text-polaria-teal">
                                  ${formatPrecioEs(importe)}
                                </td>
                                <td className="px-1 py-2 align-top text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLinea(index)}
                                    className="rounded-lg p-2 text-polaria-w-50 transition hover:bg-polaria-w-08 hover:text-polaria-danger"
                                    aria-label={`Quitar ${linea.nombre}`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </button>
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

                <CaptureSection
                  title="Almacén y política del cliente"
                  optional="se anota en observaciones"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <PolariaFormInput
                      id="orden-venta-peso"
                      label="Peso total (kg)"
                      value={formatKgEs(pesoTotalKg)}
                      readOnly
                      compact
                    />
                    <PolariaFormSelect
                      id="orden-venta-sustituciones"
                      label="¿Acepta sustituciones?"
                      value={aceptaSustituciones}
                      onChange={(event) =>
                        setAceptaSustituciones(event.target.value)
                      }
                      options={SUSTITUCIONES_OPTIONS}
                      hint="Define qué puede hacer el almacén si falta producto."
                      controlClassName={fieldControlClass({
                        field: "aceptaSustituciones",
                        autoFields,
                        warnFields,
                      })}
                      compact
                    />
                    <PolariaFormSelect
                      id="orden-venta-lote"
                      label="Requiere lote / trazabilidad"
                      value={requiereLote}
                      onChange={(event) => setRequiereLote(event.target.value)}
                      options={SI_NO_OPTIONS}
                      controlClassName={fieldControlClass({
                        field: "requiereLote",
                        autoFields,
                        warnFields,
                      })}
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
                      controlClassName={fieldControlClass({
                        field: "registrarTemperatura",
                        autoFields,
                        warnFields,
                      })}
                      compact
                    />
            </div>
                </CaptureSection>

                <section className="overflow-hidden rounded-xl border border-polaria-t-20 bg-polaria-t-08">
                  <button
                    type="button"
                    onClick={() => setShowFiscal((prev) => !prev)}
                    className="w-full px-4 py-2.5 text-left polaria-text-label uppercase tracking-wide text-polaria-teal"
                  >
                    Datos fiscales — referencia{" "}
                    {showFiscal ? "▴" : "▾"}
                  </button>
                  {showFiscal ? (
                    <div className="border-t border-polaria-w-08 p-4">
                      {fichaComprador ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <PolariaFormInput
                            id="orden-venta-fiscal-razon"
                            label="Razón social"
                            value={fichaComprador.razonSocial || "—"}
                            readOnly
              compact
                            fieldClassName="sm:col-span-2"
                          />
                          <PolariaFormInput
                            id="orden-venta-fiscal-rfc"
                            label="RFC"
                            value={fichaComprador.rfc || "—"}
                            readOnly
                            compact
                          />
                          <PolariaFormInput
                            id="orden-venta-fiscal-regimen"
                            label="Régimen"
                            value={fichaComprador.regimen || "—"}
                            readOnly
                            compact
                            fieldClassName="sm:col-span-2"
                          />
                          <PolariaFormInput
                            id="orden-venta-fiscal-cp"
                            label="CP fiscal"
                            value={fichaComprador.cpFiscal || "—"}
                            readOnly
                            compact
                          />
                          <PolariaFormInput
                            id="orden-venta-fiscal-uso"
                            label="Uso CFDI"
                            value={fichaComprador.usoCfdi || "—"}
                            readOnly
                            compact
                            fieldClassName="sm:col-span-2"
                          />
                          <PolariaFormInput
                            id="orden-venta-fiscal-metodo"
                            label="Método de pago"
                            value={fichaComprador.metodoPago || "—"}
                            readOnly
                            compact
                          />
                          <PolariaFormInput
                            id="orden-venta-fiscal-forma"
                            label="Forma de pago"
                            value={fichaComprador.formaPago || "—"}
                            readOnly
                            compact
                          />
                          <PolariaFormInput
                            id="orden-venta-fiscal-correos"
                            label="Correos CFDI"
                            value={fichaComprador.correosCfdi || "—"}
                            readOnly
                            compact
                            fieldClassName="sm:col-span-2"
                          />
                          <p className="sm:col-span-3 polaria-text-body-sm text-polaria-w-50">
                            El WMS no timbra CFDI. Estos datos salen del comprador
                            y se resuelven en facturación.
                          </p>
                        </div>
                      ) : (
                        <p className="polaria-text-body-sm text-polaria-w-50">
                          Selecciona un cliente para ver su ficha fiscal. El WMS
                          no timbra CFDI.
                        </p>
                      )}
                    </div>
                  ) : null}
                </section>
              </>
            ) : null}
          </div>
        ) : null}
      </PolariaFormModal>

      <OrdenVentaCompradorPickerModal
        open={picker === "comprador"}
        onClose={() => setPicker(null)}
        compradores={compradores}
        selectedId={idComprador}
        onSelect={handleSelectComprador}
      />

      <OrdenVentaProductoPickerModal
        open={picker === "producto"}
        onClose={() => setPicker(null)}
        productos={productosParaAgregar}
        selectedId={null}
        onSelect={handleSelectProducto}
      />

      <CompradorCreateModal
        open={isCompradorCreateOpen}
        stackLevel="elevated"
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
        onClose={() => setConfirmDiscrepanciasOpen(false)}
        onConfirm={() => {
          setConfirmDiscrepanciasOpen(false);
          skipDiscrepanciaConfirmRef.current = true;
          void handleSubmit({
            preventDefault() {},
          } as FormEvent<HTMLFormElement>);
        }}
        title="Hay diferencias con la ficha del cliente"
        description={
          discrepancias.length > 0
            ? discrepancias
                .map(
                  (item) =>
                    `${item.campo}: registrado «${item.db}» · en el pedido «${item.ia}»`,
                )
                .join(" · ")
            : "Confirma para enviar con los valores del pedido."
        }
        confirmLabel="Enviar igual"
        cancelLabel="Revisar"
      />
    </>
  );
}
