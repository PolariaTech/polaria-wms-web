"use client";

import {
  FileText,
  Pencil,
  Printer,
  Trash2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  CYPHER_PANEL_WIDTH_CLASS,
  CYPHER_TRANSITION_MS,
} from "../../constants/cypher-layout";
import { PolariaConfirmDialog } from "@/components/shared/form/PolariaConfirmDialog";
import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import { PolariaTableBadge } from "@/components/shared/table/PolariaTableCells";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { formatKgEs, formatPrecioEs } from "@/lib/utils/decimal-es";
import { useBodyScrollLock } from "@/lib/utils/use-body-scroll-lock";
import { withCuentaSchema } from "@/lib/supabase/cuenta-schema";
import { useCuentaZonaHoraria } from "@/modules/configurator/cuentas/hooks/useCuentaZonaHoraria";
import {
  formatEstadoOrdenVenta,
  normalizeEstadoOrdenVenta,
  puedeAccionesAlmacenOrdenVenta,
  puedeBorrarOrdenVenta,
  puedeEditarOrdenVentaDesdeLista,
  variantEstadoOrdenVenta,
} from "../../../shared/constants/sales-status";
import { getOrdenVentaDetalle } from "../../../shared/services/sales.service";
import type {
  EstadoOrdenVenta,
  OrdenVentaDetalleRow,
  OrdenVentaOperadorRow,
} from "../../../shared/types/sales.types";
import { fetchOrdenVentaLog } from "../../services/orden-venta-log.client";
import type { OrdenVentaLogEntry } from "../../types/orden-venta-log.types";
import { filterLogEntriesVisible } from "../../utils/filter-log-entries-visible";
import {
  extractLogSlaCallout,
  logEntryToneBadgeClass,
  logEntryToneDotClass,
  resolveLogEntryAutorBadge,
  resolveLogEntryTone,
} from "../../utils/log-entry-tone";
import {
  formatCompradorOrdenVenta,
  formatOrdenVentaLineaTotal,
  formatOrdenVentaTotal,
  resolveOrdenVentaLineaTitulo,
  sumOrdenVentaCantidadKg,
} from "../../utils/orden-venta-display";
import {
  mergeOrigenAdjuntosWithEmlParts,
  nombresOrigenAdjuntos,
  origenAdjuntosFromEmlParts,
  parseOrigenArchivos,
  type OrigenAdjunto,
} from "../../utils/origen-adjuntos";
import {
  parseCorreoChromeFromText,
  type CorreoChrome,
} from "../../utils/correo-chrome";
import {
  looksLikeCorreoCuerpoEnNotas,
  prepareCorreoBodyForCypherDisplay,
} from "../../utils/texto-origen-pedido";
import {
  groupOrigenCorreoToOrdenesTrabajo,
  parseOrigenCorreoJson,
} from "../../utils/origen-correo-ordenes-trabajo";
import { resolveOrdenCompraLimpia } from "../../utils/normalize-numero-pedido";
import { OrigenAdjuntosCards } from "../shared/OrigenAdjuntosCards";
import { CypherAlistadoSection } from "./CypherAlistadoSection";
import { CypherAlistamientoSection } from "./CypherAlistamientoSection";
import { CypherClienteVsMateoSection } from "./CypherClienteVsMateoSection";
import { CypherDatosFiscalesSection } from "./CypherDatosFiscalesSection";

type CypherStageId =
  | "fiscales"
  | "correo"
  | "confirmacion"
  | "cliente-vs-mateo"
  | "alistamiento"
  | "alistado"
  | "bitacora";

const CYPHER_STAGES: ReadonlyArray<{
  id: CypherStageId;
  num: string;
  label: string;
  title: string;
}> = [
  {
    id: "fiscales",
    num: "00",
    label: "Fiscales",
    title: "Datos fiscales — referencia",
  },
  { id: "correo", num: "01", label: "Correo", title: "Recepción del correo" },
  {
    id: "confirmacion",
    num: "02",
    label: "Confirmación",
    title: "Confirmación del pedido",
  },
  {
    id: "cliente-vs-mateo",
    num: "03",
    label: "Correo vs Mateo IA vs usuario",
    title: "Correo vs Mateo IA vs usuario",
  },
  {
    id: "alistamiento",
    num: "04",
    label: "Alistamiento",
    title: "Alistamiento",
  },
  { id: "alistado", num: "05", label: "Alistado", title: "Alistado" },
  {
    id: "bitacora",
    num: "06",
    label: "Bitácora",
    title: "Bitácora de eventos",
  },
];

const ESTADO_STAGE_INDEX: Record<EstadoOrdenVenta, number> = {
  por_confirmar: 0,
  confirmada: 1,
  alistamiento: 2,
  alistada: 3,
  cancelada: 0,
};

function stageReached(
  estado: EstadoOrdenVenta,
  stage: CypherStageId,
): boolean {
  const current = ESTADO_STAGE_INDEX[estado] ?? 0;
  if (stage === "fiscales") return true;
  if (stage === "correo") return true;
  if (stage === "confirmacion") return current >= 1;
  if (stage === "cliente-vs-mateo") return true;
  if (stage === "alistamiento") return current >= 2;
  if (stage === "alistado") return current >= 3;
  return true; // bitácora siempre
}

