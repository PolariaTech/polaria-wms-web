"use client";

import { useEffect, useMemo, useState } from "react";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { normalizeCompradorGrupoValues } from "../constants/comprador-grupos";
import {
  COMPRADOR_PRECIOS_IMPORT_PREVIEW_LIMIT,
  parseCompradorPreciosExcelFile,
  takeCompradorPreciosImportPreview,
  type CompradorPreciosExcelImportRow,
} from "../utils/comprador-precios-import";
import type { CompradorPreciosGestionModalProps } from "./comprador-precios-gestion-modal.types";
import {
  firstDayOfMonthIso,
  todayIsoDate,
  type ModalStep,
} from "./comprador-precios-gestion-modal.utils";

export function useCompradorPreciosGestionState({
  open,
  onClose,
  onExport,
  onImport,
  onPrint,
  gruposDisponibles = [],
  compradores = [],
  productos = [],
  isExporting = false,
  isImporting = false,
  isPrinting = false,
  exportDisabled = false,
  importDisabled = false,
  printDisabled = false,
}: CompradorPreciosGestionModalProps) {
  const [step, setStep] = useState<ModalStep>("acciones");
  const catalogoGrupos = useMemo(
    () =>
      normalizeCompradorGrupoValues([
        ...gruposDisponibles,
        ...compradores.map((row) => row.grupo),
      ]),
    [gruposDisponibles, compradores],
  );
  const catalogoGruposKey = catalogoGrupos.join("|");
  const [selectedGrupos, setSelectedGrupos] = useState<string[]>([]);
  const [selectedProductos, setSelectedProductos] = useState<string[]>([]);
  const [fechaInicio, setFechaInicio] = useState(firstDayOfMonthIso);
  const [fechaFin, setFechaFin] = useState(todayIsoDate);
  const [printGrupos, setPrintGrupos] = useState<string[]>([]);
  const [printCodigosComprador, setPrintCodigosComprador] = useState<string[]>(
    [],
  );
  const [compradorPickerOpen, setCompradorPickerOpen] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [importPreviewRows, setImportPreviewRows] = useState<
    CompradorPreciosExcelImportRow[]
  >([]);
  const [importTotalRows, setImportTotalRows] = useState(0);
  const [importParseError, setImportParseError] = useState<string | null>(null);
  const [isParsingImport, setIsParsingImport] = useState(false);
  const isBusy = isExporting || isImporting || isPrinting || isParsingImport;

  const productoIds = useMemo(
    () => productos.map((row) => row.idProducto),
    [productos],
  );
  const productoIdsKey = productoIds.join("|");

  useEffect(() => {
    if (!open) return;
    setStep("acciones");
    setSelectedGrupos([]);
    setSelectedProductos(productoIdsKey ? productoIdsKey.split("|") : []);
    setFechaInicio(firstDayOfMonthIso());
    setFechaFin(todayIsoDate());
    setPrintGrupos([]);
    setPrintCodigosComprador([]);
    setCompradorPickerOpen(false);
    setPendingImportFile(null);
    setImportPreviewRows([]);
    setImportTotalRows(0);
    setImportParseError(null);
    setIsParsingImport(false);
  }, [open, productoIdsKey, catalogoGruposKey]);

  const sortedCompradores = useMemo(
    () =>
      [...compradores].sort((left, right) =>
        left.nombre.localeCompare(right.nombre, "es"),
      ),
    [compradores],
  );

  const printCompradoresSeleccionados = useMemo(
    () =>
      sortedCompradores.filter((row) =>
        printCodigosComprador.includes(row.codigo),
      ),
    [printCodigosComprador, sortedCompradores],
  );

  const printCompradorFieldValue = useMemo(() => {
    if (printCompradoresSeleccionados.length === 0) return "";
    if (printCompradoresSeleccionados.length === 1) {
      const row = printCompradoresSeleccionados[0];
      return `${row.codigo} — ${row.nombre}`;
    }
    return `${printCompradoresSeleccionados.length} compradores seleccionados`;
  }, [printCompradoresSeleccionados]);

  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  const fechaRangoInvalido =
    Boolean(fechaInicio) && Boolean(fechaFin) && fechaInicio > fechaFin;

  const handleConfirmPrint = () => {
    if (isBusy || printDisabled) return;
    if (printGrupos.length === 0 && printCodigosComprador.length === 0) return;
    onPrint({
      grupos: printGrupos,
      codigosComprador: printCodigosComprador,
    });
  };

  const handleConfirmExport = () => {
    if (isBusy || exportDisabled) return;
    if (selectedGrupos.length === 0) return;
    if (selectedProductos.length === 0) return;
    if (!fechaInicio || !fechaFin || fechaRangoInvalido) return;
    onExport({
      grupos: selectedGrupos,
      idProductos: selectedProductos,
      fechaInicio,
      fechaFin,
    });
  };

  const clearImportPreview = () => {
    setPendingImportFile(null);
    setImportPreviewRows([]);
    setImportTotalRows(0);
    setImportParseError(null);
    setStep("acciones");
  };

  const handlePickImportFile = async (file: File) => {
    if (isBusy || importDisabled) return;
    setIsParsingImport(true);
    setImportParseError(null);
    setPendingImportFile(file);
    try {
      const parsed = await parseCompradorPreciosExcelFile(file);
      if (parsed.errors.length > 0 && parsed.rows.length === 0) {
        setImportParseError(parsed.errors.slice(0, 3).join(" "));
        setImportPreviewRows([]);
        setImportTotalRows(0);
        setStep("importar-preview");
        return;
      }
      setImportPreviewRows(
        takeCompradorPreciosImportPreview(
          parsed.rows,
          COMPRADOR_PRECIOS_IMPORT_PREVIEW_LIMIT,
        ),
      );
      setImportTotalRows(parsed.rows.length);
      setImportParseError(
        parsed.errors.length > 0 ? parsed.errors.slice(0, 3).join(" ") : null,
      );
      setStep("importar-preview");
    } catch (err: unknown) {
      setPendingImportFile(null);
      setImportPreviewRows([]);
      setImportTotalRows(0);
      setImportParseError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo leer el Excel de precios.",
      );
      setStep("importar-preview");
    } finally {
      setIsParsingImport(false);
    }
  };

  const handleConfirmImport = () => {
    if (isBusy || importDisabled || !pendingImportFile) return;
    onImport(pendingImportFile);
  };

  return {
    step,
    setStep,
    catalogoGrupos,
    productoIds,
    selectedGrupos,
    setSelectedGrupos,
    selectedProductos,
    setSelectedProductos,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    fechaRangoInvalido,
    printGrupos,
    setPrintGrupos,
    printCodigosComprador,
    setPrintCodigosComprador,
    compradorPickerOpen,
    setCompradorPickerOpen,
    sortedCompradores,
    printCompradoresSeleccionados,
    printCompradorFieldValue,
    pendingImportFile,
    importPreviewRows,
    importTotalRows,
    importParseError,
    isParsingImport,
    isBusy,
    isExporting,
    isImporting,
    isPrinting,
    exportDisabled,
    importDisabled,
    printDisabled,
    handleClose,
    handleConfirmPrint,
    handleConfirmExport,
    handleConfirmImport,
    handlePickImportFile,
    clearImportPreview,
  };
}
