"use client";

import { useState } from "react";
import {
  DECISIONES_RECEPCION,
  etiquetaNumeroOt,
  preguntaRecepcion,
  validarDecisionRecepcion,
  type DecisionRecepcion,
} from "@/modules/sales/ordenes/print-batch/recepcion-prefactura";

interface RecepcionPrefacturaFormProps {
  empresa: string;
  ov: string;
  ot: string;
  nombreEmpresa: string;
  cliente: string;
  numeroOt: string;
  totalOt: string;
  centroConsumo: string;
}

function DatoRecepcion({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const visible = valor.trim();
  if (!visible) return null;
  return (
    <div className="border-t border-polaria-t-20 px-4 py-3">
      <dt className="polaria-text-label text-polaria-w-50">{etiqueta}</dt>
      <dd className="mt-1 text-base font-semibold leading-snug text-polaria-w">{visible}</dd>
    </div>
  );
}

function FichaRecepcion({
  empresa,
  ov,
  nombreEmpresa,
  cliente,
  numeroOt,
  centroConsumo,
}: RecepcionPrefacturaFormProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-t-08">
      <p className="px-4 pb-1 pt-4 text-2xl font-bold leading-tight text-polaria-teal">{ov}</p>
      <dl>
        <DatoRecepcion etiqueta="Empresa" valor={nombreEmpresa || empresa} />
        <DatoRecepcion etiqueta="Cliente" valor={cliente} />
        <DatoRecepcion
          etiqueta="Orden de tarea"
          valor={etiquetaNumeroOt(numeroOt)}
        />
        <DatoRecepcion etiqueta="Centro de consumo" valor={centroConsumo} />
      </dl>
    </section>
  );
}

function OpcionesDecision({
  decision,
  onElegir,
}: {
  decision: DecisionRecepcion | "";
  onElegir: (valor: DecisionRecepcion) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="polaria-text-label mb-1 text-polaria-w-50">Decisión</legend>
      {DECISIONES_RECEPCION.map((opcion) => (
        <label
          key={opcion.valor}
          className="flex items-center gap-3 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3"
        >
          <input
            type="radio"
            name="decision"
            value={opcion.valor}
            checked={decision === opcion.valor}
            onChange={() => onElegir(opcion.valor)}
          />
          <span className="polaria-text-body">{opcion.etiqueta}</span>
        </label>
      ))}
    </fieldset>
  );
}

function AccionesDecision({
  pregunta,
  onPedir,
  onConfirmar,
  onVolver,
}: {
  pregunta: string | null;
  onPedir: () => void;
  onConfirmar: () => void;
  onVolver: () => void;
}) {
  if (!pregunta) {
    return (
      <button
        type="button"
        className="rounded-xl bg-polaria-teal px-4 py-3 font-semibold text-polaria-on-teal"
        onClick={onPedir}
      >
        Confirmar
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="polaria-text-body">{pregunta}</p>
      <button
        type="button"
        className="rounded-xl bg-polaria-teal px-4 py-3 font-semibold text-polaria-on-teal"
        onClick={onConfirmar}
      >
        Sí, confirmar
      </button>
      <button
        type="button"
        className="rounded-xl border border-polaria-t-20 px-4 py-3 text-polaria-w"
        onClick={onVolver}
      >
        Volver
      </button>
    </div>
  );
}

function PantallaLista(props: RecepcionPrefacturaFormProps) {
  return (
    <main className="min-h-screen bg-polaria-bg px-4 py-8 text-polaria-w">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
        <h1 className="polaria-text-card-title">Recepción de prefactura</h1>
        <FichaRecepcion {...props} />
        <p className="polaria-text-body">Próximamente</p>
      </div>
    </main>
  );
}

export function RecepcionPrefacturaForm(props: RecepcionPrefacturaFormProps) {
  const [decision, setDecision] = useState<DecisionRecepcion | "">("");
  const [pregunta, setPregunta] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  if (listo) return <PantallaLista {...props} />;

  function pedirConfirmacion() {
    const fallo = validarDecisionRecepcion(decision);
    setError(fallo);
    setPregunta(fallo ? null : preguntaRecepcion(decision));
  }

  return (
    <main className="min-h-screen bg-polaria-bg px-4 py-8 text-polaria-w">
      <form
        className="mx-auto flex w-full max-w-lg flex-col gap-5"
        method="post"
        onSubmit={(event) => event.preventDefault()}
      >
        <h1 className="polaria-text-card-title">Recepción de prefactura</h1>
        <FichaRecepcion {...props} />
        <OpcionesDecision
          decision={decision}
          onElegir={(valor) => {
            setDecision(valor);
            setPregunta(null);
            setError(null);
          }}
        />
        {error ? (
          <p className="polaria-text-body" role="alert">
            {error}
          </p>
        ) : null}
        <AccionesDecision
          pregunta={pregunta}
          onPedir={pedirConfirmacion}
          onConfirmar={() => setListo(true)}
          onVolver={() => setPregunta(null)}
        />
      </form>
    </main>
  );
}
