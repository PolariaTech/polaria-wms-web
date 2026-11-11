import { DespachoPublicoLista } from "./DespachoPublicoLista";
import {
  cuentaDespachoDesdeQuery,
  partirOrdenesDespacho,
} from "@/modules/sales/ordenes/despacho/despacho-publico";
import { listarOrdenesDespachoPublico } from "@/modules/sales/ordenes/despacho/despacho-publico.service";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DespachoPublicoPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const cuenta = cuentaDespachoDesdeQuery(query.cuenta);
  if (!cuenta) {
    return (
      <main className="min-h-screen bg-polaria-bg px-4 py-8 text-polaria-w">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
          <h1 className="polaria-text-card-title">Despacho</h1>
          <p className="polaria-text-subtitle">Escanea el código de despacho.</p>
        </div>
      </main>
    );
  }

  let errorCarga: string | null = null;
  let alistada: Awaited<ReturnType<typeof listarOrdenesDespachoPublico>> = [];
  let alistamiento = alistada;

  try {
    const partes = partirOrdenesDespacho(
      await listarOrdenesDespachoPublico(cuenta),
    );
    alistada = partes.alistada;
    alistamiento = partes.alistamiento;
  } catch (error) {
    errorCarga =
      error instanceof Error && error.message
        ? error.message
        : "No se pudo cargar el listado.";
  }

  return (
    <DespachoPublicoLista
      alistada={alistada}
      alistamiento={alistamiento}
      errorCarga={errorCarga}
    />
  );
}