/** Texto crudo del correo (completo) para el modal. */
function resolveCuerpoMensajeCompleto(orden: OrdenVentaDetalleRow): string {
  const fromOrigen = orden.origen_texto?.trim() || "";
  if (fromOrigen) return fromOrigen;
  const obsRaw = (orden.observaciones ?? "").trim();
  if (!obsRaw) return "";
  if (looksLikeCorreoCuerpoEnNotas(obsRaw) || obsRaw.length > 180) {
    return obsRaw;
  }
  return "";
}

/** Vista compacta en el cypher (sin reply/legal duplicados). */
function resolveCuerpoMensajePreview(orden: OrdenVentaDetalleRow): string {
  const full = resolveCuerpoMensajeCompleto(orden);
  if (!full) return "";
  return prepareCorreoBodyForCypherDisplay(full);
}

function StageHeading({
  num,
  title,
  muted = false,
}: {
  num: string;
  title: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span
        className={cn(
          "polaria-text-caption font-extrabold tracking-[0.16em]",
          muted ? "text-polaria-w-20" : "text-polaria-teal",
        )}
      >
        {num}
      </span>
      <h3
        className={cn(
          "polaria-text-card-title font-extrabold",
          muted ? "text-polaria-w-50" : "text-polaria-w",
        )}
      >
        {title}
      </h3>
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span className="polaria-text-caption font-bold tracking-[0.12em] text-polaria-w-20 pt-0.5">
        {label}
      </span>
      <div className="min-w-0 break-words polaria-text-body-sm text-polaria-w">
        {children}
      </div>
    </>
  );
}

function PendingStage({ num, title }: { num: string; title: string }) {
  return (
    <section className="pt-8">
      <StageHeading num={num} title={title} muted />
      <p className="mt-3 rounded-xl border border-dashed border-polaria-w-08 px-5 py-4 polaria-text-body-sm text-polaria-w-50">
        Aún no ocurre
      </p>
    </section>
  );
}

export type CypherCompanionOtHija = {
  id: string;
  label: string;
  productosCount: number;
  totalCantidad: number;
  almacen: string;
};

export type CypherCompanionOtPicker = {
  hijas: CypherCompanionOtHija[];
  /** OT activa en el panel izquierdo (resaltada). */
  selectedId?: string | null;
  onSelect: (id: string) => void;
};

export interface OrdenVentaCypherDrawerProps {
  idOrdenVenta: string | null;
  codigoCuenta: string | null;
  row: OrdenVentaOperadorRow | null;
  inspect?: boolean;
  busyKind: "print" | "preview" | "fotos" | "borrar" | null;
  onClose: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onPreview: () => void;
  /** Fotos de la OT seleccionada en Cypher (no de toda la OV). */
  onFotos: (idOrdenTrabajo: string) => void;
  /** Soft-delete (UI «Borrar»); solo por confirmar. */
  onBorrar?: () => void | Promise<void>;
  /**
   * Abierto junto al modal de edición o detalle: Cypher a la derecha, sin tapar el panel.
   */
  companionWithEdit?: boolean;
  /**
   * OV por confirmar + Cypher compañero: selector de OT en el panel derecho.
   */
  companionOtPicker?: CypherCompanionOtPicker | null;
}

