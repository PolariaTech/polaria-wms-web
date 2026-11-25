"use client";

import { useMemo, useState } from "react";
import { filterLineasByOrdenTrabajoHija } from "../../utils/ot/filter-lineas-by-orden-trabajo";
import {
  normalizeIdOrdenTrabajo,
  type OrdenTrabajoHija,
} from "../../utils/origen/origen-correo-ordenes-trabajo";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import {
  AlistoIncompletoAviso,
  CheckinDespachoAviso,
} from "../orden-trabajo/OrdenTrabajoChipSelector";
import { CypherAlistamientoOtArticle } from "./CypherAlistamientoOtArticle";
import { useCypherAlistamientoCapturas } from "./use-cypher-alistamiento-capturas";

export interface CypherAlistamientoSectionProps {
  idOrdenVenta: string;
  orden: OrdenVentaDetalleRow;
  hijas: readonly OrdenTrabajoHija[];
  onVerFotosOt?: (idOrdenTrabajo: string) => void;
}

export function CypherAlistamientoSection({
  idOrdenVenta,
  orden,
  hijas,
  onVerFotosOt,
}: CypherAlistamientoSectionProps) {
  const { capturaByOt, loading } = useCypherAlistamientoCapturas(idOrdenVenta);
  const [now] = useState(() => Date.now());

  const ots = useMemo(() => {
    if (hijas.length > 0) return [...hijas];
    return [
      {
        id: "",
        label: orden.centro_consumo?.trim() || "Orden de trabajo",
        numeroPedido: orden.orden_compra_hotel?.trim() || "",
        almacen: orden.centro_consumo?.trim() || "",
        referenciaPedido: "",
        fecha: "",
        responsableExterno: "",
        renglones: [],
        totalCantidad: 0,
      } satisfies OrdenTrabajoHija,
    ];
  }, [hijas, orden.centro_consumo, orden.orden_compra_hotel]);

  const escaneadas = ots.filter((ot) =>
    capturaByOt.has(normalizeIdOrdenTrabajo(ot.id)),
  ).length;

  let lineasAlistoTotal = 0;
  let lineasProductoTotal = 0;
  for (const hija of ots) {
    const otKey = normalizeIdOrdenTrabajo(hija.id);
    const captura = capturaByOt.get(otKey) ?? capturaByOt.get("");
    const lineasOt = filterLineasByOrdenTrabajoHija(
      orden.lineas ?? [],
      hija.renglones.length > 0 ? hija : null,
      { emptyFallback: hija.renglones.length === 0 ? "all" : "none" },
    );
    lineasProductoTotal += lineasOt.length;
    for (let i = 0; i < lineasOt.length; i += 1) {
      const row = captura?.payload?.lineas?.find(
        (linea) => linea.indice === i + 1,
      );
      if (row?.alisto === true) lineasAlistoTotal += 1;
    }
  }

  const impresaAt =
    orden.estado_desde?.trim() ||
    orden.updated_at?.trim() ||
    orden.created_at?.trim() ||
    null;

  if (loading) {
    return (
      <p className="mt-3 polaria-text-caption text-polaria-w-50">
        Cargando alistamiento…
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-4">
      <p className="polaria-text-body-sm text-polaria-w-50">
        <span className="font-semibold text-polaria-teal">
          {escaneadas} de {ots.length}
        </span>{" "}
        OT{ots.length === 1 ? "" : "s"} escaneada{ots.length === 1 ? "" : "s"}
        {lineasProductoTotal > 0 ? (
          <>
            {" · "}
            <span className="font-semibold text-polaria-teal">
              {lineasAlistoTotal} de {lineasProductoTotal}
            </span>{" "}
            líneas con Alistó
          </>
        ) : null}
      </p>

      <AlistoIncompletoAviso
        lineasProductoTotal={lineasProductoTotal}
        lineasAlistoTotal={lineasAlistoTotal}
        capturaByOt={capturaByOt}
      />
      <CheckinDespachoAviso ots={ots} capturaByOt={capturaByOt} />

      {ots.map((hija, index) => (
        <CypherAlistamientoOtArticle
          key={hija.id || `ot-${index}`}
          hija={hija}
          index={index}
          orden={orden}
          otsCount={ots.length}
          capturaByOt={capturaByOt}
          impresaAt={impresaAt}
          now={now}
          onVerFotosOt={onVerFotosOt}
        />
      ))}
    </div>
  );
}