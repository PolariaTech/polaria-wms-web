import { useAuthStore } from "@/stores/auth.store";
import type { PedidoExtraido } from "../ai/openai-pedido.client";

export async function leerPedidoConIaApi(input: {
  codigoCuenta: string;
  cliente: string;
  texto: string;
  archivos: File[];
}): Promise<PedidoExtraido> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) {
    throw new Error("Sesión requerida.");
  }

  const form = new FormData();
  form.append("codigoCuenta", input.codigoCuenta);
  form.append("cliente", input.cliente);
  form.append("texto", input.texto);
  for (const file of input.archivos) {
    form.append("archivos", file);
  }

  const response = await fetch("/api/ventas/leer-pedido", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & Partial<PedidoExtraido>;

  if (!response.ok) {
    throw new Error(
      data.error || "No se pudo leer el pedido. Intenta de nuevo.",
    );
  }

  return data as PedidoExtraido;
}