export function OrdenVentaCypherDrawer({
  idOrdenVenta,
  codigoCuenta,
  row,
  inspect = false,
  busyKind,
  onClose,
  onEdit,
  onPrint,
  onPreview,
  onFotos,
  onBorrar,
  companionWithEdit = false,
  companionOtPicker = null,
}: OrdenVentaCypherDrawerProps) {
  const titleId = useId();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [orden, setOrden] = useState<OrdenVentaDetalleRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<CypherStageId>("correo");
  const [logEntries, setLogEntries] = useState<OrdenVentaLogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [emlInnerAdjuntos, setEmlInnerAdjuntos] = useState<OrigenAdjunto[]>(
    [],
  );
  const [emlChrome, setEmlChrome] = useState<CorreoChrome>({});
  const [emlInnerLoading, setEmlInnerLoading] = useState(false);
  const [confirmBorrarOpen, setConfirmBorrarOpen] = useState(false);
  const [borrarError, setBorrarError] = useState<string | null>(null);
  const [panelMounted, setPanelMounted] = useState(false);
  const [panelEntered, setPanelEntered] = useState(false);

  const open = Boolean(idOrdenVenta && codigoCuenta);
  const zonaHoraria = useCuentaZonaHoraria(codigoCuenta);

  useEffect(() => {
    if (open) {
      setPanelEntered(false);
      setPanelMounted(true);
      let inner = 0;
      const outer = window.requestAnimationFrame(() => {
        inner = window.requestAnimationFrame(() => setPanelEntered(true));
      });
      return () => {
        window.cancelAnimationFrame(outer);
        window.cancelAnimationFrame(inner);
      };
    }

    // REQ-108: al cerrar Cypher no dejar el confirm de borrar pegado.
    setConfirmBorrarOpen(false);
    setBorrarError(null);
    setPanelEntered(false);
    const timeout = window.setTimeout(() => {
      setPanelMounted(false);
    }, CYPHER_TRANSITION_MS);
    return () => window.clearTimeout(timeout);
  }, [open]);

  const loadDetalle = useCallback(
    (id: string, cuenta: string) => {
      const run = () =>
        getOrdenVentaDetalle({ codigoCuenta: cuenta, idOrdenVenta: id });
      if (inspect) return withCuentaSchema(cuenta, run);
      return run();
    },
    [inspect],
  );

  useEffect(() => {
    if (!idOrdenVenta || !codigoCuenta) {
      // Conservar contenido mientras cierra (animación); se limpia al abrir otra OV.
      return;
    }

    // REQ-108: al cambiar de OV, el pop-up de borrar de la anterior no debe reaparecer.
    setConfirmBorrarOpen(false);
    setBorrarError(null);

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setOrden(null);
    setActiveStage("correo");

    void loadDetalle(idOrdenVenta, codigoCuenta)
      .then((detalle) => {
        if (!cancelled) setOrden(detalle);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar el detalle de la venta.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, idOrdenVenta, loadDetalle]);

  /** OTs del origen (fallback si Cypher está solo, sin companion picker). */
  const hijasFromOrden = useMemo(() => {
    if (!orden) return [];
    return groupOrigenCorreoToOrdenesTrabajo(
      parseOrigenCorreoJson(orden.origen_correo),
    );
  }, [orden]);

  const [fallbackOtId, setFallbackOtId] = useState<string | null>(null);

  useEffect(() => {
    if (companionOtPicker) {
      setFallbackOtId(null);
      return;
    }
    if (hijasFromOrden.length === 0) {
      setFallbackOtId(null);
      return;
    }
    setFallbackOtId((prev) =>
      prev && hijasFromOrden.some((h) => h.id === prev)
        ? prev
        : (hijasFromOrden[0]?.id ?? null),
    );
  }, [companionOtPicker, hijasFromOrden]);

  /**
   * OT(s) en Confirmación: companion (detalle/edición) o fallback desde origen_correo.
   * Visible en cualquier estado para poder acotar Fotos / bitácora a la OT elegida.
   */
  const activeOtPicker = useMemo((): CypherCompanionOtPicker | null => {
    if (companionOtPicker && companionOtPicker.hijas.length > 0) {
      return companionOtPicker;
    }
    if (hijasFromOrden.length === 0) return null;
    return {
      hijas: hijasFromOrden.map((hija) => ({
        id: hija.id,
        label: hija.label,
        productosCount: hija.renglones.length,
        totalCantidad: hija.totalCantidad,
        almacen: hija.almacen,
      })),
      selectedId: fallbackOtId ?? hijasFromOrden[0]?.id ?? null,
      onSelect: (id: string) => setFallbackOtId(id),
    };
  }, [companionOtPicker, fallbackOtId, hijasFromOrden]);

  /** OT activa: bitácora se acota a esa OT. */
  const idOrdenTrabajoBitacora =
    activeOtPicker?.selectedId?.trim() || null;

  useEffect(() => {
    if (!idOrdenVenta || !codigoCuenta) {
      setLogEntries([]);
      return;
    }

    let cancelled = false;
    setLogLoading(true);
    void fetchOrdenVentaLog({
      idOrdenVenta,
      codigoCuenta,
      idOrdenTrabajo: idOrdenTrabajoBitacora,
      createdAt: orden?.created_at || orden?.fecha_pedido || row?.fecha,
      autor: orden?.vendedor ?? null,
    })
      .then((rows) => {
        if (!cancelled) setLogEntries(filterLogEntriesVisible(rows));
      })
      .catch(() => {
        if (!cancelled) setLogEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLogLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    codigoCuenta,
    idOrdenTrabajoBitacora,
    idOrdenVenta,
    orden?.created_at,
    orden?.fecha_pedido,
    orden?.vendedor,
    row?.fecha,
  ]);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, open]);

  const scrollToStage = useCallback((stageId: CypherStageId) => {
    setActiveStage(stageId);
    const el = document.getElementById(`cypher-stage-${stageId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (!open || isLoading || error || !orden) return;
    const root = scrollRef.current;
    if (!root) return;

    /**
     * Scroll-spy por posición (sirve con secciones altas/vacías).
     * Al llegar al fondo del panel → última etapa (Bitácora).
     */
    const updateActiveStage = () => {
      const lastStage = CYPHER_STAGES[CYPHER_STAGES.length - 1]!.id;
      const canScroll = root.scrollHeight > root.clientHeight + 4;
      const atBottom =
        canScroll &&
        root.scrollTop + root.clientHeight >= root.scrollHeight - 12;
      if (atBottom) {
        setActiveStage((prev) => (prev === lastStage ? prev : lastStage));
        return;
      }

      const marker = root.getBoundingClientRect().top + 28;
      let current: CypherStageId = CYPHER_STAGES[0]!.id;
      for (const stage of CYPHER_STAGES) {
        const el = document.getElementById(`cypher-stage-${stage.id}`);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= marker) {
          current = stage.id;
        }
      }
      setActiveStage((prev) => (prev === current ? prev : current));
    };

    updateActiveStage();
    root.addEventListener("scroll", updateActiveStage, { passive: true });
    window.addEventListener("resize", updateActiveStage);
    return () => {
      root.removeEventListener("scroll", updateActiveStage);
      window.removeEventListener("resize", updateActiveStage);
    };
  }, [error, isLoading, open, orden]);

  // Lista operativa primero: no mostrar «Confirmada» si la fila es por_confirmar.
  const estado = normalizeEstadoOrdenVenta(
    row?.estado ?? orden?.estado ?? "por_confirmar",
  ) as EstadoOrdenVenta;
  const codigo = orden?.codigo ?? row?.venta ?? "OV";
  const comprador =
    (orden ? formatCompradorOrdenVenta(orden) : null) ||
    row?.comprador ||
    "—";
  const occRaw = row?.occ || orden?.orden_compra_hotel?.trim() || "";
  const occ =
    resolveOrdenCompraLimpia(occRaw, orden?.origen_texto ?? "") || "—";
  const recibida = formatDateTime(
    orden?.created_at || orden?.fecha_pedido || row?.fecha || "",
    zonaHoraria,
  );

  const cuerpoCompleto = useMemo(
    () => (orden ? resolveCuerpoMensajeCompleto(orden) : ""),
    [orden],
  );
  const cuerpoMensaje = useMemo(
    () => (orden ? resolveCuerpoMensajePreview(orden) : ""),
    [orden],
  );
  const correoChrome = useMemo(() => {
    const fromText = parseCorreoChromeFromText(cuerpoCompleto || cuerpoMensaje);
    return {
      from: fromText.from || emlChrome.from,
      to: fromText.to || emlChrome.to,
      subject: fromText.subject || emlChrome.subject,
      body: fromText.body,
    };
  }, [cuerpoCompleto, cuerpoMensaje, emlChrome.from, emlChrome.to, emlChrome.subject]);
  const origenAdjuntosStored = useMemo(() => {
    if (!orden) return [];
    return parseOrigenArchivos(orden.origen_archivos);
  }, [orden]);

  useEffect(() => {
    const eml = origenAdjuntosStored.find((item) => {
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
      setEmlChrome({});
      setEmlInnerLoading(false);
      return;
    }

    let cancelled = false;
    setEmlInnerLoading(true);
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
          from?: string | null;
          to?: string | null;
          subject?: string | null;
        };
        if (cancelled) return;
        setEmlInnerAdjuntos(
          origenAdjuntosFromEmlParts(emlPath, data.parts ?? []),
        );
        setEmlChrome({
          from: data.from?.trim() || undefined,
          to: data.to?.trim() || undefined,
          subject: data.subject?.trim() || undefined,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setEmlInnerAdjuntos([]);
          setEmlChrome({});
        }
      })
      .finally(() => {
        if (!cancelled) setEmlInnerLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [origenAdjuntosStored]);

  /** Preferir PDFs/Excel reales del .eml; si no hay, mostrar lo guardado (el .eml). */
  const origenAdjuntos = useMemo(
    () =>
      mergeOrigenAdjuntosWithEmlParts(
        origenAdjuntosStored,
        emlInnerAdjuntos,
      ),
    [emlInnerAdjuntos, origenAdjuntosStored],
  );

  const origenNombres = useMemo(
    () => nombresOrigenAdjuntos(origenAdjuntos),
    [origenAdjuntos],
  );

  const lineas = orden?.lineas ?? [];

  // REQ-131: con el form abierto en paralelo (+ / companion), Editar debe estar activo
  // aunque la OV siga en por_confirmar (la regla de lista solo aplica fuera de companion).
  const puedeEditar =
    !inspect && row
      ? companionWithEdit || puedeEditarOrdenVentaDesdeLista(row.estado)
      : false;
  const puedeAlmacen =
    !inspect && row ? puedeAccionesAlmacenOrdenVenta(row.estado) : false;
  const puedeBorrar =
    !inspect && row && onBorrar
      ? puedeBorrarOrdenVenta(row.estado)
      : false;
  const bloqueadoHastaConfirmar =
    "Disponible cuando la orden esté confirmada";

  if (!panelMounted) return null;

  // Sin backdrop: la lista/formulario a la izquierda sigue usable y se reacomoda.
  // z-110: sobre el form dock (100); pickers/confirms dock-left usan base (100).
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 top-[var(--polaria-shell-top,4.75rem)] z-[110]"
      role="presentation"
    >
      <aside
        role="dialog"
        aria-modal={companionWithEdit}
        aria-labelledby={titleId}
        className={cn(
          "pointer-events-auto absolute inset-y-0 right-0 flex h-full max-h-full min-w-0 flex-col overflow-hidden",
          "border-l border-t border-polaria-t-20 bg-polaria-bg shadow-[-20px_0_40px_rgba(0,0,0,0.35)]",
          "box-border will-change-transform",
          /* Container queries: el contenido responde al ancho del panel, no al viewport. */
          "@container/cypher",
          "transition-transform duration-[320ms] ease-out",
          CYPHER_PANEL_WIDTH_CLASS,
          panelEntered ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="relative z-20 flex shrink-0 flex-col border-b border-polaria-t-20 bg-polaria-bg">
          <div className="flex items-start gap-2 px-3 pb-2 pt-3 sm:gap-3 sm:px-4 sm:pt-4">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h2
                  id={titleId}
                  className="truncate polaria-text-body-sm font-extrabold text-polaria-w sm:polaria-text-card-title"
                >
                  {codigo}
                </h2>
                <PolariaTableBadge variant={variantEstadoOrdenVenta(estado)}>
                  {formatEstadoOrdenVenta(estado)}
                </PolariaTableBadge>
              </div>
              <p className="mt-1 truncate polaria-text-caption text-polaria-w-50">
                <span className="font-semibold text-polaria-w-50">{comprador}</span>
                {" · OCC "}
                {occ}
                {" · Recibida "}
                {recibida}
              </p>
            </div>
            <button
              type="button"
              title="Cerrar Cypher"
              aria-label={`Cerrar detalle de ${codigo}`}
              onClick={onClose}
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-polaria-t-20 bg-polaria-t-08 text-polaria-teal transition",
                "hover:bg-polaria-t-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
              )}
            >
              <X className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </button>
          </div>

          <nav
            aria-label="Etapas de la orden"
            className="flex flex-wrap gap-x-0.5 gap-y-0 px-2 @md/cypher:gap-x-1 @md/cypher:px-3"
          >
            {CYPHER_STAGES.map((stage) => {
              const active = activeStage === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  aria-current={active ? "true" : undefined}
                  title={`${stage.num} ${stage.label}`}
                  onClick={() => scrollToStage(stage.id)}
                  className={cn(
                    "relative flex h-9 max-w-full items-center gap-1 border-b-2 px-1.5 polaria-text-caption font-bold transition",
                    "@md/cypher:h-10 @md/cypher:gap-1.5 @md/cypher:px-2.5 @md/cypher:polaria-text-body-sm",
                    active
                      ? "border-polaria-teal text-polaria-w"
                      : "border-transparent text-polaria-w-50 hover:text-polaria-w",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 tracking-[0.08em]",
                      active ? "text-polaria-teal" : "text-polaria-w-20",
                    )}
                  >
                    {stage.num}
                  </span>
                  <span className="truncate">{stage.label}</span>
                </button>
              );
            })}
          </nav>
        </header>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 pb-8 pt-1 sm:px-4"
        >
          {isLoading ? (
            <PolariaStatusLoading embedded className="py-10" />
          ) : null}

          {error ? (
            <p
              role="alert"
              className="mt-6 rounded-xl border border-polaria-danger-border bg-polaria-danger-bg px-4 py-3 polaria-text-body-sm text-polaria-danger"
            >
              {error}
            </p>
          ) : null}

          {!isLoading && !error && orden ? (
            <>
              <section id="cypher-stage-fiscales" className="scroll-mt-4 pt-6">
                <StageHeading num="00" title="Datos fiscales — referencia" />
                <CypherDatosFiscalesSection
                  codigoCuenta={codigoCuenta}
                  idComprador={orden.id_comprador}
                />
              </section>

              <section id="cypher-stage-correo" className="scroll-mt-4 pt-8">
                <StageHeading num="01" title="Recepción del correo" />
                <div className="mt-3 grid grid-cols-1 gap-y-2.5 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-3 py-3 @sm/cypher:grid-cols-[6rem_minmax(0,1fr)] @sm/cypher:gap-x-3.5 @sm/cypher:gap-y-2 @sm/cypher:px-4 @sm/cypher:py-3.5">
                  <MetaRow label="REMITENTE">
                    {correoChrome.from || "—"}
                  </MetaRow>
                  <MetaRow label="DESTINATARIO">
                    {correoChrome.to || "—"}
                  </MetaRow>
                  <MetaRow label="LLEGADA">{recibida}</MetaRow>
                  <MetaRow label="ASUNTO">
                    <span className="font-semibold">
                      {correoChrome.subject ||
                        (origenNombres.length > 0
                          ? `Pedido · ${origenNombres[0]}`
                          : "—")}
                    </span>
                  </MetaRow>
                </div>
                {cuerpoCompleto || cuerpoMensaje ? (
                  <div
                    className={cn(
                      "mt-2.5 max-h-56 overflow-x-hidden overflow-y-auto rounded-xl border border-polaria-w-08 bg-polaria-bg/60 px-4 py-4",
                      "overscroll-contain [scrollbar-gutter:stable]",
                    )}
                    tabIndex={0}
                    aria-label="Cuerpo del correo"
                  >
                    {/* Texto completo con scroll; sin modal / sin click. */}
                    <pre
                      className={cn(
                        "m-0 max-w-full whitespace-pre-wrap break-words",
                        "border-l-2 border-polaria-teal pl-3 font-mono text-[12.5px] leading-relaxed text-polaria-w-50",
                      )}
                    >
                      {cuerpoCompleto ||
                        correoChrome.body ||
                        cuerpoMensaje}
                    </pre>
                  </div>
                ) : (
                  <p className="mt-2.5 rounded-xl border border-dashed border-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50">
                    Sin cuerpo de mensaje registrado.
                  </p>
                )}
                {origenAdjuntosStored.length > 0 ||
                emlInnerAdjuntos.length > 0 ||
                emlInnerLoading ? (
                  <div className="mt-4">
                    <p className="polaria-text-caption font-bold tracking-[0.14em] text-polaria-w-20">
                      ADJUNTOS
                    </p>
                    <div className="mt-2">
                      {emlInnerLoading && emlInnerAdjuntos.length === 0 ? (
                        <p className="polaria-text-caption text-polaria-w-50">
                          Leyendo adjuntos del correo…
                        </p>
                      ) : null}
                      <OrigenAdjuntosCards adjuntos={origenAdjuntos} />
                    </div>
                  </div>
                ) : null}
              </section>

              <section
                id="cypher-stage-confirmacion"
                className="scroll-mt-4 pt-8"
              >
                {activeOtPicker && activeOtPicker.hijas.length > 0 ? (
                  <>
                    <StageHeading num="02" title="Órdenes de trabajo" />
                    <p className="mt-3 polaria-text-body-sm text-polaria-w-50">
                      {activeOtPicker.hijas.length === 1 ? (
                        <>
                          Esta venta tiene{" "}
                          <span className="font-semibold text-polaria-teal">
                            1 orden de trabajo
                          </span>
                          .
                        </>
                      ) : (
                        <>
                          Esta venta tiene{" "}
                          <span className="font-semibold text-polaria-teal">
                            {activeOtPicker.hijas.length} órdenes de trabajo
                          </span>
                          . Elige cuál quieres revisar para continuar.
                        </>
                      )}
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-2.5 @sm/cypher:grid-cols-2 @lg/cypher:grid-cols-3">
                      {activeOtPicker.hijas.map((hija) => {
                        const selected =
                          activeOtPicker.selectedId === hija.id;
                        const showAlmacen =
                          Boolean(hija.almacen?.trim()) &&
                          hija.almacen.trim().toLowerCase() !==
                            hija.label.trim().toLowerCase();
                        return (
                          <button
                            key={hija.id}
                            type="button"
                            aria-pressed={selected}
                            title={hija.label}
                            onClick={() => activeOtPicker.onSelect(hija.id)}
                            className={cn(
                              "flex min-h-[4.75rem] flex-col items-center justify-center gap-1.5 rounded-xl border px-2.5 py-3 text-center transition",
                              "@sm/cypher:aspect-square @sm/cypher:min-h-0",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
                              selected
                                ? "border-polaria-teal bg-polaria-t-20 shadow-[0_0_0_1px_var(--teal)]"
                                : "border-polaria-t-20 bg-polaria-t-08 hover:border-polaria-teal hover:bg-polaria-t-20",
                            )}
                          >
                            <p className="line-clamp-3 w-full polaria-text-caption font-semibold leading-snug text-polaria-w sm:polaria-text-body-sm">
                              {hija.label}
                            </p>
                            <p className="w-full polaria-text-caption tabular-nums text-polaria-teal">
                              {hija.productosCount} prod. ·{" "}
                              {formatKgEs(hija.totalCantidad)} kg
                            </p>
                            {showAlmacen ? (
                              <p className="line-clamp-2 w-full polaria-text-caption text-polaria-w-50">
                                {hija.almacen}
                              </p>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : stageReached(estado, "confirmacion") ? (
                  <>
                    <StageHeading num="02" title="Confirmación del pedido" />
                    <div className="mt-3 grid grid-cols-1 gap-3 @md/cypher:grid-cols-3">
                      <div className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3">
                        <p className="polaria-text-caption text-polaria-w-20">
                          Cliente
                        </p>
                        <p className="mt-1 polaria-text-body-sm font-medium text-polaria-w">
                          {comprador}
                        </p>
                      </div>
                      <div className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3">
                        <p className="polaria-text-caption text-polaria-w-20">
                          OCC
                        </p>
                        <p className="mt-1 polaria-text-body-sm font-medium text-polaria-w">
                          {occ}
                        </p>
                      </div>
                      <div className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3">
                        <p className="polaria-text-caption text-polaria-w-20">
                          Entrega
                        </p>
                        <p className="mt-1 polaria-text-body-sm font-medium text-polaria-w">
                          {orden.fecha_entrega?.trim()
                            ? formatDateTime(orden.fecha_entrega, zonaHoraria)
                            : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 overflow-hidden rounded-xl border border-polaria-w-08">
                      {lineas.length === 0 ? (
                        <p className="px-4 py-3 polaria-text-body-sm text-polaria-w-50">
                          Sin líneas registradas.
                        </p>
                      ) : (
                        <>
                          <table className="w-full table-fixed border-collapse text-left">
                            <thead className="bg-polaria-w-08">
                              <tr className="border-b border-polaria-t-20">
                                <th className="px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50">
                                  Producto
                                </th>
                                <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
                                  Cantidad
                                </th>
                                <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
                                  Importe
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {lineas.map((linea) => (
                                <tr
                                  key={linea.id_linea_orden_venta}
                                  className="border-b border-polaria-w-08 last:border-b-0"
                                >
                                  <td className="px-3 py-2.5">
                                    <p className="polaria-text-body-sm font-medium text-polaria-w">
                                      {resolveOrdenVentaLineaTitulo(linea)}
                                    </p>
                                  </td>
                                  <td className="px-3 py-2.5 text-right polaria-text-body-sm text-polaria-w">
                                    {formatKgEs(linea.cantidad_pedida)} kg
                                  </td>
                                  <td className="px-3 py-2.5 text-right polaria-text-body-sm font-medium text-polaria-teal">
                                    $
                                    {formatPrecioEs(
                                      formatOrdenVentaLineaTotal(linea),
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="flex items-center justify-between border-t border-polaria-t-20 bg-polaria-w-08 px-3 py-2">
                            <p className="polaria-text-caption text-polaria-w-50">
                              {lineas.length} producto
                              {lineas.length === 1 ? "" : "s"} ·{" "}
                              {formatKgEs(sumOrdenVentaCantidadKg(orden))} kg
                            </p>
                            <p className="polaria-text-body-sm text-polaria-w-50">
                              Total:{" "}
                              <span className="font-semibold text-polaria-teal">
                                {formatOrdenVentaTotal(orden)}
                              </span>
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <PendingStage num="02" title="Confirmación del pedido" />
                )}
              </section>

              <section
                id="cypher-stage-cliente-vs-mateo"
                className="scroll-mt-4 pt-8"
              >
                <StageHeading num="03" title="Correo vs Mateo IA vs usuario" />
                {orden ? (
                  <CypherClienteVsMateoSection
                    orden={orden}
                    hijas={hijasFromOrden}
                  />
                ) : (
                  <p className="mt-3 rounded-xl border border-dashed border-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50">
                    Cargando comparación…
                  </p>
                )}
              </section>

              <section
                id="cypher-stage-alistamiento"
                className="scroll-mt-4 pt-8"
              >
                {stageReached(estado, "alistamiento") && orden ? (
                  <>
                    <StageHeading num="04" title="Alistamiento" />
                    <CypherAlistamientoSection
                      idOrdenVenta={orden.id_orden_venta}
                      orden={orden}
                      hijas={hijasFromOrden}
                      onVerFotosOt={
                        puedeAlmacen
                          ? (idOt) => {
                              onFotos(idOt);
                            }
                          : undefined
                      }
                    />
                  </>
                ) : (
                  <PendingStage num="04" title="Alistamiento" />
                )}
              </section>

              <section id="cypher-stage-alistado" className="scroll-mt-4 pt-8">
                {stageReached(estado, "alistado") && orden ? (
                  <>
                    <StageHeading num="05" title="Alistado" />
                    <CypherAlistadoSection
                      idOrdenVenta={orden.id_orden_venta}
                      orden={orden}
                      hijas={hijasFromOrden}
                    />
                  </>
                ) : (
                  <PendingStage num="05" title="Alistado" />
                )}
              </section>

              <section id="cypher-stage-bitacora" className="scroll-mt-4 pt-8">
                <StageHeading num="06" title="Bitácora de eventos" />
                {idOrdenTrabajoBitacora && activeOtPicker ? (
                  <p className="mt-2 polaria-text-caption text-polaria-w-50">
                    Eventos de{" "}
                    <span className="font-semibold text-polaria-teal">
                      {activeOtPicker.hijas.find(
                        (h) => h.id === idOrdenTrabajoBitacora,
                      )?.label ?? "esta orden de trabajo"}
                    </span>
                    {" "}
                    (creación, confirmación, cambios, alistamiento, etc.).
                  </p>
                ) : null}
                <div className="mt-4">
                  {logLoading ? (
                    <p className="polaria-text-body-sm text-polaria-w-50">
                      Cargando…
                    </p>
                  ) : logEntries.length === 0 ? (
                    <p className="polaria-text-body-sm text-polaria-w-50">
                      Sin eventos registrados.
                    </p>
                  ) : (
                    <ul className="space-y-0">
                      {logEntries.map((entry) => {
                        const stamped = formatDateTime(
                          entry.createdAt,
                          zonaHoraria,
                        );
                        const [datePart, timePart] = stamped
                          .split(",")
                          .map((part) => part.trim());
                        const tone = resolveLogEntryTone(entry);
                        const autorBadge = resolveLogEntryAutorBadge(entry);
                        const sla = extractLogSlaCallout(entry.mensaje);
                        return (
                          <li
                            key={entry.id}
                            className="grid grid-cols-[1.125rem_minmax(0,1fr)] gap-2.5 @md/cypher:grid-cols-[5.5rem_1.125rem_minmax(0,1fr)] @md/cypher:gap-3"
                          >
                            <div className="hidden pt-0.5 text-right @md/cypher:block">
                              <p className="polaria-text-body-sm font-bold text-polaria-w whitespace-nowrap">
                                {timePart || stamped}
                              </p>
                              <p className="polaria-text-caption text-polaria-w-20">
                                {datePart}
                              </p>
                            </div>
                            <div className="relative flex justify-center">
                              <span className="absolute inset-y-0 w-px bg-polaria-t-20" />
                              <span
                                className={cn(
                                  "relative mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-polaria-bg",
                                  logEntryToneDotClass(tone),
                                )}
                                title={
                                  tone === "crear"
                                    ? "Creación / recepción"
                                    : tone === "progreso"
                                      ? "Avance / confirmación"
                                      : tone === "alerta"
                                        ? "Alerta / fallo"
                                        : tone === "aviso"
                                          ? "Aviso / SLA"
                                          : "Operación"
                                }
                              />
                            </div>
                            <div className="min-w-0 pb-5">
                              <p className="mb-1 polaria-text-caption text-polaria-w-50 @md/cypher:hidden">
                                <span className="font-bold text-polaria-w">
                                  {timePart || stamped}
                                </span>
                                {datePart ? ` · ${datePart}` : null}
                              </p>
                              <div className="flex flex-col items-start gap-1.5">
                                <span
                                  className={cn(
                                    "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 polaria-text-caption font-semibold",
                                    logEntryToneBadgeClass(tone),
                                  )}
                                >
                                  {autorBadge}
                                </span>
                                <p className="min-w-0 w-full whitespace-pre-wrap break-words polaria-text-body-sm text-polaria-w">
                                  {entry.mensaje}
                                </p>
                              </div>
                              {sla ? (
                                <p
                                  className={cn(
                                    "mt-2 rounded-lg border px-2.5 py-1.5 polaria-text-caption font-semibold",
                                    sla.overLimit
                                      ? "border-polaria-danger-border bg-polaria-danger-bg text-polaria-danger"
                                      : "border-polaria-t-20 bg-polaria-t-08 text-polaria-teal",
                                  )}
                                >
                                  {sla.text}
                                </p>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>
            </>
          ) : null}
        </div>

        {!inspect && row ? (
          <footer className="grid shrink-0 grid-cols-2 gap-2 border-t border-polaria-t-20 bg-polaria-bg/95 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] @md/cypher:gap-2.5 @md/cypher:px-4">
            <button
              type="button"
              title={puedeEditar ? "Editar" : bloqueadoHastaConfirmar}
              disabled={!puedeEditar}
              onClick={() => {
                if (!puedeEditar) return;
                onEdit();
              }}
              className={cn(
                "inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-polaria-t-20 px-2.5 @md/cypher:h-10 @md/cypher:gap-2 @md/cypher:px-3",
                "polaria-text-caption font-bold text-polaria-teal transition hover:bg-polaria-t-08 @md/cypher:polaria-text-body-sm",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
              )}
            >
              <Pencil className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
              Editar
            </button>
            <button
              type="button"
              title={puedeAlmacen ? "Imprimir" : bloqueadoHastaConfirmar}
              disabled={!puedeAlmacen || busyKind === "print"}
              onClick={() => {
                if (!puedeAlmacen) return;
                onPrint();
              }}
              className={cn(
                "inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-polaria-t-20 px-2.5 @md/cypher:h-10 @md/cypher:gap-2 @md/cypher:px-3",
                "polaria-text-caption font-bold text-polaria-teal transition hover:bg-polaria-t-08 @md/cypher:polaria-text-body-sm",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
              )}
            >
              <Printer className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
              Imprimir
            </button>
            <button
              type="button"
              title={puedeAlmacen ? "Descarga" : bloqueadoHastaConfirmar}
              disabled={!puedeAlmacen || busyKind === "preview"}
              onClick={() => {
                if (!puedeAlmacen) return;
                onPreview();
              }}
              className={cn(
                "inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-polaria-t-20 px-2.5 @md/cypher:h-10 @md/cypher:gap-2 @md/cypher:px-3",
                "polaria-text-caption font-bold text-polaria-teal transition hover:bg-polaria-t-08 @md/cypher:polaria-text-body-sm",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
              )}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
              Descarga
            </button>
            {onBorrar ? (
              <button
                type="button"
                title={
                  puedeBorrar
                    ? "Borrar orden (desaparece de la tabla; permanece en BD)"
                    : "Solo disponible en órdenes por confirmar"
                }
                disabled={!puedeBorrar || busyKind === "borrar"}
                aria-disabled={!puedeBorrar || busyKind === "borrar"}
                onClick={() => {
                  if (!puedeBorrar || busyKind === "borrar") return;
                  setBorrarError(null);
                  setConfirmBorrarOpen(true);
                }}
                className={cn(
                  "inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-polaria-danger-border px-2.5 @md/cypher:h-10 @md/cypher:gap-2 @md/cypher:px-3",
                  "polaria-text-caption font-bold text-polaria-danger transition hover:bg-polaria-danger-bg @md/cypher:polaria-text-body-sm",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-danger",
                )}
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
                Borrar
              </button>
            ) : null}
          </footer>
        ) : null}
      </aside>

      <PolariaConfirmDialog
        open={confirmBorrarOpen}
        stackLevel="nested"
        onClose={() => {
          if (busyKind === "borrar") return;
          setConfirmBorrarOpen(false);
          setBorrarError(null);
        }}
        onConfirm={() => {
          if (!onBorrar || busyKind === "borrar") return;
          setBorrarError(null);
          void Promise.resolve(onBorrar())
            .then(() => {
              setConfirmBorrarOpen(false);
            })
            .catch((err: unknown) => {
              setBorrarError(
                err instanceof Error
                  ? err.message
                  : "No se pudo borrar la orden.",
              );
            });
        }}
        title="¿Borrar esta orden?"
        description="Dejará de verse en la tabla de ventas. No se elimina de forma permanente."
        confirmLabel="Sí, borrar"
        cancelLabel="Conservar"
        isSubmitting={busyKind === "borrar"}
        error={borrarError}
      />

    </div>
  );
}
