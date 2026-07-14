"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRightFromLine, Eye, Package, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatKgEs } from "@/lib/utils/decimal-es";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { POLARIA_FORM_SELECT_CLASS_COMPACT } from "@/components/shared/form/PolariaFormField";
import { usePolariaToast } from "@/components/shared/toast/PolariaToastProvider";
import {
  formatCamionId,
  listCamionesAdmin,
  type CamionListRow,
} from "@/modules/admin-panel/camiones/services/camiones.service";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import { JefeBodegaOrdenVentaPickerModal } from "@/modules/jefe-bodega/components/modals/JefeBodegaOrdenVentaPickerModal";
import {
  getOrdenVentaDetalle,
  type OrdenVentaDetalleRow,
  type OrdenVentaOperadorRow,
} from "@/modules/sales";
import { CustodioSidePanel } from "./CustodioSidePanel";

interface CustodioOrdenSalidaColumnProps {
  ventas: OrdenVentaOperadorRow[];
  cajasEnSalida: number;
  codigoCuenta: string | null;
  onRefresh: () => void;
  isLoading: boolean;
  slotSize: number;
}

type PickerKind = "paquete" | "detalle" | null;

interface PreviewProductoRow {
  key: string;
  venta: string;
  comprador: string;
  producto: string;
  cantidadKg: number;
}

function truckLabel(truck: CamionListRow): string {
  const code = truck.codigo?.trim() || formatCamionId(truck.idCamion);
  return `${truck.placa} · ${code}`;
}

function lineaProductoLabel(
  linea: OrdenVentaDetalleRow["lineas"][number],
): string {
  const producto = linea.producto;
  const sku = producto?.sku?.trim();
  const desc = producto?.descripcion?.trim();
  if (sku && desc) return `${sku} ${desc}`;
  return desc || sku || "Producto";
}

