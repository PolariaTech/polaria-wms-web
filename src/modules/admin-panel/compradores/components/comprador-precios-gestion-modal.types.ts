import type { CompradorPreciosExportFilters } from "../utils/comprador-precios-excel";
import type { CompradorPreciosPrintScope } from "../utils/comprador-precios-print";

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

export interface CompradorPreciosGestionModalProps {
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