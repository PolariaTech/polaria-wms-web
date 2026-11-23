"use client";

import { useCallback, useEffect, useState } from "react";
import { getOrdenVentaDetalle } from "@/modules/sales";
import type { OrdenVentaDetalleRow } from "@/modules/sales";
import {
  registrarEntregaApi,
  uploadEvidenciaTransporteApi,
} from "../../shared/services/transport-api.service";
import type { ViajeEntregaRow } from "../../shared/types/transport.types";
import {
  dataUrlToFile,
  MAX_EVIDENCIA_BYTES,
  parseCantidad,
  PASOS_ENTREGA,
} from "./transporte-entrega.helpers";
import { useTransporteEntregaFirma } from "./useTransporteEntregaFirma";

export interface UseTransporteEntregaParams {
  open: boolean;
  viaje: ViajeEntregaRow | null;
  codigoCuenta: string | null;
  idBodega: string | null;
  onClose: () => void;
  onEntregado: () => void;
}

export function useTransporteEntrega({
  open,
  viaje,
  codigoCuenta,
  idBodega,
  onClose,
  onEntregado,
}: UseTransporteEntregaParams) {
  const [paso, setPaso] = useState(0);
  const [detalle, setDetalle] = useState<OrdenVentaDetalleRow | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [detalleError, setDetalleError] = useState<string | null>(null);
  const [lineaVerificada, setLineaVerificada] = useState<
    Record<number, boolean>
  >({});
  const [cantidades, setCantidades] = useState<Record<number, string>>({});
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [conforme, setConforme] = useState<boolean | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const firma = useTransporteEntregaFirma(open, paso);
  const { resetFirma } = firma;

  const resetState = useCallback(() => {
    setPaso(0);
    setDetalle(null);
    setDetalleError(null);
    setLineaVerificada({});
    setCantidades({});
    setFotoFile(null);
    setFotoPreview(null);
    setConforme(null);
    setDescripcion("");
    setError(null);
    setSaving(false);
    resetFirma();
  }, [resetFirma]);

  useEffect(() => {
    if (!open || !viaje?.idOrdenVenta || !codigoCuenta?.trim()) {
      if (!open) resetState();
      return;
    }

    let cancelled = false;
    setLoadingDetalle(true);
    setDetalleError(null);

    void getOrdenVentaDetalle({
      codigoCuenta,
      idOrdenVenta: viaje.idOrdenVenta,
    })
      .then((row) => {
        if (cancelled) return;
        setDetalle(row);
        const nextCant: Record<number, string> = {};
        const nextChk: Record<number, boolean> = {};
        row.lineas.forEach((linea, index) => {
          nextCant[index] = String(linea.cantidad_pedida ?? "");
          nextChk[index] = false;
        });
        setCantidades(nextCant);
        setLineaVerificada(nextChk);
        setPaso(0);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setDetalle(null);
        setDetalleError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los productos de la venta.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingDetalle(false);
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, open, resetState, viaje?.idOrdenVenta]);

  const onFotoChange = (fileList: FileList | null) => {
    const file = fileList?.[0] ?? null;
    setError(null);
    if (!file) {
      setFotoFile(null);
      setFotoPreview(null);
      return;
    }
    if (file.size > MAX_EVIDENCIA_BYTES) {
      setError("La imagen supera 10 MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten imágenes.");
      return;
    }
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const canGoNext = (): boolean => {
    if (!detalle) return false;
    if (paso === 0) {
      return detalle.lineas.every((_, index) => {
        if (!lineaVerificada[index]) return false;
        return parseCantidad(cantidades[index] ?? "") != null;
      });
    }
    if (paso === 1) return Boolean(fotoFile);
    if (paso === 2) return firma.hasFirma();
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (!canGoNext()) {
      if (paso === 0) {
        setError(
          "Verificá todos los productos e indicá la cantidad entregada.",
        );
      } else if (paso === 1) {
        setError("La foto de evidencia es obligatoria.");
      } else if (paso === 2) {
        setError("La firma de quien recibe es obligatoria.");
      }
      return;
    }
    if (paso === 2) firma.captureFirma();
    setPaso((current) => Math.min(PASOS_ENTREGA - 1, current + 1));
  };

  const handleBack = () => {
    setError(null);
    setPaso((current) => Math.max(0, current - 1));
  };

  const handleClose = () => {
    if (saving) return;
    resetState();
    onClose();
  };

  const handleEntregar = async () => {
    if (!viaje || !detalle || !codigoCuenta?.trim() || !idBodega?.trim()) {
      setError("Falta información del viaje o de la bodega.");
      return;
    }
    if (!viaje.idGuia || !viaje.idOrdenVenta) {
      setError("El viaje no tiene guía u orden de venta asociada.");
      return;
    }
    if (paso !== PASOS_ENTREGA - 1) {
      setError("Completá todos los pasos antes de cerrar la entrega.");
      return;
    }
    if (conforme === null) {
      setError("Indicá si el pedido fue conforme (sí o no).");
      return;
    }
    if (!fotoFile) {
      setError("La foto de evidencia es obligatoria.");
      return;
    }
    const firmaRaw = firma.resolveFirmaRaw();
    if (!firmaRaw.trim()) {
      setError("La firma de quien recibe es obligatoria.");
      return;
    }
    if (!conforme && !descripcion.trim()) {
      setError("Si no estás conforme, describí el motivo antes de cerrar.");
      return;
    }

    const lineas: Array<{
      idLineaOrdenVenta: string;
      cantidadEntregada: number;
    }> = [];
    for (const [index, linea] of detalle.lineas.entries()) {
      const cantidad = parseCantidad(cantidades[index] ?? "");
      if (cantidad == null) {
        setError("Revisá las cantidades entregadas: hay un valor inválido.");
        return;
      }
      lineas.push({
        idLineaOrdenVenta: linea.id_linea_orden_venta,
        cantidadEntregada: cantidad,
      });
    }

    setSaving(true);
    setError(null);
    try {
      const [evidenciaFotoUrl, evidenciaFirmaUrl] = await Promise.all([
        uploadEvidenciaTransporteApi(fotoFile),
        uploadEvidenciaTransporteApi(
          await dataUrlToFile(firmaRaw, "firma-entrega.jpg"),
        ),
      ]);

      await registrarEntregaApi({
        codigoCuenta,
        idBodega,
        idViaje: viaje.idViaje,
        idGuia: viaje.idGuia,
        idOrdenVenta: viaje.idOrdenVenta,
        entregaConforme: conforme,
        descripcionIncidencia: conforme ? undefined : descripcion.trim(),
        evidenciaFotoUrl,
        evidenciaFirmaUrl,
        lineas,
      });

      resetState();
      onEntregado();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cerrar la entrega.",
      );
    } finally {
      setSaving(false);
    }
  };

  return {
    paso,
    detalle,
    loadingDetalle,
    detalleError,
    lineaVerificada,
    setLineaVerificada,
    cantidades,
    setCantidades,
    fotoFile,
    fotoPreview,
    conforme,
    setConforme,
    descripcion,
    setDescripcion,
    error,
    saving,
    firma,
    onFotoChange,
    handleNext,
    handleBack,
    handleClose,
    handleEntregar,
  };
}
