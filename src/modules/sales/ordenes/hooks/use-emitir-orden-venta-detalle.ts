import { useState, type Dispatch, type SetStateAction } from "react";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { useAuthStore } from "@/stores/auth.store";
import { emitirOrdenVentaApi } from "../../shared/services/sales-api.service";
import type { OrdenVentaDetalleRow } from "../../shared/types/sales.types";
import {
  autoPrintOrdenVentaTrasEmitir,
  fetchAutoImprimirFlag,
  type AutoPrintOvResult,
} from "../print/auto-print-ov-tras-emitir";

export interface UseEmitirOrdenVentaDetalleArgs {
  idOrdenVenta: string | null;
  codigoCuenta: string | null;
  orden: OrdenVentaDetalleRow | null;
  puedeEmitir: boolean;
  setOrden: Dispatch<SetStateAction<OrdenVentaDetalleRow | null>>;
  setActionError: Dispatch<SetStateAction<string | null>>;
  reloadDetalle: (options?: { silent?: boolean }) => void;
  onEmitted?: () => void;
  onEmitSuccess?: (info: { idOrdenVenta: string; codigo: string }) => void;
  onAutoPrintResult?: (result: AutoPrintOvResult) => void;
}

/** Valida y emite la OV; luego dispara la autoimpresión si está configurada. */
export function useEmitirOrdenVentaDetalle({
  idOrdenVenta,
  codigoCuenta,
  orden,
  puedeEmitir,
  setOrden,
  setActionError,
  reloadDetalle,
  onEmitted,
  onEmitSuccess,
  onAutoPrintResult,
}: UseEmitirOrdenVentaDetalleArgs) {
  const [isEmitting, setIsEmitting] = useState(false);

  const handleEmitir = () => {
    if (!idOrdenVenta || !puedeEmitir || isEmitting) {
      return;
    }

    if (!orden?.id_comprador?.trim()) {
      setActionError(
        "Selecciona un cliente del catálogo antes de confirmar el pedido. Ábrelo en Editar y elige el cliente correcto.",
      );
      return;
    }

    const lineaPrecioInvalido = (orden.lineas ?? []).find(
      (linea) =>
        !Number.isFinite(linea.precio_unitario) || linea.precio_unitario < 0,
    );
    if (lineaPrecioInvalido) {
      setActionError(
        "Hay productos con precio inválido. Ábrelo en Editar, captura 0 o mayor y vuelve a confirmar.",
      );
      return;
    }

    setActionError(null);
    setIsEmitting(true);

    void emitirOrdenVentaApi(idOrdenVenta)
      .then(async (row) => {
        setOrden((prev) =>
          prev
            ? {
                ...prev,
                estado: row.estado,
                codigo: row.venta?.trim() || prev.codigo,
              }
            : prev,
        );
        onEmitSuccess?.({
          idOrdenVenta,
          codigo: row.venta?.trim() || orden?.codigo?.trim() || "OV",
        });
        const session = useAuthStore.getState().session;
        if (codigoCuenta) {
          // Bitácora de emisión: la escribe el API al confirmar.
          try {
            const shouldAutoPrint = await fetchAutoImprimirFlag(codigoCuenta);
            if (shouldAutoPrint) {
              const autoPrintResult = await autoPrintOrdenVentaTrasEmitir({
                codigoCuenta,
                idOrdenVenta,
                listRowFallback: row,
                autorNombre: session?.nombre ?? null,
                idUsuario: session?.idUsuario ?? null,
                autoImprimirKnown: true,
              });
              if (autoPrintResult.status !== "skipped") {
                onAutoPrintResult?.(autoPrintResult);
              }
            }
          } catch (flagErr) {
            onAutoPrintResult?.({
              status: "error",
              message:
                flagErr instanceof Error
                  ? flagErr.message
                  : "No se pudo leer la configuración de autoimpresión.",
            });
          }
        }
        onEmitted?.();
        reloadDetalle({ silent: true });
      })
      .catch((err: unknown) => {
        setActionError(
          err instanceof DomainServiceError
            ? err.message
            : "No se pudo emitir la venta.",
        );
      })
      .finally(() => {
        setIsEmitting(false);
      });
  };

  return { isEmitting, handleEmitir };
}
