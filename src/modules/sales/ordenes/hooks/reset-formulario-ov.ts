"use client";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { fetchProductosVentaCatalogo } from "../../shared/services/sales-catalog.api";
import {
  getCompradorAdmin,
  listBodegasExternasVinculadasAdmin,
  listBodegasInternasVinculadasAdmin,
  listCompradoresAdmin,
  CompradorCreateModal,
  listCompradorProductoAliasAdmin,
  type CompradorListRow,
} from "@/modules/admin-panel";
import {
  createOrdenVenta,
  fetchUltimosPreciosPorComprador,
  getCuentaIdBodegaDefault,
  getOrdenVentaDetalle,
  updateOrdenVenta,
} from "../../shared/services/sales.service";
import { aplicarDetalleCargado } from "./cargar-orden-detalle";
import {
  mergeOrigenAdjuntosWithEmlParts,
  nombresOrigenAdjuntos,
  origenAdjuntosFromEmlParts,
  parseOrigenArchivos,
  type OrigenAdjunto,
} from "../utils/origen/origen-adjuntos";
import { abrirFormularioDesdeDocs } from "./useOtOv";

export function useResetFormularioOv(estado: OrdenVentaFormEstado) {
  const { open, setOrdenCargadaId, setFechaCreacion, setStep, isEditing, setStartMode, setIsCompradorCreateOpen, setIdComprador, setCompradorLabel, setCompradorNombreIa, setCompradorSugerencias, selectedCompradorIdRef, setFechaEntrega, setVentanaDesde, setVentanaHasta, setPrioridad, setMoneda, setOrdenCompraHotel, setCentroConsumo, setDenominacionComercial, setObservaciones, setDireccion, setEntregaLat, setEntregaLng, setAnden, setContacto, setTelefono, setCorreo, setTurno, setHoraSalida, setChofer, setUnidad, setAceptaSustituciones, setRequiereLote, setRegistrarTemperatura, setOrigenTexto, setTotalSolicitudDetectado, setOrigenArchivoFiles, setOrigenCorreoDraft, setOrdenesTrabajoPreview, setFormOtPage, setLineas, setProductosBase, setPrecioOverrideByProducto, setEquivalenciaByProducto, setCompradores, setBodegasDestino, setIdBodegaDestino, setPendingEmitId, setEditingEstado, setEditingCodigo, setReagruparOpen, setReagruparAplicada, setPicker, setReplaceLineaIndex, setAutoFields, setWarnFields, setAvisoVerificarDireccion, setMissingFields, setDiscrepancias, setConfirmDiscrepanciasOpen, setConfirmSaveOpen, setIsReadingIa, skipDiscrepanciaConfirmRef, skipSaveConfirmRef, skipOtSeedFromOrigenRef, pendingDraftSaveAfterReorgRef, setCantidadFocusId, setError, setSuccessMessage, setIsSaving, submitIntentRef, setOrigenAdjuntos, setEmlInnerAdjuntos, setConfirmDiscardOpen, setFichaComprador, setExigeOc, codigoCuenta, setFormDataReady, setIsLoading, editingId, codigoVenta, handleSelectComprador, bootstrapPromiseRef, compradores, formDataReady } = estado;
  useEffect(() => {
    if (!open) {
      // Al cerrar el formulario su detalle queda en memoria: que no se tome por el de la
      // próxima OV que se abra.
      setOrdenCargadaId(null);
      setFechaCreacion("");
      return;
    }

    setStep(isEditing ? "form" : "start");
    setStartMode(isEditing ? "scratch" : null);
    setIsCompradorCreateOpen(false);
    setIdComprador("");
    setCompradorLabel("");
    setCompradorNombreIa(null);
    setCompradorSugerencias([]);
    selectedCompradorIdRef.current = "";
    setFechaEntrega("");
    setFechaCreacion("");
    setVentanaDesde("");
    setVentanaHasta("");
    setPrioridad("Normal");
    setMoneda("MXN");
    setOrdenCompraHotel("");
    setCentroConsumo("");
    setDenominacionComercial("");
    setObservaciones("");
    setDireccion("");
    setEntregaLat(null);
    setEntregaLng(null);
    setAnden("");
    setContacto("");
    setTelefono("");
    setCorreo("");
    setTurno("");
    setHoraSalida("");
    setChofer("");
    setUnidad("");
    setAceptaSustituciones("");
    setRequiereLote("");
    setRegistrarTemperatura("");
    setOrigenTexto(""); setTotalSolicitudDetectado(null);
    setOrigenArchivoFiles([]);
    setOrigenCorreoDraft([]);
    setOrdenesTrabajoPreview([]);
    setFormOtPage(0);
    setLineas([]);
    setProductosBase([]);
    setPrecioOverrideByProducto({});
    setEquivalenciaByProducto({});
    setCompradores([]);
    setBodegasDestino([]);
    setIdBodegaDestino("");
    setPendingEmitId(null);
    setEditingEstado(null);
    setEditingCodigo("");
    setReagruparOpen(false);
    setOrdenCargadaId(null);
    setReagruparAplicada(null);
    setPicker(null);
    setReplaceLineaIndex(null);
    setAutoFields(new Set());
    setWarnFields(new Set());
    setAvisoVerificarDireccion(false);
    setMissingFields(new Set());
    setDiscrepancias([]);
    setConfirmDiscrepanciasOpen(false);
    setConfirmSaveOpen(false);
    setIsReadingIa(false);
    skipDiscrepanciaConfirmRef.current = false;
    skipSaveConfirmRef.current = false;
    skipOtSeedFromOrigenRef.current = false;
    pendingDraftSaveAfterReorgRef.current = false;
    setCantidadFocusId(null);
    setError(null);
    setSuccessMessage(null);
    setIsSaving(false);
    submitIntentRef.current = "emit";
    setOrigenAdjuntos([]);
    setEmlInnerAdjuntos([]);
    setConfirmDiscardOpen(false);
    setFichaComprador(null);
    setExigeOc(false);

    if (!codigoCuenta) return;

    // Pedido nuevo: mostrar «¿Cómo quieres empezar?» al instante.
    // Edición: sí bloqueamos hasta tener detalle + catálogo.
    // OV externa por_confirmar: pantalla Mateo mientras interpreta origen_correo.
    setFormDataReady(false);
    if (isEditing) {
      setIsLoading(true);
      setIsReadingIa(true);
    } else {
      // Evita spinner residual de una edición/apertura previa.
      setIsLoading(false);
    }

    const bootstrap = Promise.all([
      fetchProductosVentaCatalogo(codigoCuenta),
      listCompradoresAdmin({ codigoCuenta }),
      listBodegasInternasVinculadasAdmin({ codigoCuenta }),
      listBodegasExternasVinculadasAdmin({ codigoCuenta }),
      getCuentaIdBodegaDefault(codigoCuenta),
      editingId
        ? getOrdenVentaDetalle({ codigoCuenta, idOrdenVenta: editingId })
        : Promise.resolve(null),
    ]).then(
        ([
          productoRows,
          compradorRows,
          internas,
          externas,
          idBodegaDefault,
          detalle,
        ]) => {
        aplicarDetalleCargado({
          productoRows, compradorRows, internas, externas, idBodegaDefault, detalle,
          codigoCuenta, editingId, codigoVenta, handleSelectComprador,
          selectedCompradorIdRef, skipOtSeedFromOrigenRef,
          setProductosBase, setCompradores, setBodegasDestino, setIdBodegaDestino,
          setEditingEstado, setFechaCreacion, setOrdenCargadaId, setEditingCodigo,
          setIdComprador, setCompradorLabel, setFechaEntrega, setVentanaDesde, setVentanaHasta,
          setPrioridad, setMoneda, setOrdenCompraHotel, setCentroConsumo, setObservaciones,
          setDireccion, setEntregaLat, setEntregaLng, setAnden, setContacto, setTelefono, setCorreo, setTurno, setHoraSalida,
          setChofer, setUnidad, setAceptaSustituciones, setRequiereLote, setRegistrarTemperatura,
          setOrigenTexto, setOrigenAdjuntos, setOrigenCorreoDraft, setOrdenesTrabajoPreview,
          setCompradorNombreIa, setCompradorSugerencias, setLineas, setStartMode, setFormOtPage,
          setStep, setMissingFields, setDiscrepancias, setAutoFields, setWarnFields,
          setFichaComprador, setExigeOc, setPrecioOverrideByProducto,           setEquivalenciaByProducto,
        } as OrdenVentaFormEstado);
      });

    bootstrapPromiseRef.current = bootstrap
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los datos del formulario.",
        );
      })
      .finally(() => {
        setFormDataReady(true);
        setIsLoading(false);
        setIsReadingIa(false);
      });
  }, [codigoCuenta, editingId, isEditing, open]);

  /** Espera catálogo/compradores/bodegas si aún no terminaron (pedido nuevo). */
  const ensureFormDataReady = useCallback(async () => {
    if (formDataReady) return true;
    setIsLoading(true);
    try {
      await bootstrapPromiseRef.current;
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [formDataReady]);
  return { ensureFormDataReady };
}

export function useAperturaDesdeDocsOv(estado: OrdenVentaFormEstado) {
  const { origenArchivoFiles, origenAdjuntos, emlInnerAdjuntos } = estado;
  const origenArchivosNombres = useMemo(() => {
    const fromFiles = origenArchivoFiles.map((file) => file.name);
    const raw =
      fromFiles.length > 0
        ? fromFiles
        : nombresOrigenAdjuntos(
            mergeOrigenAdjuntosWithEmlParts(origenAdjuntos, emlInnerAdjuntos),
          );
    return [...new Set(raw.map((name) => name.trim()).filter(Boolean))];
  }, [origenArchivoFiles, origenAdjuntos, emlInnerAdjuntos]);

  // Pasar el estado completo: un partial omitía setters (Cypher / total solicitud).
  const openFormFromDocs = useCallback(async () => {
    await abrirFormularioDesdeDocs(estado);
  }, [estado]);

  return { origenArchivosNombres, openFormFromDocs };
}

export function useForzarFormularioAlEditar(estado: OrdenVentaFormEstado) {
  const { open, isEditing, step, setFormOtPage, setStep, setError } = estado;
  useEffect(() => {
    if (!open || !isEditing) return;
    if (step !== "pickOt") return;
    setFormOtPage(0);
    setStep("form");
    setError(null);
  }, [isEditing, open, setError, setFormOtPage, setStep, step]);
}
