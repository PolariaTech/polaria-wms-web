"use client";

import {
  FileText,
  Images,
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
import { PolariaConfirmDialog } from "@/components/shared/form/PolariaConfirmDialog";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import { PolariaTableBadge } from "@/components/shared/table/PolariaTableCells";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { formatKgEs, formatPrecioEs } from "@/lib/utils/decimal-es";
import { withCuentaSchema } from "@/lib/supabase/cuenta-schema";
import { useShellOverlayStore } from "@/stores/shell-overlay.store";
import {
  formatEstadoOrdenVenta,
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
  formatCompradorOrdenVenta,
  formatOrdenVentaLineaTotal,
  formatOrdenVentaTotal,
  resolveOrdenVentaLineaTitulo,
  sumOrdenVentaCantidadKg,
} from "../../utils/orden-venta-display";
import {
  nombresOrigenAdjuntos,
  origenAdjuntosFromEmlParts,
  parseOrigenArchivos,
  type OrigenAdjunto,
} from "../../utils/origen-adjuntos";
import {
  looksLikeCorreoCuerpoEnNotas,
  prepareCorreoBodyForCypherDisplay,
} from "../../utils/texto-origen-pedido";
import { OrigenAdjuntosCards } from "../shared/OrigenAdjuntosCards";
import { OrigenPedidoBodyView } from "../shared/OrigenPedidoBodyView";

type CypherStageId =
  | "correo"
  | "confirmacion"
  | "alistamiento"
  | "alistado"
  | "bitacora";

const CYPHER_STAGES: ReadonlyArray<{
  id: CypherStageId;
  num: string;
  label: string;
  title: string;
}> = [
  { id: "correo", num: "01", label: "Correo", title: "Recepción del correo" },
  {
    id: "confirmacion",
    num: "02",
    label: "Confirmación",
    title: "Confirmación del pedido",
  },
  {
    id: "alistamiento",
    num: "03",
    label: "Alistamiento",
    title: "Alistamiento",
  },
  { id: "alistado", num: "04", label: "Alistado", title: "Alistado" },
  {
    id: "bitacora",
    num: "05",
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
  if (stage === "correo") return true;
  if (stage === "confirmacion") return current >= 1;
  if (stage === "alistamiento") return current >= 2;
  if (stage === "alistado") return current >= 3;
  return true; // bitácora siempre
}

function parseCorreoChrome(raw: string): {
  from?: string;
  to?: string;
  subject?: string;
  body: string;
} {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return { body: "" };

  const from =
    text.match(/^(?:\*+)?(?:De|From)(?:\*+)?\s*:\s*(.+)$/im)?.[1]?.trim() ||
    undefined;
  const to =
    text.match(/^(?:\*+)?(?:Para|To)(?:\*+)?\s*:\s*(.+)$/im)?.[1]?.trim() ||
    undefined;
  const subject =
    text.match(
      /^(?:\*+)?(?:Asunto|Subject)(?:\*+)?\s*:\s*(.+)$/im,
    )?.[1]?.trim() || undefined;

  let body = text;
  if (from || to || subject) {
    body = text
      .split("\n")
      .filter((line) => {
        const t = line.trim();
        if (!t) return true;
        return !/^(?:\*+)?(?:De|From|Para|To|Asunto|Subject|Date|Fecha|Cc|Cco|Bcc|Enviado el|Sent)(?:\*+)?\s*:/i.test(
          t,
        );
      })
      .join("\n")
      .trim();
  }

  return { from, to, subject, body: body || text };
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

export interface OrdenVentaCypherDrawerProps {
  idOrdenVenta: string | null;
  codigoCuenta: string | null;
  row: OrdenVentaOperadorRow | null;
  inspect?: boolean;
  hasFotos: boolean;
  busyKind: "print" | "preview" | "fotos" | "borrar" | null;
  onClose: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onPreview: () => void;
  onFotos: () => void;
  /** Soft-delete (UI «Borrar»); solo por confirmar. */
  onBorrar?: () => void | Promise<void>;
}

export function OrdenVentaCypherDrawer({
  idOrdenVenta,
  codigoCuenta,
  row,
  inspect = false,
  hasFotos,
  busyKind,
  onClose,
  onEdit,
  onPrint,
  onPreview,
  onFotos,
  onBorrar,
}: OrdenVentaCypherDrawerProps) {
  const titleId = useId();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [orden, setOrden] = useState<OrdenVentaDetalleRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<CypherStageId>("correo");
  const [logEntries, setLogEntries] = useState<OrdenVentaLogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [correoModalOpen, setCorreoModalOpen] = useState(false);
  const correoModalOpenRef = useRef(false);
  correoModalOpenRef.current = correoModalOpen;
  const [emlInnerAdjuntos, setEmlInnerAdjuntos] = useState<OrigenAdjunto[]>(
    [],
  );
  const [emlInnerLoading, setEmlInnerLoading] = useState(false);
  const [confirmBorrarOpen, setConfirmBorrarOpen] = useState(false);
  const [borrarError, setBorrarError] = useState<string | null>(null);
  const setCypherOpen = useShellOverlayStore((s) => s.setCypherOpen);

  const open = Boolean(idOrdenVenta && codigoCuenta);

  useEffect(() => {
    setCypherOpen(open);
    return () => setCypherOpen(false);
  }, [open, setCypherOpen]);

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
      setOrden(null);
      setError(null);
      setLogEntries([]);
      setActiveStage("correo");
      setCorreoModalOpen(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setOrden(null);
    setActiveStage("correo");
    setCorreoModalOpen(false);

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
    idOrdenVenta,
    orden?.created_at,
    orden?.fecha_pedido,
    orden?.vendedor,
    row?.fecha,
  ]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // El modal del correo completo captura Escape primero.
      if (correoModalOpenRef.current) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
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

    const sections = CYPHER_STAGES.map((stage) =>
      document.getElementById(`cypher-stage-${stage.id}`),
    ).filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0),
          );
        const top = visible[0];
        if (!top?.target?.id) return;
        const stageId = top.target.id.replace(
          "cypher-stage-",
          "",
        ) as CypherStageId;
        if (CYPHER_STAGES.some((stage) => stage.id === stageId)) {
          setActiveStage(stageId);
        }
      },
      {
        root,
        rootMargin: "-12% 0px -55% 0px",
        threshold: [0.15, 0.35, 0.55],
      },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [error, isLoading, open, orden]);

  const estado = (orden?.estado ?? row?.estado ?? "por_confirmar") as EstadoOrdenVenta;
  const codigo = orden?.codigo ?? row?.venta ?? "OV";
  const comprador =
    (orden ? formatCompradorOrdenVenta(orden) : null) ||
    row?.comprador ||
    "—";
  const occ = row?.occ || orden?.orden_compra_hotel?.trim() || "—";
  const recibida = formatDateTime(
    orden?.created_at || orden?.fecha_pedido || row?.fecha || "",
  );

  const cuerpoCompleto = useMemo(
    () => (orden ? resolveCuerpoMensajeCompleto(orden) : ""),
    [orden],
  );
  const cuerpoMensaje = useMemo(
    () => (orden ? resolveCuerpoMensajePreview(orden) : ""),
    [orden],
  );
  const correoChrome = useMemo(
    () => parseCorreoChrome(cuerpoCompleto || cuerpoMensaje),
    [cuerpoCompleto, cuerpoMensaje],
  );
  const correoChromeCompleto = useMemo(
    () => parseCorreoChrome(cuerpoCompleto),
    [cuerpoCompleto],
  );
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
        };
        if (cancelled) return;
        setEmlInnerAdjuntos(
          origenAdjuntosFromEmlParts(emlPath, data.parts ?? []),
        );
      })
      .catch(() => {
        if (!cancelled) setEmlInnerAdjuntos([]);
      })
      .finally(() => {
        if (!cancelled) setEmlInnerLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [origenAdjuntosStored]);

  /** Preferir PDFs/Excel reales del .eml; si no hay, mostrar lo guardado (el .eml). */
  const origenAdjuntos = useMemo(() => {
    if (emlInnerAdjuntos.length > 0) {
      return [...emlInnerAdjuntos, ...origenAdjuntosStored];
    }
    return origenAdjuntosStored;
  }, [emlInnerAdjuntos, origenAdjuntosStored]);

  const origenNombres = useMemo(
    () => nombresOrigenAdjuntos(origenAdjuntos),
    [origenAdjuntos],
  );

  const lineas = orden?.lineas ?? [];

  const puedeEditar =
    !inspect && row ? puedeEditarOrdenVentaDesdeLista(row.estado) : false;
  const puedeAlmacen =
    !inspect && row ? puedeAccionesAlmacenOrdenVenta(row.estado) : false;
  const puedeBorrar =
    !inspect && row && onBorrar
      ? puedeBorrarOrdenVenta(row.estado)
      : false;
  const bloqueadoHastaConfirmar =
    "Disponible cuando la orden esté confirmada";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]" role="presentation">
      <button
        type="button"
        aria-label="Cerrar panel"
        className="absolute inset-0 bg-polaria-bg/55 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-[min(50vw,52rem)] min-w-0 flex-col",
          "border-l border-polaria-t-20 bg-polaria-bg shadow-[-30px_0_60px_rgba(0,0,0,0.45)]",
          "sm:min-w-[min(720px,100vw)]",
        )}
      >
        <header className="shrink-0 border-b border-polaria-t-20 bg-polaria-t-08/60 px-5 pb-0 pt-4 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2
                  id={titleId}
                  className="polaria-text-card-title font-extrabold text-polaria-w"
                >
                  {codigo}
                </h2>
                <PolariaTableBadge variant={variantEstadoOrdenVenta(estado)}>
                  {formatEstadoOrdenVenta(estado)}
                </PolariaTableBadge>
              </div>
              <p className="mt-1.5 polaria-text-body-sm text-polaria-w-50">
                <span className="font-semibold text-polaria-w-50">{comprador}</span>
                {" · OCC "}
                {occ}
                {" · Recibida "}
                {recibida}
              </p>
            </div>
            <button
              type="button"
              title="Cerrar"
              aria-label="Cerrar"
              onClick={onClose}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-polaria-t-20 text-polaria-teal transition",
                "hover:bg-polaria-t-08 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
              )}
            >
              <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </button>
          </div>

          <nav
            aria-label="Etapas de la orden"
            className="mt-3 flex gap-1 overflow-x-auto"
          >
            {CYPHER_STAGES.map((stage) => {
              const active = activeStage === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  aria-current={active ? "true" : undefined}
                  onClick={() => scrollToStage(stage.id)}
                  className={cn(
                    "relative flex h-10 shrink-0 items-center gap-1.5 border-b-2 px-3 polaria-text-body-sm font-bold transition",
                    active
                      ? "border-polaria-teal text-polaria-w"
                      : "border-transparent text-polaria-w-50 hover:text-polaria-w",
                  )}
                >
                  <span
                    className={cn(
                      "polaria-text-caption tracking-[0.1em]",
                      active ? "text-polaria-teal" : "text-polaria-w-20",
                    )}
                  >
                    {stage.num}
                  </span>
                  {stage.label}
                </button>
              );
            })}
          </nav>
          <p className="pb-3 pt-2 polaria-text-caption text-polaria-w-50">
            Sección actual:{" "}
            <span className="font-semibold text-polaria-teal">
              {CYPHER_STAGES.find((stage) => stage.id === activeStage)?.num}{" "}
              {CYPHER_STAGES.find((stage) => stage.id === activeStage)?.label}
            </span>
          </p>
        </header>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto px-5 pb-10 pt-1 sm:px-7"
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
              <section id="cypher-stage-correo" className="scroll-mt-4 pt-6">
                <StageHeading num="01" title="Recepción del correo" />
                <div className="mt-3 grid grid-cols-[6rem_minmax(0,1fr)] gap-x-3.5 gap-y-2 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3.5">
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
                {cuerpoMensaje ? (
                  <button
                    type="button"
                    onClick={() => setCorreoModalOpen(true)}
                    title="Ver correo completo"
                    aria-label="Ver correo completo"
                    className={cn(
                      "mt-2.5 w-full rounded-xl border border-polaria-w-08 bg-polaria-bg/60 px-4 py-4 text-left transition",
                      "hover:border-polaria-teal/60 hover:bg-polaria-t-08",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
                    )}
                  >
                    <div className="max-h-56 overflow-hidden">
                      <OrigenPedidoBodyView
                        text={correoChrome.body || cuerpoMensaje}
                        className="mt-0 font-mono text-[12.5px] leading-relaxed text-polaria-w-50"
                      />
                    </div>
                    <p className="mt-3 polaria-text-caption font-semibold text-polaria-teal">
                      Clic para ver el correo completo
                    </p>
                  </button>
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
                {stageReached(estado, "confirmacion") ? (
                  <>
                    <StageHeading num="02" title="Confirmación del pedido" />
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                            ? formatDateTime(orden.fecha_entrega)
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
                id="cypher-stage-alistamiento"
                className="scroll-mt-4 pt-8"
              >
                {stageReached(estado, "alistamiento") ? (
                  <>
                    <StageHeading num="03" title="Alistamiento" />
                    <div className="mt-3 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3">
                      <p className="polaria-text-body-sm text-polaria-w">
                        Orden en alistamiento
                        {row?.ordenesTrabajo
                          ? ` · ${row.ordenesTrabajo} OT`
                          : ""}
                        .
                      </p>
                      {hasFotos ? (
                        <p className="mt-1 polaria-text-caption text-polaria-w-50">
                          Hay fotos de captura del QR disponibles en Acciones.
                        </p>
                      ) : (
                        <p className="mt-1 polaria-text-caption text-polaria-w-50">
                          Aún no hay fotos de captura del QR.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <PendingStage num="03" title="Alistamiento" />
                )}
              </section>

              <section id="cypher-stage-alistado" className="scroll-mt-4 pt-8">
                {stageReached(estado, "alistado") ? (
                  <>
                    <StageHeading num="04" title="Alistado" />
                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3.5">
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-polaria-w-50 text-polaria-w-50 polaria-text-caption font-extrabold"
                        aria-hidden
                      >
                        ✓
                      </span>
                      <p className="polaria-text-body-sm font-bold text-polaria-w">
                        Orden alistada
                      </p>
                    </div>
                  </>
                ) : (
                  <PendingStage num="04" title="Alistado" />
                )}
              </section>

              <section id="cypher-stage-bitacora" className="scroll-mt-4 pt-8">
                <StageHeading num="05" title="Bitácora de eventos" />
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
                      {logEntries.map((entry) => (
                        <li
                          key={entry.id}
                          className="grid grid-cols-[5.5rem_1.125rem_minmax(0,1fr)] gap-3"
                        >
                          <div className="pt-0.5 text-right">
                            <p className="polaria-text-body-sm font-bold text-polaria-w whitespace-nowrap">
                              {formatDateTime(entry.createdAt).split(",")[1]
                                ?.trim() || formatDateTime(entry.createdAt)}
                            </p>
                            <p className="polaria-text-caption text-polaria-w-20">
                              {formatDateTime(entry.createdAt).split(",")[0]}
                            </p>
                          </div>
                          <div className="relative flex justify-center">
                            <span className="absolute inset-y-0 w-px bg-polaria-t-20" />
                            <span className="relative mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-polaria-bg bg-polaria-teal" />
                          </div>
                          <div className="min-w-0 pb-4">
                            <div className="flex flex-wrap items-center gap-2">
                              {entry.autor ? (
                                <span className="rounded-full border border-polaria-t-20 bg-polaria-t-08 px-2 py-0.5 polaria-text-caption font-bold text-polaria-teal">
                                  {entry.autor}
                                </span>
                              ) : null}
                              <p className="polaria-text-body-sm text-polaria-w-50">
                                {entry.mensaje}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </>
          ) : null}
        </div>

        {!inspect && row ? (
          <footer className="flex shrink-0 flex-wrap items-center gap-2.5 border-t border-polaria-t-20 bg-polaria-bg/95 px-5 py-3.5 sm:px-7">
            <button
              type="button"
              title={puedeEditar ? "Editar" : bloqueadoHastaConfirmar}
              disabled={!puedeEditar}
              onClick={() => {
                if (!puedeEditar) return;
                onEdit();
              }}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-lg border border-polaria-t-20 px-4",
                "polaria-text-body-sm font-bold text-polaria-teal transition hover:bg-polaria-t-08",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
              )}
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
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
                "inline-flex h-10 items-center gap-2 rounded-lg border border-polaria-t-20 px-4",
                "polaria-text-body-sm font-bold text-polaria-teal transition hover:bg-polaria-t-08",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
              )}
            >
              <Printer className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
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
                "inline-flex h-10 items-center gap-2 rounded-lg border border-polaria-t-20 px-4",
                "polaria-text-body-sm font-bold text-polaria-teal transition hover:bg-polaria-t-08",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
              )}
            >
              <FileText className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
              Descarga
            </button>
            <button
              type="button"
              title={
                !puedeAlmacen
                  ? bloqueadoHastaConfirmar
                  : hasFotos
                    ? "Fotos del QR"
                    : "Aún no hay fotos del QR"
              }
              disabled={
                !puedeAlmacen || !hasFotos || busyKind === "fotos"
              }
              onClick={() => {
                if (!puedeAlmacen || !hasFotos) return;
                onFotos();
              }}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-lg border border-polaria-t-20 px-4",
                "polaria-text-body-sm font-bold text-polaria-teal transition hover:bg-polaria-t-08",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
              )}
            >
              <Images className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
              Fotos
            </button>
            {onBorrar ? (
              <button
                type="button"
                title={
                  puedeBorrar
                    ? "Borrar orden (deja de verse en ventas)"
                    : "Solo se pueden borrar órdenes por confirmar"
                }
                disabled={!puedeBorrar || busyKind === "borrar"}
                onClick={() => {
                  if (!puedeBorrar) return;
                  setBorrarError(null);
                  setConfirmBorrarOpen(true);
                }}
                className={cn(
                  "ml-auto inline-flex h-10 items-center gap-2 rounded-lg border border-polaria-danger-border px-4",
                  "polaria-text-body-sm font-bold text-polaria-danger transition hover:bg-polaria-danger-bg",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-danger",
                )}
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
                Borrar
              </button>
            ) : null}
          </footer>
        ) : null}
      </aside>

      <PolariaConfirmDialog
        open={confirmBorrarOpen}
        stackLevel="elevated"
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

      <PolariaFormModal
        open={correoModalOpen && Boolean(cuerpoCompleto)}
        onClose={() => setCorreoModalOpen(false)}
        title={codigo}
        description={
          correoChromeCompleto.subject ||
          correoChrome.subject ||
          "Correo completo del pedido"
        }
        sectionLabel="Correo completo"
        onSubmit={(event) => event.preventDefault()}
        asForm={false}
        hideFooter
        size="2xl"
        stackLevel="elevated"
        compact
        scrollClassName="max-h-[min(70dvh,36rem)]"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3.5 gap-y-2 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3.5">
            <MetaRow label="REMITENTE">
              {correoChromeCompleto.from || correoChrome.from || "—"}
            </MetaRow>
            <MetaRow label="DESTINATARIO">
              {correoChromeCompleto.to || correoChrome.to || "—"}
            </MetaRow>
            <MetaRow label="LLEGADA">{recibida}</MetaRow>
            <MetaRow label="ASUNTO">
              <span className="font-semibold">
                {correoChromeCompleto.subject ||
                  correoChrome.subject ||
                  "—"}
              </span>
            </MetaRow>
          </div>
          {/* Texto crudo: sin cleanCorreoBody / OrigenPedidoBodyView (recortan firmas y legales). */}
          <div className="rounded-xl border border-polaria-w-08 bg-polaria-bg/60 px-4 py-4">
            <pre
              className={cn(
                "m-0 max-w-full overflow-x-auto whitespace-pre-wrap break-words",
                "border-l-2 border-polaria-teal pl-3 font-mono text-[12.5px] leading-relaxed text-polaria-w-50",
              )}
            >
              {cuerpoCompleto}
            </pre>
          </div>
          {origenAdjuntosStored.length > 0 ||
          emlInnerAdjuntos.length > 0 ||
          emlInnerLoading ? (
            <div>
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
        </div>
      </PolariaFormModal>
    </div>
  );
}
