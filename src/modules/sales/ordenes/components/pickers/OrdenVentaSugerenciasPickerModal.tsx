"use client";

import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { formatPrecioEs } from "@/lib/utils/decimal-es";
import { cn } from "@/lib/utils/cn";
import { stripLeadingProductoCodigo } from "../../../shared/utils/producto-venta-nombre";

export interface OrdenVentaSugerenciaItem {
  idProducto: string;
  nombre: string;
  codigo: string;
  idBodega: string;
  kgDisponible: number;
  unidadMedida: string;
  precioUnitario: number;
}

interface OrdenVentaSugerenciasPickerModalProps {
  open: boolean;
  onClose: () => void;
  sugerencias: OrdenVentaSugerenciaItem[];
  textoCliente?: string | null;
  onSelect: (sugerencia: OrdenVentaSugerenciaItem) => void;
  /** Abre el catálogo completo desde este modal. */
  onOpenCatalogo?: () => void;
  /** Con Cypher abierto: panel a la izquierda (no tapa Cypher). */
  dockWithCypher?: boolean;
}

export function OrdenVentaSugerenciasPickerModal({
  open,
  onClose,
  sugerencias,
  textoCliente,
  onSelect,
  onOpenCatalogo,
  dockWithCypher = false,
}: OrdenVentaSugerenciasPickerModalProps) {
  const subtitle = textoCliente?.trim()
    ? `Sugerencias para «${textoCliente.trim()}»`
    : "Elige una sugerencia o abre el catálogo.";

  return (
    <PolariaFormModal
      open={open}
      onClose={onClose}
      title="Elegir producto"
      description={subtitle}
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      hideHeaderClose
      footerAction={
        onOpenCatalogo ? (
          <button
            type="button"
            onClick={onOpenCatalogo}
            className={cn(
              "rounded-xl border border-polaria-t-20 px-4 py-2.5",
              "polaria-text-body-sm font-semibold text-polaria-w transition hover:bg-polaria-w-08",
            )}
          >
            Catálogo completo
          </button>
        ) : (
          <></>
        )
      }
      cancelLabel="Cerrar"
      compact
      size="md"
      layout={dockWithCypher ? "dock-left" : "center"}
      stackLevel="base"
      closeOnBackdrop={!dockWithCypher}
    >
      {sugerencias.length === 0 ? (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
          No hay sugerencias. Usa el catálogo completo.
        </p>
      ) : (
        <ul className="space-y-2">
          {sugerencias.map((sug, index) => {
            const nombre = stripLeadingProductoCodigo(sug.nombre, sug.codigo);
            return (
              <li key={sug.idProducto}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(sug);
                    onClose();
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                    "border-polaria-t-20 bg-polaria-t-08 hover:border-polaria-teal",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate polaria-text-body-sm font-semibold text-polaria-w">
                      {nombre}
                      {sug.codigo.trim() ? (
                        <span className="font-medium text-polaria-teal">
                          {" "}
                          ({sug.codigo})
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block polaria-text-caption text-polaria-w-50">
                      {index === 0 ? "Principal · " : ""}
                      ${formatPrecioEs(sug.precioUnitario)}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-lg bg-polaria-teal px-2.5 py-1 text-xs font-semibold text-polaria-on-teal">
                    Usar
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </PolariaFormModal>
  );
}
