"use client";

import { Moon, Sun } from "lucide-react";
import { useState, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { leerCfdiParaVista, type CfdiVista } from "../utils/xml-cfdi";
import { formatearXmlParaVista } from "../utils/xml-vista";

function dinero(valor: string, moneda: string): string {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || valor === "") return valor || "—";
  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: moneda.length === 3 ? moneda : "MXN",
    }).format(numero);
  } catch {
    return valor;
  }
}

function fechaCorta(valor: string): string {
  const [dia, hora] = valor.split("T");
  const partes = dia?.split("-") ?? [];
  if (partes.length !== 3) return valor;
  return `${partes[2]}/${partes[1]}/${partes[0]}${hora ? ` ${hora.slice(0, 5)}` : ""}`;
}

function clasesPapel(oscuro: boolean) {
  return oscuro
    ? {
        hoja: "bg-[#020609] text-[#f8f8f6]",
        muted: "text-[#f8f8f6]/55",
        titulo: "text-[#f8f8f6]",
        linea: "border-white/10",
      }
    : {
        hoja: "bg-white text-neutral-800",
        muted: "text-neutral-500",
        titulo: "text-neutral-900",
        linea: "border-neutral-200",
      };
}

/** Colores fijos: `polaria-text-*` y el teal neón del tema oscuro no se leen sobre papel blanco. */
function BotonSobrePapel({
  oscuro,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { oscuro: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-semibold",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009e8f]",
        oscuro
          ? "border-[#00e5cc]/40 text-[#00e5cc] hover:bg-[#00e5cc]/10"
          : "border-[#007a70] bg-[#009e8f] text-white hover:bg-[#007a70]",
      )}
    >
      {children}
    </button>
  );
}

function BotonDeFondo({ oscuro, onCambiar }: { oscuro: boolean; onCambiar: () => void }) {
  const Icono = oscuro ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={onCambiar}
      aria-pressed={oscuro}
      aria-label={oscuro ? "Usar fondo claro" : "Usar modo oscuro de Polaria"}
      title={oscuro ? "Usar fondo claro" : "Usar modo oscuro de Polaria"}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl border",
        oscuro
          ? "border-white/15 text-[#f8f8f6] hover:bg-white/10"
          : "border-neutral-300 text-neutral-700 hover:bg-neutral-100",
      )}
    >
      <Icono className="h-4 w-4" strokeWidth={1.75} aria-hidden />
    </button>
  );
}

function Parte({
  etiqueta,
  valor,
  extra,
  muted,
  titulo,
}: {
  etiqueta: string;
  valor: string;
  extra?: string;
  muted: string;
  titulo: string;
}) {
  return (
    <div>
      <p className={cn("text-xs", muted)}>{etiqueta}</p>
      <p className={cn("font-medium", titulo)}>{valor}</p>
      {extra ? <p className={cn("text-xs", muted)}>{extra}</p> : null}
    </div>
  );
}

function TablaConceptos({
  cfdi,
  linea,
}: {
  cfdi: CfdiVista;
  linea: string;
}) {
  if (cfdi.lineas.length === 0) return null;
  return (
    <table className="mt-5 w-full text-left">
      <thead>
        <tr className={cn("border-b text-xs", linea, "text-inherit opacity-70")}>
          <th className="py-2 font-medium">Descripción</th>
          <th className="py-2 text-right font-medium">Cant.</th>
          <th className="py-2 text-right font-medium">Importe</th>
        </tr>
      </thead>
      <tbody>
        {cfdi.lineas.map((renglon) => (
          <tr key={`${renglon.descripcion}-${renglon.importe}`} className={cn("border-b", linea)}>
            <td className="py-2 pr-3">{renglon.descripcion}</td>
            <td className="py-2 text-right tabular-nums">{renglon.cantidad}</td>
            <td className="py-2 text-right tabular-nums">{dinero(renglon.importe, cfdi.moneda)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DocumentoCfdi({
  cfdi,
  oscuro,
  onVerXml,
  onFondo,
}: {
  cfdi: CfdiVista;
  oscuro: boolean;
  onVerXml: () => void;
  onFondo: () => void;
}) {
  const papel = clasesPapel(oscuro);
  return (
    <article className={cn("p-5 text-sm", papel.hoja)}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={cn("text-xs tracking-wide uppercase", papel.muted)}>{cfdi.tipo}</p>
          <p className={cn("text-lg font-semibold", papel.titulo)}>Folio {cfdi.folio}</p>
          <p className={papel.muted}>{fechaCorta(cfdi.fecha)}</p>
        </div>
        <div className="flex items-center gap-2">
          <BotonDeFondo oscuro={oscuro} onCambiar={onFondo} />
          <BotonSobrePapel oscuro={oscuro} onClick={onVerXml}>
            Ver XML
          </BotonSobrePapel>
        </div>
      </header>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Parte etiqueta="Emisor" valor={cfdi.emisor} extra={cfdi.emisorRfc} muted={papel.muted} titulo={papel.titulo} />
        <Parte etiqueta="Receptor" valor={cfdi.receptor} extra={cfdi.receptorRfc} muted={papel.muted} titulo={papel.titulo} />
      </div>
      <TablaConceptos cfdi={cfdi} linea={papel.linea} />
      <p className="mt-4 text-right">
        {cfdi.subtotal ? (
          <span className={cn("mr-4", papel.muted)}>Subtotal {dinero(cfdi.subtotal, cfdi.moneda)}</span>
        ) : null}
        <span className={cn("font-semibold", papel.titulo)}>Total {dinero(cfdi.total, cfdi.moneda)}</span>
      </p>
    </article>
  );
}

/** CFDI como documento; si no es del SAT, el XML indentado. Se puede alternar. */
export function CuerpoXmlAdjunto({ texto }: { texto: string }) {
  const cfdi = leerCfdiParaVista(texto);
  const [fuente, setFuente] = useState(false);
  const [oscuro, setOscuro] = useState(false);
  const papel = clasesPapel(oscuro);
  const cambiarFondo = () => setOscuro((actual) => !actual);
  if (cfdi && !fuente) {
    return (
      <DocumentoCfdi
        cfdi={cfdi}
        oscuro={oscuro}
        onVerXml={() => setFuente(true)}
        onFondo={cambiarFondo}
      />
    );
  }
  return (
    <div className={cn("flex min-h-full flex-col", papel.hoja)}>
      <div className="flex justify-end gap-2 p-3">
        <BotonDeFondo oscuro={oscuro} onCambiar={cambiarFondo} />
        {cfdi ? (
          <BotonSobrePapel oscuro={oscuro} onClick={() => setFuente(false)}>
            Ver documento
          </BotonSobrePapel>
        ) : null}
      </div>
      <pre className="min-h-full whitespace-pre-wrap break-all p-4 font-mono text-xs leading-5">
        {formatearXmlParaVista(texto)}
      </pre>
    </div>
  );
}
