"use client";

import { Plus } from "lucide-react";
import { formatKgEs } from "@/lib/utils/decimal-es";
import { cn } from "@/lib/utils/cn";
import type { OrdenTrabajoHija } from "../../utils/origen/origen-correo-ordenes-trabajo";
import { OrdenVentaModalPickers } from "./OrdenVentaCapturePickOt-pickers";

export { OrdenVentaModalPickers };

function countProductosOt(hija: OrdenTrabajoHija): number {
  return hija.renglones.filter(
    (row) =>
      (row.Producto ?? "").trim() || (row["Codigo producto"] ?? "").trim(),
  ).length;
}

function AddTareaButton({ onAddTarea }: { onAddTarea: () => void }) {
  return (
    <button
      type="button"
      onClick={onAddTarea}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-2.5",
        "polaria-text-body-sm font-semibold text-polaria-w transition hover:border-polaria-teal",
      )}
    >
      <Plus className="h-4 w-4 text-polaria-teal" aria-hidden />
      Agregar tarea de almacén
    </button>
  );
}

function PickOtCypher({
  total,
  onAddTarea,
}: {
  total: number;
  onAddTarea: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="polaria-text-body-sm text-polaria-w-50">
        Esta venta tiene{" "}
        <span className="font-semibold text-polaria-teal">
          {total} órdenes de trabajo
        </span>
        . Elige cuál quieres revisar en el panel Cypher a la derecha.
      </p>
      <AddTareaButton onAddTarea={onAddTarea} />
    </div>
  );
}

function PickOtGrid({
  hijas,
  onEdit,
  onRemove,
  onAddTarea,
}: {
  hijas: OrdenTrabajoHija[];
  onEdit: (index: number) => void;
  onRemove: (hijaId: string) => void;
  onAddTarea: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="polaria-text-body-sm text-polaria-w-50">
        Esta venta tiene{" "}
        <span className="font-semibold text-polaria-teal">
          {hijas.length} órdenes de trabajo
        </span>
        . Elige cuál quieres editar, o agrega/elimina si faltan o sobran.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {hijas.map((hija, index) => (
          <div
            key={hija.id}
            className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-4"
          >
            <button
              type="button"
              onClick={() => onEdit(index)}
              className={cn(
                "w-full text-left transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
              )}
            >
              <p className="polaria-text-body-sm font-semibold text-polaria-w">
                {hija.label}
              </p>
              <p className="mt-1 polaria-text-caption text-polaria-w-50">
                {countProductosOt(hija)} producto
                {countProductosOt(hija) === 1 ? "" : "s"} ·{" "}
                {formatKgEs(hija.totalCantidad)} kg
              </p>
              {hija.almacen ? (
                <p className="mt-1 polaria-text-caption text-polaria-w-50">
                  {hija.almacen}
                </p>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => onRemove(hija.id)}
              className="mt-3 polaria-text-caption text-polaria-w-50 transition hover:text-polaria-teal"
            >
              Eliminar tarea
            </button>
          </div>
        ))}
      </div>
      <AddTareaButton onAddTarea={onAddTarea} />
    </div>
  );
}

export function OrdenVentaCapturePickOt({
  cypherOpen,
  hijas,
  onEdit,
  onRemove,
  onAddTarea,
}: {
  cypherOpen: boolean;
  hijas: OrdenTrabajoHija[];
  onEdit: (index: number) => void;
  onRemove: (hijaId: string) => void;
  onAddTarea: () => void;
}) {
  if (cypherOpen) {
    return <PickOtCypher total={hijas.length} onAddTarea={onAddTarea} />;
  }
  return (
    <PickOtGrid
      hijas={hijas}
      onEdit={onEdit}
      onRemove={onRemove}
      onAddTarea={onAddTarea}
    />
  );
}

