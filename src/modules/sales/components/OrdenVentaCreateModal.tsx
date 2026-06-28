"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/PolariaFormModal";
import { DomainServiceError } from "@/lib/domain-service-error";
import { listCompradoresAdmin } from "@/modules/admin-panel";
import { useCompany } from "@/providers/CompanyProvider";
import { useAuthStore } from "@/stores/auth.store";
import { CATALOGO_VENTA_EMPTY_MESSAGE } from "../constants/sales-status";
import {
  createOrdenVenta,
  listProductosVentaCatalogo,
} from "../services/sales.service";
import type { ProductoVentaOption } from "../types/sales.types";

interface OrdenVentaCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function OrdenVentaCreateModal({
  open,
  onClose,
  onCreated,
}: OrdenVentaCreateModalProps) {
  const { codigoCuenta } = useCompany();
  const idCreador = useAuthStore((state) => state.session?.idUsuario ?? "");
  const [idComprador, setIdComprador] = useState("");
  const [idProducto, setIdProducto] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [productos, setProductos] = useState<ProductoVentaOption[]>([]);
  const [compradores, setCompradores] = useState<
    { value: string; label: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hasProductos = productos.length > 0;

  useEffect(() => {
    if (!open) return;

    setIdComprador("");
    setIdProducto("");
    setObservaciones("");
    setProductos([]);
    setCompradores([]);
    setError(null);
    setIsSaving(false);

    if (!codigoCuenta) return;

    setIsLoading(true);

    void Promise.all([
      listProductosVentaCatalogo(codigoCuenta),
      listCompradoresAdmin({ codigoCuenta }),
    ])
      .then(([productoRows, compradorRows]) => {
        setProductos(productoRows);
        setIdProducto(productoRows[0]?.idProducto ?? "");
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

      if (!idProducto) {
        setError("Selecciona un producto del catálogo.");
        return;
      }

      setIsSaving(true);

      try {
        await createOrdenVenta({
          codigoCuenta,
          idComprador,
          idProducto,
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
      idProducto,
      observaciones,
      onClose,
      onCreated,
    ],
  );

  return (
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

          <PolariaFormSelect
            id="orden-venta-producto"
            label="Producto"
            value={idProducto}
            onChange={(event) => setIdProducto(event.target.value)}
            placeholder="Selecciona un producto"
            options={productos.map((producto) => ({
              value: producto.idProducto,
              label: producto.label,
            }))}
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
        </>
      ) : null}
    </PolariaFormModal>
  );
}
