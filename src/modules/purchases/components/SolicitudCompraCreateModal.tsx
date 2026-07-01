"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/PolariaFormModal";
import { formatKgEs, parseDecimalEs } from "@/lib/decimal-es";
import { DomainServiceError } from "@/lib/domain-service-error";
import {
  listBodegasInternasVinculadasAdmin,
  listCatalogoProductosAdmin,
} from "@/modules/admin-panel";
import { useCompany } from "@/providers/CompanyProvider";
import { createSolicitudCompraApi } from "../services/purchases-api.service";

interface SolicitudCompraCreateModalProps {
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

interface ProductoOption {
  value: string;
  label: string;
  sku?: string;
}

export function SolicitudCompraCreateModal({
  open,
  onClose,
  onCreated,
}: SolicitudCompraCreateModalProps) {
  const { codigoCuenta, activeBodegaId } = useCompany();
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [pickProductId, setPickProductId] = useState("");
  const [pickPesoKg, setPickPesoKg] = useState("");
  const [productos, setProductos] = useState<ProductoOption[]>([]);
  const [resolvedBodegaId, setResolvedBodegaId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setLines([]);
    setPickProductId("");
    setPickPesoKg("");
    setError(null);
    setIsSubmitting(false);
    setResolvedBodegaId(activeBodegaId);

    if (!codigoCuenta) {
      return;
    }

    setIsLoadingOptions(true);

    void Promise.all([
      listCatalogoProductosAdmin({ codigoCuenta }),
      activeBodegaId
        ? Promise.resolve(null)
        : listBodegasInternasVinculadasAdmin({ codigoCuenta }),
    ])
      .then(([productoRows, bodegaRows]) => {
        setProductos(
          productoRows.map((row) => ({
            value: row.idProducto,
            label: row.sku ? `${row.titulo} · SKU ${row.sku}` : row.titulo,
            sku: row.sku !== "—" ? row.sku : undefined,
          })),
        );

        if (!activeBodegaId && bodegaRows?.length) {
          setResolvedBodegaId(bodegaRows[0]?.idBodega ?? null);
        }
      })
      .catch(() => {
        setError("No se pudieron cargar los productos del catálogo.");
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

    const producto = productos.find((item) => item.value === pickProductId);
    if (!producto?.value) {
      setError("Selecciona un producto del catálogo.");
      return;
    }

    const pesoNum = parseDecimalEs(pickPesoKg);
    if (pesoNum == null || pesoNum <= 0) {
      setError("Ingresa un peso en kg mayor a 0 (podés usar coma: 15,6).");
      return;
    }

    const [titleSnapshot] = producto.label.split(" · SKU ");

    setLines((current) => [
      ...current,
      {
        idProducto: producto.value,
        pesoKg: pesoNum,
        titleSnapshot: titleSnapshot || producto.label,
        ...(producto.sku ? { skuSnapshot: producto.sku } : {}),
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
      setError("No hay bodega interna disponible para registrar la solicitud.");
      return;
    }

    if (lines.length === 0) {
      setError("Agrega al menos una línea con productos del catálogo.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createSolicitudCompraApi({
        codigoCuenta,
        idBodega: resolvedBodegaId,
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
          : "No se pudo guardar la solicitud.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled = isSubmitting || isLoadingOptions;

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Nueva solicitud"
      title="Nueva solicitud"
      description="Solicitud · peso/kg"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Guardar solicitud"
      compact
      size="md"
    >
      <p className="polaria-text-body-sm text-polaria-w-50">
        Peso kg por ítem.
      </p>

      {productos.length === 0 && !isLoadingOptions ? (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50">
          Tu administrador de cuenta debe registrar productos en el catálogo
          para poder armar solicitudes.
        </p>
      ) : null}

      <div className="rounded-xl border border-dashed border-polaria-t-20 bg-polaria-t-08 p-3">
        <p className="polaria-text-label mb-2 text-polaria-w-50">Líneas cat.</p>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-0 flex-1 sm:min-w-[200px]">
            <PolariaFormSelect
              id="sol-catalogo"
              label="Producto"
              value={pickProductId}
              onChange={(event) => setPickProductId(event.target.value)}
              disabled={disabled || productos.length === 0}
              placeholder="Elegí producto…"
              options={productos}
              compact
            />
          </div>

          <div className="w-full sm:w-32">
            <PolariaFormInput
              id="sol-peso-kg"
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
  );
}
