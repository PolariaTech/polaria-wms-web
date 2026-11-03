import type { OrigenAdjunto } from "../utils/origen/origen-adjuntos";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import { uploadOvAdjuntosClient } from "../services/ov-adjuntos.client";
import {
  buildPayloadEnvioOv,
  notasLineasParaEnvio,
  origenCorreoParaEnvio,
  textoOrigenParaPersistir,
} from "../utils/pedido/payload-envio-ov";
import { ejecutarPersistenciaEnvio } from "./useEnvioOv";
import { validarEnvioOv } from "./validar-envio-ov";
import { useCallback, type FormEvent } from "react";

export async function confirmarEnvioOv(input: OrdenVentaFormEstado) {
  const {
    isDraft, codigoCuenta, isEditing, startMode, origenTexto, origenAdjuntos,
    origenArchivoFiles, setOrigenAdjuntos, setIsSaving, setMateoBusyMessage, setError,
    lineas, lineasParsed, hijasSynced, fechaEntregaPersist, bodegaDestinoLabel,
    idBodegaDestino, idComprador, ventanaDesde, ventanaHasta, prioridad, moneda,
    ordenCompraHotel, centroConsumo, vendedorNombre, direccion, anden, contacto,
    telefono, correo, turno, horaSalida, chofer, unidad, aceptaSustituciones,
    requiereLote, registrarTemperatura, origenCorreoDraft, compradorNombreIa,
    compradorLabel, observaciones, idCreador,
  } = input;

  setIsSaving(true);
  setMateoBusyMessage(undefined);

  const persistOrigenTexto = textoOrigenParaPersistir({
    isEditing,
    startMode,
    origenTexto,
  });

  let persistOrigenAdjuntos: OrigenAdjunto[] = origenAdjuntos;
  try {
    if (origenArchivoFiles.length > 0) {
      const uploaded = await uploadOvAdjuntosClient(origenArchivoFiles, codigoCuenta);
      persistOrigenAdjuntos = uploaded;
      setOrigenAdjuntos(uploaded);
    } else if (isEditing) {
      persistOrigenAdjuntos = origenAdjuntos;
    } else if (startMode !== "docs") {
      persistOrigenAdjuntos = [];
    }
  } catch (uploadError) {
    setIsSaving(false);
    setError(
      uploadError instanceof Error
        ? uploadError.message
        : "No se pudieron subir los adjuntos.",
    );
    return;
  }

  const notasLineasText = notasLineasParaEnvio(lineas);
  const payload = buildPayloadEnvioOv({
    codigoCuenta,
    lineas: lineasParsed,
    idBodegaDestino,
    idComprador,
    fechaEntrega: fechaEntregaPersist,
    ventanaDesde,
    ventanaHasta,
    prioridad,
    moneda,
    ordenCompraHotel,
    centroConsumo,
    vendedor: vendedorNombre,
    bodegaDestinoLabel,
    direccion,
    anden,
    contacto,
    telefono,
    correo,
    turno,
    horaSalida,
    chofer,
    unidad,
    aceptaSustituciones,
    requiereLote,
    registrarTemperatura,
    origenTexto: persistOrigenTexto,
    origenArchivos: persistOrigenAdjuntos,
    origenCorreo: origenCorreoParaEnvio({
      hijas: hijasSynced,
      lineas,
      origenCorreoDraft,
      idComprador,
      compradorNombreIa,
      compradorLabel,
    }),
    notasLineas: notasLineasText,
    observaciones,
    idCreador,
    isDraft,
  });

  await ejecutarPersistenciaEnvio({
    ...input,
    payload,
    fechaEntregaPersist,
  } as OrdenVentaFormEstado);
}

