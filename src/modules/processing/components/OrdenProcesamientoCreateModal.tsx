"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Minus } from "lucide-react";
import { PolariaFormModal } from "@/components/shared/PolariaFormModal";
import { PolariaFormSelect } from "@/components/shared/PolariaFormField";
import {
  listBodegasInternasVinculadasAdmin,
  type BodegaInternaVinculadaRow,
} from "@/modules/admin-panel";
import { cn } from "@/lib/cn";
import { useCompany } from "@/providers/CompanyProvider";
import { useAuthStore } from "@/stores/auth.store";
import {
  createSolicitudProcesamiento,
  getStockProductoBodega,
  listProductosPrimariosProcesamiento,
  listProductosSecundariosProcesamiento,
} from "../services/processing.service";
import type { ProductoProcesamientoOption } from "../types/processing.types";

interface OrdenProcesamientoCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function formatTodayInputValue(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

function parsePositiveNumber(value: string): number | null {
  const parsed = Number(value.replace(",", "."));
  if (Number.isNaN(parsed) || parsed <= 0) return null;
  return parsed;
}

function ProcesamientoFieldBox({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="polaria-text-label text-polaria-w-50">{label}</span>
      <div className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3">
        {children}
      </div>
    </div>
  );
}

export function OrdenProcesamientoCreateModal({
  open,
  onClose,
  onCreated,
}: OrdenProcesamientoCreateModalProps) {
  const { codigoCuenta, activeBodegaId } = useCompany();
  const idSolicitante = useAuthStore((state) => state.session?.idUsuario ?? "");

  const [fecha, setFecha] = useState(formatTodayInputValue());
  const [bodegas, setBodegas] = useState<BodegaInternaVinculadaRow[]>([]);
  const [idBodega, setIdBodega] = useState("");
  const [idPrimario, setIdPrimario] = useState("");
  const [idSecundario, setIdSecundario] = useState("");
  const [conversionUnidades, setConversionUnidades] = useState("0");
  const [cantidadKg, setCantidadKg] = useState("");
  const [primarios, setPrimarios] = useState<ProductoProcesamientoOption[]>([]);
  const [secundarios, setSecundarios] = useState<ProductoProcesamientoOption[]>([]);
  const [stockKg, setStockKg] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const primarioSeleccionado = useMemo(
    () => primarios.find((item) => item.idProducto === idPrimario) ?? null,
    [idPrimario, primarios],
  );

  const secundarioSeleccionado = useMemo(
    () => secundarios.find((item) => item.idProducto === idSecundario) ?? null,
    [idSecundario, secundarios],
  );

  const conversionValue = parsePositiveNumber(conversionUnidades);
  const cantidadValue = parsePositiveNumber(cantidadKg);
  const basePrimario =
    secundarioSeleccionado?.reglaConversionCantidadPrimario ??
    primarioSeleccionado?.reglaConversionCantidadPrimario ??
    1;

  const estimadoUnidades = useMemo(() => {
    if (!conversionValue || !cantidadValue) return null;
    return (cantidadValue / basePrimario) * conversionValue;
  }, [basePrimario, cantidadValue, conversionValue]);

  const insumoValido = Boolean(
    primarioSeleccionado && stockKg !== null && stockKg > 0,
  );

  const bodegaSeleccionada = useMemo(
    () => bodegas.find((item) => item.idBodega === idBodega) ?? null,
    [bodegas, idBodega],
  );

  useEffect(() => {
    if (!open) return;

    setFecha(formatTodayInputValue());
    setBodegas([]);
    setIdBodega("");
    setIdPrimario("");
    setIdSecundario("");
    setConversionUnidades("0");
    setCantidadKg("");
    setSecundarios([]);
    setStockKg(null);
    setError(null);
    setIsSubmitting(false);

    if (!codigoCuenta) return;

    setIsLoading(true);

    void Promise.all([
      listProductosPrimariosProcesamiento(codigoCuenta),
      listBodegasInternasVinculadasAdmin({ codigoCuenta }),
    ])
      .then(([primarioRows, bodegaRows]) => {
        setPrimarios(primarioRows);
        setBodegas(bodegaRows);

        const preferred =
          (activeBodegaId &&
            bodegaRows.find((row) => row.idBodega === activeBodegaId)?.idBodega) ||
          bodegaRows[0]?.idBodega ||
          "";
        setIdBodega(preferred);
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los datos del formulario.",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [activeBodegaId, codigoCuenta, open]);

  useEffect(() => {
    if (!open || !codigoCuenta || !idPrimario || !idBodega) {
      setSecundarios([]);
      setIdSecundario("");
      setStockKg(null);
      return;
    }

    void Promise.all([
      listProductosSecundariosProcesamiento(codigoCuenta, idPrimario),
      getStockProductoBodega(idBodega, idPrimario, codigoCuenta),
    ])
      .then(([secundarioRows, stock]) => {
        setSecundarios(secundarioRows);
        setIdSecundario("");
        setStockKg(stock);
      })
      .catch(() => {
        setSecundarios([]);
        setStockKg(null);
      });
  }, [codigoCuenta, idBodega, idPrimario, open]);

  useEffect(() => {
    if (!open) return;
    setIdPrimario("");
    setIdSecundario("");
    setSecundarios([]);
    setStockKg(null);
  }, [idBodega, open]);

  useEffect(() => {
    if (!secundarioSeleccionado) {
      setConversionUnidades("0");
      return;
    }

    const defaultConversion =
      secundarioSeleccionado.reglaConversionUnidadesSecundario ?? 0;
    setConversionUnidades(String(defaultConversion));
  }, [secundarioSeleccionado]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!codigoCuenta || !idBodega) {
        setError("Selecciona una bodega interna (mapa) válida.");
        return;
      }

      if (!idSolicitante) {
        setError("No se encontró el usuario solicitante.");
        return;
      }

      if (!insumoValido || !idSecundario) {
        setError("Completa insumo y resultado válidos.");
        return;
      }

      if (!conversionValue) {
        setError("Indica una conversión válida.");
        return;
      }

      if (!cantidadValue) {
        setError("Indica la cantidad a procesar.");
        return;
      }

      if (estimadoUnidades === null) {
        setError("No se pudo calcular el estimado.");
        return;
      }

      setError(null);
      setIsSubmitting(true);

      try {
        await createSolicitudProcesamiento({
          codigoCuenta,
          idBodega,
          idSolicitante,
          idProductoPrimario: idPrimario,
          idProductoSecundario: idSecundario,
          kilosPrimario: cantidadValue,
          reglaConversionCantidadPrimario: basePrimario,
          reglaConversionUnidadesSecundario: conversionValue,
          estimadoUnidadesSecundario: estimadoUnidades,
        });
        onCreated();
        onClose();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo registrar la orden de procesamiento.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      basePrimario,
      cantidadValue,
      codigoCuenta,
      conversionValue,
      estimadoUnidades,
      idBodega,
      idPrimario,
      idSecundario,
      idSolicitante,
      insumoValido,
      onClose,
      onCreated,
    ],
  );

  const cantidadHint =
    stockKg === null
      ? "Sin stock mapa."
      : stockKg <= 0
        ? "Sin stock mapa."
        : null;

  const estimadoHint =
    estimadoUnidades === null ? "Indicá conversión." : null;

  return (
    <PolariaFormModal
      open={open}
      onClose={onClose}
      title="Nueva orden de procesamiento"
      description="INSUMO → RESULTADO"
      onSubmit={handleSubmit}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Confirmar y enviar a bodega"
      compact
      size="lg"
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor="orden-procesamiento-fecha"
          className="polaria-text-label text-polaria-w-50"
        >
          Fecha
        </label>
        <input
          id="orden-procesamiento-fecha"
          type="date"
          value={fecha}
          onChange={(event) => setFecha(event.target.value)}
          disabled={isSubmitting}
          className="w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 text-polaria-w outline-none transition focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <p className="polaria-text-body-sm text-polaria-w-50">
          {formatDisplayDate(fecha)}
        </p>
      </div>

      <p className="polaria-text-body-sm text-polaria-w-50">
        Mapa:{" "}
        <span className="font-semibold text-polaria-w">
          {bodegaSeleccionada?.nombre ?? "—"}
        </span>
      </p>

      {bodegas.length > 1 ? (
        <PolariaFormSelect
          id="orden-procesamiento-mapa"
          label="Mapa"
          value={idBodega}
          onChange={(event) => setIdBodega(event.target.value)}
          disabled={isLoading || isSubmitting}
          placeholder="Selecciona bodega interna"
          options={bodegas.map((bodega) => ({
            value: bodega.idBodega,
            label: bodega.nombre,
          }))}
          compact
        />
      ) : null}

      {bodegas.length === 0 && !isLoading ? (
        <p className="rounded-lg border border-polaria-warning-border bg-polaria-warning-bg px-3 py-2 polaria-text-body-sm text-polaria-warning">
          No hay bodegas internas vinculadas a la cuenta.
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <span className="polaria-text-label text-polaria-w-50">Insumo</span>
        <PolariaFormSelect
          id="orden-procesamiento-insumo"
          label=""
          value={idPrimario}
          onChange={(event) => setIdPrimario(event.target.value)}
          disabled={isLoading || isSubmitting || primarios.length === 0 || !idBodega}
          placeholder="Selecciona insumo primario"
          options={primarios.map((item) => ({
            value: item.idProducto,
            label: item.label,
          }))}
          fieldClassName="gap-0"
          compact
        />
        <div
          className={cn(
            "rounded-xl border px-4 py-3 polaria-text-body-sm",
            insumoValido
              ? "border-polaria-t-20 bg-polaria-t-08 text-polaria-w"
              : "border-polaria-warning-border bg-polaria-warning-bg text-polaria-warning",
          )}
        >
          {insumoValido
            ? primarioSeleccionado?.label
            : "Sin primario válido."}
        </div>
      </div>

      <PolariaFormSelect
        id="orden-procesamiento-resultado"
        label="Resultado"
        value={idSecundario}
        onChange={(event) => setIdSecundario(event.target.value)}
        disabled={
          isLoading || isSubmitting || !idPrimario || secundarios.length === 0
        }
        placeholder={idPrimario ? "Selecciona resultado" : "Elegí primario."}
        options={secundarios.map((item) => ({
          value: item.idProducto,
          label: item.label,
        }))}
        compact
      />

      <ProcesamientoFieldBox label="Conversión">
        <div className="flex flex-wrap items-center gap-2 polaria-text-body-sm text-polaria-w">
          <span>1 ud. →</span>
          <input
            type="number"
            min="0"
            step="any"
            value={conversionUnidades}
            onChange={(event) => setConversionUnidades(event.target.value)}
            disabled={isSubmitting || !idSecundario}
            className="w-20 rounded-lg border border-polaria-w-08 bg-polaria-bg px-2 py-1.5 text-center text-polaria-w outline-none focus:border-polaria-t-20 disabled:opacity-60"
          />
          <Minus className="h-4 w-4 text-polaria-w-50" aria-hidden />
        </div>
      </ProcesamientoFieldBox>

      <ProcesamientoFieldBox label="Cantidad a procesar">
        {cantidadHint ? (
          <p className="polaria-text-body-sm text-polaria-danger">{cantidadHint}</p>
        ) : (
          <div className="flex flex-col gap-2">
            <input
              type="number"
              min="0"
              step="any"
              value={cantidadKg}
              onChange={(event) => setCantidadKg(event.target.value)}
              disabled={isSubmitting || !insumoValido}
              placeholder="Kg a procesar"
              className="w-full rounded-lg border border-polaria-w-08 bg-polaria-bg px-3 py-2 text-polaria-w outline-none focus:border-polaria-t-20 disabled:opacity-60"
            />
            {stockKg !== null && stockKg > 0 ? (
              <p className="polaria-text-caption text-polaria-w-50">
                Stock mapa: {stockKg.toLocaleString("es-CL")} kg
              </p>
            ) : null}
          </div>
        )}
      </ProcesamientoFieldBox>

      <ProcesamientoFieldBox label="Estimado">
        {estimadoHint ? (
          <p className="polaria-text-body-sm text-polaria-danger">{estimadoHint}</p>
        ) : (
          <p className="polaria-text-body-sm font-semibold text-polaria-w">
            {estimadoUnidades?.toLocaleString("es-CL", {
              maximumFractionDigits: 4,
            })}{" "}
            ud.
          </p>
        )}
      </ProcesamientoFieldBox>
    </PolariaFormModal>
  );
}
