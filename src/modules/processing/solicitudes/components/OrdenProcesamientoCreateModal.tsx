"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import {
  listBodegasInternasVinculadasAdmin,
  type BodegaInternaVinculadaRow,
} from "@/modules/admin-panel";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import { cn } from "@/lib/utils/cn";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { useAuthStore } from "@/stores/auth.store";
import {
  createSolicitudProcesamiento,
  getStockProductoBodega,
  listProductosPrimariosConSecundarioProcesamiento,
} from "../../shared/services/processing.service";
import {
  PROCESAMIENTO_RELACION_PRIMARIO_BASE,
  buildProcesamientoDesgloseEstimado,
  estimadoSecundarioAplicarPerdidaPct,
  maxCantidadProcesamientoDesdeStock,
  unidadesSecundarioPorKgPrimario,
  unidadesSecundarioPorRegla,
} from "../../shared/constants/procesamiento-conversion";
import type { ProductoProcesamientoOption } from "../../shared/types/processing.types";
import { ProcesamientoMapaPickerModal } from "./ProcesamientoMapaPickerModal";
import { ProcesamientoProductoPickerModal } from "./ProcesamientoProductoPickerModal";
import { ProcesamientoResultadoPickerModal } from "./ProcesamientoResultadoPickerModal";

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

