"use client";

import { formatKgEs } from "@/lib/utils/decimal-es";
import { CamionCatalogTablePickerModal } from "@/modules/admin-panel/camiones/components/CamionCatalogTablePickerModal";
import {
  formatCamionId,
  type CamionListRow,
} from "@/modules/admin-panel/camiones/services/camiones.service";

interface CustodioOrdenSalidaCamionPickerModalProps {
  open: boolean;
  onClose: () => void;
  camiones: CamionListRow[];
  selectedKey: string | null;
  onSelect: (row: CamionListRow) => void;
}

export function CustodioOrdenSalidaCamionPickerModal({
  open,
  onClose,
  camiones,
  selectedKey,
  onSelect,
}: CustodioOrdenSalidaCamionPickerModalProps) {
  return (
    <CamionCatalogTablePickerModal
      open={open}
      onClose={onClose}
      title="Seleccionar camión"
      description="Camiones disponibles para el paquete de despacho."
      rows={camiones}
      getRowKey={(row) => row.idCamion}
      getSearchHaystack={(row) =>
        [
          row.placa,
          row.codigo,
          row.marca,
          row.modelo,
          row.tipo,
          row.rangoTemperatura,
        ]
          .filter(Boolean)
          .join(" ")
      }
      selectedKey={selectedKey}
      onSelect={onSelect}
      searchPlaceholder="Buscar por placa, código, marca o modelo"
      emptyMessage="No hay camiones disponibles."
      columns={[
        {
          id: "placa",
          header: "Placa",
          className: "w-[22%]",
          cell: (row) => (
            <span className="font-medium text-polaria-teal">{row.placa}</span>
          ),
        },
        {
          id: "codigo",
          header: "Código",
          className: "w-[18%]",
          cell: (row) => row.codigo?.trim() || formatCamionId(row.idCamion),
        },
        {
          id: "vehiculo",
          header: "Vehículo",
          className: "w-[34%]",
          cell: (row) => {
            const marca = row.marca?.trim();
            const modelo = row.modelo?.trim();
            if (marca && modelo) return `${marca} ${modelo}`;
            return marca || modelo || "—";
          },
        },
        {
          id: "tipo",
          header: "Tipo",
          className: "w-[14%]",
          cell: (row) => String(row.tipo ?? "—"),
        },
        {
          id: "capacidad",
          header: "Kg máx.",
          className: "w-[12%] whitespace-nowrap",
          cell: (row) =>
            row.capacidadKg != null ? formatKgEs(row.capacidadKg) : "—",
        },
      ]}
    />
  );
}
