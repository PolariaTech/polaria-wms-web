"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { parseDecimalEs } from "@/lib/utils/decimal-es";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  listBodegasInternasVinculadasAdmin,
  listCatalogoProductosAdmin,
  listProveedoresAdmin,
  type CatalogoProductoListRow,
  type ProveedorListRow,
} from "@/modules/admin-panel";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  productoLabel,
  proveedorLabel,
  todayInputValue,
  type DraftLine,
  type OrdenCompraCreateModalProps,
} from "./orden-compra-create-modal.helpers";
import { OrdenCompraCreateModalForm } from "./OrdenCompraCreateModalForm";
import { SolicitudProductoPickerModal } from "../../solicitudes/components/SolicitudProductoPickerModal";
import { SolicitudProveedorPickerModal } from "../../solicitudes/components/SolicitudProveedorPickerModal";
import { createOrdenCompraApi } from "../../shared/services/purchases-api.service";


export function OrdenCompraCreateModalContent({
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
      <OrdenCompraCreateModalForm
        open={open}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        error={error}
        isSubmitting={isSubmitting}
        fechaEntrega={fechaEntrega}
        setFechaEntrega={setFechaEntrega}
        observaciones={observaciones}
        setObservaciones={setObservaciones}
        selectedProveedorLabel={selectedProveedorLabel}
        isLoadingOptions={isLoadingOptions}
        proveedores={proveedores}
        disabled={disabled}
        setProveedorPickerOpen={setProveedorPickerOpen}
        selectedProductoLabel={selectedProductoLabel}
        productos={productos}
        setProductoPickerOpen={setProductoPickerOpen}
        pickPesoKg={pickPesoKg}
        setPickPesoKg={setPickPesoKg}
        addLine={addLine}
        lines={lines}
        removeLine={removeLine}
        anyPickerOpen={anyPickerOpen}
      />

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
