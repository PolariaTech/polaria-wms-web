import { TriangleAlert } from "lucide-react";
import type { OvDelMismoCorreo } from "../../../shared/services/ovs-del-mismo-correo";

/**
 * REQ-313: avisa que el correo se partió en varias OV (una por orden de compra) y de cuál OC es la
 * abierta, para que nadie crea que los otros adjuntos le faltan o le sobran. Sin hermanas, nada.
 */
export function CypherCorreoPartidoAviso({
  hermanas,
  idOrdenVenta,
  ordenCompra,
}: {
  hermanas: readonly OvDelMismoCorreo[];
  idOrdenVenta: string;
  ordenCompra: string | null | undefined;
}) {
  if (hermanas.length < 2) return null;
  const otras = hermanas.filter((hermana) => hermana.idOrdenVenta !== idOrdenVenta);
  const oc = ordenCompra?.trim() ?? "";

  return (
    <div
      role="status"
      className="mt-4 flex items-start gap-2 rounded-xl border border-polaria-warning-border bg-polaria-warning-bg px-4 py-3 polaria-text-body-sm text-polaria-warning"
    >
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 space-y-1">
        <p className="font-semibold tabular-nums">
          Este correo se partió en {hermanas.length} OV, una por orden de compra.
        </p>
        <p className="tabular-nums">
          {oc ? `Esta OV es solo de la OC ${oc}.` : "Esta OV no tiene orden de compra registrada."}
        </p>
        {otras.length > 0 ? (
          <p className="tabular-nums">
            Las otras:{" "}
            {otras
              .map((hermana) => `${hermana.codigo} · ${hermana.ordenCompra?.trim() ? `OC ${hermana.ordenCompra.trim()}` : "sin OC"}`)
              .join(", ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
