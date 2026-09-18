import { PolariaTableBadge } from "@/components/shared/table/PolariaTableCells";
import { CUENTA_COCKPIT_TITLE } from "@/modules/configurator/cuentas/constants/cuenta-cockpit";
import type { CuentaGobiernoListRow } from "@/modules/configurator/cuentas/services/cuentas.service";

interface CuentaCockpitHeaderProps {
  cuenta: CuentaGobiernoListRow;
}

export function CuentaCockpitHeader({ cuenta }: CuentaCockpitHeaderProps) {
  return (
    <section className="mx-auto max-w-4xl px-4 text-center sm:px-6">
      <p className="polaria-text-label text-polaria-teal">
        {CUENTA_COCKPIT_TITLE}
      </p>
      <h1 className="polaria-text-display mt-2">{cuenta.nombreComercial}</h1>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <p className="polaria-text-subtitle">
          {cuenta.codigoCuenta} · {cuenta.empresaNombre}
        </p>
        {cuenta.estaActiva ? (
          <PolariaTableBadge>Acceso activo</PolariaTableBadge>
        ) : (
          <PolariaTableBadge variant="neutral">Acceso inactivo</PolariaTableBadge>
        )}
      </div>
    </section>
  );
}
