import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  listBodegasInternasVinculadasAdmin,
  type BodegaInternaVinculadaRow,
} from "@/modules/admin-panel";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { useAuthStore } from "@/stores/auth.store";
import {
  createSolicitudProcesamiento,
  getStockProductoBodega,
  listProductosPrimariosConSecundarioProcesamiento,
} from "../../shared/services/processing.service";
import {
  PROCESAMIENTO_RELACION_PRIMARIO_BASE,
  unidadesSecundarioPorKgPrimario,
} from "../../shared/constants/procesamiento-conversion";
import type { ProductoProcesamientoOption } from "../../shared/types/processing.types";
import { formatTodayInputValue } from "./orden-procesamiento-create-modal.helpers";
import { useProcesamientoEstimado } from "./useProcesamientoEstimado";
import { validateOrdenProcesamientoSubmit } from "./orden-procesamiento-create-modal.submit";

interface UseOrdenProcesamientoCreateFormParams {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function useOrdenProcesamientoCreateForm({
  open,
  onClose,
  onCreated,
}: UseOrdenProcesamientoCreateFormParams) {
  const { codigoCuenta, activeBodegaId } = useCompany();
  const idSolicitante = useAuthStore((state) => state.session?.idUsuario ?? "");

  const [fecha, setFecha] = useState(formatTodayInputValue());
  const [bodegas, setBodegas] = useState<BodegaInternaVinculadaRow[]>([]);
  const [idBodega, setIdBodega] = useState("");
  const [idPrimario, setIdPrimario] = useState("");
  const [idSecundario, setIdSecundario] = useState("");
  const [conversionUnidades, setConversionUnidades] = useState("0");
  const [cantidadElegida, setCantidadElegida] = useState(1);
  const [primarios, setPrimarios] = useState<ProductoProcesamientoOption[]>([]);
  const [secundarioSeleccionado, setSecundarioSeleccionado] =
    useState<ProductoProcesamientoOption | null>(null);
  const [stockKg, setStockKg] = useState<number | null>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mapaPickerOpen, setMapaPickerOpen] = useState(false);
  const [insumoPickerOpen, setInsumoPickerOpen] = useState(false);
  const [resultadoPickerOpen, setResultadoPickerOpen] = useState(false);

  const primarioSeleccionado = useMemo(
    () => primarios.find((item) => item.idProducto === idPrimario) ?? null,
    [idPrimario, primarios],
  );

  const { conversionValue, maxCantidad, perdidaPctDelCatalogo, desgloseEstimado } =
    useProcesamientoEstimado({
      secundarioSeleccionado,
      conversionUnidades,
      cantidadElegida,
      stockKg,
    });

  const insumoValido = Boolean(
    primarioSeleccionado && stockKg !== null && stockKg > 0,
  );

  const bodegaSeleccionada = useMemo(
    () => bodegas.find((item) => item.idBodega === idBodega) ?? null,
    [bodegas, idBodega],
  );

  const nestedPickerOpen =
    mapaPickerOpen || insumoPickerOpen || resultadoPickerOpen;
  const fieldsDisabled = isLoading || isSubmitting;

