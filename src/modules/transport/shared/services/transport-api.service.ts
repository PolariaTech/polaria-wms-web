import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { ApiError, apiRequest } from "@/services/api/api";

export interface CrearPaqueteDespachoInput {
  codigoCuenta: string;
  idBodega: string;
  idCamion: string;
  idOrdenesVenta: string[];
}

export interface GuiaPaqueteDespachoApiRow {
  idGuia: string;
  codigo: string;
  idOrdenVenta: string;
  codigoVenta: string;
}

export interface PaqueteDespachoApiRow {
  idViaje: string;
  codigoViaje: string;
  idCamion: string;
  placaCamion: string;
  guias: GuiaPaqueteDespachoApiRow[];
}

export interface RegistrarEntregaLineaInput {
  idLineaOrdenVenta: string;
  cantidadEntregada: number;
}

export interface RegistrarEntregaInput {
  codigoCuenta: string;
  idBodega: string;
  idViaje: string;
  idGuia: string;
  idOrdenVenta: string;
  entregaConforme: boolean;
  descripcionIncidencia?: string;
  evidenciaFotoUrl: string;
  evidenciaFirmaUrl: string;
  lineas: RegistrarEntregaLineaInput[];
}

export interface RegistrarEntregaApiRow {
  idViaje: string;
  codigoViaje: string;
  idGuia: string;
  resultado: "ok" | "no_ok";
  estadoViaje: string;
  estadoVenta: string;
}

/** Envía el paquete de despacho al transporte (viaje + guías). Requiere API Nest. */
export async function crearPaqueteDespachoApi(
  input: CrearPaqueteDespachoInput,
): Promise<PaqueteDespachoApiRow> {
  const codigoCuenta = input.codigoCuenta.trim();
  const idBodega = input.idBodega.trim();
  const idCamion = input.idCamion.trim();
  const idOrdenesVenta = [
    ...new Set(input.idOrdenesVenta.map((id) => id.trim()).filter(Boolean)),
  ];

  if (!codigoCuenta || !idBodega || !idCamion || idOrdenesVenta.length === 0) {
    throw new DomainServiceError(
      "Faltan datos para armar el paquete de despacho.",
      "INVALID_ARGUMENT",
    );
  }

  try {
    return await apiRequest<PaqueteDespachoApiRow>(
      "/transporte/paquetes-despacho",
      {
        method: "POST",
        auth: true,
        body: {
          codigoCuenta,
          idBodega,
          idCamion,
          idOrdenesVenta,
        },
      },
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw new DomainServiceError(error.message, "MUTATION_FAILED", error);
    }
    throw error;
  }
}

/** Sube foto o firma a Cloudinary vía route local Next. */
export async function uploadEvidenciaTransporteApi(
  file: File,
): Promise<string> {
  const form = new FormData();
  form.append("file", file, file.name || "evidencia.jpg");

  let response: Response;
  try {
    response = await fetch("/api/evidencia-transporte", {
      method: "POST",
      body: form,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Error de red";
    throw new DomainServiceError(
      `No se pudo subir la evidencia (${detail}).`,
      "MUTATION_FAILED",
      error,
    );
  }

  const payload = (await response.json().catch(() => null)) as {
    url?: string;
    error?: string;
  } | null;

  if (!response.ok) {
    throw new DomainServiceError(
      payload?.error?.trim() || "Error al subir la evidencia.",
      "MUTATION_FAILED",
    );
  }

  const url = payload?.url?.trim();
  if (!url) {
    throw new DomainServiceError(
      "Cloudinary no devolvió URL de evidencia.",
      "MUTATION_FAILED",
    );
  }

  return url;
}

/** Cierra el viaje con evidencias (Nest). */
export async function registrarEntregaApi(
  input: RegistrarEntregaInput,
): Promise<RegistrarEntregaApiRow> {
  try {
    return await apiRequest<RegistrarEntregaApiRow>("/transporte/entregas", {
      method: "POST",
      auth: true,
      body: {
        codigoCuenta: input.codigoCuenta.trim(),
        idBodega: input.idBodega.trim(),
        idViaje: input.idViaje.trim(),
        idGuia: input.idGuia.trim(),
        idOrdenVenta: input.idOrdenVenta.trim(),
        entregaConforme: input.entregaConforme,
        descripcionIncidencia: input.descripcionIncidencia?.trim() || undefined,
        evidenciaFotoUrl: input.evidenciaFotoUrl.trim(),
        evidenciaFirmaUrl: input.evidenciaFirmaUrl.trim(),
        lineas: input.lineas,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new DomainServiceError(error.message, "MUTATION_FAILED", error);
    }
    throw error;
  }
}
