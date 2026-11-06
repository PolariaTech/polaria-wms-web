"use client";

import { Check } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import {
  PolariaFormField,
  POLARIA_FORM_SELECT_CLASS_COMPACT,
} from "@/components/shared/form/PolariaFormField";
import { cn } from "@/lib/utils/cn";

/** El resumen no se elige: la impresión rápida siempre lo lleva de primera hoja. */
export type TipoDocumentoRapida = "ot" | "oc" | "factura";

/** Lo que se incluye por defecto: lo único que hoy se puede imprimir. */
export const TIPOS_RAPIDA_INICIALES: ReadonlySet<TipoDocumentoRapida> = new Set(["ot"]);

interface OpcionTipo {
  id: TipoDocumentoRapida;
  etiqueta: string;
  /** Las facturas todavía no existen: esa opción queda apagada hasta que se construyan. */
  disponible: boolean;
}

/** Lo que se puede incluir en el paquete de cada OV (daily del 2026-11-05 y REQ-260). */
const OPCIONES: readonly OpcionTipo[] = [
  { id: "ot", etiqueta: "Órdenes de tarea", disponible: true },
  // REQ-260: los adjuntos HTML, PDF y Excel de la OV, detrás de sus órdenes de tarea.
  { id: "oc", etiqueta: "Órdenes de compra originales", disponible: true },
  { id: "factura", etiqueta: "Facturas", disponible: false },
];

const CONTROL =
  "h-11 [@media(max-height:50rem)]:h-9 border-polaria-w-20 text-left focus-visible:border-polaria-teal focus-visible:ring-2 focus-visible:ring-polaria-teal";

function textoDelBoton(elegidos: ReadonlySet<TipoDocumentoRapida>): string {
  if (elegidos.size === 0) return "Elige al menos un tipo";
  const elegidas = OPCIONES.filter((opcion) => elegidos.has(opcion.id));
  return elegidas.length === 1 ? elegidas[0]!.etiqueta : `${elegidas.length} tipos de documentos`;
}

interface ImpresionRapidaTiposProps {
  value: ReadonlySet<TipoDocumentoRapida>;
  onChange: (siguiente: ReadonlySet<TipoDocumentoRapida>) => void;
  disabled?: boolean;
}

/**
 * «Tipo de documentos» de la Impresión rápida: una lista desplegable de selección múltiple.
 * Las opciones que aún no existen se ven apagadas y dicen «Próximamente» al pasar el mouse o al
 * llegar con el teclado (el texto siempre está en el DOM, así que los lectores de pantalla lo leen).
 */
export function ImpresionRapidaTipos({ value, onChange, disabled = false }: ImpresionRapidaTiposProps) {
  const base = useId();
  const idBoton = `${base}-boton`;
  const idLista = `${base}-lista`;
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const contenedor = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLUListElement>(null);

  // Al abrir, el foco pasa a la lista para poder moverse con las flechas.
  useEffect(() => {
    if (abierto) lista.current?.focus();
  }, [abierto]);

  // Un clic fuera la cierra.
  useEffect(() => {
    if (!abierto) return;
    const cerrarSiEsFuera = (event: MouseEvent) => {
      if (!contenedor.current?.contains(event.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", cerrarSiEsFuera);
    return () => document.removeEventListener("mousedown", cerrarSiEsFuera);
  }, [abierto]);

  const cerrar = (devolverFoco: boolean) => {
    setAbierto(false);
    if (devolverFoco) boton.current?.focus();
  };

  const alternar = (opcion: OpcionTipo) => {
    if (!opcion.disponible) return;
    const siguiente = new Set(value);
    if (siguiente.has(opcion.id)) siguiente.delete(opcion.id);
    else siguiente.add(opcion.id);
    onChange(siguiente);
  };

  const teclasDelBoton = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setAbierto(true);
    }
  };

  const teclasDeLaLista = (event: KeyboardEvent<HTMLUListElement>) => {
    const ultimo = OPCIONES.length - 1;
    const mover: Record<string, number> = {
      ArrowDown: Math.min(activo + 1, ultimo),
      ArrowUp: Math.max(activo - 1, 0),
      Home: 0,
      End: ultimo,
    };
    if (event.key in mover) {
      event.preventDefault();
      setActivo(mover[event.key]!);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      alternar(OPCIONES[activo]!);
    } else if (event.key === "Escape") {
      event.preventDefault();
      cerrar(true);
    } else if (event.key === "Tab") {
      cerrar(false);
    }
  };

  return (
    <PolariaFormField id={idBoton} label="Tipo de documentos" compact className="min-w-0">
      <div ref={contenedor} className="relative">
        <button
          ref={boton}
          id={idBoton}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={abierto}
          aria-controls={idLista}
          onClick={() => setAbierto((actual) => !actual)}
          onKeyDown={teclasDelBoton}
          className={cn(POLARIA_FORM_SELECT_CLASS_COMPACT, CONTROL, "truncate")}
        >
          {textoDelBoton(value)}
        </button>

        {abierto ? (
          <ul
            ref={lista}
            id={idLista}
            role="listbox"
            aria-multiselectable="true"
            aria-labelledby={idBoton}
            aria-activedescendant={`${base}-op-${OPCIONES[activo]!.id}`}
            tabIndex={-1}
            onKeyDown={teclasDeLaLista}
            className="absolute left-0 right-0 top-full z-20 mt-1 flex flex-col gap-0.5 rounded-xl border border-polaria-w-20 bg-polaria-bg p-1 shadow-lg outline-none"
          >
            {OPCIONES.map((opcion, indice) => {
              const marcada = value.has(opcion.id);
              const enfocada = indice === activo;
              return (
                <li
                  key={opcion.id}
                  id={`${base}-op-${opcion.id}`}
                  role="option"
                  aria-selected={marcada}
                  aria-disabled={!opcion.disponible || undefined}
                  onMouseEnter={() => setActivo(indice)}
                  onClick={() => alternar(opcion)}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium",
                    opcion.disponible ? "cursor-pointer text-polaria-w" : "cursor-not-allowed text-polaria-w-50",
                    enfocada && "bg-polaria-w-08",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      marcada ? "border-polaria-teal bg-polaria-teal text-polaria-on-teal" : "border-polaria-w-20",
                      !opcion.disponible && "opacity-60",
                    )}
                  >
                    {marcada ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{opcion.etiqueta}</span>
                  {opcion.disponible ? null : (
                    <span
                      className={cn(
                        "shrink-0 rounded-md border border-polaria-w-20 px-1.5 py-0.5 text-[0.6875rem] font-semibold leading-none text-polaria-w opacity-0 transition-opacity duration-150 group-hover:opacity-100 motion-reduce:transition-none",
                        enfocada && "opacity-100",
                      )}
                    >
                      Próximamente
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </PolariaFormField>
  );
}
