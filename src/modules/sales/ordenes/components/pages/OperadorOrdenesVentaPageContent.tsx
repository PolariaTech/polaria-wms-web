"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import {
  PolariaTableActionGroup,
  PolariaTableBadge,
  PolariaTableCode,
  PolariaTableDocumentButton,
  PolariaTableEditButton,
  PolariaTableImagesButton,
  PolariaTablePrintButton,
} from "@/components/shared/table/PolariaTableCells";
import { usePolariaToast } from "@/components/shared/toast/PolariaToastProvider";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
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
  puedeAccionesAlmacenOrdenVenta,
  puedeEditarOrdenVentaDesdeLista,
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
import { mapOrdenVentaToAlmacenPrintSheets } from "../../print/map-orden-tarea-almacen";
import {
  getOrdenVentaDetalle,
  listOrdenesVentaOperador,
} from "../../../shared/services/sales.service";
import type {
  EstadoOrdenVenta,
  OrdenVentaOperadorRow,
} from "../../../shared/types/sales.types";
import { applySurtidoCapturasToPrintSheets } from "../../surtido/apply-surtido-to-print";
import { listOrdenIdsConSurtidoCaptura } from "../../surtido/list-orden-ids-con-surtido-captura";
import { listOrdenSurtidoCapturasClient } from "../../surtido/list-orden-surtido-capturas.client";
import { useAuthStore } from "@/stores/auth.store";
import { OrdenVentaCreateModal } from "../modals/OrdenVentaCreateModal";
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
  const { showToast } = usePolariaToast();
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoOrdenVenta | null>(
    null,
  ); // null = Todos
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const printingLockRef = useRef(false);
  const fotosOrdenIdRef = useRef<string | null>(null);
  const [busyAction, setBusyAction] = useState<{
    id: string;
    kind: "print" | "preview" | "fotos";
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

  useEffect(() => {
    return () => {
      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
      }
    };
  }, []);

  const rows = data?.rows ?? [];
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
    [codigoCuenta, runScoped],
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
        showToast({
          title: "✓ Órdenes de trabajo enviadas",
          content: `${hojaLabel}. Confirma en la impresora que hayan salido bien.`,
          variant: "success",
          durationMs: 4500,
        });
        const { postOrdenVentaLog } = await import(
          "../../services/orden-venta-log.client"
        );
        const session = useAuthStore.getState().session;
        void postOrdenVentaLog({
          idOrdenVenta: row.idOrdenVenta,
          codigoCuenta,
          accion: "actualizacion",
          mensaje: `PDF de almacén enviado a impresora por ${session?.nombre?.trim() || "usuario"}.`,
          idUsuario: session?.idUsuario ?? null,
          autorNombre: session?.nombre ?? null,
          idBodega: row.idBodega ?? null,
          payloadExtra: { tipo: "impresion_pdf", hojas: sheets.length },
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo enviar a la impresora.";
        showToast({
          title: message.includes("impresora configurada")
            ? "No hay impresora configurada"
            : "No se pudo imprimir",
          content: message.includes("impresora configurada")
            ? "Configura una en Configurador → Impresoras e inténtalo de nuevo."
            : message,
          variant: "error",
          durationMs: 5000,
        });
      } finally {
        printingLockRef.current = false;
        setBusyAction(null);
      }
    },
    [codigoCuenta, loadPrintSheets, showToast],
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
    async (row: OrdenVentaOperadorRow) => {
      if (printingLockRef.current) return;
      printingLockRef.current = true;
      fotosOrdenIdRef.current = row.idOrdenVenta;
      setBusyAction({ id: row.idOrdenVenta, kind: "fotos" });
      setFotosPreview({
        idOrdenVenta: row.idOrdenVenta,
        title: `Fotos · ${row.venta}`,
        ordenesTrabajo: [],
        selectedOt: null,
        fotos: [],
        loadingOts: true,
        loadingFotos: false,
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
          <PolariaTableCode>{row.venta}</PolariaTableCode>
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
        header: "Comprador",
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
        cell: (row: OrdenVentaOperadorRow) => formatDateTime(row.fecha),
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
                const hasFotos = idsConFotosCaptura.has(row.idOrdenVenta);
                const busyId = busyAction?.id === row.idOrdenVenta;
                const puedeEditar = puedeEditarOrdenVentaDesdeLista(
                  row.estado,
                );
                const puedeAlmacen = puedeAccionesAlmacenOrdenVenta(
                  row.estado,
                );
                const bloqueadoHastaConfirmar =
                  "Disponible cuando la orden esté confirmada";
                return (
                  <span
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <PolariaTableActionGroup>
                      <PolariaTableEditButton
                        label={
                          puedeEditar
                            ? "Editar"
                            : bloqueadoHastaConfirmar
                        }
                        disabled={!puedeEditar}
                        onClick={() => {
                          if (!puedeEditar) return;
                          setEditingId(row.idOrdenVenta);
                          setIsCreateOpen(true);
                        }}
                      />
                      <PolariaTablePrintButton
                        label={
                          puedeAlmacen
                            ? "Imprimir"
                            : bloqueadoHastaConfirmar
                        }
                        onClick={() => {
                          if (!puedeAlmacen) return;
                          void runPrint(row);
                        }}
                        disabled={
                          !puedeAlmacen ||
                          (busyId && busyAction?.kind === "print")
                        }
                      />
                      <PolariaTableDocumentButton
                        label={
                          puedeAlmacen
                            ? "Descarga"
                            : bloqueadoHastaConfirmar
                        }
                        onClick={() => {
                          if (!puedeAlmacen) return;
                          void openPdfPreview(row);
                        }}
                        disabled={
                          !puedeAlmacen ||
                          (busyId && busyAction?.kind === "preview")
                        }
                      />
                      <PolariaTableImagesButton
                        label={
                          !puedeAlmacen
                            ? bloqueadoHastaConfirmar
                            : hasFotos
                              ? "Fotos del QR"
                              : "Aún no hay fotos del QR"
                        }
                        onClick={() => {
                          if (!puedeAlmacen || !hasFotos) return;
                          void openFotosCaptura(row);
                        }}
                        disabled={
                          !puedeAlmacen ||
                          !hasFotos ||
                          (busyId && busyAction?.kind === "fotos")
                        }
                      />
                    </PolariaTableActionGroup>
                  </span>
                );
              },
            },
          ]),
    ],
    [
      inspect,
      runPrint,
      openPdfPreview,
      openFotosCaptura,
      busyAction,
      idsConFotosCaptura,
    ],
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
        subtitle="Venta, comprador y estado."
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
          // OV por_confirmar (correo/tercero): flujo Mateo → preview OT → formulario.
          if (!inspect && row.estado === "por_confirmar") {
            setDetalleId(null);
            setEditingId(row.idOrdenVenta);
            setIsCreateOpen(true);
            return;
          }
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
        onClose={() => setDetalleId(null)}
        onEmitted={inspect ? undefined : () => {
          void reload();
        }}
      />

      <OrdenVentaCreateModal
        open={!inspect && isCreateOpen}
        idOrdenVenta={editingId}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingId(null);
        }}
        onCreated={() => {
          void reload();
        }}
      />

      <OrdenVentaPdfPreviewModal
        open={Boolean(pdfPreview)}
        title={pdfPreview?.title ?? "Previsualizacion"}
        blob={pdfPreview?.blob ?? null}
        isLoading={Boolean(pdfPreview) && !pdfPreview?.blob && !pdfPreview?.error}
        error={pdfPreview?.error ?? null}
        onClose={() => setPdfPreview(null)}
      />

      <OrdenVentaFotosCapturaModal
        open={Boolean(fotosPreview)}
        title={fotosPreview?.title ?? "Fotos"}
        ordenesTrabajo={fotosPreview?.ordenesTrabajo ?? []}
        fotos={fotosPreview?.fotos ?? []}
        selectedOt={fotosPreview?.selectedOt ?? null}
        isLoadingOts={Boolean(fotosPreview?.loadingOts)}
        isLoadingFotos={Boolean(fotosPreview?.loadingFotos)}
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

  return body;
}
