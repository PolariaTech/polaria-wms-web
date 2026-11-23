import {
  type ImpresoraCamino,
  type ImpresoraModoEnvio,
  type ImpresoraPais,
  type ImpresoraTipoConexion,
} from "./impresoras.service.types";

export function suggestModoEnvio(
  tipo: ImpresoraTipoConexion,
): ImpresoraModoEnvio {
  if (tipo === "usb") return "sistema_local";
  if (tipo === "bluetooth") return "agente";
  return "ipp";
}

export function labelTipoConexion(tipo: ImpresoraTipoConexion): string {
  switch (tipo) {
    case "wifi":
      return "Wi‑Fi";
    case "ethernet":
      return "Ethernet (cable)";
    case "usb":
      return "USB";
    case "bluetooth":
      return "Bluetooth";
  }
}

export function labelModoEnvio(modo: ImpresoraModoEnvio): string {
  switch (modo) {
    case "ipp":
      return "IPP / IPPS";
    case "raw_9100":
      return "JetDirect (9100)";
    case "sistema_local":
      return "Cola del sistema";
    case "agente":
      return "QZ Tray";
    case "email":
      return "Brother · correo";
    case "epson_connect":
      return "Epson Connect";
  }
}

export function caminoFromModoEnvio(modo: ImpresoraModoEnvio): ImpresoraCamino {
  if (modo === "email") return "brother_email";
  if (modo === "epson_connect") return "epson_connect";
  return "qz";
}

export function labelCaminoImpresora(camino: ImpresoraCamino): string {
  switch (camino) {
    case "qz":
      return "QZ Tray";
    case "brother_email":
      return "Brother · correo";
    case "epson_connect":
      return "Epson Connect";
  }
}

export function defaultsForCamino(camino: ImpresoraCamino): {
  modoEnvio: ImpresoraModoEnvio;
  tipoConexion: ImpresoraTipoConexion;
  marca: string;
} {
  switch (camino) {
    case "qz":
      return { modoEnvio: "agente", tipoConexion: "usb", marca: "" };
    case "brother_email":
      return { modoEnvio: "email", tipoConexion: "wifi", marca: "Brother" };
    case "epson_connect":
      return {
        modoEnvio: "epson_connect",
        tipoConexion: "wifi",
        marca: "Epson",
      };
  }
}

export function labelPais(pais: ImpresoraPais): string {
  switch (pais) {
    case "CO":
      return "Colombia";
    case "MX":
      return "México";
    case "US":
      return "Estados Unidos";
  }
}
