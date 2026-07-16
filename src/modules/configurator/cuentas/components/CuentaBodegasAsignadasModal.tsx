"use client";

import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaTableBadge } from "@/components/shared/table/PolariaTableCells";
import { cn } from "@/lib/utils/cn";
import type { CuentaBodegaAsignada } from "../services/cuentas.service";

interface CuentaBodegasAsignadasModalProps {
  open: boolean;
  onClose: () => void;
  cuentaNombre: string;
  bodegas: CuentaBodegaAsignada[];
}

function formatCapacidad(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("es-CL");
}

function formatTipo(tipo: string): string {
  if (tipo === "interna") return "Interna";
  if (tipo === "externa") return "Externa";
  return tipo;
}

export function CuentaBodegasAsignadasModal({
  open,
  onClose,
  cuentaNombre,
  bodegas,
}: CuentaBodegasAsignadasModalProps) {
  return (
    <PolariaFormModal
      open={open}
      onClose={onClose}
      title="Bodegas asignadas"
      description={`Bodegas vinculadas a ${cuentaNombre}.`}
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      hideHeaderClose
      footerAction={<></>}
      cancelLabel="Cerrar"
      compact
      size="lg"
    >
      {bodegas.length === 0 ? (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
          No hay bodegas asignadas a esta cuenta.
        </p>
      ) : (
        <div className="max-h-[min(55dvh,24rem)] overflow-auto rounded-xl border border-polaria-w-08">
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[40%]" />
              <col className="w-[22%]" />
              <col className="w-[38%]" />
            </colgroup>
            <thead className="sticky top-0 bg-polaria-t-08">
              <tr className="border-b border-polaria-t-20">
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Nombre
                </th>
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Tipo
                </th>
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Capacidad
                </th>
              </tr>
            </thead>
            <tbody>
              {bodegas.map((bodega) => (
                <tr
                  key={bodega.idBodega}
                  className="border-b border-polaria-w-08 last:border-b-0"
                >
                  <td className="px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w">
                    {bodega.nombre}
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <PolariaTableBadge
                      variant={
                        bodega.tipo === "interna" ? "positive" : "neutral"
                      }
                    >
                      {formatTipo(bodega.tipo)}
                    </PolariaTableBadge>
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2.5 align-middle polaria-text-body-sm",
                      "text-polaria-w-50",
                    )}
                  >
                    {formatCapacidad(bodega.capacidad)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PolariaFormModal>
  );
}
