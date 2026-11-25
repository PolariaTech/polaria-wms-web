"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePolariaToast } from "@/components/shared/toast/PolariaToastProvider";
import {
  listCamionesAdmin,
  type CamionListRow,
} from "@/modules/admin-panel/camiones/services/camiones.service";
import {
  getOrdenVentaDetalle,
  type OrdenVentaDetalleRow,
  type OrdenVentaOperadorRow,
} from "@/modules/sales";
import { crearPaqueteDespachoApi } from "@/modules/transport";
import {
  buildPreviewRows,
  ESTADOS_VENTA_ACTIVA,
  truckLabel,
  type PickerKind,
} from "./custodio-orden-salida.helpers";

export interface UseCustodioOrdenSalidaParams {
  ventas: OrdenVentaOperadorRow[];
  cajasEnSalida: number;
  codigoCuenta: string | null;
  idBodega: string | null;
  onRefresh: () => void;
  onPaqueteEnviado?: () => void;
}

export function useCustodioOrdenSalida({
  ventas,
  cajasEnSalida,
  codigoCuenta,
  idBodega,
  onRefresh,
  onPaqueteEnviado,
}: UseCustodioOrdenSalidaParams) {
  const { showToast } = usePolariaToast();

  const ventasActivas = useMemo(
    () =>
      ventas.filter((venta) => ESTADOS_VENTA_ACTIVA.includes(venta.estado)),
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

  const camionFieldLabel = useMemo(() => {
    if (!selectedCamion) return "";
    return truckLabel(selectedCamion);
  }, [selectedCamion]);

  const camionPickerPlaceholder = loadingCamiones
    ? "Cargando camiones…"
    : camiones.length === 0
      ? "Sin camiones disponibles"
      : "Buscar camión disponible";

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

  const previewRows = useMemo(
    () =>
      buildPreviewRows({
        previewIds,
        previewByOrden,
        ventasActivas,
        loadingPreview,
      }),
    [loadingPreview, previewByOrden, previewIds, ventasActivas],
  );

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
    if (!codigoCuenta?.trim() || !idBodega?.trim()) {
      showToast({
        title: "Sin contexto",
        content: "Seleccioná cuenta y bodega activas para enviar el paquete.",
        variant: "error",
        durationMs: 3500,
      });
      return;
    }
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
      const resultado = await crearPaqueteDespachoApi({
        codigoCuenta,
        idBodega,
        idCamion: selectedCamion.idCamion,
        idOrdenesVenta: paqueteIds,
      });

      showToast({
        title: "Paquete enviado al transporte",
        content: `Viaje ${resultado.codigoViaje} · camión ${resultado.placaCamion}. Ya aparece para el transportista.`,
        variant: "success",
        durationMs: 4500,
      });
      setPaqueteIds(null);
      setSelectedKeys([]);
      setCamionId("");
      setCamiones((prev) =>
        prev.filter((camion) => camion.idCamion !== selectedCamion.idCamion),
      );
      onPaqueteEnviado?.();
      onRefresh();
    } catch (error) {
      showToast({
        title: "No se pudo enviar el paquete",
        content:
          error instanceof Error
            ? error.message
            : "Error al crear el viaje de transporte.",
        variant: "error",
        durationMs: 4500,
      });
    } finally {
      setEnviando(false);
    }
  };

  return {
    ventasActivas,
    selectedKeys,
    detalleVentaId,
    setDetalleVentaId,
    camionId,
    setCamionId,
    camiones,
    loadingCamiones,
    enviando,
    picker,
    setPicker,
    previewOpen,
    setPreviewOpen,
    loadingPreview,
    paqueteArmado,
    ventasSeleccionadas,
    ventasPaquete,
    mezclaCuentas,
    selectedCamion,
    paqueteFieldLabel,
    detalleFieldLabel,
    camionFieldLabel,
    camionPickerPlaceholder,
    canPreview,
    previewRows,
    loadCamiones,
    handleSelectPaqueteVenta,
    handleRemovePaqueteVenta,
    handleArmarPaquete,
    handleCancelarPaquete,
    handleEnviarPaquete,
  };
}
