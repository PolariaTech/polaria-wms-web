"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  PolariaFormField,
  PolariaFormInput,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { formatKgEs, parseDecimalEs } from "@/lib/utils/decimal-es";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  listBodegasInternasVinculadasAdmin,
  listCatalogoProductosAdmin,
  listProveedoresAdmin,
  type CatalogoProductoListRow,
  type ProveedorListRow,
} from "@/modules/admin-panel";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { SolicitudProductoPickerModal } from "../../solicitudes/components/SolicitudProductoPickerModal";
import { SolicitudProveedorPickerModal } from "../../solicitudes/components/SolicitudProveedorPickerModal";
import { createOrdenCompraApi } from "../../shared/services/purchases-api.service";

interface OrdenCompraCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface DraftLine {
  idProducto: string;
  pesoKg: number;
  titleSnapshot: string;
  skuSnapshot?: string;
}

function todayInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function proveedorLabel(row: ProveedorListRow): string {
  return row.nombre && row.nombre !== row.proveedor
    ? `${row.proveedor} — ${row.nombre}`
    : row.proveedor;
}

function productoLabel(row: CatalogoProductoListRow): string {
  return row.sku && row.sku !== "—"
    ? `${row.titulo} · SKU ${row.sku}`
    : row.titulo;
}

