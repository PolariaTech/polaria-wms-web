"use client";

import { useMemo, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { normalizeEstadoOrdenVenta } from "../../../shared/constants/sales-status";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import type { OrdenTrabajoHija } from "../../utils/origen/origen-correo-ordenes-trabajo";
import { buildGeneralesRows, buildOtRows } from "./cypher-cliente-vs-mateo-build-rows";
import { CypherClienteVsMateoComparisonTable } from "./CypherClienteVsMateoComparisonTable";
import type { MateoSuggestContext } from "./cypher-cliente-vs-mateo.types";
import { useCypherClienteVsMateoCatalog } from "./use-cypher-cliente-vs-mateo-catalog";

export function CypherClienteVsMateoSection({
  orden,
  hijas,
}: {
  orden: OrdenVentaDetalleRow;
  hijas: readonly OrdenTrabajoHija[];
}): ReactNode {
  const { productos, compradores } = useCypherClienteVsMateoCatalog(
    orden.codigo_cuenta,
  );

  const usuarioConfirmado = useMemo(
    () => normalizeEstadoOrdenVenta(orden.estado) !== "por_confirmar",
    [orden.estado],
  );
  const ctx = useMemo(
    (): MateoSuggestContext => ({ productos, compradores }),
    [productos, compradores],
  );
  const generales = useMemo(
    () => buildGeneralesRows(orden, usuarioConfirmado, ctx),
    [orden, usuarioConfirmado, ctx],
  );
  const otBlocks = useMemo(
    () =>
      hijas.map((hija, index) => ({
        id: hija.id,
        title: hija.label?.trim() || `Orden de trabajo ${index + 1}`,
        rows: buildOtRows(orden, hija, index, usuarioConfirmado, ctx),
      })),
    [hijas, orden, usuarioConfirmado, ctx],
  );

  const empty =
    generales.every((row) => !row.correo && !row.mateo && !row.usuario) &&
    otBlocks.length === 0;

  if (empty) {
    return (
      <p className="mt-3 rounded-xl border border-dashed border-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50">
        Sin datos de comparación Correo / Mateo / Usuario para esta OV.
      </p>
    );
  }

  return (
    <div className={cn("mt-3 space-y-4")}>
      <CypherClienteVsMateoComparisonTable title="Datos generales" rows={generales} />
      {otBlocks.map((block) => (
        <CypherClienteVsMateoComparisonTable
          key={block.id}
          title={block.title}
          rows={block.rows}
        />
      ))}
    </div>
  );
}