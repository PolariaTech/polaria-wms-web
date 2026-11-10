"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  preguntaConfirmacionDespacho,
  validarConfirmacionDespacho,
  type OrdenDespachoPublico,
} from "@/modules/sales/ordenes/despacho/despacho-publico";

interface DespachoPublicoListaProps {
  alistada: OrdenDespachoPublico[];
  alistamiento: OrdenDespachoPublico[];
  errorCarga: string | null;
}

export function DespachoPublicoLista({
  alistada,
  alistamiento,
  errorCarga,
}: DespachoPublicoListaProps) {
  const router = useRouter();
  const [seleccion, setSeleccion] = useState<OrdenDespachoPublico | null>(null);
  const [despachador, setDespachador] = useState("");
  const [transportista, setTransportista] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function abrir(orden: OrdenDespachoPublico) {
    setSeleccion(orden);
    setDespachador("");
    setTransportista("");
    setConfirmando(false);
    setError(null);
  }

  function cerrar() {
    if (enviando) return;
    setSeleccion(null);
  }

  function pasarAConfirmacion() {
    if (!seleccion) return;
    const validacion = validarConfirmacionDespacho({
      idOrdenVenta: seleccion.idOrdenVenta,
      codigoCuenta: seleccion.codigoCuenta,
      despachador,
      transportista,
    });
    if (!validacion.ok) {
      setError(validacion.error);
      return;
    }
    setDespachador(validacion.value.despachador);
    setTransportista(validacion.value.transportista);
    setError(null);
    setConfirmando(true);
  }

  async function confirmar() {
    if (!seleccion) return;
    const validacion = validarConfirmacionDespacho({
      idOrdenVenta: seleccion.idOrdenVenta,
      codigoCuenta: seleccion.codigoCuenta,
      despachador,
      transportista,
    });
    if (!validacion.ok) {
      setError(validacion.error);
      setConfirmando(false);
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await fetch("/despacho/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validacion.value),
      });
      const cuerpo = (await respuesta.json()) as { ok?: boolean; error?: string };
      if (!respuesta.ok || !cuerpo.ok) {
        setError(cuerpo.error || "No se pudo confirmar el despacho.");
        return;
      }
      setSeleccion(null);
      router.refresh();
    } catch {
      setError("No se pudo confirmar el despacho.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-polaria-bg px-4 py-8 text-polaria-w">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <header>
          <h1 className="polaria-text-card-title">Despacho</h1>
          <p className="polaria-text-subtitle">Órdenes en alistada</p>
        </header>

        {errorCarga ? (
          <p className="polaria-text-body" role="alert">
            {errorCarga}
          </p>
        ) : null}

        <ul className="flex flex-col gap-2">
          {alistada.length === 0 ? (
            <li className="polaria-text-body text-polaria-w-50">
              No hay órdenes en alistada.
            </li>
          ) : (
            alistada.map((orden) => (
              <li key={orden.idOrdenVenta}>
                <button
                  type="button"
                  className="w-full rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3 text-left"
                  onClick={() => abrir(orden)}
                >
                  <span className="polaria-text-body">{orden.codigo}</span>
                  <span className="polaria-text-body-sm block text-polaria-w-50">
                    {orden.nombreCliente} · alistada
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>

        <details className="rounded-xl border border-polaria-t-20 bg-polaria-t-08">
          <summary className="cursor-pointer px-4 py-3 polaria-text-body">
            alistamiento ({alistamiento.length})
          </summary>
          <ul className="flex flex-col gap-2 px-4 pb-4">
            {alistamiento.length === 0 ? (
              <li className="polaria-text-body text-polaria-w-50">
                No hay órdenes en alistamiento.
              </li>
            ) : (
              alistamiento.map((orden) => (
                <li key={orden.idOrdenVenta}>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-polaria-t-20 px-4 py-3 text-left"
                    onClick={() => abrir(orden)}
                  >
                    <span className="polaria-text-body">{orden.codigo}</span>
                    <span className="polaria-text-body-sm block text-polaria-w-50">
                      {orden.nombreCliente} · alistamiento
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </details>
      </div>

      {seleccion ? (
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
            <h2 id="despacho-titulo" className="polaria-text-card-title">
              {seleccion.codigo}
            </h2>
            <p className="polaria-text-body">{seleccion.nombreCliente}</p>
            <p className="polaria-text-subtitle mb-4">{seleccion.estado}</p>
            {confirmando ? (
              <div className="flex flex-col gap-4">
                <p className="polaria-text-body">
                  {preguntaConfirmacionDespacho(
                    seleccion.codigo,
                    seleccion.nombreCliente,
                  )}
                </p>
                {error ? (
                  <p className="polaria-text-body" role="alert">
                    {error}
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={enviando}
                  className="rounded-xl bg-polaria-teal px-4 py-3 font-semibold text-polaria-on-teal hover:opacity-90 disabled:opacity-40"
                  onClick={() => void confirmar()}
                >
                  Sí, despachar
                </button>
                <button
                  type="button"
                  disabled={enviando}
                  className="rounded-xl border border-polaria-t-20 px-4 py-3 text-polaria-w"
                  onClick={() => setConfirmando(false)}
                >
                  Volver
                </button>
              </div>
            ) : (
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                pasarAConfirmacion();
              }}
            >
              <label className="flex flex-col gap-1">
                <span className="polaria-text-body-sm">
                  Quién despachó la mercancía
                </span>
                <input
                  className="rounded-xl border border-polaria-t-20 bg-polaria-w-08 px-3 py-3 text-polaria-w"
                  value={despachador}
                  onChange={(event) => setDespachador(event.target.value)}
                  autoComplete="name"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="polaria-text-body-sm">Transportista</span>
                <input
                  className="rounded-xl border border-polaria-t-20 bg-polaria-w-08 px-3 py-3 text-polaria-w"
                  value={transportista}
                  onChange={(event) => setTransportista(event.target.value)}
                  autoComplete="name"
                />
              </label>
              {error ? (
                <p className="polaria-text-body" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                className="rounded-xl bg-polaria-teal px-4 py-3 font-semibold text-polaria-on-teal hover:opacity-90"
              >
                Pasar a despachada
              </button>
              <button
                type="button"
                className="rounded-xl border border-polaria-t-20 px-4 py-3 text-polaria-w"
                onClick={cerrar}
              >
                Cerrar
              </button>
            </form>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
