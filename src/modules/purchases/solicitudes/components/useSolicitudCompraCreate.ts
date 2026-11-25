"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
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
import { createSolicitudCompraApi } from "../../shared/services/purchases-api.service";
import {
  buildSolicitudCompraN8nBody,
  notifySolicitudCompraN8n,
} from "../services/solicitud-compra-n8n-client.service";
import {
  productoLabel,
  proveedorLabel,
  type DraftLine,
} from "./solicitud-compra-create.helpers";

export interface UseSolicitudCompraCreateParams {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function useSolicitudCompraCreate({
  open,
  onClose,
  onCreated,
}: UseSolicitudCompraCreateParams) {
  const { codigoCuenta, activeBodegaId } = useCompany();
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [pickProductId, setPickProductId] = useState("");
  const [pickPesoKg, setPickPesoKg] = useState("");
  const [idProveedor, setIdProveedor] = useState("");
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

    setLines([]);
    setPickProductId("");
    setPickPesoKg("");
    setIdProveedor("");
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
      setError("No hay bodega interna disponible para registrar la solicitud.");
      return;
    }

    if (lines.length === 0) {
      setError("Agrega al menos una línea con productos del catálogo.");
      return;
    }

    if (!idProveedor) {
      setError("Selecciona un proveedor para la solicitud.");
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await createSolicitudCompraApi({
        codigoCuenta,
        idBodega: resolvedBodegaId,
        idProveedor,
        lineas: lines.map((linea) => ({
          idProducto: linea.idProducto,
          cantidad: linea.pesoKg,
        })),
      });

      const proveedor =
        proveedores.find((row) => row.idProveedor === created.idProveedor) ??
        proveedores.find((row) => row.idProveedor === idProveedor);

      if (proveedor?.telefono) {
        try {
          await notifySolicitudCompraN8n(
            buildSolicitudCompraN8nBody({
              codigoCuenta,
              solicitud: created,
              proveedor,
              lineas: lines.map((linea) => ({
                idProducto: linea.idProducto,
                sku: linea.skuSnapshot,
                descripcion: linea.titleSnapshot,
                cantidad: linea.pesoKg,
              })),
            }),
          );
        } catch {
          // La solicitud ya quedó guardada; la notificación a n8n es best-effort.
        }
      }

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

  return {
    lines,
    pickProductId,
    setPickProductId,
    pickPesoKg,
    setPickPesoKg,
    idProveedor,
    setIdProveedor,
    productos,
    proveedores,
    proveedorPickerOpen,
    setProveedorPickerOpen,
    productoPickerOpen,
    setProductoPickerOpen,
    error,
    setError,
    isSubmitting,
    isLoadingOptions,
    selectedProveedorLabel,
    selectedProductoLabel,
    handleClose,
    addLine,
    removeLine,
    handleSubmit,
  };
}
