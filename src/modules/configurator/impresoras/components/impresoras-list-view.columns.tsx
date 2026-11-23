import type { PolariaDataTableColumn } from "@/components/shared/table/PolariaDataTable";
import {
  PolariaTableBadge,
  PolariaTableDeleteButton,
  PolariaTableEditButton,
} from "@/components/shared/table/PolariaTableCells";
import {
  labelModoEnvio,
  type ImpresoraListRow,
} from "@/modules/configurator/impresoras/services/impresoras.service";

export function buildImpresorasListColumns(params: {
  lockedCuenta: string | undefined;
  onEdit: (row: ImpresoraListRow) => void;
  onDelete: (row: ImpresoraListRow) => void;
}): PolariaDataTableColumn<ImpresoraListRow>[] {
  const { lockedCuenta, onEdit, onDelete } = params;
  const cols: PolariaDataTableColumn<ImpresoraListRow>[] = [
    {
      id: "nombre",
      header: "Nombre",
      cell: (row) => row.nombre,
    },
  ];

  if (!lockedCuenta) {
    cols.push({
      id: "cuenta",
      header: "Cuenta",
      cell: (row) => row.cuentaNombre,
    });
  }

  cols.push(
    {
      id: "camino",
      header: "Camino",
      cell: (row) => labelModoEnvio(row.modoEnvio),
    },
    {
      id: "destino",
      header: "Destino",
      cell: (row) => {
        if (row.emailDestino?.trim()) return row.emailDestino.trim();
        if (row.nombreSistema?.trim()) return row.nombreSistema.trim();
        if (row.hostIp) {
          return row.puerto ? `${row.hostIp}:${row.puerto}` : row.hostIp;
        }
        return "—";
      },
    },
    {
      id: "estado",
      header: "Estado",
      cell: (row) =>
        row.estaActiva ? (
          <PolariaTableBadge>Activa</PolariaTableBadge>
        ) : (
          <PolariaTableBadge variant="neutral">Inactiva</PolariaTableBadge>
        ),
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: (row) => (
        <div
          className="flex flex-wrap items-center gap-2"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <PolariaTableEditButton onClick={() => onEdit(row)} />
          <PolariaTableDeleteButton onClick={() => onDelete(row)} />
        </div>
      ),
    },
  );

  return cols;
}
