"use client";

import {
  PolariaTableActionGroup,
  PolariaTableBadge,
  PolariaTableCode,
  PolariaTableDisableButton,
  PolariaTableEditButton,
  PolariaTableEnableButton,
} from "@/components/shared/table/PolariaTableCells";
import {
  formatCamionCreatedAt,
  formatCamionDecimal,
  formatCamionMarcaModelo,
  getCamionTipoLabel,
} from "../constants/camion-types";
import {
  formatCamionId,
  type CamionListRow,
} from "../services/camiones.service";

export type CamionPendingToggle = {
  row: CamionListRow;
  mode: "disable" | "enable";
};

interface BuildCamionesColumnsParams {
  setEditingCamion: (row: CamionListRow) => void;
  setToggleError: (value: string | null) => void;
  setPendingToggle: (value: CamionPendingToggle | null) => void;
}

export function buildCamionesListColumns({
  setEditingCamion,
  setToggleError,
  setPendingToggle,
}: BuildCamionesColumnsParams) {
  return [
    {
      id: "id",
      header: "ID",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      cell: (row: CamionListRow) => (
        <span className="font-mono text-polaria-w-50">
          {formatCamionId(row.idCamion)}
        </span>
      ),
    },
    {
      id: "codigo",
      header: "Cód",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      cell: (row: CamionListRow) => (
        <PolariaTableCode>{row.codigo}</PolariaTableCode>
      ),
    },
    {
      id: "placa",
      header: "Placa",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap font-medium",
      cell: (row: CamionListRow) => row.placa,
    },
    {
      id: "marca-modelo",
      header: "Marca / Modelo",
      headerClassName: "min-w-[14rem] whitespace-nowrap",
      cellClassName: "min-w-[14rem] whitespace-nowrap",
      cell: (row: CamionListRow) =>
        formatCamionMarcaModelo(row.marca, row.modelo),
    },
    {
      id: "tipo",
      header: "Tipo",
      headerClassName: "min-w-[7rem] whitespace-nowrap",
      cellClassName: "min-w-[7rem] whitespace-nowrap",
      cell: (row: CamionListRow) => getCamionTipoLabel(row.tipo),
    },
    {
      id: "peso-max",
      header: "Peso Máx",
      headerClassName: "min-w-[7rem] whitespace-nowrap",
      cellClassName: "min-w-[7rem] whitespace-nowrap",
      cell: (row: CamionListRow) =>
        formatCamionDecimal(row.capacidadKg, "kg"),
    },
    {
      id: "volumen",
      header: "Volumen",
      headerClassName: "min-w-[6rem] whitespace-nowrap",
      cellClassName: "min-w-[6rem] whitespace-nowrap",
      cell: (row: CamionListRow) =>
        formatCamionDecimal(row.capacidadM3, "m³"),
    },
    {
      id: "pallets",
      header: "Pallets",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      cell: (row: CamionListRow) => row.capacidadPallets ?? "—",
    },
    {
      id: "rango-temp",
      header: "Rango Temp",
      headerClassName: "min-w-[10rem] whitespace-nowrap",
      cellClassName: "min-w-[10rem] whitespace-nowrap",
      cell: (row: CamionListRow) => row.rangoTemperatura ?? "—",
    },
    {
      id: "estado",
      header: "Estado",
      headerClassName: "min-w-[8rem] whitespace-nowrap",
      cellClassName: "min-w-[8rem] whitespace-nowrap",
      cell: (row: CamionListRow) =>
        !row.estaActivo ? (
          <PolariaTableBadge variant="neutral">Deshabilitado</PolariaTableBadge>
        ) : row.disponible ? (
          <PolariaTableBadge>Disponible</PolariaTableBadge>
        ) : (
          <PolariaTableBadge variant="neutral">No disponible</PolariaTableBadge>
        ),
    },
    {
      id: "creado",
      header: "Creado",
      headerClassName: "min-w-[7rem] whitespace-nowrap",
      cellClassName: "min-w-[7rem] whitespace-nowrap",
      cell: (row: CamionListRow) => formatCamionCreatedAt(row.createdAt),
    },
    {
      id: "acciones",
      header: "Acciones",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      cell: (row: CamionListRow) => (
        <PolariaTableActionGroup>
          <PolariaTableEditButton
            disabled={!row.estaActivo}
            onClick={() => setEditingCamion(row)}
          />
          {row.estaActivo ? (
            <PolariaTableDisableButton
              onClick={() => {
                setToggleError(null);
                setPendingToggle({ row, mode: "disable" });
              }}
            />
          ) : (
            <PolariaTableEnableButton
              onClick={() => {
                setToggleError(null);
                setPendingToggle({ row, mode: "enable" });
              }}
            />
          )}
        </PolariaTableActionGroup>
      ),
    },
  ] as const;
}
