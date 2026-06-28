"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/PolariaFormModal";
import { listCompradoresAdmin } from "@/modules/admin-panel";
import { useCompany } from "@/providers/CompanyProvider";
import { CATALOGO_VENTA_EMPTY_MESSAGE } from "../constants/sales-status";
import { listProductosVentaCatalogo } from "../services/sales.service";

interface OrdenVentaCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function OrdenVentaCreateModal({
  open,
  onClose,
}: OrdenVentaCreateModalProps) {
  const { codigoCuenta } = useCompany();
  const [idComprador, setIdComprador] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [hasProductos, setHasProductos] = useState(false);
  const [compradores, setCompradores] = useState<
    { value: string; label: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setIdComprador("");
    setObservaciones("");
    setHasProductos(false);
    setCompradores([]);
    setError(null);
    setIsSaving(false);

    if (!codigoCuenta) return;

    setIsLoading(true);

    void Promise.all([
      listProductosVentaCatalogo(codigoCuenta),
      listCompradoresAdmin({ codigoCuenta }),
    ])
      .then(([productos, compradorRows]) => {
        setHasProductos(productos.length > 0);
        setCompradores(
          compradorRows.map((row) => ({
            value: row.idComprador,
            label: `${row.codigo} — ${row.comprador}`,
          })),
        );
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

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!hasProductos) {
        return;
      }

      setError(
        "La creación manual de ventas estará disponible próximamente.",
      );
    },
    [hasProductos],
  );

  return (
    <PolariaFormModal
      open={open}
      onClose={onClose}
      title="Nueva orden de venta"
      description="Venta manual de la cuenta."
      onSubmit={handleSubmit}
      error={error}
      isSubmitting={isSaving}
      submitDisabled={isLoading || !hasProductos}
      submitLabel="Crear venta"
      compact
      className="max-w-lg"
    >
      {isLoading ? (
        <p className="polaria-text-body-sm text-polaria-w-50">Cargando…</p>
      ) : null}

      {!isLoading && !hasProductos ? (
        <p className="rounded-xl border border-polaria-warning-border bg-polaria-warning-bg px-4 py-3 polaria-text-body-sm text-polaria-warning">
          {CATALOGO_VENTA_EMPTY_MESSAGE}
        </p>
      ) : null}

      {!isLoading && hasProductos ? (
        <>
          <PolariaFormSelect
            id="orden-venta-comprador"
            label="Comprador"
            value={idComprador}
            onChange={(event) => setIdComprador(event.target.value)}
            placeholder="Selecciona un comprador"
            options={compradores}
            compact
          />

          <PolariaFormInput
            id="orden-venta-observaciones"
            label="Observaciones"
            value={observaciones}
            placeholder="Notas opcionales"
            onChange={(event) => setObservaciones(event.target.value)}
            compact
          />

          <p className="polaria-text-body-sm text-polaria-w-50">
            Las líneas de producto se habilitarán cuando el catálogo tenga
            artículos listos para despacho.
          </p>
        </>
      ) : null}
    </PolariaFormModal>
  );
}
