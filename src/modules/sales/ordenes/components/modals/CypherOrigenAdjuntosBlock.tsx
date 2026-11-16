"use client";

import { useState } from "react";
import type { OrigenAdjunto } from "../../utils/origen/origen-adjuntos";
import { OrigenAdjuntosCards } from "../shared/OrigenAdjuntosCards";
import { OrdenVentaAdjuntoPreviewModal } from "./OrdenVentaAdjuntoPreviewModal";

/** REQ-266/293: tarjetas de adjuntos + preview en el panel derecho (Cypher). */
export function CypherOrigenAdjuntosBlock({
  adjuntos,
  esDeEstaOv,
}: {
  adjuntos: readonly OrigenAdjunto[];
  /** REQ-313: qué adjunto es de la OC de esta OV (correo partido en varias OV). */
  esDeEstaOv?: (adjunto: OrigenAdjunto) => boolean;
}) {
  const [preview, setPreview] = useState<{
    adjunto: OrigenAdjunto;
    viewUrl: string;
  } | null>(null);

  return (
    <>
      <OrigenAdjuntosCards
        adjuntos={adjuntos}
        esDeEstaOv={esDeEstaOv}
        onPreviewAdjunto={(adjunto, viewUrl) =>
          setPreview({ adjunto, viewUrl })
        }
      />
      <OrdenVentaAdjuntoPreviewModal
        open={preview !== null}
        adjunto={preview?.adjunto ?? null}
        viewUrl={preview?.viewUrl ?? null}
        dockWithCypher
        onClose={() => setPreview(null)}
      />
    </>
  );
}
