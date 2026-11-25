import { campoSurtido } from "./apply-surtido-to-print";
import type { OrdenSurtidoCapturaPayload } from "./orden-surtido.types";

export function deriveTurnoSurtido(payload: OrdenSurtidoCapturaPayload): string | null {
  const pm = payload.checks?.turnoPm === true;
  const noche = payload.checks?.turnoNocheAm === true;
  if (pm && noche) return "PM / Noche-AM";
  if (pm) return "PM";
  if (noche) return "Noche / AM";
  return null;
}

export function buildSurtidoNotasAlmacen(
  payload: OrdenSurtidoCapturaPayload,
): string {
  const lines: string[] = [];
  const push = (label: string, ...keys: string[]) => {
    const value = campoSurtido(payload, ...keys);
    if (value) lines.push(`${label}: ${value}`);
  };

  push(
    "Folio factura asociada",
    "facturaAsociada",
    "Folio factura asociada",
    "Factura asociada",
  );
  push("Hora comprometida", "horaComprometida", "Hora comprometida");
  push("Renglones surtidos", "renglonesSurtidosCompletos");
  push("Cajas 1.5 kg", "cajas15kg");
  push("Cajas 21 kg", "cajas21kg");
  push("Total bultos", "totalBultosCamion");
  push("Tolerancia peso %", "toleranciaPesoPct");
  push("Notas generales", "notasGenerales", "Notas generales");
  push("Incidencias", "incidencias", "Incidencias");
  push("Alistó", "alistoNombre");
  push("Alistó hora", "alistoHora");
  push("Revisó", "revisoNombre");
  push("Revisó hora", "revisoHora");
  push("Documentó", "documentoNombre");
  push("Documentó hora", "documentoHora");
  push(
    "Factura (OK)",
    "facturaOkNombre",
    "documentoNombre",
    "Documentación nombre",
    "Documentación",
  );
  push(
    "Factura (OK) hora",
    "facturaOkHora",
    "documentoHora",
    "Documentación hora",
  );
  push(
    "Factura (OK) folio",
    "facturaOkFolio",
    "Factura (OK) folio",
    "Documentación folio",
  );
  push(
    "Factura (OK) firma",
    "facturaOkFirma",
    "Factura (OK) firma",
    "Documentación firma",
  );
  push("Despachó", "despachoNombre");
  push("Despachó hora", "despachoHora");
  push("Retorno", "retornoNombre");
  push("Retorno hora", "retornoHora");
  push("Recepción", "recepcionNombre");
  push("Recepción cargo", "recepcionCargo");
  push("Recepción hora", "recepcionHora");
  push("Recepción motivo", "recepcionMotivo");

  const checks: string[] = [];
  if (payload.checks?.incidenciaFueraHorario) checks.push("Fuera de horario");
  if (payload.checks?.incidenciaSinFactura) checks.push("Sin factura");
  if (payload.checks?.incidenciaFacturaNoPedida) {
    checks.push("Factura no pedida");
  }
  if (payload.checks?.incidenciaNinguna) checks.push("Sin incidencias");
  if (payload.checks?.mercanciaCoincide) checks.push("Mercancía coincide");
  if (payload.checks?.mercanciaDentroTolerancia) {
    checks.push("Dentro de tolerancia");
  }
  if (payload.checks?.mercanciaFueraTolerancia) {
    checks.push("Fuera de tolerancia");
  }
  if (payload.checks?.recepcionAceptadoCompleto) {
    checks.push("Recepción completa");
  }
  if (payload.checks?.recepcionAceptadoParcial) {
    checks.push("Recepción parcial");
  }
  if (payload.checks?.recepcionRechazado) checks.push("Rechazado");
  if (payload.checks?.recepcionRetornoFactura) {
    checks.push("Retorno a factura");
  }
  if (checks.length > 0) {
    lines.push(`Checks surtido: ${checks.join(", ")}`);
  }

  const obs = payload.observacionesIa?.trim();
  if (obs) lines.push(`IA: ${obs}`);

  if (lines.length === 0) return "";
  return `Surtido (foto QR):\n${lines.join("\n")}`;
}

export function buildNotasLineasFromSurtido(
  _payload: OrdenSurtidoCapturaPayload,
  _productosByIndex: Map<number, string>,
): string {
  // REQ-124: la especificación no se lee del manuscrito de la hoja;
  // se conserva la del pedido (Mateo / OV). No escribir notas_lineas desde captura.
  void _payload;
  void _productosByIndex;
  return "";
}