"use client";

import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  PolariaFormField,
  PolariaFormInput,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { formatKgEs, formatPrecioEs, parseDecimalEs } from "@/lib/utils/decimal-es";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { listCompradoresAdmin, type CompradorListRow } from "@/modules/admin-panel";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { useAuthStore } from "@/stores/auth.store";
import {
  CATALOGO_VENTA_EMPTY_MESSAGE,
  CATALOGO_VENTA_SIN_STOCK_MESSAGE,
} from "../../shared/constants/sales-status";
import { fetchProductosVentaCatalogo } from "../../shared/services/sales-catalog.api";
import { createOrdenVenta } from "../../shared/services/sales.service";
import type { ProductoVentaOption } from "../../shared/types/sales.types";
import { OrdenVentaCompradorPickerModal } from "./OrdenVentaCompradorPickerModal";
import { OrdenVentaProductoPickerModal } from "./OrdenVentaProductoPickerModal";

interface OrdenVentaCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type PickerKind = "comprador" | "producto" | null;

interface LineaVentaForm {
  idProducto: string;
  nombre: string;
  codigo: string;
  idBodega: string;
  cantidadKg: number;
  kgDisponible: number;
  precioUnitario: number;
}

function formatCompradorLabel(row: CompradorListRow): string {
  return `${row.codigo} — ${row.comprador}`;
}

function formatProductoLabel(row: ProductoVentaOption): string {
  return `${row.nombre} (${row.codigo})`;
}

