"use client";

import { AlertTriangle, CheckCircle2, Replace, XCircle } from "lucide-react";
import { PolariaFormSelect } from "@/components/shared/form/PolariaFormField";
import {
  PRESENTACION_OPTIONS,
  SI_NO_OPTIONS,
  SUSTITUCIONES_OPTIONS,
} from "../../types/orden-venta-create-modal.types";
import type { LineaVentaForm } from "../../types/orden-venta-create-modal.types";
import { POLARIA_FORM_INPUT_CLASS_COMPACT } from "@/components/shared/form/PolariaFormField";
import { cn } from "@/lib/utils/cn";
import { CatalogStatusHint } from "./catalog-status-hint";
import { fieldControlClass } from "../../utils/pedido/orden-venta-create-helpers";

export function OrdenVentaCaptureFormCliente({
  idComprador,
  compradorLabel,
  compradorNombreIa,
  haySugerencias,
  missingFields,
  onElegirCliente,
}: {
  idComprador: string;
  compradorLabel: string;
  compradorNombreIa: string | null;
  haySugerencias: boolean;
  missingFields: Set<string>;
  onElegirCliente: () => void;
}) {
  const solicitado = compradorNombreIa?.trim() ?? "";
  return (
    <>
      {idComprador && !haySugerencias ? (
        <ClienteCoincide
          compradorLabel={compradorLabel}
          missingFields={missingFields}
          idComprador={idComprador}
          onElegirCliente={onElegirCliente}
        />
      ) : !idComprador && (Boolean(solicitado) || haySugerencias) ? (
        <ClienteSinMatch
          compradorLabel={compradorLabel}
          compradorNombreIa={solicitado}
          onElegirCliente={onElegirCliente}
        />
      ) : (
        <ClienteFalta
          compradorLabel={compradorLabel}
          onElegirCliente={onElegirCliente}
        />
      )}
      {solicitado ? (
        <p
          className="mt-1.5 truncate text-[11px] leading-snug text-polaria-teal/80"
          title={solicitado}
        >
          Solicitado: <span className="text-polaria-w-50">{solicitado}</span>
        </p>
      ) : null}
    </>
  );
}

function ClienteCoincide({
  compradorLabel,
  missingFields,
  idComprador,
  onElegirCliente,
}: {
  compradorLabel: string;
  missingFields: Set<string>;
  idComprador: string;
  onElegirCliente: () => void;
}) {
  return (
    <div className="relative flex items-stretch">
      <input
        id="orden-venta-cliente"
        type="text"
        value={compradorLabel}
        title={compradorLabel || undefined}
        readOnly
        aria-label="Cliente: razón social"
        className={cn(
          POLARIA_FORM_INPUT_CLASS_COMPACT,
          "w-full truncate pr-[6.75rem]",
          "border-polaria-teal bg-polaria-t-08 ring-1 ring-polaria-teal/50",
          "shadow-[0_0_22px_var(--teal-glow-strong)]",
          fieldControlClass({
            field: "cliente",
            missingFields,
            missing: !idComprador,
          }),
        )}
      />
      <span className="absolute right-1 top-1/2 inline-flex -translate-y-1/2 items-center gap-1">
        <CatalogStatusHint
          label="Cliente: razón social coincide con el catálogo"
          tone="teal"
          size="md"
        >
          <CheckCircle2 className="h-4 w-4" strokeWidth={2} aria-hidden />
        </CatalogStatusHint>
        <button
          type="button"
          onClick={onElegirCliente}
          title="Cambiar cliente"
          aria-label="Cambiar cliente"
          className="inline-flex items-center gap-1 rounded-lg border border-polaria-t-20 bg-polaria-t-08 px-2 py-1 polaria-text-caption font-medium text-polaria-teal transition hover:bg-polaria-t-20"
        >
          <Replace className="h-3 w-3" aria-hidden />
          Cambiar
        </button>
      </span>
    </div>
  );
}

