import { useCallback } from "react";
import {
  getCompradorAdmin,
  listCompradorProductoAliasAdmin,
  type CompradorListRow,
} from "@/modules/admin-panel";
import type { CompradorAltaFicha } from "@/modules/admin-panel/compradores/utils/comprador-alta";
import { fetchUltimosPreciosPorComprador } from "../../shared/services/sales.service";
import { debeAvisarVerificarDireccion } from "../utils/pedido/debe-avisar-direccion";
import { formatCompradorLabel } from "../utils/pedido/orden-venta-create-helpers";
import { preciosYEquivalenciasDeComprador } from "./useClienteOv";

type SeleccionOptions = {
  preservePedidoData?: boolean;
  keepNombreIa?: boolean;
  verificarDireccionEntrega?: boolean;
};

export function seleccionarCompradorOv(input: {
  row: CompradorListRow;
  options?: SeleccionOptions;
  codigoCuenta: string | null;
  selectedCompradorIdRef: { current: string };
  setIdComprador: (value: string) => void;
  setCompradorLabel: (value: string) => void;
  setExigeOc: (value: boolean) => void;
  setCompradorNombreIa: (value: string | null) => void;
  setCompradorSugerencias: (value: CompradorListRow[]) => void;
  setError: (value: string | null) => void;
  setMissingFields: (value: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setAvisoVerificarDireccion: (value: boolean) => void;
  setWarnFields: (value: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setTelefono: (value: string | ((prev: string) => string)) => void;
  applyCompradorPrefill: (
    row: CompradorListRow,
    ficha: CompradorAltaFicha,
    options?: { onlyEmpty?: boolean },
  ) => void;
  setPrecioOverrideByProducto: (value: Record<string, number>) => void;
  setEquivalenciaByProducto: (value: Record<string, string>) => void;
}) {
  const {
    row,
    options,
    codigoCuenta,
    selectedCompradorIdRef,
    setIdComprador,
    setCompradorLabel,
    setExigeOc,
    setCompradorNombreIa,
    setCompradorSugerencias,
    setError,
    setMissingFields,
    setAvisoVerificarDireccion,
    setWarnFields,
    setTelefono,
    applyCompradorPrefill,
    setPrecioOverrideByProducto,
    setEquivalenciaByProducto,
  } = input;
  const previousId = selectedCompradorIdRef.current;

  selectedCompradorIdRef.current = row.idComprador;
  setIdComprador(row.idComprador);
  setCompradorLabel(formatCompradorLabel(row));
  // REQ-117: no dejar OCC obligatorio del cliente anterior mientras carga la ficha.
  setExigeOc(false);
  if (!options?.keepNombreIa) {
    setCompradorNombreIa(null);
  }
  setCompradorSugerencias([]);
  setError(null);
  setMissingFields((prev) => {
    if (!prev.has("cliente")) return prev;
    const next = new Set(prev);
    next.delete("cliente");
    return next;
  });

  if (
    debeAvisarVerificarDireccion({
      verificarDireccionEntrega: options?.verificarDireccionEntrega,
      idClienteAnterior: previousId,
      idClienteNuevo: row.idComprador,
    })
  ) {
    setAvisoVerificarDireccion(true);
    setWarnFields((prev) => {
      const next = new Set(prev);
      next.add("direccion");
      return next;
    });
  }

  // No vaciar entrega al cambiar cliente; onlyEmpty completa huecos.
  setTelefono((prev) => prev.trim() || row.telefono?.trim() || "");

  if (!codigoCuenta) return;

  void getCompradorAdmin({
    codigoCuenta,
    idComprador: row.idComprador,
  })
    .then((detalle) => {
      if (selectedCompradorIdRef.current !== row.idComprador) return;
      applyCompradorPrefill(row, detalle.ficha, { onlyEmpty: true });
    })
    .catch(() => {
      if (selectedCompradorIdRef.current !== row.idComprador) return;
      setError(
        "Se seleccionó el cliente, pero no se pudieron cargar sus datos de alta.",
      );
    });

  void Promise.all([
    listCompradorProductoAliasAdmin({
      codigoCuenta,
      idComprador: row.idComprador,
    }),
    fetchUltimosPreciosPorComprador({
      codigoCuenta,
      idComprador: row.idComprador,
    }).catch(() => ({}) as Record<string, number>),
  ])
    .then(([aliases, ultimos]) => {
      if (selectedCompradorIdRef.current !== row.idComprador) return;
      const { overrides, equivalencias } = preciosYEquivalenciasDeComprador(
        aliases,
        ultimos,
      );
      setPrecioOverrideByProducto(overrides);
      setEquivalenciaByProducto(equivalencias);
    })
    .catch(() => {
      if (selectedCompradorIdRef.current !== row.idComprador) return;
      setPrecioOverrideByProducto({});
      setEquivalenciaByProducto({});
    });
}

export function useSeleccionarCompradorModal(e: Record<string, any>) {
  const {
    codigoCuenta, selectedCompradorIdRef, setIdComprador, setCompradorLabel, setExigeOc,
    setCompradorNombreIa, setCompradorSugerencias, setError, setMissingFields,
    setAvisoVerificarDireccion, setWarnFields, setTelefono, applyCompradorPrefill,
    setPrecioOverrideByProducto, setEquivalenciaByProducto,
  } = e;
  const handleSelectComprador = useCallback(
    (
      row: CompradorListRow,
      options?: {
        preservePedidoData?: boolean;
        keepNombreIa?: boolean;
        verificarDireccionEntrega?: boolean;
      },
    ) => {
      seleccionarCompradorOv({
        row,
        options,
        codigoCuenta,
        selectedCompradorIdRef,
        setIdComprador,
        setCompradorLabel,
        setExigeOc,
        setCompradorNombreIa,
        setCompradorSugerencias,
        setError,
        setMissingFields,
        setAvisoVerificarDireccion,
        setWarnFields,
        setTelefono,
        applyCompradorPrefill,
        setPrecioOverrideByProducto,
        setEquivalenciaByProducto,
      });
    },
    [applyCompradorPrefill, codigoCuenta],
  );
  return { handleSelectComprador };
}
