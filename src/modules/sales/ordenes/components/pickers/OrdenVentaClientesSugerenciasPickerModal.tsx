"use client";

import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";
import type { CompradorListRow } from "@/modules/admin-panel";

interface OrdenVentaClientesSugerenciasPickerModalProps {
  open: boolean;
  onClose: () => void;
  sugerencias: CompradorListRow[];
  textoCliente?: string | null;
  onSelect: (comprador: CompradorListRow) => void;
  onOpenCatalogo?: () => void;
}

export function OrdenVentaClientesSugerenciasPickerModal({
  open,
  onClose,
  sugerencias,
  textoCliente,
  onSelect,
  onOpenCatalogo,
}: OrdenVentaClientesSugerenciasPickerModalProps) {
  const subtitle = textoCliente?.trim()
    ? `Sugerencias para «${textoCliente.trim()}»`
    : "Elige una sugerencia o abre el catálogo.";

  return (
    <PolariaFormModal
      open={open}
      onClose={onClose}
      title="Elegir cliente"
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
      stackLevel="nested"
    >
      {sugerencias.length === 0 ? (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
          No hay sugerencias para este nombre. Usa el catálogo completo.
        </p>
      ) : (
        <ul className="space-y-2">
          {sugerencias.map((row, index) => (
            <li key={row.idComprador}>
              <button
                type="button"
                onClick={() => {
                  onSelect(row);
                  onClose();
                }}
                className={cn(
                  "flex w-full items-start justify-between gap-3 rounded-xl border px-3 py-3 text-left transition",
                  "border-polaria-t-20 bg-polaria-t-08 hover:border-polaria-teal hover:bg-polaria-t-08",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
                )}
              >
                <span className="min-w-0">
                  <span className="block polaria-text-body-sm font-semibold text-polaria-w">
                    {row.comprador}
                    {row.codigo?.trim() ? (
                      <span className="font-medium text-polaria-teal">
                        {" "}
                        ({row.codigo})
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block polaria-text-caption text-polaria-w-50">
                    {index === 0 ? "Sugerencia principal" : "Alternativa"}
                    {row.telefono?.trim() ? ` · ${row.telefono.trim()}` : ""}
                  </span>
                </span>
                <span className="shrink-0 rounded-lg bg-polaria-teal px-2.5 py-1 text-xs font-semibold text-polaria-on-teal">
                  Usar
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </PolariaFormModal>
  );
}
