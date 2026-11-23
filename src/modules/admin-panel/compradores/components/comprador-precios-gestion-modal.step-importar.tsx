"use client";

import { Upload } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { CompradorPreciosExcelImportRow } from "../utils/comprador-precios-import";
import {
  ACTION_BUTTON_PRIMARY_CLASS,
  ACTION_BUTTON_SECONDARY_CLASS,
  formatPrecioPreview,
} from "./comprador-precios-gestion-modal.utils";

const TH_CLASS =
  "px-2 py-2 polaria-text-label uppercase tracking-wide text-polaria-teal";

interface CompradorPreciosStepImportarProps {
  isBusy: boolean;
  isImporting: boolean;
  importDisabled: boolean;
  pendingImportFile: File | null;
  importPreviewRows: readonly CompradorPreciosExcelImportRow[];
  importTotalRows: number;
  onBack: () => void;
  onConfirm: () => void;
}

export function CompradorPreciosStepImportar({
  isBusy,
  isImporting,
  importDisabled,
  pendingImportFile,
  importPreviewRows,
  importTotalRows,
  onBack,
  onConfirm,
}: CompradorPreciosStepImportarProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="polaria-text-body-sm text-polaria-w-50">
        {pendingImportFile ? (
          <>
            Archivo:{" "}
            <span className="text-polaria-w">{pendingImportFile.name}</span>
            {importTotalRows > 0 ? (
              <>
                {" "}
                · Mostrando {importPreviewRows.length} de {importTotalRows}{" "}
                fila(s)
              </>
            ) : null}
          </>
        ) : (
          "No hay archivo pendiente."
        )}
      </p>

      {importPreviewRows.length > 0 ? (
        <div className="max-h-80 overflow-auto rounded-xl border border-polaria-w-08">
          <table className="min-w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-polaria-bg">
              <tr className="border-b border-polaria-w-08">
                <th className={TH_CLASS}>Grupo</th>
                <th className={TH_CLASS}>Comprador</th>
                <th className={TH_CLASS}>Producto</th>
                <th className={TH_CLASS}>Equivalencia</th>
                <th className={TH_CLASS}>Actual</th>
                <th className={TH_CLASS}>Nuevo</th>
              </tr>
            </thead>
            <tbody>
              {importPreviewRows.map((row) => (
                <tr
                  key={`${row.rowNumber}-${row.codigoComprador}-${row.codigoProducto}`}
                  className="border-b border-polaria-w-08/60"
                >
                  <td className="px-2 py-1.5 polaria-text-body-sm text-polaria-w-50">
                    {row.grupo || "—"}
                  </td>
                  <td className="px-2 py-1.5 polaria-text-body-sm text-polaria-w">
                    <span className="font-medium text-polaria-teal">
                      {row.codigoComprador}
                    </span>
                    {row.nombreComprador ? (
                      <span className="text-polaria-w-50">
                        {" "}
                        — {row.nombreComprador}
                      </span>
                    ) : null}
                  </td>
                  <td className="max-w-[14rem] px-2 py-1.5 polaria-text-body-sm text-polaria-w">
                    <span className="font-medium text-polaria-teal">
                      {row.codigoProducto}
                    </span>
                    {row.nombreProducto ? (
                      <span className="block truncate text-polaria-w-50">
                        {row.nombreProducto}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-2 py-1.5 polaria-text-body-sm text-polaria-w-50">
                    {row.equivalencia || "—"}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 polaria-text-body-sm text-polaria-w-50">
                    {formatPrecioPreview(row.precioActual)}
                  </td>
                  <td
                    className={cn(
                      "whitespace-nowrap px-2 py-1.5 polaria-text-body-sm",
                      row.hasPrecioNuevo
                        ? "font-semibold text-polaria-teal"
                        : "text-polaria-w-50",
                    )}
                  >
                    {formatPrecioPreview(row.precioNuevo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-lg border border-polaria-w-08 bg-polaria-w-08 px-3 py-2 polaria-text-body-sm text-polaria-w-50">
          No hay filas válidas para previsualizar.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isBusy}
          className={ACTION_BUTTON_SECONDARY_CLASS}
        >
          Volver
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={
            isBusy ||
            importDisabled ||
            !pendingImportFile ||
            importPreviewRows.length === 0
          }
          className={ACTION_BUTTON_PRIMARY_CLASS}
        >
          <Upload className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          {isImporting ? "Importando…" : "Confirmar importación"}
        </button>
      </div>
    </div>
  );
}
