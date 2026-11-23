"use client";

import { useState, type RefObject } from "react";
import { importCatalogoProductosFromFile } from "../services/productos-catalogo.service";

interface UseCatalogoImportExcelParams {
  codigoCuenta: string | null | undefined;
  fileInputRef: RefObject<HTMLInputElement | null>;
  reload: () => Promise<unknown> | void;
}

export function useCatalogoImportExcel({
  codigoCuenta,
  fileInputRef,
  reload,
}: UseCatalogoImportExcelParams) {
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImportExcel = () => {
    if (!codigoCuenta || isImporting) return;
    setImportMessage(null);
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (file: File | undefined) => {
    if (!file || !codigoCuenta) return;

    setIsImporting(true);
    setImportMessage(null);
    setImportError(null);

    try {
      const result = await importCatalogoProductosFromFile(codigoCuenta, file);

      if (result.imported > 0) {
        await reload();
      }

      const parts: string[] = [];

      if (result.imported > 0) {
        parts.push(`Se importaron ${result.imported} producto(s) desde ${file.name}.`);
      }

      if (result.skipped > 0) {
        parts.push(`${result.skipped} fila(s) omitida(s) por datos incompletos.`);
      }

      if (result.errors.length) {
        parts.push(`${result.errors.length} fila(s) con error.`);
      }

      if (parts.length) {
        setImportMessage(parts.join(" "));
      } else if (result.imported === 0) {
        setImportError("No se importó ningún producto.");
      }

      if (result.errors.length) {
        setImportError(result.errors.slice(0, 5).join(" "));
      }
    } catch (err: unknown) {
      setImportError(
        err instanceof Error
          ? err.message
          : "No se pudo procesar el archivo de importación.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  return {
    importMessage,
    importError,
    isImporting,
    handleImportExcel,
    handleFileSelected,
  };
}
