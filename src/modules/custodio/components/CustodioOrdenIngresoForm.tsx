"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";
import {
  POLARIA_FORM_INPUT_CLASS,
  POLARIA_FORM_SELECT_CLASS_COMPACT,
} from "@/components/shared/form/PolariaFormField";
import { formatKgEs } from "@/lib/utils/decimal-es";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { listCatalogoProductosAdmin } from "@/modules/admin-panel";
import type { CatalogoProductoListRow } from "@/modules/admin-panel/catalogo/services/productos-catalogo.service";
import {
  buildNotasProductoAdicional,
  buildRecepcionLineasDraft,
  canSubmitRecepcionDraft,
  formatLineaIngresoTitulo,
  formatOrdenIngresoResumen,
  parseRecepcionLineasPayload,
  type ProductoAdicionalDraft,
  type RecepcionLineaDraft,
} from "@/modules/purchases/ingreso/utils/recepcion-compra-draft";
import { cerrarRecepcionCompraApi } from "@/modules/purchases/shared/services/purchases-api.service";
import { listOrdenCompraLineasRecepcion } from "@/modules/purchases/shared/services/purchases.service";
import type {
  OrdenCompraLineaRow,
  OrdenCompraRow,
} from "@/modules/purchases/shared/types/purchases.types";

interface CustodioOrdenIngresoFormProps {
  orden: OrdenCompraRow;
  codigoCuenta: string;
  resolveUbicacionIngreso: () => string | null;
  slotsIngresoCount: number;
  onRegistered: () => void | Promise<void>;
}

const EMPTY_ADICIONAL: ProductoAdicionalDraft = {
  idProducto: "",
  label: "",
  temperaturaInput: "",
  pesoInput: "",
};

