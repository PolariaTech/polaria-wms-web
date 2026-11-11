import type { OrigenAdjunto } from "../utils/origen/origen-adjuntos";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import { uploadOvAdjuntosClient } from "../services/ov-adjuntos.client";
import { armarPayloadEnvioConSelloUsuario } from "../utils/pedido/armar-payload-envio-con-sello";
import { textoOrigenParaPersistir } from "../utils/pedido/payload-envio-ov";
import { ejecutarPersistenciaEnvio } from "./useEnvioOv";
import { validarEnvioOv } from "./validar-envio-ov";
import { useCallback, type FormEvent } from "react";

export async function confirmarEnvioOv(input: OrdenVentaFormEstado) {
  const {
    isDraft, codigoCuenta, isEditing, startMode, origenTexto, origenAdjuntos,
    origenArchivoFiles, setOrigenAdjuntos, setIsSaving, setMateoBusyMessage, setError,
    lineas, lineasParsed, hijasSynced, fechaEntregaPersist, bodegaDestinoLabel,
    idBodegaDestino, idComprador, ventanaDesde, ventanaHasta, prioridad, moneda,
    ordenCompraHotel, centroConsumo, vendedorNombre, direccion, entregaLat, entregaLng, anden, contacto,
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

  const payload = armarPayloadEnvioConSelloUsuario({
    codigoCuenta,
    lineasParsed,
    lineas,
    hijasSynced,
    origenCorreoDraft,
    idBodegaDestino,
    idComprador,
    fechaEntregaPersist,
    ventanaDesde,
    ventanaHasta,
    prioridad,
    moneda,
    ordenCompraHotel,
    centroConsumo,
    vendedorNombre,
    bodegaDestinoLabel,
    direccion,
    entregaLat,
    entregaLng,
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
    persistOrigenTexto,
    persistOrigenAdjuntos,
    compradorNombreIa,
    compradorLabel,
    observaciones,
    idCreador,
    isDraft,
    denominacionComercial,
    denominacionComercialCatalogo,
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
