"use client";

import { useState } from "react";

/**
 * Estado de cabecera/entrega del modal de captura OV.
 * Extraído de OrdenVentaCreateModal para el límite de tamaño del gate.
 */
export function useOrdenVentaCreateCabeceraState() {
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [ventanaDesde, setVentanaDesde] = useState("");
  const [ventanaHasta, setVentanaHasta] = useState("");
  const [prioridad, setPrioridad] = useState("Normal");
  const [moneda, setMoneda] = useState("MXN");
  const [ordenCompraHotel, setOrdenCompraHotel] = useState("");
  const [centroConsumo, setCentroConsumo] = useState("");
  /** REQ-328 */
  const [referenciaPedido, setReferenciaPedido] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [direccion, setDireccion] = useState("");
  const [entregaLat, setEntregaLat] = useState<number | null>(null);
  const [entregaLng, setEntregaLng] = useState<number | null>(null);
  const [anden, setAnden] = useState("");
  const [contacto, setContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [denominacionComercial, setDenominacionComercial] = useState("");
  const [turno, setTurno] = useState("");
  const [horaSalida, setHoraSalida] = useState("");
  const [chofer, setChofer] = useState("");
  const [unidad, setUnidad] = useState("");
  const [aceptaSustituciones, setAceptaSustituciones] = useState("");
  const [requiereLote, setRequiereLote] = useState("");
  const [registrarTemperatura, setRegistrarTemperatura] = useState("");

  return {
    fechaEntrega,
    setFechaEntrega,
    ventanaDesde,
    setVentanaDesde,
    ventanaHasta,
    setVentanaHasta,
    prioridad,
    setPrioridad,
    moneda,
    setMoneda,
    ordenCompraHotel,
    setOrdenCompraHotel,
    centroConsumo,
    setCentroConsumo,
    referenciaPedido,
    setReferenciaPedido,
    observaciones,
    setObservaciones,
    direccion,
    setDireccion,
    entregaLat,
    setEntregaLat,
    entregaLng,
    setEntregaLng,
    anden,
    setAnden,
    contacto,
    setContacto,
    telefono,
    setTelefono,
    correo,
    setCorreo,
    denominacionComercial,
    setDenominacionComercial,
    turno,
    setTurno,
    horaSalida,
    setHoraSalida,
    chofer,
    setChofer,
    unidad,
    setUnidad,
    aceptaSustituciones,
    setAceptaSustituciones,
    requiereLote,
    setRequiereLote,
    registrarTemperatura,
    setRegistrarTemperatura,
  };
}
