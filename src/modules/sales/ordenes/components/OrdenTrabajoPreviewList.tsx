"use client";

import { formatKgEs } from "@/lib/utils/decimal-es";
import type { OrdenTrabajoHija } from "../utils/origen-correo-ordenes-trabajo";

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="polaria-text-label text-polaria-w-20">{label}</p>
      <p className="mt-1 break-words polaria-text-body-sm font-medium text-polaria-w">
        {value.trim() || "—"}
      </p>
    </div>
  );
}

export function OrdenTrabajoPreviewList({
  clienteLabel,
  hijas,
  page,
}: {
  clienteLabel: string;
  hijas: OrdenTrabajoHija[];
  /** Página controlada desde el pie del modal. */
  page: number;
}) {
  if (hijas.length === 0) {
    return (
      <p className="polaria-text-body-sm text-polaria-w-50">
        No se detectaron órdenes de trabajo en el pedido.
      </p>
    );
  }

  const total = hijas.length;
  const safePage = Math.min(Math.max(0, page), total - 1);
  const hija = hijas[safePage]!;

  return (
    <div className="flex flex-col gap-4">
      <p className="polaria-text-body-sm text-polaria-w-50">
        Se detectaron{" "}
        <span className="font-semibold text-polaria-teal">
          {total} orden{total === 1 ? "" : "es"} de trabajo
        </span>{" "}
        dentro de esta venta. Revisa cada una y continúa para confirmar el
        formulario.
      </p>

      <section className="overflow-hidden rounded-xl border border-polaria-t-20 bg-polaria-t-08">
        <div className="border-b border-polaria-w-08 px-4 py-3">
          <p className="polaria-text-label uppercase tracking-wide text-polaria-teal">
            Orden de trabajo {safePage + 1}/{total}
          </p>
          <h3 className="mt-1 polaria-text-card-title text-polaria-w">
            {hija.label}
          </h3>
          <p className="mt-0.5 polaria-text-caption text-polaria-w-50">
            {clienteLabel || "Cliente"}
          </p>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <p className="mb-2 polaria-text-label uppercase tracking-wide text-polaria-teal">
              Datos del pedido
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Meta label="Cliente" value={clienteLabel} />
              <Meta
                label="Orden de compra del hotel"
                value={hija.numeroPedido}
              />
              <Meta
                label="Centro de consumo / cocina"
                value={hija.almacen}
              />
              <Meta label="Fecha de entrega" value={hija.fecha} />
              <Meta label="Referencia" value={hija.referenciaPedido} />
              <Meta
                label="Responsable externo"
                value={hija.responsableExterno}
              />
            </div>
          </div>

          <div>
            <p className="mb-2 polaria-text-label uppercase tracking-wide text-polaria-teal">
              Productos
            </p>
            <div className="overflow-hidden rounded-lg border border-polaria-t-20">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-polaria-t-20 bg-polaria-w-08 text-left">
                    <th className="px-3 py-2 polaria-text-label text-polaria-w-50">
                      Producto
                    </th>
                    <th className="px-3 py-2 text-right polaria-text-label text-polaria-w-50">
                      Cantidad
                    </th>
                    <th className="px-3 py-2 text-right polaria-text-label text-polaria-w-50">
                      Precio
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {hija.renglones.map((row, i) => {
                    const qty =
                      typeof row.Cantidad === "number"
                        ? row.Cantidad
                        : Number(String(row.Cantidad ?? "").replace(",", ".")) ||
                          0;
                    const unidad = (row.Unidad || "kg").toLowerCase();
                    const precioRaw = row.Precio;
                    const precio =
                      typeof precioRaw === "number"
                        ? precioRaw
                        : Number(
                            String(precioRaw ?? "")
                              .replace(/[^\d.,-]/g, "")
                              .replace(",", "."),
                          );
                    return (
                      <tr
                        key={`${hija.id}-${i}`}
                        className="border-b border-polaria-w-08 last:border-0"
                      >
                        <td className="px-3 py-2.5">
                          <p className="font-medium polaria-text-body-sm text-polaria-w">
                            {row.Producto || "—"}
                          </p>
                          {row["Codigo producto"] ? (
                            <p className="polaria-text-caption text-polaria-w-50">
                              Cód. {row["Codigo producto"]}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5 text-right polaria-text-body-sm text-polaria-w">
                          {formatKgEs(qty)} {unidad}
                        </td>
                        <td className="px-3 py-2.5 text-right polaria-text-body-sm text-polaria-w">
                          {Number.isFinite(precio) && precio > 0
                            ? `$${formatKgEs(precio)}`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="border-t border-polaria-t-20 bg-polaria-w-08 px-3 py-2 polaria-text-caption text-polaria-w-50">
                {hija.renglones.length === 1
                  ? "1 producto"
                  : `${hija.renglones.length} productos`}{" "}
                · {formatKgEs(hija.totalCantidad)} kg
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
