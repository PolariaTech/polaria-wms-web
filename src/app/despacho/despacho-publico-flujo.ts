"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  despachadorDistintoDelDefault,
  validarConfirmacionDespacho,
  validarNombreDespachador,
  type OrdenDespachoPublico,
} from "@/modules/sales/ordenes/despacho/despacho-publico";

interface AccionesFlujo {
  setSeleccion: (orden: OrdenDespachoPublico | null) => void;
  setDefecto: (nombre: string) => void;
  setDespachador: (nombre: string) => void;
  setTransportista: (nombre: string) => void;
  setEnviando: (valor: boolean) => void;
  setConfirmando: (valor: boolean) => void;
  setPreguntarDefault: (valor: boolean) => void;
  setError: (error: string | null) => void;
}

export interface FlujoDespacho {
  seleccion: OrdenDespachoPublico | null;
  defecto: string | null;
  despachador: string;
  transportista: string;
  enviando: boolean;
  confirmando: boolean;
  preguntarDefault: boolean;
  error: string | null;
  setDespachador: (nombre: string) => void;
  setTransportista: (nombre: string) => void;
  abrir: (orden: OrdenDespachoPublico) => void;
  cerrar: () => void;
  pasar: () => void;
  volver: () => void;
  usarNuevo: () => void;
  dejarAnterior: () => void;
  guardar: () => void;
  confirmar: () => void;
}

export function useFlujoDespacho(): FlujoDespacho {
  const router = useRouter();
  const [seleccion, setSeleccion] = useState<OrdenDespachoPublico | null>(null);
  const [defecto, setDefecto] = useState<string | null>(null);
  const [despachador, setDespachador] = useState("");
  const [transportista, setTransportista] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [preguntarDefault, setPreguntarDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const acciones: AccionesFlujo = {
    setSeleccion, setDefecto, setDespachador, setTransportista,
    setEnviando, setConfirmando, setPreguntarDefault, setError,
  };
  const refrescar = () => router.refresh();
  return {
    seleccion, defecto, despachador, transportista, enviando,
    confirmando, preguntarDefault, error, setDespachador, setTransportista,
    abrir: (orden: OrdenDespachoPublico) => abrirOrden(orden, defecto, acciones),
    cerrar: () => cerrarOrden(enviando, acciones),
    pasar: () => pasarAConfirmacion(seleccion, despachador, transportista, defecto, acciones),
    volver: () => acciones.setConfirmando(false),
    usarNuevo: () => resolverDefault(true, despachador, acciones),
    dejarAnterior: () => resolverDefault(false, despachador, acciones),
    guardar: () => guardarDespachador(despachador, acciones),
    confirmar: () => void enviarDespacho(seleccion, despachador, transportista, acciones, refrescar),
  };
}

function abrirOrden(
  orden: OrdenDespachoPublico,
  defecto: string | null,
  acciones: AccionesFlujo,
) {
  acciones.setSeleccion(orden);
  acciones.setDespachador(defecto ?? "");
  acciones.setTransportista("");
  acciones.setConfirmando(false);
  acciones.setPreguntarDefault(false);
  acciones.setError(null);
}

function cerrarOrden(enviando: boolean, acciones: AccionesFlujo) {
  if (enviando) return;
  acciones.setSeleccion(null);
}

function guardarDespachador(nombre: string, acciones: AccionesFlujo) {
  const validacion = validarNombreDespachador(nombre);
  if (!validacion.ok) {
    acciones.setError(validacion.error);
    return;
  }
  acciones.setDefecto(validacion.value);
  acciones.setDespachador(validacion.value);
  acciones.setError(null);
}

function pasarAConfirmacion(
  seleccion: OrdenDespachoPublico | null,
  despachador: string,
  transportista: string,
  defecto: string | null,
  acciones: AccionesFlujo,
) {
  if (!seleccion) return;
  const validacion = validarConfirmacionDespacho({
    idOrdenVenta: seleccion.idOrdenVenta,
    codigoCuenta: seleccion.codigoCuenta,
    despachador,
    transportista,
  });
  if (!validacion.ok) {
    acciones.setError(validacion.error);
    return;
  }
  acciones.setDespachador(validacion.value.despachador);
  acciones.setTransportista(validacion.value.transportista);
  acciones.setError(null);
  if (
    defecto &&
    despachadorDistintoDelDefault(validacion.value.despachador, defecto)
  ) {
    acciones.setPreguntarDefault(true);
    return;
  }
  acciones.setConfirmando(true);
}

function resolverDefault(
  usarNuevo: boolean,
  despachador: string,
  acciones: AccionesFlujo,
) {
  if (usarNuevo) acciones.setDefecto(despachador);
  acciones.setPreguntarDefault(false);
  acciones.setConfirmando(true);
}

async function enviarDespacho(
  seleccion: OrdenDespachoPublico | null,
  despachador: string,
  transportista: string,
  acciones: AccionesFlujo,
  refrescar: () => void,
) {
  if (!seleccion) return;
  const validacion = validarConfirmacionDespacho({
    idOrdenVenta: seleccion.idOrdenVenta,
    codigoCuenta: seleccion.codigoCuenta,
    despachador,
    transportista,
  });
  if (!validacion.ok) {
    acciones.setError(validacion.error);
    acciones.setConfirmando(false);
    return;
  }
  acciones.setEnviando(true);
  acciones.setError(null);
  try {
    const respuesta = await fetch("/despacho/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validacion.value),
    });
    const cuerpo = (await respuesta.json()) as { ok?: boolean; error?: string };
    if (!respuesta.ok || !cuerpo.ok) {
      acciones.setError(cuerpo.error || "No se pudo confirmar el despacho.");
      return;
    }
    acciones.setSeleccion(null);
    refrescar();
  } catch {
    acciones.setError("No se pudo confirmar el despacho.");
  } finally {
    acciones.setEnviando(false);
  }
}
