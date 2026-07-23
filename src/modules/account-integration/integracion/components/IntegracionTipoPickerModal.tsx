"use client";

import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";
import {
  TIPOS_INTEGRACION,
  type TipoIntegracion,
} from "../constants/integration-types";

interface IntegracionTipoPickerModalProps {
  open: boolean;
  onClose: () => void;
  selectedId?: TipoIntegracion | null;
  onSelect: (tipo: TipoIntegracion) => void;
}

export function IntegracionTipoPickerModal({
  open,
  onClose,
  selectedId = null,
  onSelect,
}: IntegracionTipoPickerModalProps) {
  return (
    <PolariaFormModal
      open={open}
      onClose={onClose}
      title="Seleccionar tipo de integración"
      description="Tipos disponibles para la solicitud."
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      stackLevel="elevated"
      hideHeaderClose
      footerAction={<></>}
      cancelLabel="Cerrar"
      compact
      size="md"
    >
      <div className="max-h-[min(55dvh,24rem)] overflow-auto rounded-xl border border-polaria-w-08">
        <table className="w-full table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[36%]" />
            <col className="w-[64%]" />
          </colgroup>
          <thead className="sticky top-0 bg-polaria-t-08">
            <tr className="border-b border-polaria-t-20">
              <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                Código
              </th>
              <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                Tipo
              </th>
            </tr>
          </thead>
          <tbody>
            {TIPOS_INTEGRACION.map((tipo) => {
              const isSelected = tipo.value === selectedId;
              return (
                <tr
                  key={tipo.value}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onSelect(tipo.value);
                    onClose();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(tipo.value);
                      onClose();
                    }
                  }}
                  aria-label={`Seleccionar ${tipo.label}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "cursor-pointer border-b border-polaria-w-08 transition last:border-b-0",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-polaria-teal",
                    isSelected
                      ? "bg-polaria-t-08 text-polaria-w"
                      : "text-polaria-w hover:bg-polaria-t-08",
                  )}
                >
                  <td className="px-3 py-2.5 align-middle polaria-text-body-sm font-medium text-polaria-teal">
                    {tipo.value}
                  </td>
                  <td className="px-3 py-2.5 align-middle polaria-text-body-sm">
                    {tipo.label}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PolariaFormModal>
  );
}
