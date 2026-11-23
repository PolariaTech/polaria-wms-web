"use client";

import { Download, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { PolariaRemoteImage } from "@/components/shared/media/PolariaRemoteImage";
import { descargarAdjunto } from "../services/correos.client";
import type { AdjuntoCorreo } from "../types/correos.types";
import { esVistaPreviaXml, mensajeDeError } from "../utils/correos-formato";
import { BOTON_SECUNDARIO } from "./AccionIngreso";
import { CuerpoXmlAdjunto } from "./XmlDocumentoCfdi";

function esImagen(mimeType: string): boolean {
  return /^image\/(png|jpe?g|gif|webp)$/i.test(mimeType.trim());
}

function guardarComoArchivo(url: string, nombre: string): void {
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
}

function guardarTexto(texto: string, nombre: string): void {
  const blobUrl = URL.createObjectURL(new Blob([texto], { type: "application/xml" }));
  guardarComoArchivo(blobUrl, nombre);
  URL.revokeObjectURL(blobUrl);
}

/**
 * PDF, imagen o XML en la columna del mensaje (REQ-317). El archivo se baja con la sesión;
 * PDF e imagen van como blob (el api manda `X-Frame-Options: DENY`); el CFDI se ve como documento.
 */
export function VisorAdjuntoCorreo({
  messageId,
  adjunto,
  onCerrar,
}: {
  messageId: string;
  adjunto: AdjuntoCorreo;
  onCerrar: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [textoXml, setTextoXml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    let creado: string | null = null;
    setUrl(null);
    setTextoXml(null);
    setError(null);
    descargarAdjunto(messageId, adjunto.indice)
      .then(async (archivo) => {
        if (esVistaPreviaXml(adjunto.mimeType, adjunto.nombre)) {
          const texto = await archivo.text();
          if (!cancelado) setTextoXml(texto);
          return;
        }
        const blobUrl = URL.createObjectURL(archivo);
        if (cancelado) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        creado = blobUrl;
        setUrl(blobUrl);
      })
      .catch((causa: unknown) => {
        if (!cancelado) setError(mensajeDeError(causa));
      });
    return () => {
      cancelado = true;
      if (creado) URL.revokeObjectURL(creado);
    };
  }, [messageId, adjunto.indice, adjunto.mimeType, adjunto.nombre]);

  return (
    <section
      aria-label={`Vista previa de ${adjunto.nombre}`}
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-3"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <p className="polaria-text-body min-w-0 truncate font-semibold">{adjunto.nombre}</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCerrar} className={BOTON_SECUNDARIO}>
            <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Cerrar
          </button>
          <button
            type="button"
            disabled={!url && textoXml == null}
            onClick={() => {
              if (url) guardarComoArchivo(url, adjunto.nombre);
              else if (textoXml != null) guardarTexto(textoXml, adjunto.nombre);
            }}
            aria-label={`Descargar ${adjunto.nombre}`}
            className={BOTON_SECUNDARIO}
          >
            <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Descargar
          </button>
        </div>
      </header>
      {error ? (
        <p role="alert" className="polaria-text-body-sm text-polaria-danger">
          {error}
        </p>
      ) : null}
      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-polaria-w-08 bg-polaria-bg">
        {!url && textoXml == null && !error ? (
          <div className="flex min-h-[24rem] items-center justify-center text-polaria-w-50">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            <span className="sr-only">Cargando adjunto</span>
          </div>
        ) : null}
        {url && esImagen(adjunto.mimeType) ? (
          <PolariaRemoteImage
            src={url}
            alt={adjunto.nombre}
            width={1200}
            height={900}
            className="mx-auto h-auto max-w-full"
          />
        ) : null}
        {textoXml != null ? <CuerpoXmlAdjunto texto={textoXml} /> : null}
        {url && !esImagen(adjunto.mimeType) ? (
          <iframe
            title={`Vista previa de ${adjunto.nombre}`}
            src={url}
            className="h-full min-h-[24rem] w-full border-0"
          />
        ) : null}
      </div>
    </section>
  );
}
