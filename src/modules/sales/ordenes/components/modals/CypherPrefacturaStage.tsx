"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import { blobPrefactura } from "../../print-batch/blob-prefactura";
import { CypherStageAccordion } from "./CypherStageAccordion";
import type { CypherStageId } from "./cypher-stages";

function codigoEmpresaDeSesion(): string {
  const estado = useAuthStore.getState();
  return (estado.session?.codigoEmpresa ?? estado.context?.codigoEmpresa ?? "").trim();
}

function VistaPrefactura({ orden }: { orden: OrdenVentaDetalleRow }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    let creada = "";
    const codigo = codigoEmpresaDeSesion();
    if (!codigo) {
      setError("No se encontró la empresa de la sesión.");
      setUrl(null);
      return;
    }
    setError(null);
    setUrl(null);
    blobPrefactura(orden, codigo)
      .then((blob) => {
        const siguiente = URL.createObjectURL(blob);
        if (!vigente) {
          URL.revokeObjectURL(siguiente);
          return;
        }
        creada = siguiente;
        setUrl(siguiente);
      })
      .catch((causa: unknown) => {
        if (!vigente) return;
        setError(causa instanceof Error ? causa.message : "No se pudo armar la prefactura.");
      });
    return () => {
      vigente = false;
      if (creada) URL.revokeObjectURL(creada);
    };
  }, [orden]);

  if (error) return <p className="polaria-text-body-sm text-polaria-w">{error}</p>;
  if (!url) return <p className="polaria-text-body-sm text-polaria-w-50">Preparando la prefactura…</p>;
  return (
    <iframe
      title="Prefactura"
      src={url}
      className="h-[32rem] w-full rounded-xl border border-polaria-w-08 bg-polaria-bg"
    />
  );
}

export function CypherPrefacturaStage({
  openStages,
  toggleAccordionStage,
  orden,
}: {
  openStages: ReadonlySet<CypherStageId>;
  toggleAccordionStage: (stageId: CypherStageId) => void;
  orden: OrdenVentaDetalleRow;
}) {
  const abierta = openStages.has("prefactura");
  return (
    <CypherStageAccordion
      stageId="prefactura"
      num="04"
      title="Prefactura"
      open={abierta}
      onToggle={toggleAccordionStage}
    >
      {abierta ? <VistaPrefactura orden={orden} /> : null}
    </CypherStageAccordion>
  );
}