export function CustodioOrdenSalidaColumn({
  ventas,
  cajasEnSalida,
  codigoCuenta,
  onRefresh,
  isLoading,
  slotSize,
}: CustodioOrdenSalidaColumnProps) {
  const { showToast } = usePolariaToast();

  const ventasActivas = useMemo(
    () =>
      ventas.filter((venta) =>
        ["confirmada", "en_preparacion", "parcialmente_despachada"].includes(
          venta.estado,
        ),
      ),
    [ventas],
  );

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [detalleVentaId, setDetalleVentaId] = useState("");
  const [paqueteIds, setPaqueteIds] = useState<string[] | null>(null);
  const [camionId, setCamionId] = useState("");
  const [camiones, setCamiones] = useState<CamionListRow[]>([]);
  const [loadingCamiones, setLoadingCamiones] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [picker, setPicker] = useState<PickerKind>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewByOrden, setPreviewByOrden] = useState<
    Record<string, OrdenVentaDetalleRow>
  >({});
  const [loadingPreview, setLoadingPreview] = useState(false);

  const paqueteArmado = Boolean(paqueteIds?.length);

  const ventasSeleccionadas = useMemo(
    () =>
      ventasActivas.filter((venta) =>
        selectedKeys.includes(venta.idOrdenVenta),
      ),
    [selectedKeys, ventasActivas],
  );

  const ventasPaquete = useMemo(() => {
    if (!paqueteIds?.length) return [];
    return ventasActivas.filter((venta) =>
      paqueteIds.includes(venta.idOrdenVenta),
    );
  }, [paqueteIds, ventasActivas]);

  const ventaDetalle = useMemo(
    () =>
      ventasActivas.find((venta) => venta.idOrdenVenta === detalleVentaId) ??
      null,
    [detalleVentaId, ventasActivas],
  );

  const mezclaCuentas = useMemo(() => {
    const cuentas = new Set(ventasSeleccionadas.map((venta) => venta.cuenta));
    return cuentas.size > 1;
  }, [ventasSeleccionadas]);

  const selectedCamion = useMemo(
    () => camiones.find((camion) => camion.idCamion === camionId) ?? null,
    [camionId, camiones],
  );

  const paqueteFieldLabel = useMemo(() => {
    if (ventasSeleccionadas.length === 0) return "";
    if (ventasSeleccionadas.length === 1) {
      return `${ventasSeleccionadas[0]!.venta} · ${ventasSeleccionadas[0]!.comprador}`;
    }
    return `${ventasSeleccionadas.length} ventas seleccionadas`;
  }, [ventasSeleccionadas]);

  const detalleFieldLabel = useMemo(() => {
    if (!ventaDetalle) return "";
    return `${ventaDetalle.venta} · ${ventaDetalle.comprador}`;
  }, [ventaDetalle]);

  const previewIds = useMemo(() => {
    if (paqueteArmado && paqueteIds?.length) return paqueteIds;
    return selectedKeys;
  }, [paqueteArmado, paqueteIds, selectedKeys]);

  const canPreview = previewIds.length > 0 && !mezclaCuentas;

  const loadCamiones = useCallback(async () => {
    if (!codigoCuenta?.trim()) {
      setCamiones([]);
      return;
    }

    setLoadingCamiones(true);
    try {
      const rows = await listCamionesAdmin({ codigoCuenta });
      setCamiones(rows.filter((row) => row.disponible));
    } catch {
      setCamiones([]);
    } finally {
      setLoadingCamiones(false);
    }
  }, [codigoCuenta]);

  useEffect(() => {
    void loadCamiones();
  }, [loadCamiones]);

  useEffect(() => {
    const activos = new Set(ventasActivas.map((venta) => venta.idOrdenVenta));
    setSelectedKeys((prev) => prev.filter((id) => activos.has(id)));
    setPaqueteIds((prev) => {
      if (!prev) return prev;
      const next = prev.filter((id) => activos.has(id));
      return next.length > 0 ? next : null;
    });
    if (detalleVentaId && !activos.has(detalleVentaId)) {
      setDetalleVentaId("");
    }
  }, [detalleVentaId, ventasActivas]);

  useEffect(() => {
    if (!previewOpen || !codigoCuenta?.trim() || previewIds.length === 0) {
      if (!previewOpen) setPreviewByOrden({});
      return;
    }

    let cancelled = false;
    setLoadingPreview(true);

    void Promise.all(
      previewIds.map(async (idOrdenVenta) => {
        try {
          const detalle = await getOrdenVentaDetalle({
            codigoCuenta,
            idOrdenVenta,
          });
          return [idOrdenVenta, detalle] as const;
        } catch {
          return null;
        }
      }),
    ).then((rows) => {
      if (cancelled) return;
      const next: Record<string, OrdenVentaDetalleRow> = {};
      for (const row of rows) {
        if (!row) continue;
        next[row[0]] = row[1];
      }
      setPreviewByOrden(next);
      setLoadingPreview(false);
    });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, previewIds, previewOpen]);

  const previewRows = useMemo((): PreviewProductoRow[] => {
    const rows: PreviewProductoRow[] = [];
    for (const id of previewIds) {
      const detalle = previewByOrden[id];
      const venta =
        ventasActivas.find((row) => row.idOrdenVenta === id) ?? null;
      const ventaLabel = venta?.venta ?? detalle?.codigo ?? id;
      const compradorLabel =
        venta?.comprador ?? detalle?.comprador_nombre ?? "—";
      const lineas = detalle?.lineas ?? [];
      if (lineas.length === 0) {
        if (!loadingPreview) {
          rows.push({
            key: `${id}-empty`,
            venta: ventaLabel,
            comprador: compradorLabel,
            producto: "Sin líneas",
            cantidadKg: 0,
          });
        }
        continue;
      }
      for (const linea of lineas) {
        rows.push({
          key: linea.id_linea_orden_venta,
          venta: ventaLabel,
          comprador: compradorLabel,
          producto: lineaProductoLabel(linea),
          cantidadKg: linea.cantidad_pedida,
        });
      }
    }
    return rows;
  }, [loadingPreview, previewByOrden, previewIds, ventasActivas]);

  const handleSelectPaqueteVenta = (orden: OrdenVentaOperadorRow) => {
    setSelectedKeys((prev) =>
      prev.includes(orden.idOrdenVenta)
        ? prev
        : [...prev, orden.idOrdenVenta],
    );
    setPicker(null);
  };

  const handleRemovePaqueteVenta = (idOrdenVenta: string) => {
    if (paqueteArmado) return;
    setSelectedKeys((prev) => prev.filter((id) => id !== idOrdenVenta));
  };

  const handleArmarPaquete = () => {
    if (ventasSeleccionadas.length === 0 || mezclaCuentas) return;
    setPaqueteIds(ventasSeleccionadas.map((venta) => venta.idOrdenVenta));
    setCamionId("");
    void loadCamiones();
  };

  const handleCancelarPaquete = () => {
    setPaqueteIds(null);
    setCamionId("");
  };

  const handleEnviarPaquete = async () => {
    if (!paqueteIds?.length || !selectedCamion) return;
    if (cajasEnSalida <= 0) {
      showToast({
        title: "Sin cajas en salida",
        content:
          "No hay cajas en zona de salida para las ventas del paquete.",
        variant: "error",
        durationMs: 3500,
      });
      return;
    }

    setEnviando(true);
    try {
      showToast({
        title: "Paquete listo (UI)",
        content: `Se enviarán ${cajasEnSalida} caja(s) con ${selectedCamion.placa}. El despacho al transporte se conecta en el siguiente paso.`,
        variant: "info",
        durationMs: 4000,
      });
      setPaqueteIds(null);
      setSelectedKeys([]);
      setCamionId("");
    } finally {
      setEnviando(false);
    }
  };

  const secondaryButtonClass = cn(
    "inline-flex w-full items-center justify-center gap-2 rounded-xl",
    "border border-polaria-t-20 bg-polaria-w-08 px-4 py-2.5",
    "polaria-text-body-sm font-medium text-polaria-w",
    "transition hover:border-polaria-teal hover:text-polaria-teal",
    "disabled:cursor-not-allowed disabled:opacity-60",
  );

  const previsualizarButton = (
    <button
      type="button"
      disabled={!canPreview}
      onClick={() => setPreviewOpen(true)}
      className={secondaryButtonClass}
    >
      <Eye className="h-4 w-4" aria-hidden />
      Previsualizar
    </button>
  );

  return (
    <>
      <CustodioSidePanel
        slotSize={slotSize}
        panelClassName="polaria-card-glow border-polaria-t-20 bg-polaria-t-08"
        className="h-full min-h-0"
      >
        <header className="mb-2 flex w-full shrink-0 flex-row flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 shrink items-center gap-2">
            <ArrowRightFromLine
              className="h-4 w-4 shrink-0 text-polaria-teal"
              strokeWidth={1.75}
              aria-hidden
            />
            <h2 className="truncate polaria-text-body-sm font-semibold text-polaria-w">
              Orden de salida
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-polaria-t-20 bg-polaria-t-08 px-2.5 py-0.5 polaria-text-caption text-polaria-w">
              {paqueteArmado ? "Paquete" : `${cajasEnSalida} cajas`}
            </span>
            <span className="rounded-full border border-polaria-t-20 bg-polaria-t-08 px-2.5 py-0.5 polaria-text-caption text-polaria-teal">
              {ventasActivas.length} ventas
            </span>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          {!paqueteArmado ? (
            <>
              <div className="flex shrink-0 flex-col gap-1.5">
                <label
                  htmlFor="custodio-salida-paquete-venta"
                  className="polaria-text-caption text-polaria-w-50"
                >
                  Ventas para el mismo camión
                </label>
                <JefeBodegaModalSearchField
                  id="custodio-salida-paquete-venta"
                  value={paqueteFieldLabel}
                  placeholder="Buscar órdenes de venta"
                  ariaLabel="Ventas para el paquete"
                  onSearchClick={
                    isLoading ? undefined : () => setPicker("paquete")
                  }
                />
                {ventasSeleccionadas.length > 0 ? (
                  <ul className="flex flex-wrap gap-1.5 pt-1">
                    {ventasSeleccionadas.map((venta) => (
                      <li
                        key={venta.idOrdenVenta}
                        className="inline-flex max-w-full items-center gap-1 rounded-full border border-polaria-t-20 bg-polaria-t-08 px-2 py-0.5"
                      >
                        <span className="truncate polaria-text-caption text-polaria-w">
                          {venta.venta}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleRemovePaqueteVenta(venta.idOrdenVenta)
                          }
                          aria-label={`Quitar ${venta.venta}`}
                          className="rounded-full p-0.5 text-polaria-w-50 transition hover:text-polaria-teal"
                        >
                          <X className="h-3 w-3" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              {mezclaCuentas ? (
                <p className="polaria-text-caption font-medium text-polaria-danger">
                  Las ventas del mismo envío deben ser de la misma cuenta.
                </p>
              ) : null}

              <div className="flex shrink-0 flex-col gap-1.5">
                <label
                  htmlFor="custodio-salida-detalle-venta"
                  className="polaria-text-caption text-polaria-w-50"
                >
                  Venta para detalle (opcional)
                </label>
                <JefeBodegaModalSearchField
                  id="custodio-salida-detalle-venta"
                  value={detalleFieldLabel}
                  placeholder="Buscar orden de venta"
                  ariaLabel="Venta para detalle"
                  onSearchClick={
                    isLoading ? undefined : () => setPicker("detalle")
                  }
                />
              </div>

              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className={secondaryButtonClass}
              >
                <RefreshCw
                  className={cn("h-4 w-4", isLoading && "animate-spin")}
                  aria-hidden
                />
                Actualizar
              </button>

              {previsualizarButton}

              <div className="rounded-xl border border-dashed border-polaria-t-20 bg-polaria-w-08 p-3">
                <p className="polaria-text-caption font-semibold uppercase tracking-wide text-polaria-teal">
                  Paquete de despacho
                </p>
                {selectedKeys.length === 0 ? (
                  <p className="mt-2 polaria-text-caption text-polaria-w-50">
                    Buscá y agregá al menos una venta para armar el paquete.
                  </p>
                ) : (
                  <>
                    <p className="mt-2 polaria-text-caption text-polaria-w-50">
                      Previsualizá los productos y armá el paquete para elegir
                      camión.
                    </p>
                    <button
                      type="button"
                      disabled={mezclaCuentas || isLoading}
                      onClick={handleArmarPaquete}
                      className={cn(
                        "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5",
                        "bg-polaria-teal polaria-text-body-sm font-semibold text-polaria-bg",
                        "transition hover:opacity-90",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                    >
                      <Package className="h-4 w-4" aria-hidden />
                      Armar paquete de despacho
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-dashed border-polaria-t-20 bg-polaria-t-08 p-3">
                <p className="polaria-text-caption font-semibold uppercase tracking-wide text-polaria-teal">
                  Paquete listo
                </p>
                <ul className="mt-2 space-y-1">
                  {ventasPaquete.map((venta) => (
                    <li
                      key={venta.idOrdenVenta}
                      className="polaria-text-caption font-semibold text-polaria-w"
                    >
                      {venta.venta}{" "}
                      <span className="font-normal text-polaria-w-50">
                        · {venta.comprador}
                      </span>
                    </li>
                  ))}
                </ul>

                {cajasEnSalida <= 0 ? (
                  <p className="mt-2 rounded-lg border border-polaria-warning-border bg-polaria-warning-bg px-3 py-2 polaria-text-caption text-polaria-warning">
                    No hay cajas en zona de salida para estas ventas.
                  </p>
                ) : (
                  <p className="mt-2 polaria-text-caption text-polaria-w-50">
                    Se enviarán{" "}
                    <strong className="text-polaria-w">{cajasEnSalida}</strong>{" "}
                    caja(s). Las ventas pasarán a transporte.
                  </p>
                )}

                <div className="mt-3 grid gap-1.5">
                  <label
                    htmlFor="custodio-orden-salida-camion"
                    className="polaria-text-caption text-polaria-w-50"
                  >
                    Camión asignado
                  </label>
                  <select
                    id="custodio-orden-salida-camion"
                    value={camionId}
                    onChange={(event) => setCamionId(event.target.value)}
                    disabled={
                      loadingCamiones || camiones.length === 0 || enviando
                    }
                    className={POLARIA_FORM_SELECT_CLASS_COMPACT}
                  >
                    <option value="" className="polaria-form-select__option">
                      {loadingCamiones
                        ? "Cargando camiones…"
                        : camiones.length === 0
                          ? "Sin camiones disponibles"
                          : "Seleccioná un camión"}
                    </option>
                    {camiones.map((camion) => (
                      <option
                        key={camion.idCamion}
                        value={camion.idCamion}
                        className="polaria-form-select__option"
                      >
                        {truckLabel(camion)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {previsualizarButton}

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={
                    enviando || cajasEnSalida <= 0 || !selectedCamion
                  }
                  onClick={() => void handleEnviarPaquete()}
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5",
                    "bg-polaria-teal polaria-text-body-sm font-semibold text-polaria-bg",
                    "transition hover:opacity-90",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  <Package className="h-4 w-4" aria-hidden />
                  {enviando ? "Enviando…" : "Enviar paquete al transporte"}
                </button>
                <button
                  type="button"
                  disabled={enviando}
                  onClick={handleCancelarPaquete}
                  className={secondaryButtonClass}
                >
                  Cancelar paquete
                </button>
              </div>
            </div>
          )}
        </div>
      </CustodioSidePanel>

      <JefeBodegaOrdenVentaPickerModal
        open={picker === "paquete"}
        onClose={() => setPicker(null)}
        ordenes={ventasActivas}
        loading={isLoading}
        selectedId={null}
        onSelect={handleSelectPaqueteVenta}
      />

      <JefeBodegaOrdenVentaPickerModal
        open={picker === "detalle"}
        onClose={() => setPicker(null)}
        ordenes={ventasActivas}
        loading={isLoading}
        selectedId={detalleVentaId || null}
        onSelect={(orden) => {
          setDetalleVentaId(orden.idOrdenVenta);
          setPicker(null);
        }}
      />

      <PolariaFormModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Previsualización del envío"
        description="Productos que se enviarán con las ventas del paquete."
        onSubmit={(event) => event.preventDefault()}
        asForm={false}
        hideHeaderClose
        footerAction={<></>}
        cancelLabel="Cerrar"
        compact
        size="lg"
      >
        {loadingPreview ? (
          <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
            Cargando productos…
          </p>
        ) : previewRows.length === 0 ? (
          <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
            No hay productos para previsualizar.
          </p>
        ) : (
          <div className="max-h-[min(55dvh,26rem)] overflow-auto rounded-xl border border-polaria-w-08">
            <table className="w-full min-w-[36rem] border-collapse text-left">
              <thead className="sticky top-0 bg-polaria-t-08">
                <tr className="border-b border-polaria-t-20">
                  <th className="px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50">
                    Venta
                  </th>
                  <th className="px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50">
                    Comprador
                  </th>
                  <th className="px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50">
                    Producto
                  </th>
                  <th className="px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50">
                    Cantidad
                  </th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => (
                  <tr
                    key={row.key}
                    className="border-b border-polaria-w-08 text-polaria-w last:border-b-0"
                  >
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm font-medium text-polaria-teal">
                      {row.venta}
                    </td>
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm">
                      {row.comprador}
                    </td>
                    <td className="max-w-[14rem] truncate px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w-50">
                      {row.producto}
                    </td>
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm whitespace-nowrap">
                      {formatKgEs(row.cantidadKg)} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PolariaFormModal>
    </>
  );
}