export function OrdenCompraCreateModal({
  open,
  onClose,
  onCreated,
}: OrdenCompraCreateModalProps) {
  const { codigoCuenta, activeBodegaId } = useCompany();
  const [fechaEntrega, setFechaEntrega] = useState(todayInputValue());
  const [idProveedor, setIdProveedor] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [pickProductId, setPickProductId] = useState("");
  const [pickPesoKg, setPickPesoKg] = useState("");
  const [productos, setProductos] = useState<CatalogoProductoListRow[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorListRow[]>([]);
  const [proveedorPickerOpen, setProveedorPickerOpen] = useState(false);
  const [productoPickerOpen, setProductoPickerOpen] = useState(false);
  const [resolvedBodegaId, setResolvedBodegaId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const selectedProveedorLabel = useMemo(() => {
    if (!idProveedor) return "";
    const selected = proveedores.find((row) => row.idProveedor === idProveedor);
    return selected ? proveedorLabel(selected) : "";
  }, [idProveedor, proveedores]);

  const selectedProductoLabel = useMemo(() => {
    if (!pickProductId) return "";
    const selected = productos.find((row) => row.idProducto === pickProductId);
    return selected ? productoLabel(selected) : "";
  }, [pickProductId, productos]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFechaEntrega(todayInputValue());
    setIdProveedor("");
    setObservaciones("");
    setLines([]);
    setPickProductId("");
    setPickPesoKg("");
    setProveedorPickerOpen(false);
    setProductoPickerOpen(false);
    setError(null);
    setIsSubmitting(false);
    setResolvedBodegaId(activeBodegaId);

    if (!codigoCuenta) {
      return;
    }

    setIsLoadingOptions(true);

    void Promise.all([
      listCatalogoProductosAdmin({ codigoCuenta }),
      listProveedoresAdmin({ codigoCuenta }),
      activeBodegaId
        ? Promise.resolve(null)
        : listBodegasInternasVinculadasAdmin({ codigoCuenta }),
    ])
      .then(([productoRows, proveedorRows, bodegaRows]) => {
        setProductos(productoRows);
        setProveedores(proveedorRows);

        if (!activeBodegaId && bodegaRows?.length) {
          setResolvedBodegaId(bodegaRows[0]?.idBodega ?? null);
        }
      })
      .catch(() => {
        setError("No se pudieron cargar productos o proveedores.");
      })
      .finally(() => {
        setIsLoadingOptions(false);
      });
  }, [activeBodegaId, codigoCuenta, open]);

  const handleClose = useCallback(() => {
    if (isSubmitting) {
      return;
    }
    onClose();
  }, [isSubmitting, onClose]);

  const addLine = () => {
    setError(null);

    const producto = productos.find((item) => item.idProducto === pickProductId);
    if (!producto) {
      setError("Selecciona un producto del catálogo.");
      return;
    }

    const pesoNum = parseDecimalEs(pickPesoKg);
    if (pesoNum == null || pesoNum <= 0) {
      setError("Ingresa un peso en kg mayor a 0 (podés usar coma: 15,6).");
      return;
    }

    const sku =
      producto.sku && producto.sku !== "—" ? producto.sku : undefined;

    setLines((current) => [
      ...current,
      {
        idProducto: producto.idProducto,
        pesoKg: pesoNum,
        titleSnapshot: producto.titulo || producto.sku || "Producto",
        ...(sku ? { skuSnapshot: sku } : {}),
      },
    ]);
    setPickProductId("");
    setPickPesoKg("");
  };

  const removeLine = (index: number) => {
    setLines((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!codigoCuenta) {
      setError("No se encontró la cuenta activa.");
      return;
    }

    if (!resolvedBodegaId) {
      setError("No hay bodega interna disponible para registrar la orden.");
      return;
    }

    if (!idProveedor) {
      setError("Selecciona un proveedor para la orden.");
      return;
    }

    if (lines.length === 0) {
      setError("Agrega al menos una línea con productos del catálogo.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createOrdenCompraApi({
        codigoCuenta,
        idBodega: resolvedBodegaId,
        idProveedor,
        fechaEntregaEstimada: fechaEntrega || null,
        observaciones: observaciones.trim() || null,
        lineas: lines.map((linea) => ({
          idProducto: linea.idProducto,
          cantidad: linea.pesoKg,
        })),
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo guardar la orden de compra.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled = isSubmitting || isLoadingOptions;
  const anyPickerOpen = proveedorPickerOpen || productoPickerOpen;

  return (
    <>
      <PolariaFormModal
        open={open}
        onClose={handleClose}
        sectionLabel="Nueva orden"
        title="Nueva orden de compra"
        description="Orden manual · proveedor · productos"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        error={error}
        isSubmitting={isSubmitting}
        submitLabel="Guardar orden"
        compact
        size="md"
        closeOnEscape={!anyPickerOpen}
      >
        <PolariaFormField id="oc-proveedor" label="Proveedor" compact>
          <JefeBodegaModalSearchField
            id="oc-proveedor"
            value={selectedProveedorLabel}
            placeholder={
              isLoadingOptions
                ? "Cargando proveedores…"
                : proveedores.length === 0
                  ? "Sin proveedores"
                  : "Elegí proveedor…"
            }
            ariaLabel="Proveedor"
            onSearchClick={
              disabled || proveedores.length === 0
                ? undefined
                : () => setProveedorPickerOpen(true)
            }
          />
        </PolariaFormField>

        <PolariaFormInput
          id="oc-fecha"
          label="Fecha"
          type="date"
          value={fechaEntrega}
          onChange={(event) => setFechaEntrega(event.target.value)}
          disabled={disabled}
          compact
        />

        <PolariaFormInput
          id="oc-observaciones"
          label="Observación"
          value={observaciones}
          onChange={(event) => setObservaciones(event.target.value)}
          placeholder="Opcional"
          disabled={disabled}
          compact
          hint="Opcional."
        />

        {proveedores.length === 0 && !isLoadingOptions ? (
          <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50">
            Registrá proveedores en administración antes de crear órdenes.
          </p>
        ) : null}

        {productos.length === 0 && !isLoadingOptions ? (
          <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50">
            Tu administrador de cuenta debe registrar productos en el catálogo.
          </p>
        ) : null}

        <div className="rounded-xl border border-dashed border-polaria-t-20 bg-polaria-t-08 p-3">
          <p className="polaria-text-label mb-2 text-polaria-w-50">Productos</p>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-0 flex-1 sm:min-w-[200px]">
              <PolariaFormField id="oc-catalogo" label="Producto" compact>
                <JefeBodegaModalSearchField
                  id="oc-catalogo"
                  value={selectedProductoLabel}
                  placeholder={
                    isLoadingOptions
                      ? "Cargando productos…"
                      : productos.length === 0
                        ? "Sin productos"
                        : "Elegí producto…"
                  }
                  ariaLabel="Producto"
                  onSearchClick={
                    disabled || productos.length === 0
                      ? undefined
                      : () => setProductoPickerOpen(true)
                  }
                />
              </PolariaFormField>
            </div>

            <div className="w-full sm:w-32">
              <PolariaFormInput
                id="oc-peso-kg"
                label="Peso (kg)"
                type="text"
                inputMode="decimal"
                value={pickPesoKg}
                onChange={(event) => setPickPesoKg(event.target.value)}
                placeholder="Ej. 15,6"
                disabled={disabled || productos.length === 0}
                compact
              />
            </div>

            <button
              type="button"
              onClick={addLine}
              disabled={disabled || productos.length === 0}
              className="inline-flex items-center justify-center gap-1 rounded-xl bg-polaria-teal px-4 py-2.5 polaria-text-body-sm font-semibold text-polaria-bg transition hover:opacity-90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Agregar
            </button>
          </div>

          {lines.length === 0 ? (
            <p className="mt-3 text-center polaria-text-caption text-polaria-w-50">
              Sin líneas.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {lines.map((linea, index) => (
                <li
                  key={`${linea.idProducto}-${index}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-polaria-w-08 bg-polaria-bg px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-polaria-w">
                      {linea.titleSnapshot}
                    </p>
                    <p className="polaria-text-caption text-polaria-w-50">
                      {linea.skuSnapshot ? `SKU ${linea.skuSnapshot} · ` : null}
                      {formatKgEs(linea.pesoKg)} kg
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    className="shrink-0 rounded-lg p-2 text-polaria-w-50 transition hover:bg-polaria-w-08"
                    aria-label="Quitar línea"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PolariaFormModal>

      <SolicitudProveedorPickerModal
        open={proveedorPickerOpen}
        onClose={() => setProveedorPickerOpen(false)}
        proveedores={proveedores}
        selectedId={idProveedor || null}
        onSelect={(proveedor) => {
          setIdProveedor(proveedor.idProveedor);
          setError(null);
        }}
      />

      <SolicitudProductoPickerModal
        open={productoPickerOpen}
        onClose={() => setProductoPickerOpen(false)}
        productos={productos}
        selectedId={pickProductId || null}
        onSelect={(producto) => {
          setPickProductId(producto.idProducto);
          setError(null);
        }}
      />
    </>
  );
}
