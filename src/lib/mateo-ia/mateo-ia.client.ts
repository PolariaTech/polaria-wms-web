/**
 * Cliente HTTP hacia mateo-ia-api para lectura de pedidos.
 * El BFF de Next ya no ejecuta OpenAI localmente.
 */

export type MateoIaArchivo = {
  nombre: string;
  mime: string;
  base64: string;
};

export type MateoIaLeerInput = {
  texto?: string;
  archivos: MateoIaArchivo[];
  catalogoClaves: string[];
  presentaciones: string[];
  hoyISO?: string;
};

import {
  type MateoIaLectura,
  parseMateoIaLectura,
} from "./mateo-ia.contract";

export type { MateoIaLectura };

export async function leerPedidoEnMateoIa(
  input: MateoIaLeerInput,
): Promise<MateoIaLectura> {
  const baseUrl = (process.env.MATEO_IA_API_URL ?? "").trim().replace(/\/$/, "");
  const apiKey = (process.env.MATEO_IA_API_KEY ?? "").trim();
  if (!baseUrl) {
    throw new Error("Falta MATEO_IA_API_URL (ej. http://127.0.0.1:3010).");
  }
  if (!apiKey) {
    throw new Error("Falta MATEO_IA_API_KEY para llamar a mateo-ia-api.");
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/pedidos/leer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify(input),
    });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    throw new Error(`No se pudo contactar mateo-ia-api (${baseUrl}): ${mensaje}`);
  }

  const texto = await response.text();
  if (!response.ok) {
    throw new Error(
      `mateo-ia-api respondió ${response.status}: ${texto.slice(0, 300)}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(texto) as unknown;
  } catch {
    throw new Error("mateo-ia-api devolvió JSON inválido.");
  }
  return parseMateoIaLectura(parsed);
}
