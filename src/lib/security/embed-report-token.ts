import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** TTL del token de vista embebida (12 horas). */
export const EMBED_REPORT_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

export interface EmbedReportTokenPayload {
  /** codigo_cuenta */
  c: string;
  /** epoch ms de expiración */
  exp: number;
  /** id único del token */
  jti: string;
}

function getSigningSecret(): string {
  const explicit = process.env.EMBED_REPORT_SIGNING_SECRET?.trim();
  if (explicit) return explicit;

  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceRole) return serviceRole;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "EMBED_REPORT_SIGNING_SECRET (o SUPABASE_SERVICE_ROLE_KEY) es obligatoria.",
    );
  }

  return "dev-insecure-embed-report-secret";
}

function signPayload(payloadB64: string): string {
  return createHmac("sha256", getSigningSecret())
    .update(payloadB64)
    .digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Emite un token opaco (no incluye la URL de Looker). */
export function mintEmbedReportToken(codigoCuenta: string): string {
  const payload: EmbedReportTokenPayload = {
    c: codigoCuenta.trim(),
    exp: Date.now() + EMBED_REPORT_TOKEN_TTL_MS,
    jti: randomBytes(12).toString("hex"),
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  const signature = signPayload(payloadB64);
  return `${payloadB64}.${signature}`;
}

/** Valida firma y expiración. Devuelve null si es inválido. */
export function verifyEmbedReportToken(
  token: string,
): EmbedReportTokenPayload | null {
  const trimmed = token.trim();
  const dot = trimmed.lastIndexOf(".");
  if (dot <= 0 || dot === trimmed.length - 1) return null;

  const payloadB64 = trimmed.slice(0, dot);
  const signature = trimmed.slice(dot + 1);
  const expected = signPayload(payloadB64);

  if (!safeEqual(signature, expected)) return null;

  try {
    const json = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(json) as EmbedReportTokenPayload;
    if (!payload?.c?.trim() || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