export function OrdenVentaCreateModal({
  open,
  onClose,
  onCreated,
}: OrdenVentaCreateModalProps) {
  const { codigoCuenta } = useCompany();
  const idCreador = useAuthStore((state) => state.session?.idUsuario ?? "");
  const [idComprador, setIdComprador] = useState("");
  const [compradorLabel, setCompradorLabel] = useState("");
  const [draftProducto, setDraftProducto] = useState<ProductoVentaOption | null>(
    null,
  );
  const [draftProductoLabel, setDraftProductoLabel] = useState("");
  const [draftCantidadKg, setDraftCantidadKg] = useState("");
  const [lineas, setLineas] = useState<LineaVentaForm[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const [productos, setProductos] = useState<ProductoVentaOption[]>([]);
  const [compradores, setCompradores] = useState<CompradorListRow[]>([]);
  const [picker, setPicker] = useState<PickerKind>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hasProductos = productos.length > 0;
  const hasCompradores = compradores.length > 0;

  const productosParaAgregar = useMemo(
    () =>
      productos.filter(
        (producto) =>
          !lineas.some((linea) => linea.idProducto === producto.idProducto),
      ),
    [lineas, productos],
  );

  const puedeAgregarProducto = productosParaAgregar.length > 0;

  const totalVenta = useMemo(
    () =>
      lineas.reduce(
        (sum, linea) => sum + linea.cantidadKg * linea.precioUnitario,
        0,
      ),
    [lineas],
  );

  const kgRestanteDraft = useMemo(() => {
    if (!draftProducto) return null;
    const yaEnLineas = lineas
      .filter((linea) => linea.idProducto === draftProducto.idProducto)
      .reduce((sum, linea) => sum + linea.cantidadKg, 0);
    return Math.max(0, draftProducto.kgDisponible - yaEnLineas);
  }, [draftProducto, lineas]);

  useEffect(() => {
    if (!open) return;

    setIdComprador("");
    setCompradorLabel("");
    setDraftProducto(null);
    setDraftProductoLabel("");
    setDraftCantidadKg("");
    setLineas([]);
    setObservaciones("");
    setProductos([]);
    setCompradores([]);
    setPicker(null);
    setError(null);
    setIsSaving(false);

    if (!codigoCuenta) return;

    setIsLoading(true);

    void Promise.all([
      fetchProductosVentaCatalogo(codigoCuenta),
      listCompradoresAdmin({ codigoCuenta }),
    ])
      .then(([productoRows, compradorRows]) => {
        setProductos(productoRows);
        setCompradores(compradorRows);
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
  }, [codigoCuenta, open]);

  const handleSelectComprador = useCallback((row: CompradorListRow) => {
    setIdComprador(row.idComprador);
    setCompradorLabel(formatCompradorLabel(row));
    setError(null);
  }, []);

  const handleSelectProducto = useCallback((row: ProductoVentaOption) => {
    setDraftProducto(row);
    setDraftProductoLabel(formatProductoLabel(row));
    setDraftCantidadKg("");
    setError(null);
  }, []);

  const handleAddLinea = useCallback(() => {
    setError(null);

    if (!draftProducto) {
      setError("Selecciona un producto para agregar.");
      return;
    }

    if (lineas.some((linea) => linea.idProducto === draftProducto.idProducto)) {
      setError("Ese producto ya está en la venta.");
      return;
    }

    const cantidadKg = parseDecimalEs(draftCantidadKg);
    if (cantidadKg === null || cantidadKg <= 0) {
      setError("Ingresa una cantidad válida mayor a cero.");
      return;
    }

    const kgDisponible = kgRestanteDraft ?? draftProducto.kgDisponible;
    if (cantidadKg > kgDisponible) {
      setError(
        `No puedes vender más de ${formatKgEs(kgDisponible)} kg. Disponible en stock: ${formatKgEs(kgDisponible)} kg.`,
      );
      return;
    }

    setLineas((prev) => [
      ...prev,
      {
        idProducto: draftProducto.idProducto,
        nombre: draftProducto.nombre,
        codigo: draftProducto.codigo,
        idBodega: draftProducto.idBodega,
        cantidadKg,
        kgDisponible: draftProducto.kgDisponible,
        precioUnitario: draftProducto.precioUnitario,
      },
    ]);
    setDraftProducto(null);
    setDraftProductoLabel("");
    setDraftCantidadKg("");
  }, [draftCantidadKg, draftProducto, kgRestanteDraft, lineas]);

  const handleRemoveLinea = useCallback((index: number) => {
    setLineas((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);

      if (!codigoCuenta || !hasProductos) {
        return;
      }

      if (!idComprador) {
        setError("Selecciona un comprador.");
        return;
      }

      if (lineas.length === 0) {
        setError("Agrega al menos un producto a la venta.");
        return;
      }

      setIsSaving(true);

      try {
        await createOrdenVenta({
          codigoCuenta,
          idBodega: lineas[0]?.idBodega,
          idComprador,
          lineas: lineas.map((linea) => ({
            idProducto: linea.idProducto,
            cantidadPedida: linea.cantidadKg,
            idBodega: linea.idBodega,
          })),
          observaciones: observaciones.trim() || null,
          idCreador: idCreador || null,
        });
        onCreated();
        onClose();
      } catch (err: unknown) {
        setError(
          err instanceof DomainServiceError
            ? err.message
            : "No se pudo crear la orden de venta.",
        );
      } finally {
        setIsSaving(false);
      }
    },
    [
      codigoCuenta,
      hasProductos,
      idComprador,
      idCreador,
      lineas,
      observaciones,
      onClose,
      onCreated,
    ],
  );

  const emptyCatalogMessage = hasCompradores
    ? CATALOGO_VENTA_SIN_STOCK_MESSAGE
    : CATALOGO_VENTA_EMPTY_MESSAGE;

  return (
    <>
      <PolariaFormModal
        open={open}
        onClose={onClose}
        title="Nueva orden de venta"
        description="Venta manual de la cuenta."
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        error={error}
        isSubmitting={isSaving}
        submitDisabled={isLoading || !hasProductos || lineas.length === 0}
        submitLabel="Crear venta"
        compact
        size="md"
      >
        {isLoading ? (
          <p className="polaria-text-body-sm text-polaria-w-50">Cargando…</p>
        ) : null}

        {!isLoading && !hasProductos ? (
          <p className="rounded-xl border border-polaria-warning-border bg-polaria-warning-bg px-4 py-3 polaria-text-body-sm text-polaria-warning">
            {emptyCatalogMessage}
          </p>
        ) : null}

        {!isLoading && hasProductos ? (
          <>
            <PolariaFormField
              id="orden-venta-comprador"
              label="Comprador"
              compact
            >
              <JefeBodegaModalSearchField
                id="orden-venta-comprador"
                value={compradorLabel}
                placeholder="Selecciona un comprador"
                ariaLabel="Comprador"
                onSearchClick={() => setPicker("comprador")}
              />
            </PolariaFormField>

            <div className="rounded-xl border border-dashed border-polaria-t-20 bg-polaria-t-08 p-3">
              <p className="polaria-text-label mb-2 text-polaria-w-50">
                Productos
              </p>

              <div className="flex flex-col gap-2">
                <PolariaFormField
                  id="orden-venta-producto"
                  label="Producto"
                  compact
                >
                  <JefeBodegaModalSearchField
                    id="orden-venta-producto"
                    value={draftProductoLabel}
                    placeholder={
                      puedeAgregarProducto
                        ? "Selecciona un producto"
                        : "Todos los productos ya están en la venta"
                    }
                    ariaLabel="Producto"
                    onSearchClick={() => {
                      if (puedeAgregarProducto) {
                        setPicker("producto");
                      }
                    }}
                  />
                </PolariaFormField>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <PolariaFormInput
                      id="orden-venta-cantidad"
                      label="Cantidad (kg)"
                      type="text"
                      inputMode="decimal"
                      value={draftCantidadKg}
                      placeholder="Ej. 15,5"
                      onChange={(event) =>
                        setDraftCantidadKg(event.target.value)
                      }
                      hint={
                        draftProducto && kgRestanteDraft !== null
                          ? `Disponible: ${formatKgEs(kgRestanteDraft)} kg · Precio: $${formatPrecioEs(draftProducto.precioUnitario)}/kg`
                          : undefined
                      }
                      compact
                      disabled={!draftProducto}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddLinea}
                    disabled={!puedeAgregarProducto || !draftProducto}
                    className="inline-flex items-center justify-center gap-1 rounded-xl bg-polaria-teal px-4 py-2.5 polaria-text-body-sm font-semibold text-polaria-bg transition hover:opacity-90 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    Agregar
                  </button>
                </div>
              </div>

              {lineas.length === 0 ? (
                <p className="mt-3 text-center polaria-text-caption text-polaria-w-50">
                  Sin productos. Agrega al menos uno para crear la venta.
                </p>
              ) : (
                <div className="mt-3 overflow-hidden rounded-lg border border-polaria-w-08">
                  <table className="w-full table-fixed border-collapse text-left">
                    <colgroup>
                      <col className="w-[44%]" />
                      <col className="w-[20%]" />
                      <col className="w-[24%]" />
                      <col className="w-[12%]" />
                    </colgroup>
                    <thead className="bg-polaria-t-08">
                      <tr className="border-b border-polaria-t-20">
                        <th className="px-3 py-2 polaria-text-caption font-medium text-polaria-w-50">
                          Producto
                        </th>
                        <th className="px-3 py-2 text-right polaria-text-caption font-medium text-polaria-w-50">
                          Cantidad (kg)
                        </th>
                        <th className="px-3 py-2 text-right polaria-text-caption font-medium text-polaria-w-50">
                          Total
                        </th>
                        <th className="px-3 py-2">
                          <span className="sr-only">Quitar</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineas.map((linea, index) => (
                        <tr
                          key={`${linea.idProducto}-${index}`}
                          className="border-b border-polaria-w-08 last:border-b-0"
                        >
                          <td className="px-3 py-2 align-middle">
                            <p className="truncate polaria-text-body-sm font-medium text-polaria-w">
                              {linea.nombre}
                            </p>
                            <p className="polaria-text-caption text-polaria-w-50">
                              {linea.codigo} · ${formatPrecioEs(linea.precioUnitario)}/kg
                            </p>
                          </td>
                          <td className="px-3 py-2 align-middle text-right polaria-text-body-sm text-polaria-w">
                            {formatKgEs(linea.cantidadKg)} kg
                          </td>
                          <td className="px-3 py-2 align-middle text-right polaria-text-body-sm font-medium text-polaria-teal">
                            ${formatPrecioEs(linea.cantidadKg * linea.precioUnitario)}
                          </td>
                          <td className="px-3 py-2 align-middle text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveLinea(index)}
                              className="rounded-lg p-2 text-polaria-w-50 transition hover:bg-polaria-w-08"
                              aria-label="Quitar producto"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-end border-t border-polaria-t-20 bg-polaria-t-08 px-3 py-2">
                    <p className="polaria-text-body-sm text-polaria-w-50">
                      Total venta:{" "}
                      <span className="font-semibold text-polaria-teal">
                        ${formatPrecioEs(totalVenta)}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <PolariaFormInput
              id="orden-venta-observaciones"
              label="Observaciones"
              value={observaciones}
              placeholder="Notas opcionales"
              onChange={(event) => setObservaciones(event.target.value)}
              compact
            />
          </>
        ) : null}
      </PolariaFormModal>

      <OrdenVentaCompradorPickerModal
        open={picker === "comprador"}
        onClose={() => setPicker(null)}
        compradores={compradores}
        selectedId={idComprador}
        onSelect={handleSelectComprador}
      />

      <OrdenVentaProductoPickerModal
        open={picker === "producto"}
        onClose={() => setPicker(null)}
        productos={productosParaAgregar}
        selectedId={draftProducto?.idProducto ?? ""}
        onSelect={handleSelectProducto}
      />
    </>
  );
}