export function useHandleSubmitOv(estado: OrdenVentaFormEstado) {
  const {
    submitIntentRef, setError, setSuccessMessage, codigoCuenta, hasProductos, step,
    isEditing, pendingEmitId, idComprador, showToast, startMode, avisosCatalogoValidacion,
    skipDiscrepanciaConfirmRef, setConfirmDiscrepanciasOpen, exigeOc, ordenCompraHotel,
    syncActiveOtFromForm, ordenesTrabajoForm, applyOrdenesTrabajo, lineas, fechaEntrega,
    origenCorreoDraft, setFechaEntrega, setMissingFields, ventanaDesde, ventanaHasta,
    formScrollRef, bodegasDestino, idBodegaDestino, skipSaveConfirmRef, setConfirmSaveOpen,
    setIsSaving, setMateoBusyMessage, origenTexto, origenAdjuntos, origenArchivoFiles,
    setOrigenAdjuntos, compradorNombreIa, compradorLabel, prioridad, moneda, centroConsumo,
    vendedorNombre, direccion, anden, contacto, telefono, correo, turno, horaSalida, chofer,
    unidad, aceptaSustituciones, requiereLote, registrarTemperatura, observaciones, idCreador,
    editingId, editingEstado, session, setPendingEmitId, setEditingEstado, reagruparAplicada,
    setReagruparAplicada, folioFactura, onEmitSuccess, onAutoPrintResult, onCreated, onClose,
    hijaFormActiva, paginarPorOt,
  } = estado;

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const intent = submitIntentRef.current;
      submitIntentRef.current = "emit";
      const isDraft = intent === "draft";
      setError(null);
      setSuccessMessage(null);

      const preparado = validarEnvioOv({
        isDraft,
        codigoCuenta,
        hasProductos,
        step,
        isEditing,
        pendingEmitId,
        idComprador,
        setError,
        showToast,
        startMode,
        avisosCatalogoValidacion,
        skipDiscrepanciaConfirmRef,
        setConfirmDiscrepanciasOpen,
        exigeOc,
        ordenCompraHotel,
        syncActiveOtFromForm,
        ordenesTrabajoForm,
        applyOrdenesTrabajo,
        lineas,
        fechaEntrega,
        origenCorreoDraft,
        setFechaEntrega,
        setMissingFields,
        ventanaDesde,
        ventanaHasta,
        formScrollRef,
        bodegasDestino,
        idBodegaDestino,
        skipSaveConfirmRef,
        setConfirmSaveOpen,
        setIsSaving,
        setMateoBusyMessage,
        origenTexto,
        origenAdjuntos,
        origenArchivoFiles,
        setOrigenAdjuntos,
        compradorNombreIa,
        compradorLabel,
        prioridad,
        moneda,
        centroConsumo,
        vendedorNombre,
        direccion,
        anden,
        contacto,
        telefono,
        correo,
        turno,
        horaSalida,
        chofer,
        unidad,
        aceptaSustituciones,
        requiereLote,
        registrarTemperatura,
        observaciones,
        idCreador,
        editingId,
        editingEstado,
        session,
        setPendingEmitId,
        setEditingEstado,
        reagruparAplicada,
        setReagruparAplicada,
        folioFactura,
        onEmitSuccess,
        onAutoPrintResult,
        onCreated,
        onClose,
        hijaFormActiva,
        paginarPorOt,
      } as OrdenVentaFormEstado);
      if (!preparado) return;
      await confirmarEnvioOv({
        isDraft,
        ...preparado,
        codigoCuenta,
        hasProductos,
        step,
        isEditing,
        pendingEmitId,
        idComprador,
        setError,
        showToast,
        startMode,
        avisosCatalogoValidacion,
        skipDiscrepanciaConfirmRef,
        setConfirmDiscrepanciasOpen,
        exigeOc,
        ordenCompraHotel,
        syncActiveOtFromForm,
        ordenesTrabajoForm,
        applyOrdenesTrabajo,
        lineas,
        fechaEntrega,
        origenCorreoDraft,
        setFechaEntrega,
        setMissingFields,
        ventanaDesde,
        ventanaHasta,
        formScrollRef,
        bodegasDestino,
        idBodegaDestino,
        skipSaveConfirmRef,
        setConfirmSaveOpen,
        setIsSaving,
        setMateoBusyMessage,
        origenTexto,
        origenAdjuntos,
        origenArchivoFiles,
        setOrigenAdjuntos,
        compradorNombreIa,
        compradorLabel,
        prioridad,
        moneda,
        centroConsumo,
        vendedorNombre,
        direccion,
        anden,
        contacto,
        telefono,
        correo,
        turno,
        horaSalida,
        chofer,
        unidad,
        aceptaSustituciones,
        requiereLote,
        registrarTemperatura,
        observaciones,
        idCreador,
        editingId,
        editingEstado,
        session,
        setPendingEmitId,
        setEditingEstado,
        reagruparAplicada,
        setReagruparAplicada,
        folioFactura,
        onEmitSuccess,
        onAutoPrintResult,
        onCreated,
        onClose,
        hijaFormActiva,
        paginarPorOt,
      } as unknown as OrdenVentaFormEstado);
    },
    [
      anden, applyOrdenesTrabajo, bodegasDestino, centroConsumo, chofer, codigoCuenta,
      compradorLabel, compradorNombreIa, contacto, correo, direccion, avisosCatalogoValidacion,
      editingEstado, editingId, exigeOc, fechaEntrega, folioFactura, hasProductos, hijaFormActiva,
      horaSalida, idBodegaDestino, idComprador, idCreador, isEditing, lineas, moneda, observaciones,
      onAutoPrintResult, onClose, onCreated, onEmitSuccess, reagruparAplicada, showToast,
      ordenCompraHotel, origenAdjuntos, origenArchivoFiles, origenCorreoDraft, ordenesTrabajoForm,
      origenTexto, paginarPorOt, pendingEmitId, prioridad, session, setEditingEstado, setError,
      setFechaEntrega, setIsSaving, setMateoBusyMessage, setMissingFields, setOrigenAdjuntos,
      setPendingEmitId, setReagruparAplicada, setSuccessMessage, skipDiscrepanciaConfirmRef,
      skipSaveConfirmRef, startMode, step, syncActiveOtFromForm, telefono, turno, unidad,
      aceptaSustituciones, requiereLote, registrarTemperatura, vendedorNombre, ventanaDesde,
      ventanaHasta, setConfirmDiscrepanciasOpen, setConfirmSaveOpen,
    ],
  );

  return { handleSubmit };
}

export function useContarProductosOt() {
  const countProductosOt = useCallback((hija: { renglones: Array<Record<string, string | undefined>> }) => {
    return hija.renglones.filter(
      (row) => (row.Producto ?? "").trim() || (row["Codigo producto"] ?? "").trim(),
    ).length;
  }, []);
  return { countProductosOt };
}
