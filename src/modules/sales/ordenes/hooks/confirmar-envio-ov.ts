import type { OrigenAdjunto } from "../utils/origen/origen-adjuntos";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import { uploadOvAdjuntosClient } from "../services/ov-adjuntos.client";
import {
  buildPayloadEnvioOv,
  notasLineasParaEnvio,
  origenCorreoParaEnvio,
  textoOrigenParaPersistir,
} from "../utils/pedido/payload-envio-ov";
import { overrideDenominacionParaPersistir } from "../utils/pedido/resolve-denominacion-comercial";
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
    denominacionComercial, denominacionComercialCatalogo,
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
    entregaLat: input.entregaLat,
    entregaLng: input.entregaLng,
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
    denominacionComercialOverride: overrideDenominacionParaPersistir({
      valorFormulario: denominacionComercial ?? "",
      apodoSincronizado: denominacionComercialCatalogo ?? "",
    }),
  });

  await ejecutarPersistenciaEnvio({
    ...input,
    payload,
    fechaEntregaPersist,
  } as OrdenVentaFormEstado);
}

export function useHandleSubmitOv(estado: OrdenVentaFormEstado) {
  const { submitIntentRef, setError, setSuccessMessage } = estado;

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const intent = submitIntentRef.current;
      submitIntentRef.current = "emit";
      const isDraft = intent === "draft";
      setError(null);
      setSuccessMessage(null);

      const preparado = validarEnvioOv({ ...estado, isDraft });
      if (!preparado) return;
      await confirmarEnvioOv({
        ...estado,
        isDraft,
        ...preparado,
      } as OrdenVentaFormEstado);
    },
    [estado, setError, setSuccessMessage, submitIntentRef],
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
