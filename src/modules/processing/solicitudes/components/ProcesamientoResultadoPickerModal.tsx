"use client";

import { useEffect, useState } from "react";
import { listProductosSecundariosProcesamiento } from "../../shared/services/processing.service";
import type { ProductoProcesamientoOption } from "../../shared/types/processing.types";
import { ProcesamientoProductoPickerModal } from "./ProcesamientoProductoPickerModal";

interface ProcesamientoResultadoPickerModalProps {
  open: boolean;
  onClose: () => void;
  codigoCuenta: string | null;
  idProductoPrimario: string | null;
  primarioLabel?: string;
  selectedId?: string | null;
  onSelect: (producto: ProductoProcesamientoOption) => void;
}

export function ProcesamientoResultadoPickerModal({
  open,
  onClose,
  codigoCuenta,
  idProductoPrimario,
  primarioLabel,
  selectedId = null,
  onSelect,
}: ProcesamientoResultadoPickerModalProps) {
  const [productos, setProductos] = useState<ProductoProcesamientoOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !codigoCuenta || !idProductoPrimario) {
      setProductos([]);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    void listProductosSecundariosProcesamiento(codigoCuenta, idProductoPrimario)
      .then((rows) => {
        if (!cancelled) setProductos(rows);
      })
      .catch(() => {
        if (!cancelled) {
          setProductos([]);
          setLoadError("No se pudieron cargar los productos secundarios.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, idProductoPrimario, open]);

  return (
    <ProcesamientoProductoPickerModal
      open={open}
      onClose={onClose}
      title="Seleccionar resultado"
      description={
        primarioLabel
          ? `Productos secundarios vinculados a ${primarioLabel}.`
          : "Productos secundarios del insumo seleccionado."
      }
      productos={productos}
      isLoading={isLoading}
      loadError={loadError}
      selectedId={selectedId}
      emptyMessage="No hay productos secundarios para el insumo seleccionado."
      onSelect={onSelect}
    />
  );
}
