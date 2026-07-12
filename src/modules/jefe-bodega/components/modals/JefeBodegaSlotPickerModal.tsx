"use client";

import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { EstadoBodegaSlotCell } from "@/modules/warehouses/estado-bodega/components/EstadoBodegaSlotCell";
import type {
  EstadoBodegaSlot,
  EstadoBodegaSlotDetalleView,
} from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";

export interface JefeBodegaSlotPickerOption {
  id: string;
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  disabled?: boolean;
  slotNumber?: number;
  codigo?: string | null;
  visual?: EstadoBodegaSlot["visual"];
  detalle?: EstadoBodegaSlotDetalleView | null;
}

interface JefeBodegaSlotPickerModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  options: JefeBodegaSlotPickerOption[];
  selectedId?: string | null;
  emptyMessage?: string;
  onSelect: (option: JefeBodegaSlotPickerOption) => void;
}

const SLOT_SIZE = 108;

function toEstadoSlot(
  option: JefeBodegaSlotPickerOption,
  index: number,
): EstadoBodegaSlot {
  const visual = option.visual ?? "ocupada_primario";
  const isEmpty = visual === "vacia";
  const detalle = isEmpty
    ? null
    : (option.detalle ??
      ({
        productoNombre: option.title,
        idPaquete: option.subtitle ?? null,
        cliente: null,
        cantidad: "—",
        posicion: option.codigo ?? null,
        temperatura: option.meta ?? null,
        ordenCompraCodigo: null,
      } satisfies EstadoBodegaSlotDetalleView));

  return {
    slotNumber: option.slotNumber ?? index + 1,
    idUbicacion: option.id,
    codigo: option.codigo ?? null,
    visual,
    productoLabel: detalle?.productoNombre ?? option.title,
    detalle,
  };
}

export function JefeBodegaSlotPickerModal({
  open,
  onClose,
  title,
  description,
  options,
  selectedId = null,
  emptyMessage = "No hay opciones disponibles.",
  onSelect,
}: JefeBodegaSlotPickerModalProps) {
  return (
    <PolariaFormModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      onSubmit={(event) => event.preventDefault()}
      hideHeaderClose
      footerAction={<></>}
      cancelLabel="Cerrar"
      compact
      size="md"
    >
      {options.length === 0 ? (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
          {emptyMessage}
        </p>
      ) : (
        <div className="max-h-[min(55dvh,26rem)] overflow-y-auto pr-1">
          <div className="flex flex-wrap justify-center gap-3 py-1">
            {options.map((option, index) => {
              const slot = toEstadoSlot(option, index);
              const isSelected = option.id === selectedId;
              const handlePick = () => {
                if (option.disabled) return;
                onSelect(option);
                onClose();
              };

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={option.disabled}
                  onClick={handlePick}
                  aria-label={`Seleccionar ${option.title}`}
                  className={
                    isSelected
                      ? "rounded-xl ring-2 ring-polaria-teal ring-offset-2 ring-offset-polaria-bg focus-visible:outline-none"
                      : "rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal"
                  }
                >
                  <EstadoBodegaSlotCell
                    slot={slot}
                    accentClassName=""
                    size={SLOT_SIZE}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </PolariaFormModal>
  );
}
