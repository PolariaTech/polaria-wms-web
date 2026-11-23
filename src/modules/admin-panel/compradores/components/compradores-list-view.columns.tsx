"use client";

import { useMemo } from "react";
import {
  PolariaTableActionGroup,
  PolariaTableBadge,
  PolariaTableCode,
  PolariaTableDisableButton,
  PolariaTableEditButton,
  PolariaTableEnableButton,
} from "@/components/shared/table/PolariaTableCells";
import { formatInternationalPhoneDisplay } from "@/constants/ui/phone-countries";
import type { CompradorListRow } from "../services/compradores.service";

type PendingToggle = { row: CompradorListRow; mode: "disable" | "enable" };

export function useCompradoresListColumns(
  setEditingComprador: (row: CompradorListRow) => void,
  setToggleError: (value: string | null) => void,
  setPendingToggle: (value: PendingToggle) => void,
) {
  const columns = useMemo(
    () =>
      [
        {
          id: "codigo",
          header: "Código",
          cell: (row: CompradorListRow) => (
            <PolariaTableCode>{row.codigo}</PolariaTableCode>
          ),
        },
        {
          id: "comprador",
          header: "Cliente",
          cell: (row: CompradorListRow) => row.comprador,
        },
        {
          id: "apodo",
          header: "D. Comercial",
          cell: (row: CompradorListRow) => row.apodo?.trim() || "—",
        },
        {
          id: "telefono",
          header: "Teléfono",
          cell: (row: CompradorListRow) =>
            formatInternationalPhoneDisplay(row.telefono),
        },
        {
          id: "estado",
          header: "Estado",
          cell: (row: CompradorListRow) =>
            row.estaActivo ? (
              <PolariaTableBadge>Activo</PolariaTableBadge>
            ) : (
              <PolariaTableBadge variant="neutral">Deshabilitado</PolariaTableBadge>
            ),
        },
        {
          id: "acciones",
          header: "Acciones",
          cell: (row: CompradorListRow) => (
            <span
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <PolariaTableActionGroup>
                <PolariaTableEditButton
                  disabled={!row.estaActivo}
                  onClick={() => setEditingComprador(row)}
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
            </span>
          ),
        },
      ] as const,
    [setEditingComprador, setPendingToggle, setToggleError],
  );

  return columns;
}