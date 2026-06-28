"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/PolariaFormModal";
import { DomainServiceError } from "@/lib/domain-service-error";
import {
  listCatalogoProductosAdmin,
  listProveedoresAdmin,
} from "@/modules/admin-panel";
import { useCompany } from "@/providers/CompanyProvider";
import { createSolicitudCompraApi } from "../services/purchases-api.service";

interface SolicitudCompraCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface LineaForm {
  idProducto: string;
  cantidad: string;
}

interface Option {
  value: string;
  label: string;
}

const INITIAL_LINEA: LineaForm = {
  idProducto: "",
  cantidad: "",
};

export function SolicitudCompraCreateModal({
  open,
  onClose,
  onCreated,
}: SolicitudCompraCreateModalProps) {
  const { codigoCuenta, activeBodegaId } = useCompany();
  const [idProveedor, setIdProveedor] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [lineas, setLineas] = useState<LineaForm[]>([{ ...INITIAL_LINEA }]);
  const [proveedores, setProveedores] = useState<Option[]>([]);
  const [productos, setProductos] = useState<Option[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  useEffect(() => {
    if (!open) return;

    setIdProveedor("");
    setObservaciones("");
    setLineas([{ ...INITIAL_LINEA }]);
    setError(null);
    setIsSubmitting(false);

    if (!codigoCuenta) return;

    setIsLoadingOptions(true);

    void Promise.all([
      listProveedoresAdmin({ codigoCuenta }),
      listCatalogoProductosAdmin({ codigoCuenta }),
    ])
      .then(([proveedorRows, productoRows]) => {
        setProveedores(
          proveedorRows.map((row) => ({
            value: row.idProveedor,
            label: `${row.codigo} — ${row.proveedor}`,
          })),
        );
        setProductos(
          productoRows.map((row) => ({
            value: row.idProducto,
            label: `${row.codigo} — ${row.titulo}`,
          })),
        );
      })
      .catch(() => {
        setError("No se pudieron cargar proveedores o productos.");
      })
      .finally(() => {
        setIsLoadingOptions(false);
      });
  }, [codigoCuenta, open]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!codigoCuenta) {
      setError("No se encontró la cuenta activa.");
      return;
    }

    if (!activeBodegaId) {
      setError("Selecciona una bodega activa.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createSolicitudCompraApi({
        idProveedor,
        idBodega: activeBodegaId,
        observaciones,
        lineas: lineas.map((linea) => ({
          idProducto: linea.idProducto,
          cantidad: Number(linea.cantidad),
        })),
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo crear la solicitud de compra.",
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
      title="Crear solicitud de compra"
      description="Define proveedor, bodega activa y líneas de producto."
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Crear solicitud"
      compact
      className="max-w-3xl"
    >
      <PolariaFormSelect
        id="solicitud-proveedor"
        label="Proveedor"
        value={idProveedor}
        onChange={(event) => setIdProveedor(event.target.value)}
        disabled={disabled}
        placeholder="Selecciona un proveedor"
        options={proveedores}
        compact
      />

      <PolariaFormInput
        id="solicitud-bodega"
        label="Bodega activa"
        value={activeBodegaId ?? ""}
        readOnly
        disabled
        compact
      />

      <PolariaFormInput
        id="solicitud-observaciones"
        label="Observaciones"
        value={observaciones}
        placeholder="Notas opcionales"
        onChange={(event) => setObservaciones(event.target.value)}
        disabled={disabled}
        compact
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="polaria-text-label text-polaria-w-50">Líneas</span>
          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              setLineas((current) => [...current, { ...INITIAL_LINEA }])
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-polaria-t-20 px-3 py-1.5 text-sm text-polaria-teal transition hover:bg-polaria-t-08 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Agregar línea
          </button>
        </div>

        {lineas.map((linea, index) => (
          <div
            key={`linea-${index}`}
            className="grid grid-cols-1 gap-3 rounded-xl border border-polaria-w-08 p-3 md:grid-cols-[1fr_140px_auto]"
          >
            <PolariaFormSelect
              id={`solicitud-producto-${index}`}
              label={`Producto ${index + 1}`}
              value={linea.idProducto}
              onChange={(event) =>
                setLineas((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, idProducto: event.target.value }
                      : item,
                  ),
                )
              }
              disabled={disabled}
              placeholder="Selecciona producto"
              options={productos}
              compact
            />

            <PolariaFormInput
              id={`solicitud-cantidad-${index}`}
              label="Cantidad"
              type="number"
              min="0"
              step="0.01"
              value={linea.cantidad}
              onChange={(event) =>
                setLineas((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, cantidad: event.target.value }
                      : item,
                  ),
                )
              }
              disabled={disabled}
              compact
            />

            <div className="flex items-end">
              <button
                type="button"
                disabled={disabled || lineas.length === 1}
                onClick={() =>
                  setLineas((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
                className="inline-flex h-10 items-center justify-center rounded-lg border border-polaria-w-08 px-3 text-polaria-w-50 transition hover:bg-polaria-w-08 disabled:opacity-40"
                aria-label={`Eliminar línea ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        ))}
      </div>
    </PolariaFormModal>
  );
}