  useEffect(() => {
    if (!open) return;

    setFecha(formatTodayInputValue());
    setBodegas([]);
    setIdBodega("");
    setIdPrimario("");
    setIdSecundario("");
    setConversionUnidades("0");
    setCantidadElegida(1);
    setPrimarios([]);
    setSecundarioSeleccionado(null);
    setStockKg(null);
    setStockLoading(false);
    setStockError(null);
    setError(null);
    setIsSubmitting(false);
    setMapaPickerOpen(false);
    setInsumoPickerOpen(false);
    setResultadoPickerOpen(false);

    if (!codigoCuenta) return;

    setIsLoading(true);

    void Promise.all([
      listProductosPrimariosConSecundarioProcesamiento(codigoCuenta),
      listBodegasInternasVinculadasAdmin({ codigoCuenta }),
    ])
      .then(([primarioRows, bodegaRows]) => {
        setPrimarios(primarioRows);
        setBodegas(bodegaRows);

        const preferred =
          (activeBodegaId &&
            bodegaRows.find((row) => row.idBodega === activeBodegaId)?.idBodega) ||
          bodegaRows[0]?.idBodega ||
          "";
        setIdBodega(preferred);
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
  }, [activeBodegaId, codigoCuenta, open]);

  useEffect(() => {
    if (!open || !codigoCuenta || !idPrimario || !idBodega) {
      setStockKg(null);
      setStockLoading(false);
      setStockError(null);
      return;
    }

    let cancelled = false;
    setStockLoading(true);
    setStockError(null);

    void getStockProductoBodega(idBodega, idPrimario, codigoCuenta)
      .then((stock) => {
        if (!cancelled) setStockKg(stock);
      })
      .catch(() => {
        if (!cancelled) {
          setStockKg(null);
          setStockError("No se pudo consultar el stock del mapa.");
        }
      })
      .finally(() => {
        if (!cancelled) setStockLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, idBodega, idPrimario, open]);

  const handleMapaSelect = useCallback((bodega: BodegaInternaVinculadaRow) => {
    setIdBodega(bodega.idBodega);
    setIdPrimario("");
    setIdSecundario("");
    setSecundarioSeleccionado(null);
    setCantidadElegida(1);
    setStockKg(null);
    setStockError(null);
  }, []);

  const handleInsumoSelect = useCallback((producto: ProductoProcesamientoOption) => {
    setIdPrimario(producto.idProducto);
    setIdSecundario("");
    setSecundarioSeleccionado(null);
    setCantidadElegida(1);
  }, []);

  const handleResultadoSelect = useCallback((producto: ProductoProcesamientoOption) => {
    setIdSecundario(producto.idProducto);
    setSecundarioSeleccionado(producto);
  }, []);

  useEffect(() => {
    if (!open || !idPrimario) return;
    setCantidadElegida((prev) => {
      if (maxCantidad <= 0) return 1;
      return Math.min(Math.max(1, Math.round(prev)), maxCantidad);
    });
  }, [idPrimario, maxCantidad, open, idSecundario]);

  useEffect(() => {
    if (!secundarioSeleccionado) {
      setConversionUnidades("0");
      return;
    }

    const perKg = unidadesSecundarioPorKgPrimario(
      secundarioSeleccionado.reglaConversionCantidadPrimario ??
        PROCESAMIENTO_RELACION_PRIMARIO_BASE,
      secundarioSeleccionado.reglaConversionUnidadesSecundario,
    );
    setConversionUnidades(perKg !== null ? String(perKg) : "0");
  }, [secundarioSeleccionado]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const validation = validateOrdenProcesamientoSubmit({
        codigoCuenta,
        idBodega,
        idSolicitante,
        insumoValido,
        idSecundario,
        conversionValue,
        cantidadElegida,
        maxCantidad,
        perdidaPctDelCatalogo,
      });
      if (!validation.ok) {
        setError(validation.error);
        return;
      }
      const { cantidadValue, est } = validation;

      setError(null);
      setIsSubmitting(true);

      try {
        await createSolicitudProcesamiento({
          codigoCuenta: validation.codigoCuenta,
          idBodega,
          idSolicitante,
          idProductoPrimario: idPrimario,
          idProductoSecundario: idSecundario,
          kilosPrimario: cantidadValue,
          reglaConversionCantidadPrimario: PROCESAMIENTO_RELACION_PRIMARIO_BASE,
          reglaConversionUnidadesSecundario: validation.conversionValue,
          estimadoUnidadesSecundario: est,
          perdidaProcesamientoPct: perdidaPctDelCatalogo,
        });
        onCreated();
        onClose();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo registrar la orden de procesamiento.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      cantidadElegida,
      codigoCuenta,
      conversionValue,
      idBodega,
      idPrimario,
      idSecundario,
      idSolicitante,
      insumoValido,
      maxCantidad,
      onClose,
      onCreated,
      perdidaPctDelCatalogo,
    ],
  );

  const cantidadLista =
    insumoValido && maxCantidad > 0 && !stockLoading && !stockError;

  return {
    codigoCuenta,
    fecha,
    setFecha,
    bodegas,
    idBodega,
    idPrimario,
    idSecundario,
    conversionUnidades,
    setConversionUnidades,
    cantidadElegida,
    setCantidadElegida,
    primarios,
    secundarioSeleccionado,
    stockKg,
    stockLoading,
    stockError,
    error,
    isSubmitting,
    isLoading,
    mapaPickerOpen,
    setMapaPickerOpen,
    insumoPickerOpen,
    setInsumoPickerOpen,
    resultadoPickerOpen,
    setResultadoPickerOpen,
    primarioSeleccionado,
    maxCantidad,
    perdidaPctDelCatalogo,
    desgloseEstimado,
    insumoValido,
    bodegaSeleccionada,
    nestedPickerOpen,
    fieldsDisabled,
    cantidadLista,
    handleMapaSelect,
    handleInsumoSelect,
    handleResultadoSelect,
    handleSubmit,
  };
}
