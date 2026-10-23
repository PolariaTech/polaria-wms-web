"use client";

import { CheckCircle2, Plus, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import {
  PolariaTableBadge,
  PolariaTableCode,
} from "@/components/shared/table/PolariaTableCells";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { ROLES_NIVEL_CUENTA } from "@/constants/wms/roles";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { useVisibleInterval } from "@/hooks/shared/useVisibleInterval";
import { cn } from "@/lib/utils/cn";
import { AdminMaestroViewShell } from "@/modules/admin-panel/shared/components/AdminMaestroViewShell";
import {
  useAdminMaestroScope,
  type AdminMaestroViewProps,
} from "@/modules/admin-panel/shared/hooks/useAdminMaestroScope";
import {
  ESTADO_ORDEN_VENTA_LABELS,
  ESTADOS_ORDEN_VENTA,
  formatEstadoOrdenVenta,
  variantEstadoOrdenVenta,
} from "../../../shared/constants/sales-status";
import { useOrdenesVentaSubscription } from "../../../shared/hooks/useOrdenesVentaSubscription";
import {
  ORDENES_VENTA_TABLE_MIN_WIDTH_CLASS,
  ordenVentaTableColumnClass,
} from "../../constants/ordenes-venta-table-layout";
import {
  buildOrdenTareaAlmacenLandscapePdfBlob,
  printOrdenTareaAlmacenLandscape,
} from "../../print/download-orden-tarea-almacen-pdf";
import {
  autoPrintResultToFeedback,
  type AutoPrintOvResult,
} from "../../print/auto-print-ov-tras-emitir";
import { useCuentaZonaHoraria } from "@/modules/configurator/cuentas/hooks/useCuentaZonaHoraria";
import { mapOrdenVentaToAlmacenPrintSheets } from "../../print/map-orden-tarea-almacen";
import {
  borrarOrdenVenta,
  getOrdenVentaDetalle,
  listOrdenesVentaOperador,
} from "../../../shared/services/sales.service";
import {
  postOrdenVentaLog,
  postOrdenVentaLogForOts,
} from "../../services/orden-venta-log.client";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import type {
  EstadoOrdenVenta,
  OrdenVentaOperadorRow,
} from "../../../shared/types/sales.types";
import { OvAlertaDot } from "../shared/OvAlertaDot";
import { applySurtidoCapturasToPrintSheets } from "../../surtido/apply-surtido-to-print";
import { listOrdenIdsConSurtidoCaptura } from "../../surtido/list-orden-ids-con-surtido-captura";
import { listOrdenSurtidoCapturasClient } from "../../surtido/list-orden-surtido-capturas.client";
import { useAuthStore } from "@/stores/auth.store";
import { useShellOverlayStore } from "@/stores/shell-overlay.store";
import { OrdenVentaCreateModal } from "../modals/OrdenVentaCreateModal";
import {
  OrdenVentaCypherDrawer,
  type CypherCompanionOtPicker,
} from "../modals/OrdenVentaCypherDrawer";
import { OrdenVentaDetalleModal } from "../modals/OrdenVentaDetalleModal";
import {
  OrdenVentaFotosCapturaModal,
  type OrdenVentaFotoCapturaItem,
  type OrdenVentaOtConFotosItem,
} from "../modals/OrdenVentaFotosCapturaModal";
import { OrdenVentaPdfPreviewModal } from "../modals/OrdenVentaPdfPreviewModal";

interface OrdenesVentaPageData {
  rows: OrdenVentaOperadorRow[];
  idsConFotosCaptura: Set<string>;
}

function renderEstadoBadge(estado: string) {
  return (
    <PolariaTableBadge variant={variantEstadoOrdenVenta(estado)}>
      {formatEstadoOrdenVenta(estado)}
    </PolariaTableBadge>
  );
}

export function OperadorOrdenesVentaPageContent({
  codigoCuenta: codigoCuentaProp,
  mode = "manage",
}: AdminMaestroViewProps = {}) {
  const { codigoCuenta, inspect, runScoped } = useAdminMaestroScope({
    codigoCuenta: codigoCuentaProp,
    mode,
  });
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoOrdenVenta | null>(
    null,
  ); // null = Todos
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [cypherId, setCypherId] = useState<string | null>(null);
  const setCypherOpen = useShellOverlayStore((s) => s.setCypherOpen);
  const [companionOtPicker, setCompanionOtPicker] =
    useState<CypherCompanionOtPicker | null>(null);
  /** Soft-delete: ocultar de la tabla al instante (fila sigue en BD como cancelada). */
  const [idsOcultosBorrados, setIdsOcultosBorrados] = useState<Set<string>>(
    () => new Set(),
  );

  // Mateo oculta el launcher flotante mientras Cypher está abierto.
  useEffect(() => {
    setCypherOpen(Boolean(cypherId));
    return () => setCypherOpen(false);
  }, [cypherId, setCypherOpen]);
  const printingLockRef = useRef(false);
  const fotosOrdenIdRef = useRef<string | null>(null);
  /** Un solo modal: orden confirmada + impresión (REQ-039). */
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    title: string;
    lines: string[];
  } | null>(null);
  const showFeedback = useCallback(
    (item: { ok: boolean; title: string; detail: string }) => {
      setFeedback({
        ok: item.ok,
        title: item.title,
        lines: item.detail.trim() ? [item.detail.trim()] : [],
      });
    },
    [],
  );
  const handleEmitSuccess = useCallback(
    (info: { idOrdenVenta: string; codigo: string }) => {
      const codigo = info.codigo.trim() || "OV";
      setFeedback({
        ok: true,
        title: `${codigo} confirmada`,
        lines: ["El pedido ya está confirmado y listo para bodega."],
      });
    },
    [],
  );
  const handleAutoPrintResult = useCallback((result: AutoPrintOvResult) => {
    const print = autoPrintResultToFeedback(result);
    if (!print) return;
    const printLine = print.ok
      ? `Impresión enviada. ${print.detail}`
      : `${print.title}. ${print.detail}`;
    setFeedback((prev) => {
      if (prev?.title.toLowerCase().includes("confirmada")) {
        // La OV ya salió bien: el chulo se queda; la línea de impresión aclara el resto.
        return {
          ok: true,
          title: prev.title,
          lines: [...prev.lines, printLine],
        };
      }
      return {
        ok: print.ok,
        title: print.title,
        lines: [print.detail],
      };
    });
  }, []);
  const [busyAction, setBusyAction] = useState<{
    id: string;
    kind: "print" | "preview" | "fotos" | "borrar";
  } | null>(null);

  const [pdfPreview, setPdfPreview] = useState<{
    title: string;
    blob: Blob | null;
    error: string | null;
  } | null>(null);

  const [fotosPreview, setFotosPreview] = useState<{
    idOrdenVenta: string;
    title: string;
    ordenesTrabajo: OrdenVentaOtConFotosItem[];
    selectedOt: string | null;
    fotos: OrdenVentaFotoCapturaItem[];
    loadingOts: boolean;
    loadingFotos: boolean;
    /** true = abierto desde Cypher para una OT; no volver al listado de OTs. */
    lockToOt: boolean;
    error: string | null;
  } | null>(null);

  const fetchOrdenes = useCallback(async (): Promise<OrdenesVentaPageData> => {
    if (!codigoCuenta) {
      return { rows: [], idsConFotosCaptura: new Set() };
    }

    const rows = await runScoped(() =>
      listOrdenesVentaOperador({ codigoCuenta }),
    );
    let idsConFotosCaptura = new Set<string>();
    try {
      idsConFotosCaptura = await runScoped(() =>
        listOrdenIdsConSurtidoCaptura({
          codigoCuenta,
          idOrdenes: rows.map((row) => row.idOrdenVenta),
        }),
      );
    } catch {
      idsConFotosCaptura = new Set();
    }
    return { rows, idsConFotosCaptura };
  }, [codigoCuenta, runScoped]);

  const { data, isLoading, isRefreshing, error, reload } = useAsyncQuery(
    fetchOrdenes,
    Boolean(codigoCuenta),
  );

  const zonaHoraria = useCuentaZonaHoraria(codigoCuenta);

  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reloadRealtime = useCallback(() => {
    if (reloadTimerRef.current) {
      clearTimeout(reloadTimerRef.current);
    }
    reloadTimerRef.current = setTimeout(() => {
      void reload();
    }, 250);
  }, [reload]);

  useOrdenesVentaSubscription(codigoCuenta, reloadRealtime);

  /** Red de seguridad: si un cambio no llega al instante, se alinea en ~90 s. */
  useVisibleInterval(
    () => {
      void reload();
    },
    90_000,
    Boolean(codigoCuenta),
  );

  useEffect(() => {
    return () => {
      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
      }
    };
  }, []);

  const rows = useMemo(() => {
    const base = data?.rows ?? [];
    return base.filter(
      (row) =>
        row.estado !== "cancelada" && !idsOcultosBorrados.has(row.idOrdenVenta),
    );
  }, [data?.rows, idsOcultosBorrados]);
  const idsConFotosCaptura = useMemo(
    () => data?.idsConFotosCaptura ?? new Set<string>(),
    [data],
  );

  const filteredRows = useMemo(() => {
    if (!estadoFiltro) return rows;
    return rows.filter((row) => row.estado === estadoFiltro);
  }, [rows, estadoFiltro]);

  const countsByEstado = useMemo(() => {
    const counts: Record<EstadoOrdenVenta, number> = {
      por_confirmar: 0,
      confirmada: 0,
      alistamiento: 0,
      alistada: 0,
      cancelada: 0,
    };
    for (const row of rows) {
      counts[row.estado] = (counts[row.estado] ?? 0) + 1;
    }
    return counts;
  }, [rows]);

  const loadPrintSheets = useCallback(
    async (row: OrdenVentaOperadorRow) => {
      let detalle = null;
      if (codigoCuenta) {
        try {
          detalle = await runScoped(() =>
            getOrdenVentaDetalle({
              codigoCuenta,
              idOrdenVenta: row.idOrdenVenta,
            }),
          );
        } catch {
          detalle = null;
        }
      }

      const sheets = mapOrdenVentaToAlmacenPrintSheets({
        listRow: row,
        detalle,
        timeZone: zonaHoraria,
      });

      if (!codigoCuenta) return sheets;

      try {
        const capturas = await runScoped(() =>
          listOrdenSurtidoCapturasClient({
            codigoCuenta,
            idOrdenVenta: row.idOrdenVenta,
          }),
        );
        return applySurtidoCapturasToPrintSheets(sheets, capturas);
      } catch {
        return sheets;
      }
    },
    [codigoCuenta, runScoped, zonaHoraria],
  );

  const runPrint = useCallback(
    async (row: OrdenVentaOperadorRow) => {
      if (!codigoCuenta || printingLockRef.current) return;
      printingLockRef.current = true;
      setBusyAction({ id: row.idOrdenVenta, kind: "print" });

      try {
        const sheets = await loadPrintSheets(row);
        if (sheets.length === 0) {
          throw new Error("No hay datos para generar el PDF.");
        }
        // Mismo PDF horizontal multipágina que la previsualización (con surtido).
        await printOrdenTareaAlmacenLandscape(sheets, { codigoCuenta });
        const hojaLabel =
          sheets.length === 1
            ? "1 orden de trabajo enviada"
            : `${sheets.length} órdenes de trabajo enviadas`;
        showFeedback({
          ok: true,
          title: "Impresión enviada",
          detail: `${hojaLabel}. Confirma en la impresora que hayan salido bien.`,
        });
        const session = useAuthStore.getState().session;
        void postOrdenVentaLogForOts({
          idOrdenVenta: row.idOrdenVenta,
          codigoCuenta,
          accion: "actualizacion",
          mensaje: `PDF de almacén enviado a impresora por ${session?.nombre?.trim() || "usuario"}.`,
          idUsuario: session?.idUsuario ?? null,
          autorNombre: session?.nombre ?? null,
          idBodega: row.idBodega ?? null,
          idOrdenesTrabajo: sheets.map((sheet) => sheet.idOrdenTrabajo),
          payloadExtra: { tipo: "impresion_pdf", hojas: sheets.length },
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo enviar a la impresora.";
        const sinImpresora = message.includes("impresora configurada");
        showFeedback({
          ok: false,
          title: sinImpresora
            ? "No hay impresora configurada"
            : "No se pudo imprimir",
          detail: sinImpresora
            ? "Contacta al área de TI de Polaria para que configure la impresora de esta cuenta e inténtalo de nuevo."
            : message,
        });
      } finally {
        printingLockRef.current = false;
        setBusyAction(null);
      }
    },
    [codigoCuenta, loadPrintSheets, showFeedback],
  );

  const openPdfPreview = useCallback(
    async (row: OrdenVentaOperadorRow) => {
      if (!codigoCuenta || printingLockRef.current) return;
      printingLockRef.current = true;
      setBusyAction({ id: row.idOrdenVenta, kind: "preview" });
      setPdfPreview({
        title: `Previsualizacion · ${row.venta}`,
        blob: null,
        error: null,
      });

      try {
        const sheets = await loadPrintSheets(row);
        if (sheets.length === 0) {
          throw new Error("No hay datos para generar el PDF.");
        }
        const { blob } = await buildOrdenTareaAlmacenLandscapePdfBlob(sheets);
        setPdfPreview({
          title: `Previsualizacion · ${row.venta}`,
          blob,
          error: null,
        });
      } catch (error: unknown) {
        setPdfPreview({
          title: `Previsualizacion · ${row.venta}`,
          blob: null,
          error:
            error instanceof Error
              ? error.message
              : "No se pudo generar el PDF.",
        });
      } finally {
        printingLockRef.current = false;
        setBusyAction(null);
      }
    },
    [codigoCuenta, loadPrintSheets],
  );

  const openFotosCaptura = useCallback(
    async (
      row: OrdenVentaOperadorRow,
      idOrdenTrabajo?: string | null,
    ) => {
      if (printingLockRef.current) return;
      printingLockRef.current = true;
      fotosOrdenIdRef.current = row.idOrdenVenta;
      setBusyAction({ id: row.idOrdenVenta, kind: "fotos" });

      const ot = idOrdenTrabajo?.trim() || "";

      // Desde Cypher: solo fotos de la OT seleccionada (sin listar las demás).
      if (ot) {
        setFotosPreview({
          idOrdenVenta: row.idOrdenVenta,
          title: `Fotos · ${row.venta}`,
          ordenesTrabajo: [],
          selectedOt: ot,
          fotos: [],
          loadingOts: false,
          loadingFotos: true,
          lockToOt: true,
          error: null,
        });

        try {
          const params = new URLSearchParams({
            historial: "1",
            ot,
          });
          const response = await fetch(
            `/captura-orden/${encodeURIComponent(row.idOrdenVenta)}/api?${params.toString()}`,
          );
          const body = (await response.json()) as {
            error?: string;
            fotos?: Array<{
              idFoto?: string;
              idOrdenTrabajo?: string;
              urlFoto?: string | null;
              createdAt?: string | null;
            }>;
          };
          if (!response.ok) {
            throw new Error(body.error || "No se pudieron cargar las fotos.");
          }

          const fotos = (body.fotos ?? [])
            .map((item) => ({
              idFoto: item.idFoto,
              idOrdenTrabajo: item.idOrdenTrabajo,
              urlFoto: item.urlFoto?.trim() ?? "",
              createdAt: item.createdAt ?? null,
            }))
            .filter((item) => Boolean(item.urlFoto));

          setFotosPreview({
            idOrdenVenta: row.idOrdenVenta,
            title: `Fotos · ${row.venta}`,
            ordenesTrabajo: [],
            selectedOt: ot,
            fotos,
            loadingOts: false,
            loadingFotos: false,
            lockToOt: true,
            error: null,
          });
        } catch (error: unknown) {
          setFotosPreview({
            idOrdenVenta: row.idOrdenVenta,
            title: `Fotos · ${row.venta}`,
            ordenesTrabajo: [],
            selectedOt: ot,
            fotos: [],
            loadingOts: false,
            loadingFotos: false,
            lockToOt: true,
            error:
              error instanceof Error
                ? error.message
                : "No se pudieron cargar las fotos.",
          });
        } finally {
          printingLockRef.current = false;
          setBusyAction(null);
        }
        return;
      }

      setFotosPreview({
        idOrdenVenta: row.idOrdenVenta,
        title: `Fotos · ${row.venta}`,
        ordenesTrabajo: [],
        selectedOt: null,
        fotos: [],
        loadingOts: true,
        loadingFotos: false,
        lockToOt: false,
        error: null,
      });

      try {
        const response = await fetch(
          `/captura-orden/${encodeURIComponent(row.idOrdenVenta)}/api?historial=1`,
        );
        const body = (await response.json()) as {
          error?: string;
          ordenesTrabajo?: OrdenVentaOtConFotosItem[];
        };
        if (!response.ok) {
          throw new Error(body.error || "No se pudieron cargar las fotos.");
        }

        setFotosPreview({
          idOrdenVenta: row.idOrdenVenta,
          title: `Fotos · ${row.venta}`,
          ordenesTrabajo: body.ordenesTrabajo ?? [],
          selectedOt: null,
          fotos: [],
          loadingOts: false,
          loadingFotos: false,
          lockToOt: false,
          error: null,
        });
      } catch (error: unknown) {
        setFotosPreview({
          idOrdenVenta: row.idOrdenVenta,
          title: `Fotos · ${row.venta}`,
          ordenesTrabajo: [],
          selectedOt: null,
          fotos: [],
          loadingOts: false,
          loadingFotos: false,
          lockToOt: false,
          error:
            error instanceof Error
              ? error.message
              : "No se pudieron cargar las fotos.",
        });
      } finally {
        printingLockRef.current = false;
        setBusyAction(null);
      }
    },
    [],
  );

  const selectFotosOt = useCallback(async (idOrdenTrabajo: string) => {
    const idOrdenVenta = fotosOrdenIdRef.current;
    if (!idOrdenVenta) return;

    setFotosPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        selectedOt: idOrdenTrabajo,
        fotos: [],
        loadingFotos: true,
        error: null,
      };
    });

    try {
      const params = new URLSearchParams({
        historial: "1",
        ot: idOrdenTrabajo,
      });
      const response = await fetch(
        `/captura-orden/${encodeURIComponent(idOrdenVenta)}/api?${params.toString()}`,
      );
      const body = (await response.json()) as {
        error?: string;
        fotos?: Array<{
          idFoto?: string;
          idOrdenTrabajo?: string;
          urlFoto?: string | null;
          createdAt?: string | null;
        }>;
      };
      if (!response.ok) {
        throw new Error(body.error || "No se pudieron cargar las fotos.");
      }

      const fotos = (body.fotos ?? [])
        .map((item) => ({
          idFoto: item.idFoto,
          idOrdenTrabajo: item.idOrdenTrabajo,
          urlFoto: item.urlFoto?.trim() ?? "",
          createdAt: item.createdAt ?? null,
        }))
        .filter((item) => Boolean(item.urlFoto));

      setFotosPreview((prev) => {
        if (!prev || prev.idOrdenVenta !== idOrdenVenta) return prev;
        return {
          ...prev,
          selectedOt: idOrdenTrabajo,
          fotos,
          loadingFotos: false,
          error: null,
        };
      });
    } catch (error: unknown) {
      setFotosPreview((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          fotos: [],
          loadingFotos: false,
          error:
            error instanceof Error
              ? error.message
              : "No se pudieron cargar las fotos.",
        };
      });
    }
  }, []);

  const columns = useMemo(
    () => [
      {
        id: "venta",
        header: "OV",
        headerClassName: ordenVentaTableColumnClass("venta", "header"),
        cellClassName: ordenVentaTableColumnClass("venta"),
        cell: (row: OrdenVentaOperadorRow) => (
          <span className="inline-flex items-center gap-2">
            <OvAlertaDot
              alertaStatus={row.alertaStatus}
              minutosEnEstado={row.minutosEnEstado}
              slaMinutos={row.slaMinutos}
              alertaMinutos={row.alertaMinutos}
            />
            <PolariaTableCode>{row.venta}</PolariaTableCode>
          </span>
        ),
      },
      {
        id: "occ",
        header: "OCC",
        headerClassName: ordenVentaTableColumnClass("occ", "header"),
        cellClassName: ordenVentaTableColumnClass("occ"),
        cell: (row: OrdenVentaOperadorRow) => {
          const title =
            row.occTodas.length > 0 ? row.occTodas.join(", ") : row.occ;
          const tieneMas = row.occTodas.length > 1;
          return (
            <span
              className="inline-flex max-w-[10rem] items-center gap-1"
              title={title}
            >
              <span className="min-w-0 truncate">{row.occ}</span>
              {tieneMas ? (
                <span
                  className="shrink-0 font-medium text-polaria-teal"
                  aria-label={`${row.occTodas.length - 1} OCC más`}
                >
                  +
                </span>
              ) : null}
            </span>
          );
        },
      },
      {
        id: "comprador",
        header: "Cliente",
        headerClassName: ordenVentaTableColumnClass("comprador", "header"),
        cellClassName: ordenVentaTableColumnClass("comprador"),
        cell: (row: OrdenVentaOperadorRow) => (
          <span className="block max-w-[9.5rem] truncate" title={row.comprador}>
            {row.comprador}
          </span>
        ),
      },
      {
        id: "estado",
        header: "Estado",
        headerClassName: ordenVentaTableColumnClass("estado", "header"),
        cellClassName: ordenVentaTableColumnClass("estado"),
        cell: (row: OrdenVentaOperadorRow) => renderEstadoBadge(row.estado),
      },
      {
        id: "fecha",
        header: "Fecha de creación",
        headerClassName: ordenVentaTableColumnClass("fecha", "header"),
        cellClassName: ordenVentaTableColumnClass("fecha"),
        cell: (row: OrdenVentaOperadorRow) =>
          formatDateTime(row.fecha, zonaHoraria),
      },
      {
        id: "ot",
        header: "OT",
        headerClassName: ordenVentaTableColumnClass("ot", "header"),
        cellClassName: ordenVentaTableColumnClass("ot"),
        cell: (row: OrdenVentaOperadorRow) => String(row.ordenesTrabajo),
      },
      ...(inspect
        ? []
        : [
            {
              id: "acciones",
              header: "Acciones",
              headerClassName: ordenVentaTableColumnClass("acciones", "header"),
              cellClassName: ordenVentaTableColumnClass("acciones"),
              cell: (row: OrdenVentaOperadorRow) => {
                const open = cypherId === row.idOrdenVenta;
                return (
                  <span
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      title={open ? "Cerrar detalle" : "Ver detalle"}
                      aria-label={
                        open
                          ? `Cerrar detalle de ${row.venta}`
                          : `Ver detalle de ${row.venta}`
                      }
                      aria-pressed={open}
                      onClick={() => {
                        setCypherId((prev) =>
                          prev === row.idOrdenVenta ? null : row.idOrdenVenta,
                        );
                      }}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-lg border transition",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
                        open
                          ? "border-polaria-teal bg-polaria-teal text-polaria-on-teal"
                          : "border-polaria-t-20 bg-transparent text-polaria-teal hover:bg-polaria-t-08",
                      )}
                    >
                      <Plus
                        className="h-4 w-4"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                    </button>
                  </span>
                );
              },
            },
          ]),
    ],
    [inspect, cypherId, zonaHoraria],
  );

  const companionWithCypher = Boolean(
    !inspect &&
      cypherId &&
      ((isCreateOpen && editingId === cypherId) ||
        Boolean(detalleId && detalleId === cypherId)),
  );

  const body = (
    <>
      <div
        role="group"
        aria-label="Filtrar por estado"
        className="mb-4 flex w-full gap-2 sm:mb-5"
      >
        <button
          type="button"
          aria-pressed={estadoFiltro === null}
          onClick={() => setEstadoFiltro(null)}
          className={cn(
            "min-w-0 flex-1 rounded-xl border px-3 py-3 text-sm font-semibold transition sm:py-3.5 sm:text-base",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
            estadoFiltro === null
              ? "border-polaria-teal bg-polaria-teal text-polaria-on-teal"
              : "border-polaria-t-20 bg-polaria-t-08 text-polaria-w hover:border-polaria-teal hover:bg-polaria-t-20",
          )}
        >
          Todos
          <span
            className={cn(
              "ml-2 tabular-nums",
              estadoFiltro === null
                ? "text-polaria-on-teal/80"
                : "text-polaria-w-50",
            )}
          >
            {rows.length}
          </span>
        </button>
        {ESTADOS_ORDEN_VENTA.map((estado) => {
          const selected = estadoFiltro === estado;
          const count = countsByEstado[estado];
          return (
            <button
              key={estado}
              type="button"
              aria-pressed={selected}
              onClick={() => setEstadoFiltro(estado)}
              className={cn(
                "min-w-0 flex-1 rounded-xl border px-3 py-3 text-sm font-semibold transition sm:py-3.5 sm:text-base",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
                selected
                  ? "border-polaria-teal bg-polaria-teal text-polaria-on-teal"
                  : "border-polaria-t-20 bg-polaria-t-08 text-polaria-w hover:border-polaria-teal hover:bg-polaria-t-20",
              )}
            >
              {ESTADO_ORDEN_VENTA_LABELS[estado]}
              <span
                className={cn(
                  "ml-2 tabular-nums",
                  selected ? "text-polaria-on-teal/80" : "text-polaria-w-50",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <PolariaDataTable
        title="Órdenes de venta"
        subtitle="Venta, cliente y estado."
        isLoading={isLoading}
        error={
          error ??
          (!codigoCuenta ? "No se encontró la cuenta activa." : null)
        }
        rows={filteredRows}
        columns={columns}
        getRowKey={(row) => row.idOrdenVenta}
        emptyMessage={
          estadoFiltro
            ? `Sin órdenes en estado «${ESTADO_ORDEN_VENTA_LABELS[estadoFiltro]}».`
            : "Sin órdenes de venta registradas."
        }
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        primaryAction={
          inspect
            ? undefined
            : {
                label: "Nueva venta",
                onClick: () => {
                  if (!codigoCuenta) return;
                  setEditingId(null);
                  setIsCreateOpen(true);
                },
              }
        }
        onRowClick={(row) => {
          // OV por_confirmar: Mateo + formulario. Cypher solo con +.
          if (!inspect && row.estado === "por_confirmar") {
            const id = row.idOrdenVenta;
            setDetalleId(null);
            setCypherId(null);
            setEditingId(id);
            setIsCreateOpen(true);
            return;
          }
          setCypherId(null);
          setDetalleId(row.idOrdenVenta);
        }}
        getRowAriaLabel={(row) =>
          row.estado === "por_confirmar"
            ? `Revisar pedido ${row.venta}`
            : `Ver detalle de venta ${row.venta}`
        }
        tableClassName={ORDENES_VENTA_TABLE_MIN_WIDTH_CLASS}
      />

      <OrdenVentaDetalleModal
        idOrdenVenta={detalleId}
        codigoCuenta={codigoCuenta}
        inspect={inspect}
        cypherOpen={Boolean(
          !inspect && detalleId && cypherId && detalleId === cypherId,
        )}
        onToggleCypher={
          !inspect && detalleId
            ? () => {
                setCypherId((prev) =>
                  prev === detalleId ? null : detalleId,
                );
              }
            : undefined
        }
        onCompanionOtPickerChange={setCompanionOtPicker}
        onClose={() => {
          // Al cancelar/salir del detalle, cerrar también Cypher de ese pedido.
          const closingId = detalleId;
          setDetalleId(null);
          setCompanionOtPicker(null);
          setCypherId((prev) =>
            prev && closingId && prev === closingId ? null : prev,
          );
        }}
        onEmitted={inspect ? undefined : () => {
          void reload();
        }}
        onEmitSuccess={inspect ? undefined : handleEmitSuccess}
        onAutoPrintResult={inspect ? undefined : handleAutoPrintResult}
      />

      <OrdenVentaCypherDrawer
        idOrdenVenta={inspect ? null : cypherId}
        codigoCuenta={codigoCuenta}
        row={
          cypherId
            ? (rows.find((r) => r.idOrdenVenta === cypherId) ?? null)
            : null
        }
        inspect={inspect}
        companionWithEdit={companionWithCypher}
        companionOtPicker={companionOtPicker}
        busyKind={
          cypherId && busyAction?.id === cypherId
            ? busyAction.kind
            : null
        }
        onClose={() => {
          setCypherId(null);
          setCompanionOtPicker(null);
        }}
        onEdit={() => {
          if (!cypherId) return;
          setDetalleId(null);
          setEditingId(cypherId);
          setIsCreateOpen(true);
        }}
        onPrint={() => {
          const target = cypherId
            ? rows.find((r) => r.idOrdenVenta === cypherId)
            : null;
          if (!target) return;
          void runPrint(target);
        }}
        onPreview={() => {
          const target = cypherId
            ? rows.find((r) => r.idOrdenVenta === cypherId)
            : null;
          if (!target) return;
          void openPdfPreview(target);
        }}
        onFotos={(idOrdenTrabajo) => {
          const target = cypherId
            ? rows.find((r) => r.idOrdenVenta === cypherId)
            : null;
          if (!target) return;
          void openFotosCaptura(target, idOrdenTrabajo);
        }}
        onBorrar={
          inspect || !cypherId || !codigoCuenta
            ? undefined
            : async () => {
                const target = rows.find((r) => r.idOrdenVenta === cypherId);
                if (!target) {
                  throw new DomainServiceError(
                    "No se encontró la orden de venta.",
                    "NOT_FOUND",
                  );
                }
                setBusyAction({ id: cypherId, kind: "borrar" });
                try {
                  await runScoped(() =>
                    borrarOrdenVenta({
                      codigoCuenta,
                      idOrdenVenta: cypherId,
                    }),
                  );
                  const autor =
                    useAuthStore.getState().session?.nombre?.trim() ||
                    "usuario";
                  void postOrdenVentaLog({
                    idOrdenVenta: cypherId,
                    codigoCuenta,
                    accion: "actualizacion",
                    mensaje: `Orden borrada (desactivada) por ${autor}.`,
                    idUsuario:
                      useAuthStore.getState().session?.idUsuario ?? null,
                    autorNombre:
                      useAuthStore.getState().session?.nombre ?? null,
                    idBodega: target.idBodega ?? null,
                  });
                  setIdsOcultosBorrados((prev) => {
                    const next = new Set(prev);
                    next.add(cypherId);
                    return next;
                  });
                  setCypherId(null);
                  void reload();
                } finally {
                  setBusyAction(null);
                }
              }
        }
      />

      <OrdenVentaCreateModal
        open={!inspect && isCreateOpen}
        idOrdenVenta={editingId}
        cypherOpen={Boolean(
          editingId && cypherId && editingId === cypherId,
        )}
        onToggleCypher={
          editingId
            ? () => {
                setCypherId((prev) =>
                  prev === editingId ? null : editingId,
                );
              }
            : undefined
        }
        onCompanionOtPickerChange={setCompanionOtPicker}
        onClose={() => {
          // Cypher abierto desde el formulario del pedido se cierra al salir.
          const closingId = editingId;
          setIsCreateOpen(false);
          setEditingId(null);
          setCompanionOtPicker(null);
          setCypherId((prev) =>
            prev && closingId && prev === closingId ? null : prev,
          );
        }}
        onCreated={() => {
          void reload();
        }}
        onEmitSuccess={handleEmitSuccess}
        onAutoPrintResult={handleAutoPrintResult}
      />

      {feedback ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center overflow-hidden p-3 sm:p-6"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setFeedback(null)}
            className="absolute inset-0 bg-polaria-bg/80 backdrop-blur-sm"
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="ov-feedback-title"
            aria-describedby="ov-feedback-detail"
            className="polaria-card-glow relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-t-08 backdrop-blur-xl"
          >
            <div className="px-5 pb-3 pt-6 sm:px-6">
              <div className="flex flex-col items-center text-center">
                {feedback.ok ? (
                  <CheckCircle2
                    className="h-12 w-12 text-polaria-teal"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                ) : (
                  <XCircle
                    className="h-12 w-12 text-polaria-danger"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                )}
                <h2
                  id="ov-feedback-title"
                  className="mt-4 polaria-text-title font-semibold text-polaria-w"
                >
                  {feedback.title}
                </h2>
                <div
                  id="ov-feedback-detail"
                  className="mt-2 space-y-2 polaria-text-body-sm text-polaria-w-50"
                >
                  {feedback.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-polaria-w-08 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="w-full rounded-xl bg-polaria-teal px-4 py-2.5 polaria-text-body-sm font-semibold text-polaria-on-teal transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <OrdenVentaPdfPreviewModal
        open={Boolean(pdfPreview)}
        title={pdfPreview?.title ?? "Previsualizacion"}
        blob={pdfPreview?.blob ?? null}
        isLoading={Boolean(pdfPreview) && !pdfPreview?.blob && !pdfPreview?.error}
        error={pdfPreview?.error ?? null}
        onClose={() => setPdfPreview(null)}
        dockWithCypher={Boolean(cypherId)}
      />

      <OrdenVentaFotosCapturaModal
        open={Boolean(fotosPreview)}
        title={fotosPreview?.title ?? "Fotos"}
        ordenesTrabajo={fotosPreview?.ordenesTrabajo ?? []}
        fotos={fotosPreview?.fotos ?? []}
        selectedOt={fotosPreview?.selectedOt ?? null}
        isLoadingOts={Boolean(fotosPreview?.loadingOts)}
        isLoadingFotos={Boolean(fotosPreview?.loadingFotos)}
        allowBackToOts={!fotosPreview?.lockToOt}
        dockWithCypher={Boolean(fotosPreview?.lockToOt && cypherId)}
        error={fotosPreview?.error ?? null}
        onSelectOt={(idOrdenTrabajo) => {
          void selectFotosOt(idOrdenTrabajo);
        }}
        onBackToOts={() => {
          setFotosPreview((prev) =>
            prev
              ? {
                  ...prev,
                  selectedOt: null,
                  fotos: [],
                  loadingFotos: false,
                  error: null,
                }
              : prev,
          );
        }}
        onClose={() => {
          fotosOrdenIdRef.current = null;
          setFotosPreview(null);
        }}
      />
    </>
  );

  if (inspect) {
    return (
      <AdminMaestroViewShell inspect sectionLabel="" title="" hint="">
        {body}
      </AdminMaestroViewShell>
    );
  }

  return (
    <OperationalModuleShell
      title="Órdenes venta"
      description="Órdenes de venta manuales de la cuenta."
      gate={{ roles: ROLES_NIVEL_CUENTA }}
      dockForCypher={Boolean(cypherId)}
    >
      {body}
    </OperationalModuleShell>
  );
}
