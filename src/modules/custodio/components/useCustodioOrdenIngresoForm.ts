"use client";

import { useEffect, useMemo, useState } from "react";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { listCatalogoProductosAdmin } from "@/modules/admin-panel";
import type { CatalogoProductoListRow } from "@/modules/admin-panel/catalogo/services/productos-catalogo.service";
import {
  buildNotasProductoAdicional,
  buildRecepcionLineasDraft,
  canSubmitRecepcionDraft,
  parseRecepcionLineasPayload,
  type ProductoAdicionalDraft,
  type RecepcionLineaDraft,
} from "@/modules/purchases/ingreso/utils/recepcion-compra-draft";
import { cerrarRecepcionCompraApi } from "@/modules/purchases/shared/services/purchases-api.service";
import { listOrdenCompraLineasRecepcion } from "@/modules/purchases/shared/services/purchases.service";
import type {
  OrdenCompraLineaRow,
  OrdenCompraRow,
} from "@/modules/purchases/shared/types/purchases.types";

export const EMPTY_ADICIONAL: ProductoAdicionalDraft = {
  idProducto: "",
  label: "",
  temperaturaInput: "",
  pesoInput: "",
};

export interface UseCustodioOrdenIngresoFormParams {
  orden: OrdenCompraRow;
  codigoCuenta: string;
  resolveUbicacionIngreso: () => string | null;
  slotsIngresoCount: number;
  onRegistered: () => void | Promise<void>;
}

export function useCustodioOrdenIngresoForm({
  orden,
  codigoCuenta,
  resolveUbicacionIngreso,
  slotsIngresoCount,
  onRegistered,
}: UseCustodioOrdenIngresoFormParams) {
  const [lineas, setLineas] = useState<RecepcionLineaDraft[]>([]);
  const [productoAdicional, setProductoAdicional] =
    useState<ProductoAdicionalDraft>(EMPTY_ADICIONAL);
  const [catalogo, setCatalogo] = useState<CatalogoProductoListRow[]>([]);
  const [isLoadingLineas, setIsLoadingLineas] = useState(false);
  const [isLoadingCatalogo, setIsLoadingCatalogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingLineas(true);
    setError(null);

    const sourceLineas: Promise<OrdenCompraLineaRow[]> = orden.lineas?.length
      ? Promise.resolve(orden.lineas)
      : listOrdenCompraLineasRecepcion(orden.id_orden_compra);

    void sourceLineas
      .then((rows) => {
        if (cancelled) {
          return;
        }

        setLineas(buildRecepcionLineasDraft(rows));
        setProductoAdicional(EMPTY_ADICIONAL);
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }

        setLineas([]);
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las líneas de la orden.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingLineas(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [orden]);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingCatalogo(true);

    void listCatalogoProductosAdmin({ codigoCuenta })
      .then((rows) => {
        if (!cancelled) {
          setCatalogo(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogo([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingCatalogo(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta]);

  const canSubmit = useMemo(
    () => canSubmitRecepcionDraft(lineas, productoAdicional),
    [lineas, productoAdicional],
  );

  const updateLinea = (
    idLineaOrdenCompra: string,
    patch: Partial<RecepcionLineaDraft>,
  ) => {
    setLineas((current) =>
      current.map((linea) =>
        linea.idLineaOrdenCompra === idLineaOrdenCompra
          ? { ...linea, ...patch }
          : linea,
      ),
    );
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const lineasPayload = parseRecepcionLineasPayload(lineas);
      const notaAdicional = buildNotasProductoAdicional(productoAdicional);
      const idUbicacionIngreso = resolveUbicacionIngreso();

      if (!idUbicacionIngreso) {
        throw new DomainServiceError(
          slotsIngresoCount === 0
            ? "Esta bodega no tiene slots de ingreso configurados."
            : "No hay slots libres en la zona de ingreso.",
          "INVALID_ARGUMENT",
        );
      }

      await cerrarRecepcionCompraApi({
        idOrdenCompra: orden.id_orden_compra,
        codigoCuenta: orden.codigo_cuenta,
        idBodega: orden.id_bodega,
        lineas: lineasPayload,
        idUbicacionIngreso,
        ...(notaAdicional ? { notas: notaAdicional } : {}),
      });

      await onRegistered();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo registrar el ingreso.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    lineas,
    productoAdicional,
    setProductoAdicional,
    catalogo,
    isLoadingLineas,
    isLoadingCatalogo,
    error,
    isSubmitting,
    canSubmit,
    updateLinea,
    handleSubmit,
  };
}
