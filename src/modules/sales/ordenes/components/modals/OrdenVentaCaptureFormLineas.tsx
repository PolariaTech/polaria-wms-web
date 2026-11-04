"use client";

import { AlertTriangle, CheckCircle2, Plus, Replace, Trash2, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import {
  POLARIA_FORM_INPUT_CLASS_COMPACT,
  POLARIA_FORM_SELECT_CLASS_COMPACT,
} from "@/components/shared/form/PolariaFormField";
import { formatPrecioEs, parseDecimalEs } from "@/lib/utils/decimal-es";
import { textoConteoProductos } from "./detalle-venta-presentacion";
import { cn } from "@/lib/utils/cn";
import { UNIDAD_MEDIDA_VENTA_DEFAULT } from "../../../shared/types/sales.types";
import { IVA_PCT_OPTIONS } from "../../types/orden-venta-create-modal.types";
import type { LineaVentaForm } from "../../types/orden-venta-create-modal.types";
import {
  collectSugerenciasLinea,
  fieldControlClass,
  formatProductoNombreConSku,
  lineAmounts,
} from "../../utils/pedido/orden-venta-create-helpers";
import { CaptureSection } from "./CaptureSection";
import { CatalogStatusHint } from "./catalog-status-hint";
import {
  CeldaCantidad,
  CeldaEspecificacion,
  CeldaProducto,
} from "./OrdenVentaCaptureFormEntrega";

export type LineaConIndice = { linea: LineaVentaForm; index: number };

type LineaHandlers = {
  onOpenReplace: (index: number) => void;
  onEspecificacion: (index: number, value: string) => void;
  onIva: (index: number, value: string) => void;
  onCantidadChange: (index: number, value: string) => void;
  onCantidadBlur: (index: number, value: string) => void;
  onPrecioChange: (index: number, value: string) => void;
  onPrecioBlur: (index: number, value: string) => void;
  onRemove: (index: number) => void;
};

export function OrdenVentaCaptureFormLineas(props: {
  lineas: LineaConIndice[];
  subtotal: number;
  iva: number;
  total: number;
  totalOv: number;
  mostrarTotalOv: boolean;
  otCount: number;
  puedeAgregar: boolean;
  onAgregar: () => void;
} & LineaHandlers) {
  return (
    <div data-ov-revision="productos">
      <CaptureSection
        title="Productos"
        footer={<Totales {...props} cantidadProductos={props.lineas.length} />}
      >
        <div className="overflow-x-hidden">
          <table className="w-full table-fixed border-collapse text-left">
            <Colgroup />
            <thead>
              <tr className="border-b border-polaria-t-20">
                <Th>Producto <span className="font-bold text-polaria-danger">*</span></Th>
                <Th>Especificación</Th>
                <Th>Cantidad <span className="font-bold text-polaria-danger">*</span></Th>
                <Th>Unidad</Th>
                <Th>Precio <span className="font-bold text-polaria-danger">*</span></Th>
                <Th>IVA</Th>
                <Th>Importe</Th>
                <th className="px-0 pb-2 pr-1"><span className="sr-only">Quitar</span></th>
              </tr>
            </thead>
            <tbody>
              {props.lineas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-1 py-4 text-center polaria-text-caption text-polaria-w-50">
                    Sin productos. Agrega al menos uno para crear la venta.
                  </td>
                </tr>
              ) : (
                props.lineas.map((row) => <LineaFila key={`ov-linea-${row.index}`} row={row} handlers={props} />)
              )}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={props.onAgregar}
          disabled={!props.puedeAgregar}
          className={cn(
            "mt-3 inline-flex items-center gap-1 rounded-xl border border-polaria-teal px-4 py-2",
            "polaria-text-body-sm font-semibold text-polaria-teal transition hover:bg-polaria-t-08",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Agregar producto
        </button>
      </CaptureSection>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="px-1 pb-2 text-left polaria-text-caption font-medium text-polaria-w-50">
      {children}
    </th>
  );
}

function Colgroup() {
  const widths = ["6.25rem", "4.25rem", "4.75rem", "4.75rem", "5rem", "5.5rem", "2.25rem"];
  return (
    <colgroup>
      <col />
      {widths.map((width, index) => (
        <col key={`${width}-${index}`} style={{ width }} />
      ))}
    </colgroup>
  );
}

function Totales(props: {
  subtotal: number;
  iva: number;
  total: number;
  totalOv: number;
  mostrarTotalOv: boolean;
  otCount: number;
  cantidadProductos: number;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-polaria-t-20 bg-polaria-w-08 px-4 py-3">
      {/* REQ-224: conteo de productos a la izquierda, sin unidad. */}
      <p className="polaria-text-caption text-polaria-w-50">
        {textoConteoProductos(props.cantidadProductos)}
      </p>
      <table className="text-right">
        <tbody>
          <tr>
            <td className="pr-8 polaria-text-body-sm text-polaria-w-50">Subtotal</td>
            <td className="font-mono polaria-text-body-sm text-polaria-w">${formatPrecioEs(props.subtotal)}</td>
          </tr>
          <tr>
            <td className="pr-8 polaria-text-body-sm text-polaria-w-50">IVA</td>
            <td className="font-mono polaria-text-body-sm text-polaria-w">${formatPrecioEs(props.iva)}</td>
          </tr>
          <tr>
            <td className="pt-2 pr-8 polaria-text-body-sm font-semibold text-polaria-w">
              {props.mostrarTotalOv ? "Total OT" : "Total"}
            </td>
            <td className="pt-2 font-mono polaria-text-body-sm font-semibold text-polaria-teal">
              ${formatPrecioEs(props.total)}
            </td>
          </tr>
          {props.mostrarTotalOv ? (
            <tr>
              <td className="pt-1 pr-8 polaria-text-body-sm font-semibold text-polaria-w">
                Total OV ({props.otCount} OT)
              </td>
              <td className="pt-1 font-mono polaria-text-body-sm font-semibold text-polaria-teal">
                ${formatPrecioEs(props.totalOv)}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function LineaFila({ row, handlers }: { row: LineaConIndice; handlers: LineaHandlers }) {
  const { linea, index } = row;
  const { importe } = lineAmounts(linea);
  return (
    <tr key={`ov-linea-${index}`} className="border-b border-polaria-w-08 last:border-b-0">
      <td className="px-1 py-2 align-middle">
        <CeldaProducto linea={linea} index={index} onOpenReplace={handlers.onOpenReplace} />
      </td>
      <td className="h-px px-1 py-2"><CeldaEspecificacion linea={linea} index={index} onChange={handlers.onEspecificacion} /></td>
      <td className="h-px px-1 py-2"><CeldaCantidad linea={linea} index={index} onChange={handlers.onCantidadChange} onBlur={handlers.onCantidadBlur} /></td>
      <td className="h-px px-1 py-2"><CeldaUnidad linea={linea} /></td>
      <td className="h-px px-1 py-2"><CeldaPrecio linea={linea} index={index} onChange={handlers.onPrecioChange} onBlur={handlers.onPrecioBlur} /></td>
      <td className="h-px px-1 py-2"><CeldaIva linea={linea} index={index} onChange={handlers.onIva} /></td>
      <td className="h-px px-1 py-2">
        <div className="flex h-full min-h-full items-center font-mono polaria-text-body-sm text-polaria-teal">
          ${formatPrecioEs(importe)}
        </div>
      </td>
      <td className="h-px px-0 py-2 pr-1">
        <div className="flex h-full min-h-full items-center justify-center">
          <button
            type="button"
            onClick={() => handlers.onRemove(index)}
            className="rounded-lg p-1.5 text-polaria-w-50 transition hover:bg-polaria-w-08 hover:text-polaria-danger"
            aria-label={`Quitar ${linea.aliasCliente || linea.nombre}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </td>
    </tr>
  );
}

function CeldaUnidad({ linea }: { linea: LineaVentaForm }) {
  return (
    <div className="flex h-full min-h-full items-stretch">
      <input
        aria-label={`Unidad de ${linea.nombre}`}
        value={linea.unidadMedida || UNIDAD_MEDIDA_VENTA_DEFAULT}
        disabled
        tabIndex={-1}
        className={cn(POLARIA_FORM_INPUT_CLASS_COMPACT, "h-full min-h-full px-1.5 text-center")}
      />
    </div>
  );
}

function CeldaPrecio({
  linea,
  index,
  onChange,
  onBlur,
}: {
  linea: LineaVentaForm;
  index: number;
  onChange: (index: number, value: string) => void;
  onBlur: (index: number, value: string) => void;
}) {
  return (
    <div className="flex h-full min-h-full items-stretch">
      <input
        data-ov-revision={`precio-${index}`}
        aria-label={`Precio de ${linea.nombre}`}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={linea.precioInput}
        placeholder=""
        onChange={(event) => onChange(index, event.target.value)}
        onBlur={(event) => onBlur(index, event.target.value)}
        className={cn(
          POLARIA_FORM_INPUT_CLASS_COMPACT,
          "h-full min-h-full px-2 tabular-nums",
          fieldControlClass({
            missing:
              Boolean(linea.precioInput.trim()) &&
              (parseDecimalEs(linea.precioInput) ?? -1) < 0,
          }),
        )}
      />
    </div>
  );
}

function CeldaIva({
  linea,
  index,
  onChange,
}: {
  linea: LineaVentaForm;
  index: number;
  onChange: (index: number, value: string) => void;
}) {
  return (
    <div className="flex h-full min-h-full items-stretch">
      <select
        aria-label={`IVA de ${linea.nombre}`}
        value={linea.ivaPct}
        onChange={(event) => onChange(index, event.target.value)}
        className={cn(POLARIA_FORM_SELECT_CLASS_COMPACT, "h-full min-h-full")}
      >
        {IVA_PCT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
