import { RecepcionPrefacturaForm } from "./RecepcionPrefacturaForm";
import { completarFichaRecepcion } from "@/modules/sales/ordenes/print-batch/cargar-ficha-recepcion.server";
import { leerRecepcionQuery } from "@/modules/sales/ordenes/print-batch/recepcion-prefactura";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RecepcionPrefacturaPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const datos = leerRecepcionQuery(query);
  if (!datos) {
    return (
      <main className="min-h-screen bg-polaria-bg px-4 py-8 text-polaria-w">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
          <h1 className="polaria-text-card-title">Recepción de prefactura</h1>
          <p className="polaria-text-body">Escanea el código de la prefactura.</p>
        </div>
      </main>
    );
  }

  const ficha = await completarFichaRecepcion(datos);
  return (
    <RecepcionPrefacturaForm
      empresa={ficha.empresa}
      ov={ficha.ov}
      ot={ficha.ot}
      nombreEmpresa={ficha.nombreEmpresa}
      cliente={ficha.cliente}
      numeroOt={ficha.numeroOt}
      totalOt={ficha.totalOt}
      centroConsumo={ficha.centroConsumo}
    />
  );
}
