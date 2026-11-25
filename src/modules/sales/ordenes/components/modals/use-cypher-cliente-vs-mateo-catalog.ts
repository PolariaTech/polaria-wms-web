import { useEffect, useState } from "react";
import { listCompradoresAdmin } from "@/modules/admin-panel/compradores/services/compradores.service";
import type { CompradorListRow } from "@/modules/admin-panel/compradores/services/compradores.service";
import { fetchProductosVentaCatalogo } from "../../../shared/services/sales-catalog.api";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";

export function useCypherClienteVsMateoCatalog(codigoCuenta: string | undefined) {
  const [productos, setProductos] = useState<ProductoVentaOption[]>([]);
  const [compradores, setCompradores] = useState<CompradorListRow[]>([]);

  useEffect(() => {
    const codigo = codigoCuenta?.trim();
    if (!codigo) {
      setProductos([]);
      setCompradores([]);
      return;
    }
    let cancelled = false;
    void Promise.all([
      fetchProductosVentaCatalogo(codigo),
      listCompradoresAdmin({ codigoCuenta: codigo, soloActivos: true }),
    ])
      .then(([nextProductos, nextCompradores]) => {
        if (cancelled) return;
        setProductos(nextProductos);
        setCompradores(nextCompradores);
      })
      .catch(() => {
        if (cancelled) return;
        setProductos([]);
        setCompradores([]);
      });
    return () => {
      cancelled = true;
    };
  }, [codigoCuenta]);

  return { productos, compradores };
}