function formatBodegaLabel(bodega: BodegaInternaVinculadaRow): string {
  return `${bodega.nombre} (${bodega.codigo})`;
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
  const [cantidadElegida, setCantidadElegida] = useState(1);
  const [primarios, setPrimarios] = useState<ProductoProcesamientoOption[]>([]);
  const [secundarioSeleccionado, setSecundarioSeleccionado] =
    useState<ProductoProcesamientoOption | null>(null);
  const [stockKg, setStockKg] = useState<number | null>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mapaPickerOpen, setMapaPickerOpen] = useState(false);
  const [insumoPickerOpen, setInsumoPickerOpen] = useState(false);
  const [resultadoPickerOpen, setResultadoPickerOpen] = useState(false);

  const primarioSeleccionado = useMemo(
    () => primarios.find((item) => item.idProducto === idPrimario) ?? null,
    [idPrimario, primarios],
  );

  const conversionValue = parsePositiveNumber(conversionUnidades);

  const maxCantidad = useMemo(
    () => maxCantidadProcesamientoDesdeStock(stockKg ?? 0),
    [stockKg],
  );

  const perdidaPctDelCatalogo = secundarioSeleccionado?.mermaPct ?? 0;

  const estimadoTeorico = useMemo(() => {
    if (!secundarioSeleccionado || !conversionValue) return null;
    return unidadesSecundarioPorRegla(
      cantidadElegida,
      PROCESAMIENTO_RELACION_PRIMARIO_BASE,
      conversionValue,
    );
  }, [cantidadElegida, conversionValue, secundarioSeleccionado]);

  const estimadoUnidades = useMemo(() => {
    return estimadoSecundarioAplicarPerdidaPct(
      estimadoTeorico,
      perdidaPctDelCatalogo,
    );
  }, [estimadoTeorico, perdidaPctDelCatalogo]);

  const desgloseEstimado = useMemo(() => {
    if (estimadoUnidades === null) return null;
    return buildProcesamientoDesgloseEstimado(
      estimadoUnidades,
      estimadoTeorico,
      cantidadElegida,
    );
  }, [cantidadElegida, estimadoTeorico, estimadoUnidades]);

  const insumoValido = Boolean(
    primarioSeleccionado && stockKg !== null && stockKg > 0,
  );

  const bodegaSeleccionada = useMemo(
    () => bodegas.find((item) => item.idBodega === idBodega) ?? null,
    [bodegas, idBodega],
  );

  const nestedPickerOpen =
    mapaPickerOpen || insumoPickerOpen || resultadoPickerOpen;
  const fieldsDisabled = isLoading || isSubmitting;

  useEffect(() => {
    if (!open) return;

    setFecha(formatTodayInputValue());
    setBodegas([]);
    setIdBodega("");
    setIdPrimario("");
    setIdSecundario("");
    setConversionUnidades("0");
    setCantidadElegida(1);
    setPrimarios([]);
    setSecundarioSeleccionado(null);
    setStockKg(null);
    setStockLoading(false);
    setStockError(null);
    setError(null);
    setIsSubmitting(false);
    setMapaPickerOpen(false);
    setInsumoPickerOpen(false);
    setResultadoPickerOpen(false);

    if (!codigoCuenta) return;

    setIsLoading(true);

    void Promise.all([
      listProductosPrimariosConSecundarioProcesamiento(codigoCuenta),
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
      setStockKg(null);
      setStockLoading(false);
      setStockError(null);
      return;
    }

    let cancelled = false;
    setStockLoading(true);
    setStockError(null);

    void getStockProductoBodega(idBodega, idPrimario, codigoCuenta)
      .then((stock) => {
        if (!cancelled) setStockKg(stock);
      })
      .catch(() => {
        if (!cancelled) {
          setStockKg(null);
          setStockError("No se pudo consultar el stock del mapa.");
        }
      })
      .finally(() => {
        if (!cancelled) setStockLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, idBodega, idPrimario, open]);

  const handleMapaSelect = useCallback((bodega: BodegaInternaVinculadaRow) => {
    setIdBodega(bodega.idBodega);
    setIdPrimario("");
    setIdSecundario("");
    setSecundarioSeleccionado(null);
    setCantidadElegida(1);
    setStockKg(null);
    setStockError(null);
  }, []);

  const handleInsumoSelect = useCallback((producto: ProductoProcesamientoOption) => {
    setIdPrimario(producto.idProducto);
    setIdSecundario("");
    setSecundarioSeleccionado(null);
    setCantidadElegida(1);
  }, []);

  const handleResultadoSelect = useCallback((producto: ProductoProcesamientoOption) => {
    setIdSecundario(producto.idProducto);
    setSecundarioSeleccionado(producto);
  }, []);

  useEffect(() => {
    if (!open || !idPrimario) return;
    setCantidadElegida((prev) => {
      if (maxCantidad <= 0) return 1;
      return Math.min(Math.max(1, Math.round(prev)), maxCantidad);
    });
  }, [idPrimario, maxCantidad, open, idSecundario]);

  useEffect(() => {
    if (!secundarioSeleccionado) {
      setConversionUnidades("0");
      return;
    }

    const perKg = unidadesSecundarioPorKgPrimario(
      secundarioSeleccionado.reglaConversionCantidadPrimario ??
        PROCESAMIENTO_RELACION_PRIMARIO_BASE,
      secundarioSeleccionado.reglaConversionUnidadesSecundario,
    );
    setConversionUnidades(perKg !== null ? String(perKg) : "0");
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
        setError(
          "Indicá cuántas unidades de secundario obtenés con 1 kg de primario.",
        );
        return;
      }

      const cantidadValue = Math.round(cantidadElegida);
      if (!Number.isFinite(cantidadValue) || cantidadValue <= 0) {
        setError("Elegí una cantidad válida en primario.");
        return;
      }

      if (cantidadValue > maxCantidad) {
        setError("La cantidad supera el stock disponible en bodega para este primario.");
        return;
      }

      const estTeo = unidadesSecundarioPorRegla(
        cantidadValue,
        PROCESAMIENTO_RELACION_PRIMARIO_BASE,
        conversionValue,
      );
      if (estTeo === null) {
        setError("No se pudo calcular el estimado del secundario. Revisá la conversión.");
        return;
      }

      const est = estimadoSecundarioAplicarPerdidaPct(
        estTeo,
        perdidaPctDelCatalogo,
      );
      if (est === null) {
        setError("No se pudo aplicar la pérdida al estimado. Revisá los valores.");
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
          reglaConversionCantidadPrimario: PROCESAMIENTO_RELACION_PRIMARIO_BASE,
          reglaConversionUnidadesSecundario: conversionValue,
          estimadoUnidadesSecundario: est,
          perdidaProcesamientoPct: perdidaPctDelCatalogo,
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
      cantidadElegida,
      codigoCuenta,
      conversionValue,
      idBodega,
      idPrimario,
      idSecundario,
      idSolicitante,
      insumoValido,
      maxCantidad,
      onClose,
      onCreated,
      perdidaPctDelCatalogo,
    ],
  );

  const cantidadLista =
    insumoValido && maxCantidad > 0 && !stockLoading && !stockError;

  const estimadoListo = desgloseEstimado !== null;

  return (
    <>
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
        hideHeaderClose
        closeOnEscape={!nestedPickerOpen}
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

        <div className="flex flex-col gap-2">
          <span className="polaria-text-label text-polaria-w-50">Mapa</span>
          <JefeBodegaModalSearchField
            id="orden-procesamiento-mapa"
            value={bodegaSeleccionada ? formatBodegaLabel(bodegaSeleccionada) : ""}
            placeholder={
              isLoading ? "Cargando bodegas…" : "Seleccionar bodega interna"
            }
            ariaLabel="Mapa"
            onSearchClick={
              fieldsDisabled || bodegas.length === 0
                ? undefined
                : () => setMapaPickerOpen(true)
            }
          />
        </div>

        {bodegas.length === 0 && !isLoading ? (
          <p className="rounded-lg border border-polaria-warning-border bg-polaria-warning-bg px-3 py-2 polaria-text-body-sm text-polaria-warning">
            No hay bodegas internas vinculadas a la cuenta.
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          <span className="polaria-text-label text-polaria-w-50">Insumo</span>
          <JefeBodegaModalSearchField
            id="orden-procesamiento-insumo"
            value={primarioSeleccionado?.label ?? ""}
            placeholder={
              isLoading
                ? "Cargando insumos…"
                : !idBodega
                  ? "Selecciona un mapa primero"
                  : primarios.length === 0
                    ? "Sin productos con primario y secundario"
                    : "Seleccionar insumo primario"
            }
            ariaLabel="Insumo"
            onSearchClick={
              fieldsDisabled || !idBodega || primarios.length === 0
                ? undefined
                : () => setInsumoPickerOpen(true)
            }
          />
          {idPrimario ? (
            <p className="polaria-text-caption text-polaria-w-50">
              {stockLoading
                ? "Consultando stock del mapa…"
                : stockError
                  ? stockError
                  : insumoValido
                    ? `Stock: ${Math.floor(stockKg ?? 0).toLocaleString("es-CL")} kg`
                    : "Sin stock de almacenamiento en el mapa seleccionado."}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <span className="polaria-text-label text-polaria-w-50">Resultado</span>
          <JefeBodegaModalSearchField
            id="orden-procesamiento-resultado"
            value={secundarioSeleccionado?.label ?? ""}
            placeholder={
              !idPrimario
                ? "Elegí insumo primero"
                : "Seleccionar resultado secundario"
            }
            ariaLabel="Resultado"
            onSearchClick={
              fieldsDisabled || !idPrimario
                ? undefined
                : () => setResultadoPickerOpen(true)
            }
          />
        </div>

        <ProcesamientoFieldBox label="Conversión">
          <div className="flex flex-wrap items-center gap-2 polaria-text-body-sm text-polaria-w">
            <span>1 kg →</span>
            <input
              type="text"
              inputMode="decimal"
              value={conversionUnidades}
              onChange={(event) => setConversionUnidades(event.target.value)}
              disabled={isSubmitting || !idSecundario}
              placeholder="0"
              aria-label="Unidades de secundario por 1 kg de primario"
              className="w-20 rounded-lg border border-polaria-w-08 bg-polaria-bg px-2 py-1.5 text-center text-polaria-w outline-none focus:border-polaria-t-20 disabled:opacity-60"
            />
            <span className="text-polaria-w-50">ud.</span>
          </div>
        </ProcesamientoFieldBox>

        <ProcesamientoFieldBox label="Cantidad a procesar (kg)">
          {!idBodega ? (
            <p className="polaria-text-body-sm text-polaria-warning">Sin bodega interna.</p>
          ) : stockLoading ? (
            <p className="polaria-text-body-sm text-polaria-w-50">Cargando…</p>
          ) : maxCantidad <= 0 ? (
            <p className="polaria-text-body-sm text-polaria-warning">Sin stock mapa.</p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="polaria-text-caption text-polaria-w-50">
                  Máx.{" "}
                  <span className="font-medium text-polaria-w">
                    {maxCantidad.toLocaleString("es-CL")} kg
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={maxCantidad}
                  step={1}
                  value={Math.min(Math.round(cantidadElegida), maxCantidad)}
                  onChange={(event) => {
                    setCantidadElegida(Math.round(Number(event.target.value)));
                  }}
                  disabled={isSubmitting || !cantidadLista}
                  className="min-w-0 flex-1 accent-polaria-teal"
                  aria-label="Cantidad a procesar en kilogramos"
                />
                <span className="w-16 shrink-0 text-right polaria-text-body-sm font-semibold tabular-nums text-polaria-w">
                  {Math.round(cantidadElegida).toLocaleString("es-CL")}
                </span>
              </div>
            </div>
          )}
        </ProcesamientoFieldBox>

        <ProcesamientoFieldBox label="Estimado">
          {estimadoListo && desgloseEstimado ? (
            <ul className="flex flex-col gap-2.5 polaria-text-body-sm text-polaria-w">
              <li>
                <span className="polaria-text-caption text-polaria-w-50">Ud. netas</span>
                <p className="font-semibold tabular-nums">
                  {desgloseEstimado.uInt.toLocaleString("es-CL")} ud.
                </p>
              </li>
              <li>
                <span className="polaria-text-caption text-polaria-w-50">Sobrante</span>
                <p className="font-semibold tabular-nums">
                  {desgloseEstimado.sobranteKg.toLocaleString("es-CL", {
                    maximumFractionDigits: 3,
                  })}{" "}
                  kg
                </p>
              </li>
              <li>
                <span className="polaria-text-caption text-polaria-w-50">Merma</span>
                {desgloseEstimado.mermaUnidades !== null &&
                desgloseEstimado.mermaKg !== null ? (
                  <p className="font-semibold tabular-nums">
                    ≈{" "}
                    {desgloseEstimado.mermaUnidades.toLocaleString("es-CL", {
                      maximumFractionDigits: 4,
                    })}{" "}
                    u. · ≈{" "}
                    {desgloseEstimado.mermaKg.toLocaleString("es-CL", {
                      maximumFractionDigits: 3,
                    })}{" "}
                    kg
                    {perdidaPctDelCatalogo > 0 ? (
                      <span className="ml-1 polaria-text-caption font-normal text-polaria-w-50">
                        ({Math.round(perdidaPctDelCatalogo).toLocaleString("es-CL")}% cat.)
                      </span>
                    ) : null}
                  </p>
                ) : (
                  <p className="text-polaria-w-50">—</p>
                )}
              </li>
            </ul>
          ) : (
            <p className="polaria-text-body-sm text-polaria-warning">Indicá conversión.</p>
          )}
        </ProcesamientoFieldBox>
      </PolariaFormModal>

      {typeof document !== "undefined"
        ? createPortal(
            <>
              <ProcesamientoMapaPickerModal
                open={mapaPickerOpen}
                onClose={() => setMapaPickerOpen(false)}
                bodegas={bodegas}
                selectedId={idBodega || null}
                onSelect={handleMapaSelect}
              />
              <ProcesamientoProductoPickerModal
                open={insumoPickerOpen}
                onClose={() => setInsumoPickerOpen(false)}
                title="Seleccionar insumo"
                description="Solo productos primarios con al menos un secundario vinculado."
                productos={primarios}
                isLoading={isLoading}
                selectedId={idPrimario || null}
                emptyMessage="No hay productos con primario y secundario en el catálogo."
                onSelect={handleInsumoSelect}
              />
              <ProcesamientoResultadoPickerModal
                open={resultadoPickerOpen}
                onClose={() => setResultadoPickerOpen(false)}
                codigoCuenta={codigoCuenta}
                idProductoPrimario={idPrimario || null}
                primarioLabel={primarioSeleccionado?.label}
                selectedId={idSecundario || null}
                onSelect={handleResultadoSelect}
              />
            </>,
            document.body,
          )
        : null}
    </>
  );
}