function ClienteSinMatch({
  compradorLabel,
  compradorNombreIa,
  onElegirCliente,
}: {
  compradorLabel: string;
  compradorNombreIa: string;
  onElegirCliente: () => void;
}) {
  const visible =
    (compradorLabel && compradorLabel !== "—" ? compradorLabel : "") ||
    compradorNombreIa ||
    "";
  return (
    <div className="relative flex items-stretch">
      <input
        id="orden-venta-cliente"
        type="text"
        value={visible}
        title={visible || undefined}
        readOnly
        aria-label="Cliente: razón social"
        className={cn(
          POLARIA_FORM_INPUT_CLASS_COMPACT,
          "w-full truncate pr-[7.5rem]",
          "!border-polaria-warning-border !bg-polaria-warning-bg",
        )}
      />
      <span className="absolute right-1 top-1/2 inline-flex -translate-y-1/2 items-center gap-1">
        <CatalogStatusHint
          label="Cliente: razón social sin coincidencia exacta en el catálogo"
          tone="warning"
          size="md"
        >
          <AlertTriangle className="h-4 w-4" strokeWidth={2} aria-hidden />
        </CatalogStatusHint>
        <button
          type="button"
          onClick={onElegirCliente}
          title="Elegir cliente"
          aria-label="Elegir cliente"
          className="inline-flex items-center gap-1 rounded-lg border border-polaria-warning-border bg-polaria-warning-bg px-2 py-1 polaria-text-caption font-semibold text-polaria-warning transition hover:opacity-90"
        >
          Elegir
        </button>
      </span>
    </div>
  );
}

function ClienteFalta({
  compradorLabel,
  onElegirCliente,
}: {
  compradorLabel: string;
  onElegirCliente: () => void;
}) {
  return (
    <div className="relative flex items-stretch">
      <input
        id="orden-venta-cliente"
        type="text"
        value={compradorLabel}
        title={compradorLabel || undefined}
        readOnly
        placeholder="Selecciona un cliente"
        aria-label="Cliente: razón social"
        className={cn(
          POLARIA_FORM_INPUT_CLASS_COMPACT,
          "w-full truncate pr-[7.5rem]",
          "!border-polaria-danger-border !bg-polaria-danger-bg",
        )}
      />
      <span className="absolute right-1 top-1/2 inline-flex -translate-y-1/2 items-center gap-1">
        <CatalogStatusHint
          label="Falta seleccionar cliente: razón social"
          tone="danger"
          size="md"
        >
          <XCircle className="h-4 w-4" strokeWidth={2} aria-hidden />
        </CatalogStatusHint>
        <button
          type="button"
          onClick={onElegirCliente}
          title="Elegir cliente"
          aria-label="Elegir cliente"
          className="inline-flex items-center gap-1 rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-2 py-1 polaria-text-caption font-semibold text-polaria-danger transition hover:opacity-90"
        >
          Elegir
        </button>
      </span>
    </div>
  );
}

export function OrdenVentaCaptureFormOcultos({
  lineas,
  onCajas,
  onPresentacion,
  aceptaSustituciones,
  onSustituciones,
  requiereLote,
  onRequiereLote,
  registrarTemperatura,
  onRegistrarTemperatura,
}: {
  lineas: LineaVentaForm[];
  onCajas: (index: number, value: string) => void;
  onPresentacion: (index: number, value: string) => void;
  aceptaSustituciones: string;
  onSustituciones: (value: string) => void;
  requiereLote: string;
  onRequiereLote: (value: string) => void;
  registrarTemperatura: string;
  onRegistrarTemperatura: (value: string) => void;
}) {
  return (
    <div className="hidden" aria-hidden>
      {lineas.map((linea, index) => (
        <div key={`hidden-pack-${linea.idProducto}-${index}`}>
          <input
            aria-label={`Cajas de ${linea.nombre}`}
            tabIndex={-1}
            value={linea.cajasInput}
            onChange={(event) => onCajas(index, event.target.value)}
          />
          <select
            aria-label={`Presentación de ${linea.nombre}`}
            tabIndex={-1}
            value={linea.presentacion}
            onChange={(event) => onPresentacion(index, event.target.value)}
          >
            {PRESENTACION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      <PolariaFormSelect
        id="orden-venta-sustituciones"
        label="¿Acepta sustituciones?"
        value={aceptaSustituciones}
        onChange={(event) => onSustituciones(event.target.value)}
        options={SUSTITUCIONES_OPTIONS}
        compact
      />
      <PolariaFormSelect
        id="orden-venta-lote"
        label="Requiere lote / trazabilidad"
        value={requiereLote}
        onChange={(event) => onRequiereLote(event.target.value)}
        options={SI_NO_OPTIONS}
        compact
      />
      <PolariaFormSelect
        id="orden-venta-temp"
        label="Registrar temperatura al entregar"
        value={registrarTemperatura}
        onChange={(event) => onRegistrarTemperatura(event.target.value)}
        options={SI_NO_OPTIONS}
        compact
      />
    </div>
  );
}
