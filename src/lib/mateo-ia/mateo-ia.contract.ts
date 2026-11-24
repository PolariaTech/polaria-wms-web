import { z } from "zod";

const mateoIaLecturaSchema = z.object({
  pedido: z.record(z.string(), z.unknown()),
  grupos: z.array(z.unknown()),
  textoOrigen: z.string(),
  documentos: z.array(z.unknown()),
  advertencias: z.array(z.unknown()),
  catalogoProductos: z.number(),
  tokensTotal: z.number(),
  costoUSD: z.number().nullable(),
});

export type MateoIaLectura = z.infer<typeof mateoIaLecturaSchema>;

/** Valida el envelope de POST /pedidos/leer antes de usarlo en el BFF. */
export function parseMateoIaLectura(valor: unknown): MateoIaLectura {
  const parsed = mateoIaLecturaSchema.safeParse(valor);
  if (!parsed.success) {
    const detalle = parsed.error.issues
      .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Contrato mateo-ia-api (/pedidos/leer) inválido: ${detalle}`,
    );
  }
  return parsed.data;
}