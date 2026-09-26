"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Printer, Upload } from "lucide-react";
import {
  PolariaFormField,
  PolariaFormInput,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { cn } from "@/lib/utils/cn";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import { normalizeCompradorGrupoValues } from "../constants/comprador-grupos";
import type { CompradorPreciosExportFilters } from "../utils/comprador-precios-excel";
import {
  COMPRADOR_PRECIOS_IMPORT_PREVIEW_LIMIT,
  parseCompradorPreciosExcelFile,
  takeCompradorPreciosImportPreview,
  type CompradorPreciosExcelImportRow,
} from "../utils/comprador-precios-import";
import type { CompradorPreciosPrintScope } from "../utils/comprador-precios-print";
import { CompradorTableMultiPickerModal } from "./CompradorTableMultiPickerModal";

export interface CompradorPreciosPrintOption {
  codigo: string;
  nombre: string;
  grupo: string;
}

export interface CompradorPreciosProductoOption {
  idProducto: string;
  codigo: string;
  nombre: string;
}

interface CompradorPreciosGestionModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (filters: CompradorPreciosExportFilters) => void;
  onImport: (file: File) => void;
  onPrint: (scope: CompradorPreciosPrintScope) => void;
  /** Catálogo de grupos pertenecientes (BD / tmp). */
  gruposDisponibles?: readonly string[];
  compradores?: readonly CompradorPreciosPrintOption[];
  productos?: readonly CompradorPreciosProductoOption[];
  isExporting?: boolean;
  isImporting?: boolean;
  isPrinting?: boolean;
  exportDisabled?: boolean;
  importDisabled?: boolean;
  printDisabled?: boolean;
  error?: string | null;
  status?: string | null;
}

const ACTION_BUTTON_CLASS = cn(
  "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3",
  "polaria-text-body-sm font-semibold transition",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
);

