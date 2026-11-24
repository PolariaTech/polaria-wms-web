"use client";

import {
  POLARIA_FORM_INPUT_CLASS,
  POLARIA_FORM_SELECT_CLASS_COMPACT,
} from "@/components/shared/form/PolariaFormField";
import type { CatalogoProductoListRow } from "@/modules/admin-panel/catalogo/services/productos-catalogo.service";
import type { ProductoAdicionalDraft } from "@/modules/purchases/ingreso/utils/recepcion-compra-draft";

interface CustodioOrdenIngresoProductoAdicionalProps {
  productoAdicional: ProductoAdicionalDraft;
  setProductoAdicional: (
    update:
      | ProductoAdicionalDraft
      | ((current: ProductoAdicionalDraft) => ProductoAdicionalDraft),
  ) => void;
  catalogo: CatalogoProductoListRow[];
  isSubmitting: boolean;
  isLoadingCatalogo: boolean;
}

export function CustodioOrdenIngresoProductoAdicional({
  productoAdicional,
  setProductoAdicional,
  catalogo,
  isSubmitting,
  isLoadingCatalogo,
}: CustodioOrdenIngresoProductoAdicionalProps) {
  return (
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
  );
}
