"use client";

import { useCallback, useMemo } from "react";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import type { CompradorListRow } from "../services/compradores.service";
import {
  importCompradorPreciosFromFile,
  listCompradorPreciosTemplateAdmin,
} from "../services/comprador-producto-alias.service";
import {
  downloadCompradorPreciosExcelTemplate,
  type CompradorPreciosExportFilters,
} from "../utils/comprador-precios-excel";
import type { CompradorPreciosPrintScope } from "../utils/comprador-precios-print";

export function useCompradoresListPreciosHandlers({
  codigoCuenta,
  runScoped,
  reload,
  rows,
  productos,
  isExportingPrecios,
  setIsExportingPrecios,
  isImportingPrecios,
  setIsImportingPrecios,
  isPrintingPrecios,
  setIsPrintingPrecios,
  setPreciosError,
  setPreciosStatus,
  setIsPreciosModalOpen,
}: {
  codigoCuenta: string | null;
  runScoped: <T>(fn: () => Promise<T>) => Promise<T>;
  reload: () => Promise<void>;
  rows: CompradorListRow[];
  productos: { idProducto: string; codigo: string; nombre: string }[];
  isExportingPrecios: boolean;
  setIsExportingPrecios: (v: boolean) => void;
  isImportingPrecios: boolean;
  setIsImportingPrecios: (v: boolean) => void;
  isPrintingPrecios: boolean;
  setIsPrintingPrecios: (v: boolean) => void;
  setPreciosError: (v: string | null) => void;
  setPreciosStatus: (v: string | null) => void;
  setIsPreciosModalOpen: (v: boolean) => void;
}) {
  const handleExportPrecios = useCallback(
    async (filters: CompradorPreciosExportFilters) => {
      if (
        !codigoCuenta ||
        isExportingPrecios ||
        isImportingPrecios ||
        isPrintingPrecios
      ) {
        return;
      }

      setIsExportingPrecios(true);
      setPreciosError(null);
      setPreciosStatus(null);

      try {
        const nextRows = await runScoped(() =>
          listCompradorPreciosTemplateAdmin({ codigoCuenta, filters }),
        );

        await downloadCompradorPreciosExcelTemplate(nextRows, {
          fechaInicio: filters.fechaInicio,
          fechaFin: filters.fechaFin,
        });
        setIsPreciosModalOpen(false);
      } catch (error: unknown) {
        setPreciosError(
          error instanceof DomainServiceError
            ? error.message
            : "No se pudo exportar la plantilla de precios.",
        );
      } finally {
        setIsExportingPrecios(false);
      }
    },
    [
      codigoCuenta,
      isExportingPrecios,
      isImportingPrecios,
      isPrintingPrecios,
      runScoped,
      setIsExportingPrecios,
      setIsPreciosModalOpen,
      setPreciosError,
      setPreciosStatus,
    ],
  );

  const handleImportPrecios = useCallback(
    async (file: File) => {
      if (
        !codigoCuenta ||
        isImportingPrecios ||
        isExportingPrecios ||
        isPrintingPrecios
      ) {
        return;
      }

      setIsImportingPrecios(true);
      setPreciosError(null);
      setPreciosStatus(null);

      try {
        const result = await runScoped(() =>
          importCompradorPreciosFromFile(codigoCuenta, file),
        );

        const parts: string[] = [];
        if (result.imported > 0) {
          parts.push(`Se importaron ${result.imported} fila(s).`);
        }
        if (result.errors.length) {
          parts.push(result.errors.slice(0, 5).join(" "));
        }

        if (result.imported === 0) {
          setPreciosError(
            result.errors.slice(0, 5).join(" ") ||
              "No hay cambios para importar.",
          );
          return;
        }

        setPreciosStatus(parts.join(" "));
        if (result.errors.length) {
          setPreciosError(result.errors.slice(0, 5).join(" "));
        }
        await reload();
      } catch (error: unknown) {
        setPreciosError(
          error instanceof DomainServiceError
            ? error.message
            : "No se pudo importar la plantilla de precios.",
        );
      } finally {
        setIsImportingPrecios(false);
      }
    },
    [
      codigoCuenta,
      isExportingPrecios,
      isImportingPrecios,
      isPrintingPrecios,
      reload,
      runScoped,
      setIsImportingPrecios,
      setPreciosError,
      setPreciosStatus,
    ],
  );

  const handlePrintPrecios = useCallback(
    async (scope: CompradorPreciosPrintScope) => {
      if (
        !codigoCuenta ||
        isPrintingPrecios ||
        isExportingPrecios ||
        isImportingPrecios
      ) {
        return;
      }

      setIsPrintingPrecios(true);
      setPreciosError(null);
      setPreciosStatus(null);

      try {
        const nextRows = await runScoped(() =>
          listCompradorPreciosTemplateAdmin({
            codigoCuenta,
            filters: {
              grupos: scope.grupos,
              codigosComprador: scope.codigosComprador,
            },
          }),
        );
        await downloadCompradorPreciosExcelTemplate(nextRows, {
          variant: "print",
        });
        setPreciosStatus("Excel de lista de precios generado.");
        setIsPreciosModalOpen(false);
      } catch (error: unknown) {
        setPreciosError(
          error instanceof DomainServiceError
            ? error.message
            : "No se pudo generar el Excel de precios.",
        );
      } finally {
        setIsPrintingPrecios(false);
      }
    },
    [
      codigoCuenta,
      isExportingPrecios,
      isImportingPrecios,
      isPrintingPrecios,
      runScoped,
      setIsPreciosModalOpen,
      setIsPrintingPrecios,
      setPreciosError,
      setPreciosStatus,
    ],
  );

  const preciosPrintOptions = useMemo(
    () =>
      rows.map((row) => ({
        codigo: row.codigo,
        nombre: row.comprador,
        grupo: row.grupo,
      })),
    [rows],
  );

  const preciosProductoOptions = useMemo(
    () =>
      productos.map((row) => ({
        idProducto: row.idProducto,
        codigo: row.codigo,
        nombre: row.nombre,
      })),
    [productos],
  );

  return {
    handleExportPrecios,
    handleImportPrecios,
    handlePrintPrecios,
    preciosPrintOptions,
    preciosProductoOptions,
  };
}