type ModalStep = "acciones" | "exportar" | "imprimir" | "importar-preview";

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function firstDayOfMonthIso(): string {
  return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

function formatPrecioPreview(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
}

export function CompradorPreciosGestionModal({
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
  error = null,
  status = null,
}: CompradorPreciosGestionModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const sortedProductos = useMemo(() => [...productos], [productos]);

  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  const fechaRangoInvalido =
    Boolean(fechaInicio) &&
    Boolean(fechaFin) &&
    fechaInicio > fechaFin;

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
        parsed.errors.length > 0
          ? parsed.errors.slice(0, 3).join(" ")
          : null,
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

  const allGruposSelected =
    catalogoGrupos.length > 0 &&
    selectedGrupos.length === catalogoGrupos.length;
  const allPrintGruposSelected =
    catalogoGrupos.length > 0 && printGrupos.length === catalogoGrupos.length;
  const allProductosSelected =
    productos.length > 0 && selectedProductos.length === productos.length;

  return (
    <>
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Compradores"
      title="Gestión de precios"
      description={
        step === "imprimir"
          ? "Elige grupos y/o compradores adicionales (con lupa). Se descarga Excel."
          : step === "exportar"
            ? "Elige periodo, grupos y productos antes de exportar."
            : step === "importar-preview"
              ? "Revisa una muestra del Excel antes de confirmar la importación."
              : "Elige una acción para la plantilla de precios."
      }
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      hideFooter
      compact
      size={
        step === "acciones" ? "sm" : step === "importar-preview" ? "2xl" : "md"
      }
      isSubmitting={isBusy}
      error={error ?? (step === "importar-preview" ? importParseError : null)}
      closeOnEscape={!compradorPickerOpen}
      closeOnBackdrop={!compradorPickerOpen}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void handlePickImportFile(file);
        }}
      />

      {status ? (
        <p
          role="status"
          className="mb-3 rounded-lg border border-polaria-w-08 bg-polaria-w-08 px-3 py-2 polaria-text-body-sm text-polaria-w-50"
        >
          {status}
        </p>
      ) : null}

      {step === "acciones" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setStep("exportar")}
            disabled={isBusy || exportDisabled}
            className={cn(
              ACTION_BUTTON_CLASS,
              "border border-polaria-t-20 text-polaria-teal hover:bg-polaria-t-08",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Exportar
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy || importDisabled}
            className={cn(
              ACTION_BUTTON_CLASS,
              "border border-polaria-t-20 text-polaria-teal hover:bg-polaria-t-08",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            <Upload className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            {isParsingImport
              ? "Leyendo…"
              : isImporting
                ? "Importando…"
                : "Importar"}
          </button>

          <button
            type="button"
            onClick={() => setStep("imprimir")}
            disabled={isBusy || printDisabled}
            className={cn(
              ACTION_BUTTON_CLASS,
              "border border-polaria-t-20 text-polaria-teal hover:bg-polaria-t-08",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            <Printer className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Imprimir
          </button>
        </div>
      ) : null}

      {step === "exportar" ? (
        <div className="flex flex-col gap-4">
          <section className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 p-3">
            <h3 className="mb-2 polaria-text-label uppercase tracking-wide text-polaria-teal">
              Periodo
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <PolariaFormInput
                id="precios-export-fecha-inicio"
                label="Fecha inicio"
                type="date"
                compact
                value={fechaInicio}
                disabled={isBusy}
                onChange={(event) => setFechaInicio(event.target.value)}
              />
              <PolariaFormInput
                id="precios-export-fecha-fin"
                label="Fecha final"
                type="date"
                compact
                value={fechaFin}
                disabled={isBusy}
                onChange={(event) => setFechaFin(event.target.value)}
              />
            </div>
            {fechaRangoInvalido ? (
              <p className="mt-2 polaria-text-body-sm text-polaria-w-50">
                La fecha inicio no puede ser posterior a la fecha final.
              </p>
            ) : null}
          </section>

          <section className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="polaria-text-label uppercase tracking-wide text-polaria-teal">
                Grupo perteneciente
              </h3>
              <button
                type="button"
                disabled={isBusy}
                onClick={() =>
                  setSelectedGrupos(
                    allGruposSelected ? [] : [...catalogoGrupos],
                  )
                }
                className="polaria-text-body-sm text-polaria-teal hover:underline disabled:opacity-60"
              >
                {allGruposSelected ? "Quitar todos" : "Seleccionar todos"}
              </button>
            </div>
            {catalogoGrupos.length === 0 ? (
              <p className="polaria-text-body-sm text-polaria-w-50">
                No hay grupos pertenecientes cargados para esta cuenta.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {catalogoGrupos.map((nombre) => {
                  const checked = selectedGrupos.includes(nombre);
                  return (
                    <label
                      key={nombre}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-polaria-t-20 bg-polaria-t-08 px-3 py-2 polaria-text-body-sm text-polaria-w"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isBusy}
                        onChange={() =>
                          setSelectedGrupos((prev) =>
                            toggleValue(prev, nombre),
                          )
                        }
                        className="h-4 w-4 accent-polaria-teal"
                      />
                      {nombre}
                    </label>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="polaria-text-label uppercase tracking-wide text-polaria-teal">
                Producto más vendido
              </h3>
              <button
                type="button"
                disabled={isBusy || productos.length === 0}
                onClick={() =>
                  setSelectedProductos(
                    allProductosSelected ? [] : [...productoIds],
                  )
                }
                className="polaria-text-body-sm text-polaria-teal hover:underline disabled:opacity-60"
              >
                {allProductosSelected ? "Quitar todos" : "Seleccionar todos"}
              </button>
            </div>
            {sortedProductos.length === 0 ? (
              <p className="polaria-text-body-sm text-polaria-w-50">
                No hay productos más vendidos cargados para esta cuenta.
              </p>
            ) : (
              <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
                {sortedProductos.map((producto) => {
                  const checked = selectedProductos.includes(
                    producto.idProducto,
                  );
                  return (
                    <label
                      key={producto.idProducto}
                      className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 polaria-text-body-sm text-polaria-w hover:bg-polaria-t-08"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isBusy}
                        onChange={() =>
                          setSelectedProductos((prev) =>
                            toggleValue(prev, producto.idProducto),
                          )
                        }
                        className="mt-0.5 h-4 w-4 shrink-0 accent-polaria-teal"
                      />
                      <span className="min-w-0">
                        <span className="font-medium text-polaria-teal">
                          {producto.codigo}
                        </span>
                        <span className="text-polaria-w-50"> — </span>
                        <span className="break-words">{producto.nombre}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setStep("acciones")}
              disabled={isBusy}
              className={cn(
                ACTION_BUTTON_CLASS,
                "border border-polaria-t-20 text-polaria-teal hover:bg-polaria-t-08",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              Volver
            </button>
            <button
              type="button"
              onClick={handleConfirmExport}
              disabled={
                isBusy ||
                exportDisabled ||
                selectedGrupos.length === 0 ||
                selectedProductos.length === 0 ||
                !fechaInicio ||
                !fechaFin ||
                fechaRangoInvalido
              }
              className={cn(
                ACTION_BUTTON_CLASS,
                "bg-polaria-teal text-polaria-bg hover:opacity-90",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              {isExporting ? "Exportando…" : "Descargar Excel"}
            </button>
          </div>
        </div>
      ) : null}

      {step === "imprimir" ? (
        <div className="flex flex-col gap-4">
          <section className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="polaria-text-label uppercase tracking-wide text-polaria-teal">
                Grupo perteneciente
              </h3>
              <button
                type="button"
                disabled={isBusy}
                onClick={() =>
                  setPrintGrupos(
                    allPrintGruposSelected ? [] : [...catalogoGrupos],
                  )
                }
                className="polaria-text-body-sm text-polaria-teal hover:underline disabled:opacity-60"
              >
                {allPrintGruposSelected ? "Quitar todos" : "Seleccionar todos"}
              </button>
            </div>
            {catalogoGrupos.length === 0 ? (
              <p className="polaria-text-body-sm text-polaria-w-50">
                No hay grupos pertenecientes cargados para esta cuenta.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {catalogoGrupos.map((nombre) => {
                  const checked = printGrupos.includes(nombre);
                  return (
                    <label
                      key={nombre}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-polaria-t-20 bg-polaria-t-08 px-3 py-2 polaria-text-body-sm text-polaria-w"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isBusy}
                        onChange={() =>
                          setPrintGrupos((prev) => toggleValue(prev, nombre))
                        }
                        className="h-4 w-4 accent-polaria-teal"
                      />
                      {nombre}
                    </label>
                  );
                })}
              </div>
            )}
          </section>

          <PolariaFormField
            id="precios-print-compradores"
            label="Compradores adicionales"
            compact
            hint="Opcional. Puedes elegir compradores de cualquier grupo."
          >
            <JefeBodegaModalSearchField
              id="precios-print-compradores"
              value={printCompradorFieldValue}
              placeholder="Buscar compradores…"
              ariaLabel="Compradores adicionales"
              compact
              onSearchClick={() => {
                if (!isBusy) setCompradorPickerOpen(true);
              }}
            />
          </PolariaFormField>

          {printCompradoresSeleccionados.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {printCompradoresSeleccionados.map((row) => (
                <button
                  key={row.codigo}
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    setPrintCodigosComprador((prev) =>
                      prev.filter((codigo) => codigo !== row.codigo),
                    )
                  }
                  className="rounded-lg border border-polaria-t-20 bg-polaria-t-08 px-2 py-1 polaria-text-body-sm text-polaria-w hover:opacity-90 disabled:opacity-60"
                  title="Quitar"
                >
                  {row.codigo}
                  <span className="ml-1 text-polaria-w-50">×</span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setStep("acciones")}
              disabled={isBusy}
              className={cn(
                ACTION_BUTTON_CLASS,
                "border border-polaria-t-20 text-polaria-teal hover:bg-polaria-t-08",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              Volver
            </button>
            <button
              type="button"
              onClick={handleConfirmPrint}
              disabled={
                isBusy ||
                printDisabled ||
                (printGrupos.length === 0 && printCodigosComprador.length === 0)
              }
              className={cn(
                ACTION_BUTTON_CLASS,
                "bg-polaria-teal text-polaria-bg hover:opacity-90",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              {isPrinting ? "Generando…" : "Descargar Excel"}
            </button>
          </div>
        </div>
      ) : null}

      {step === "importar-preview" ? (
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
                <thead className="sticky top-0 bg-polaria-bg">
                  <tr className="border-b border-polaria-w-08">
                    <th className="px-2 py-2 polaria-text-label uppercase tracking-wide text-polaria-teal">
                      Grupo
                    </th>
                    <th className="px-2 py-2 polaria-text-label uppercase tracking-wide text-polaria-teal">
                      Comprador
                    </th>
                    <th className="px-2 py-2 polaria-text-label uppercase tracking-wide text-polaria-teal">
                      Producto
                    </th>
                    <th className="px-2 py-2 polaria-text-label uppercase tracking-wide text-polaria-teal">
                      Equivalencia
                    </th>
                    <th className="px-2 py-2 polaria-text-label uppercase tracking-wide text-polaria-teal">
                      Actual
                    </th>
                    <th className="px-2 py-2 polaria-text-label uppercase tracking-wide text-polaria-teal">
                      Nuevo
                    </th>
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
              onClick={clearImportPreview}
              disabled={isBusy}
              className={cn(
                ACTION_BUTTON_CLASS,
                "border border-polaria-t-20 text-polaria-teal hover:bg-polaria-t-08",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              Volver
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={
                isBusy ||
                importDisabled ||
                !pendingImportFile ||
                importPreviewRows.length === 0
              }
              className={cn(
                ACTION_BUTTON_CLASS,
                "bg-polaria-teal text-polaria-bg hover:opacity-90",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <Upload className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              {isImporting ? "Importando…" : "Confirmar importación"}
            </button>
          </div>
        </div>
      ) : null}
    </PolariaFormModal>

    <CompradorTableMultiPickerModal
      open={compradorPickerOpen}
      onClose={() => setCompradorPickerOpen(false)}
      rows={sortedCompradores}
      selectedCodigos={printCodigosComprador}
      onConfirm={setPrintCodigosComprador}
    />
    </>
  );
}
