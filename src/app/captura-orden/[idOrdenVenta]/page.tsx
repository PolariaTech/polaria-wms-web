import {
  getOrdenMetaPublica,
  getOrdenSurtidoCaptura,
} from "@/modules/sales/ordenes/surtido/orden-surtido.service";
import {
  CapturaOrdenView,
  type CapturaOrdenMetaView,
} from "./CapturaOrdenView";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ idOrdenVenta: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  value: string | string[] | undefined,
): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value[0]) return value[0];
  return null;
}

export default async function CapturaOrdenPublicPage({
  params,
  searchParams,
}: PageProps) {
  const { idOrdenVenta: rawId } = await params;
  const query = await searchParams;
  const idOrdenVenta = rawId?.trim() ?? "";

  const capturaFlash = firstParam(query.captura);
  const flashOk = capturaFlash === "ok";
  const flashError =
    capturaFlash === "error"
      ? firstParam(query.msg) || "No se pudo procesar la foto."
      : null;

  if (!idOrdenVenta) {
    return (
      <CapturaOrdenView
        idOrdenVenta=""
        meta={null}
        error="Enlace inválido."
        flashOk={false}
        flashError={null}
      />
    );
  }

  let meta: CapturaOrdenMetaView | null = null;
  let error: string | null = null;

  try {
    const orden = await getOrdenMetaPublica(idOrdenVenta);
    if (!orden) {
      error = "Orden no encontrada.";
    } else {
      const captura = orden.tieneCaptura
        ? await getOrdenSurtidoCaptura(idOrdenVenta)
        : null;
      meta = {
        idOrdenVenta: orden.idOrdenVenta,
        folio: orden.folio,
        tieneCaptura: orden.tieneCaptura || flashOk,
        capturaActualizadaEn: captura?.updatedAt ?? null,
      };
    }
  } catch (err: unknown) {
    error =
      err instanceof Error ? err.message : "No se pudo cargar la orden.";
  }

  return (
    <CapturaOrdenView
      idOrdenVenta={idOrdenVenta}
      meta={meta}
      error={error}
      flashOk={flashOk}
      flashError={flashError}
    />
  );
}
