import { DatosOrden, DespachoOrdenDialog } from "./despacho-publico-ui";
import type { FlujoDespacho } from "./despacho-publico-flujo";
import type { OrdenDespachoPublico } from "@/modules/sales/ordenes/despacho/despacho-publico";

export function PantallaOrdenes({
  alistada,
  alistamiento,
  errorCarga,
  flujo,
}: {
  alistada: OrdenDespachoPublico[];
  alistamiento: OrdenDespachoPublico[];
  errorCarga: string | null;
  flujo: FlujoDespacho;
}) {
  return (
    <main className="min-h-screen bg-polaria-bg px-4 py-8 text-polaria-w">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <header>
          <h1 className="polaria-text-card-title">Despacho</h1>
          <p className="polaria-text-subtitle">Órdenes en alistada</p>
        </header>
        {errorCarga ? (
          <p className="polaria-text-body" role="alert">{errorCarga}</p>
        ) : null}
        <ListaOrdenes
          ordenes={alistada}
          etiqueta="alistada"
          vacio="No hay órdenes en alistada."
          onAbrir={flujo.abrir}
        />
        <details className="rounded-xl border border-polaria-t-20 bg-polaria-t-08">
          <summary className="cursor-pointer px-4 py-3 polaria-text-body">
            alistamiento ({alistamiento.length})
          </summary>
          <div className="px-4 pb-4">
            <ListaOrdenes
              ordenes={alistamiento}
              etiqueta="alistamiento"
              vacio="No hay órdenes en alistamiento."
              onAbrir={flujo.abrir}
            />
          </div>
        </details>
      </div>
      {flujo.seleccion ? <DialogoOrden flujo={flujo} orden={flujo.seleccion} /> : null}
    </main>
  );
}

function DialogoOrden({
  flujo,
  orden,
}: {
  flujo: FlujoDespacho;
  orden: OrdenDespachoPublico;
}) {
  return (
    <DespachoOrdenDialog
      orden={orden}
      despachador={flujo.despachador}
      transportista={flujo.transportista}
      error={flujo.error}
      enviando={flujo.enviando}
      confirmando={flujo.confirmando}
      preguntarDefault={flujo.preguntarDefault}
      onDespachador={flujo.setDespachador}
      onTransportista={flujo.setTransportista}
      onCerrar={flujo.cerrar}
      onPasar={flujo.pasar}
      onVolver={flujo.volver}
      onConfirmar={flujo.confirmar}
      onUsarNuevo={flujo.usarNuevo}
      onDejarAnterior={flujo.dejarAnterior}
    />
  );
}

function ListaOrdenes({
  ordenes,
  etiqueta,
  vacio,
  onAbrir,
}: {
  ordenes: OrdenDespachoPublico[];
  etiqueta: string;
  vacio: string;
  onAbrir: (orden: OrdenDespachoPublico) => void;
}) {
  if (ordenes.length === 0) {
    return <p className="polaria-text-body text-polaria-w-50">{vacio}</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {ordenes.map((orden) => (
        <li key={orden.idOrdenVenta}>
          <button
            type="button"
            className="w-full rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3 text-left"
            onClick={() => onAbrir(orden)}
          >
            <span className="polaria-text-body">{orden.codigo}</span>
            <span className="polaria-text-body-sm block text-polaria-w-50">
              {orden.nombreCliente} · {etiqueta}
            </span>
            <DatosOrden orden={orden} />
          </button>
        </li>
      ))}
    </ul>
  );
}
