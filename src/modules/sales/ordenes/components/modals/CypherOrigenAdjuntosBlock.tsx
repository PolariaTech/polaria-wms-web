"use client";

import { useState } from "react";
import type { OrigenAdjunto } from "../../utils/origen/origen-adjuntos";
import { OrigenAdjuntosCards } from "../shared/OrigenAdjuntosCards";
import { OrdenVentaAdjuntoPreviewModal } from "./OrdenVentaAdjuntoPreviewModal";

/** REQ-266/293: tarjetas de adjuntos + preview en el panel derecho (Cypher). */
export function CypherOrigenAdjuntosBlock({
  adjuntos,
}: {
  adjuntos: readonly OrigenAdjunto[];
}) {
  const [preview, setPreview] = useState<{
    adjunto: OrigenAdjunto;
    viewUrl: string;
  } | null>(null);

  return (
    <>
      <OrigenAdjuntosCards
        adjuntos={adjuntos}
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
