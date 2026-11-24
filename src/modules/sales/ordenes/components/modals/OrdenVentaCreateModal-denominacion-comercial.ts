import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { CompradorListRow } from "@/modules/admin-panel";
import { getOrdenVentaDetalle } from "../../../shared/services/sales.service";
import { resolveDenominacionComercial } from "../../utils/pedido/resolve-denominacion-comercial";

export function useDenominacionComercialEdicionOv(params: {
  open: boolean;
  formDataReady: boolean;
  isEditing: boolean;
  editingId: string;
  codigoCuenta: string | null | undefined;
  compradores: CompradorListRow[];
  setDenominacionComercial: Dispatch<SetStateAction<string>>;
}) {
  const {
    open,
    formDataReady,
    isEditing,
    editingId,
    codigoCuenta,
    compradores,
    setDenominacionComercial,
  } = params;

  useEffect(() => {
    if (!open) {
      setDenominacionComercial("");
    }
  }, [open, setDenominacionComercial]);

  useEffect(() => {
    if (!open || !formDataReady || !isEditing || !editingId || !codigoCuenta) {
      return;
    }
    let cancelled = false;
    void getOrdenVentaDetalle({
      codigoCuenta,
      idOrdenVenta: editingId,
    })
      .then((detalle) => {
        if (cancelled) return;
        const compradorRow = compradores.find(
          (row) => row.idComprador === (detalle.id_comprador ?? "").trim(),
        );
        const overrideComprador =
          compradorRow?.denominacionComercialOverride?.trim() || "";
        setDenominacionComercial(
          resolveDenominacionComercial({
            override:
              detalle.denominacion_comercial_override?.trim() ||
              overrideComprador ||
              null,
            apodoSincronizado: detalle.comprador_apodo,
          }),
        );
      })
      .catch(() => {
        if (cancelled) return;
      });
    return () => {
      cancelled = true;
    };
  }, [
    open,
    formDataReady,
    isEditing,
    editingId,
    codigoCuenta,
    compradores,
    setDenominacionComercial,
  ]);
}
