import { useEffect, useState } from "react";
import { leerFolioFacturaVista } from "../components/modals/detalle-venta-presentacion";
import { useRecargaFolioFactura } from "../surtido/folio-factura-captura";
import { listOrdenSurtidoCapturasClient } from "../surtido/list-orden-surtido-capturas.client";

/** Folio de factura capturado en surtido para la OV (y la OT activa, si hay). */
export function useFolioFacturaDetalle(
  codigoCuenta: string | null,
  idOrdenVenta: string,
  idOrdenTrabajo: string | undefined,
): string {
  const [folioFactura, setFolioFactura] = useState("");
  const recargaFolio = useRecargaFolioFactura(idOrdenVenta);

  useEffect(() => {
    const cuenta = codigoCuenta?.trim() ?? "";
    const id = idOrdenVenta.trim();
    if (!cuenta || !id) {
      setFolioFactura("");
      return;
    }
    let cancelled = false;
    void listOrdenSurtidoCapturasClient({
      codigoCuenta: cuenta,
      idOrdenVenta: id,
    })
      .then((rows) => {
        if (cancelled) return;
        const otId = idOrdenTrabajo?.trim() ?? "";
        const match = otId
          ? rows.find((row) => row.idOrdenTrabajo === otId)
          : rows[0];
        setFolioFactura(leerFolioFacturaVista(match?.payload.campos));
      })
      .catch(() => {
        if (!cancelled) setFolioFactura("");
      });
    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, idOrdenTrabajo, idOrdenVenta, recargaFolio]);

  return folioFactura;
}
