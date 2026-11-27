import {
  preguntaConfirmacionDespacho,
  type OrdenDespachoPublico,
} from "@/modules/sales/ordenes/despacho/despacho-publico";

export function DatosOrden({ orden }: { orden: OrdenDespachoPublico }) {
  return (
    <span className="polaria-text-body-sm block text-polaria-w-50">
      {orden.denominacionComercial} · {orden.cantidadOrdenesTrabajo} OT · OC {orden.ordenCompraCliente}
    </span>
  );
}

export function DespachoQuienDespacha({
  nombre,
  errorCarga,
  error,
  onNombre,
  onContinuar,
}: {
  nombre: string;
  errorCarga: string | null;
  error: string | null;
  onNombre: (nombre: string) => void;
  onContinuar: () => void;
}) {
  return (
    <main className="min-h-screen bg-polaria-bg px-4 py-8 text-polaria-w">
      <form
        className="mx-auto flex w-full max-w-lg flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onContinuar();
        }}
      >
        <header>
          <h1 className="polaria-text-card-title">Despacho</h1>
          <p className="polaria-text-subtitle">Quién va a despachar</p>
        </header>
        {errorCarga ? (
          <p className="polaria-text-body" role="alert">{errorCarga}</p>
        ) : null}
        <CampoNombre
          etiqueta="Quién despachó la mercancía"
          valor={nombre}
          onChange={onNombre}
        />
        {error ? (
          <p className="polaria-text-body" role="alert">{error}</p>
        ) : null}
        <button
          type="submit"
          className="rounded-xl bg-polaria-teal px-4 py-3 font-semibold text-polaria-on-teal hover:opacity-90"
        >
          Continuar
        </button>
      </form>
    </main>
  );
}

export interface DialogoDespachoProps {
  orden: OrdenDespachoPublico;
  despachador: string;
  transportista: string;
  error: string | null;
  enviando: boolean;
  confirmando: boolean;
  preguntarDefault: boolean;
  onDespachador: (nombre: string) => void;
  onTransportista: (nombre: string) => void;
  onCerrar: () => void;
  onPasar: () => void;
  onVolver: () => void;
  onConfirmar: () => void;
  onUsarNuevo: () => void;
  onDejarAnterior: () => void;
}

export function DespachoOrdenDialog(props: DialogoDespachoProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-polaria-bg/80 px-4 py-6 sm:items-center"
      onClick={(event) => {
        if (event.target === event.currentTarget) event.preventDefault();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="despacho-titulo"
        className="w-full max-w-lg rounded-2xl border border-polaria-t-20 bg-polaria-bg p-5"
      >
        <EncabezadoOrden orden={props.orden} />
        <CuerpoDialogo {...props} />
      </div>
    </div>
  );
}

function EncabezadoOrden({ orden }: { orden: OrdenDespachoPublico }) {
  return (
    <>
      <h2 id="despacho-titulo" className="polaria-text-card-title">{orden.codigo}</h2>
      <p className="polaria-text-body">{orden.nombreCliente}</p>
      <p className="polaria-text-subtitle mb-4">{orden.estado}</p>
      <DatosOrden orden={orden} />
    </>
  );
}

function CuerpoDialogo(props: DialogoDespachoProps) {
  if (props.preguntarDefault) {
    return (
      <PreguntaDefault onUsarNuevo={props.onUsarNuevo} onDejarAnterior={props.onDejarAnterior} />
    );
  }
  if (props.confirmando) {
    return (
      <ConfirmacionDespacho
        orden={props.orden}
        despachador={props.despachador}
        transportista={props.transportista}
        error={props.error}
        enviando={props.enviando}
        onVolver={props.onVolver}
        onConfirmar={props.onConfirmar}
      />
    );
  }
  return (
    <FormularioDespacho
      despachador={props.despachador}
      transportista={props.transportista}
      error={props.error}
      onDespachador={props.onDespachador}
      onTransportista={props.onTransportista}
      onCerrar={props.onCerrar}
      onPasar={props.onPasar}
    />
  );
}

function PreguntaDefault({
  onUsarNuevo,
  onDejarAnterior,
}: {
  onUsarNuevo: () => void;
  onDejarAnterior: () => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-4">
      <p className="polaria-text-body">
        Cambiaste quién despacha. ¿Este nombre se repite en las siguientes órdenes?
      </p>
      <button
        type="button"
        className="rounded-xl bg-polaria-teal px-4 py-3 font-semibold text-polaria-on-teal hover:opacity-90"
        onClick={onUsarNuevo}
      >
        Usar este nombre en las siguientes
      </button>
      <button
        type="button"
        className="rounded-xl border border-polaria-t-20 px-4 py-3 text-polaria-w"
        onClick={onDejarAnterior}
      >
        Dejar el anterior
      </button>
    </div>
  );
}

function ConfirmacionDespacho({
  orden,
  despachador,
  transportista,
  error,
  enviando,
  onVolver,
  onConfirmar,
}: {
  orden: OrdenDespachoPublico;
  despachador: string;
  transportista: string;
  error: string | null;
  enviando: boolean;
  onVolver: () => void;
  onConfirmar: () => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-4">
      <p className="polaria-text-body">Quién despacha: {despachador}</p>
      <p className="polaria-text-body">Transportista: {transportista}</p>
      <p className="polaria-text-body">
        {preguntaConfirmacionDespacho(orden.codigo, orden.nombreCliente)}
      </p>
      {error ? <p className="polaria-text-body" role="alert">{error}</p> : null}
      <button
        type="button"
        disabled={enviando}
        className="rounded-xl bg-polaria-teal px-4 py-3 font-semibold text-polaria-on-teal hover:opacity-90 disabled:opacity-40"
        onClick={onConfirmar}
      >
        Sí, despachar
      </button>
      <button
        type="button"
        disabled={enviando}
        className="rounded-xl border border-polaria-t-20 px-4 py-3 text-polaria-w"
        onClick={onVolver}
      >
        Volver
      </button>
    </div>
  );
}

function CampoNombre({
  etiqueta,
  valor,
  onChange,
}: {
  etiqueta: string;
  valor: string;
  onChange: (nombre: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="polaria-text-body-sm">{etiqueta}</span>
      <input
        className="rounded-xl border border-polaria-t-20 bg-polaria-w-08 px-3 py-3 text-polaria-w"
        value={valor}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="name"
      />
    </label>
  );
}

function FormularioDespacho({
  despachador,
  transportista,
  error,
  onDespachador,
  onTransportista,
  onCerrar,
  onPasar,
}: {
  despachador: string;
  transportista: string;
  error: string | null;
  onDespachador: (nombre: string) => void;
  onTransportista: (nombre: string) => void;
  onCerrar: () => void;
  onPasar: () => void;
}) {
  return (
    <form
      className="mt-4 flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onPasar();
      }}
    >
      <CampoNombre
        etiqueta="Quién despachó la mercancía"
        valor={despachador}
        onChange={onDespachador}
      />
      <CampoNombre etiqueta="Transportista" valor={transportista} onChange={onTransportista} />
      {error ? <p className="polaria-text-body" role="alert">{error}</p> : null}
      <button
        type="submit"
        className="rounded-xl bg-polaria-teal px-4 py-3 font-semibold text-polaria-on-teal hover:opacity-90"
      >
        Pasar a despachada
      </button>
      <button
        type="button"
        className="rounded-xl border border-polaria-t-20 px-4 py-3 text-polaria-w"
        onClick={onCerrar}
      >
        Cerrar
      </button>
    </form>
  );
}