export function CustodioOrdenIngresoForm({
  orden,
  codigoCuenta,
  resolveUbicacionIngreso,
  slotsIngresoCount,
  onRegistered,
}: CustodioOrdenIngresoFormProps) {
  const [lineas, setLineas] = useState<RecepcionLineaDraft[]>([]);
  const [productoAdicional, setProductoAdicional] =
    useState<ProductoAdicionalDraft>(EMPTY_ADICIONAL);
  const [catalogo, setCatalogo] = useState<CatalogoProductoListRow[]>([]);
  const [isLoadingLineas, setIsLoadingLineas] = useState(false);
  const [isLoadingCatalogo, setIsLoadingCatalogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingLineas(true);
    setError(null);

    const sourceLineas: Promise<OrdenCompraLineaRow[]> = orden.lineas?.length
      ? Promise.resolve(orden.lineas)
      : listOrdenCompraLineasRecepcion(orden.id_orden_compra);

    void sourceLineas
      .then((rows) => {
        if (cancelled) {
          return;
        }

        setLineas(buildRecepcionLineasDraft(rows));
        setProductoAdicional(EMPTY_ADICIONAL);
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }

        setLineas([]);
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las líneas de la orden.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingLineas(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [orden]);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingCatalogo(true);

    void listCatalogoProductosAdmin({ codigoCuenta })
      .then((rows) => {
        if (!cancelled) {
          setCatalogo(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogo([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingCatalogo(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta]);

  const canSubmit = useMemo(
    () => canSubmitRecepcionDraft(lineas, productoAdicional),
    [lineas, productoAdicional],
  );

  const updateLinea = (
    idLineaOrdenCompra: string,
    patch: Partial<RecepcionLineaDraft>,
  ) => {
    setLineas((current) =>
      current.map((linea) =>
        linea.idLineaOrdenCompra === idLineaOrdenCompra
          ? { ...linea, ...patch }
          : linea,
      ),
    );
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const lineasPayload = parseRecepcionLineasPayload(lineas);
      const notaAdicional = buildNotasProductoAdicional(productoAdicional);
      const idUbicacionIngreso = resolveUbicacionIngreso();

      if (!idUbicacionIngreso) {
        throw new DomainServiceError(
          slotsIngresoCount === 0
            ? "Esta bodega no tiene slots de ingreso configurados."
            : "No hay slots libres en la zona de ingreso.",
          "INVALID_ARGUMENT",
        );
      }

      await cerrarRecepcionCompraApi({
        idOrdenCompra: orden.id_orden_compra,
        codigoCuenta: orden.codigo_cuenta,
        idBodega: orden.id_bodega,
        lineas: lineasPayload,
        idUbicacionIngreso,
        ...(notaAdicional ? { notas: notaAdicional } : {}),
      });

      await onRegistered();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo registrar el ingreso.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3 border-t border-polaria-w-08 pt-3">
      <p className="polaria-text-caption text-polaria-w-50">
        {formatOrdenIngresoResumen(orden)}
      </p>

      {isLoadingLineas ? (
        <p className="polaria-text-caption text-polaria-w-50">
          Cargando líneas…
        </p>
      ) : lineas.length === 0 ? (
        <p className="polaria-text-caption text-polaria-w-50">
          La orden no tiene líneas para recepcionar.
        </p>
      ) : (
        <ul className="space-y-2">
          {lineas.map((linea) => (
            <li
              key={linea.idLineaOrdenCompra}
              className={cn(
                "rounded-xl border px-3 py-2.5 transition",
                linea.incluida
                  ? "border-polaria-t-20 bg-polaria-t-08"
                  : "border-polaria-w-08 bg-polaria-w-08 opacity-80",
              )}
            >
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={linea.incluida}
                  onChange={(event) =>
                    updateLinea(linea.idLineaOrdenCompra, {
                      incluida: event.target.checked,
                    })
                  }
                  disabled={isSubmitting}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-polaria-t-20 accent-polaria-teal"
                />
                <span className="min-w-0 flex-1">
                  <span className="block polaria-text-caption font-medium leading-snug text-polaria-w">
                    {formatLineaIngresoTitulo(linea)}
                  </span>
                  <span className="mt-1 block polaria-text-caption text-polaria-w-50">
                    Pedido: {formatKgEs(linea.cantidadPedida)} kg
                  </span>
                </span>
              </label>

              {linea.incluida ? (
                <div className="mt-2 grid grid-cols-1 gap-2 pl-6">
                  <label className="flex flex-col gap-1">
                    <span className="polaria-text-caption text-polaria-w-50">
                      Temperatura (°C)
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ej: -18"
                      value={linea.temperaturaInput}
                      onChange={(event) =>
                        updateLinea(linea.idLineaOrdenCompra, {
                          temperaturaInput: event.target.value,
                        })
                      }
                      disabled={isSubmitting}
                      className={POLARIA_FORM_INPUT_CLASS}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="polaria-text-caption text-polaria-w-50">
                      Peso recibido (kg)
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={linea.cantidadRecibidaInput}
                      onChange={(event) =>
                        updateLinea(linea.idLineaOrdenCompra, {
                          cantidadRecibidaInput: event.target.value,
                        })
                      }
                      disabled={isSubmitting}
                      className={POLARIA_FORM_INPUT_CLASS}
                    />
                  </label>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-xl border border-dashed border-polaria-w-08 bg-polaria-w-08/40 p-3">
        <p className="polaria-text-caption font-semibold uppercase tracking-wide text-polaria-w-50">
          Producto adicional
        </p>

        <label className="mt-2 flex flex-col gap-1">
          <span className="polaria-text-caption text-polaria-w-50">
            Producto del catálogo
          </span>
          <select
            value={productoAdicional.idProducto}
            onChange={(event) => {
              const idProducto = event.target.value;
              const producto = catalogo.find(
                (row) => row.idProducto === idProducto,
              );

              setProductoAdicional({
                idProducto,
                label: producto
                  ? `${producto.codigo} ${producto.titulo}`.trim()
                  : "",
                temperaturaInput: "",
                pesoInput: "",
              });
            }}
            disabled={isSubmitting || isLoadingCatalogo}
            className={POLARIA_FORM_SELECT_CLASS_COMPACT}
          >
            <option value="" className="polaria-form-select__option">
              {isLoadingCatalogo
                ? "Cargando catálogo…"
                : "Sin producto adicional"}
            </option>
            {catalogo.map((producto) => (
              <option
                key={producto.idProducto}
                value={producto.idProducto}
                className="polaria-form-select__option"
              >
                {producto.codigo} {producto.titulo}
              </option>
            ))}
          </select>
        </label>

        {productoAdicional.idProducto ? (
          <div className="mt-2 grid grid-cols-1 gap-2">
            <label className="flex flex-col gap-1">
              <span className="polaria-text-caption text-polaria-w-50">
                Temperatura (°C)
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ej: -18"
                value={productoAdicional.temperaturaInput}
                onChange={(event) =>
                  setProductoAdicional((current) => ({
                    ...current,
                    temperaturaInput: event.target.value,
                  }))
                }
                disabled={isSubmitting}
                className={POLARIA_FORM_INPUT_CLASS}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="polaria-text-caption text-polaria-w-50">
                Peso (kg)
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ej. 10,5"
                value={productoAdicional.pesoInput}
                onChange={(event) =>
                  setProductoAdicional((current) => ({
                    ...current,
                    pesoInput: event.target.value,
                  }))
                }
                disabled={isSubmitting}
                className={POLARIA_FORM_INPUT_CLASS}
              />
            </label>
          </div>
        ) : null}
      </section>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-3 py-2 polaria-text-caption text-polaria-danger"
        >
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={!canSubmit || isSubmitting || isLoadingLineas}
        className={cn(
          "mt-auto w-full rounded-xl px-3 py-3 font-semibold leading-snug transition",
          "disabled:cursor-not-allowed disabled:opacity-50",
          canSubmit && !isSubmitting
            ? "bg-polaria-teal text-sm font-semibold text-polaria-bg hover:opacity-90"
            : "border border-polaria-w-08 bg-polaria-w-08 polaria-text-caption text-polaria-w-50",
        )}
      >
        {isSubmitting
          ? "Registrando ingreso…"
          : "Registrar ingreso y cerrar orden."}
      </button>
    </div>
  );
}
