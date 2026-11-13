import { validarConfirmacionDespacho } from "@/modules/sales/ordenes/despacho/despacho-publico";
import { confirmarDespachoPublico } from "@/modules/sales/ordenes/despacho/despacho-publico.service";

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  const validacion = validarConfirmacionDespacho(body);
  if (!validacion.ok) {
    return Response.json({ ok: false, error: validacion.error }, { status: 400 });
  }

  try {
    const resultado = await confirmarDespachoPublico(validacion.value);
    if (!resultado.ok) {
      return Response.json(resultado, { status: 409 });
    }
    return Response.json(resultado);
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo confirmar el despacho.",
      },
      { status: 500 },
    );
  }
}
