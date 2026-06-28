import { z } from "zod";

export const pedidoProveedorLineaSchema = z.object({
  sku: z.string().trim().min(1, "El SKU es obligatorio."),
  cantidad: z.number().finite().positive("La cantidad debe ser mayor a cero."),
  unidad: z.string().trim().min(1, "La unidad es obligatoria."),
});

export const pedidoProveedorBodySchema = z.object({
  idOrdenCompra: z.string().trim().min(1, "idOrdenCompra es obligatorio."),
  idProveedor: z.string().trim().min(1, "idProveedor es obligatorio."),
  lineas: z
    .array(pedidoProveedorLineaSchema)
    .min(1, "Debe incluir al menos una línea."),
  observaciones: z.string().trim().optional(),
});

export type PedidoProveedorLinea = z.infer<typeof pedidoProveedorLineaSchema>;
export type PedidoProveedorBody = z.infer<typeof pedidoProveedorBodySchema>;

export interface PedidoProveedorN8nPayload extends PedidoProveedorBody {
  documentId: string;
  correlationId: string;
  sentAt: string;
}

export function parsePedidoProveedorBody(input: unknown) {
  return pedidoProveedorBodySchema.safeParse(input);
}

export function formatPedidoProveedorValidationError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(" ");
}

export function buildPedidoProveedorN8nPayload(
  body: PedidoProveedorBody,
  documentId: string,
  correlationId: string,
  sentAt: string,
): PedidoProveedorN8nPayload {
  return {
    ...body,
    ...(body.observaciones ? { observaciones: body.observaciones } : {}),
    documentId,
    correlationId,
    sentAt,
  };
}
