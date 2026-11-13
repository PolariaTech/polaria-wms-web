"use client";

import { Download, Eye, FileText } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  canPreviewOrigenAdjunto,
  dedupeOrigenAdjuntos,
  isBrokenCloudinaryPdfUrl,
  labelTipoOrigenAdjunto,
  origenAdjuntoDownloadUrl,
  origenAdjuntoViewUrl,
  type OrigenAdjunto,
} from "../../utils/origen/origen-adjuntos";

/** Iconos de tarjeta: mismo tamaño en preview, tipo y acciones (REQ-102). */
const ICONO_ADJUNTO_CLASS = "h-3 w-3 shrink-0";

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function OrigenAdjuntosCards({
  adjuntos,
  className,
  /** REQ-266: si hay callback, el ojo previsualiza dockeado (no abre pestaña). */
  onPreviewAdjunto,
}: {
  adjuntos: readonly OrigenAdjunto[];
  className?: string;
  onPreviewAdjunto?: (item: OrigenAdjunto, viewUrl: string) => void;
}) {
  const unique = dedupeOrigenAdjuntos(adjuntos);
  if (unique.length === 0) return null;

  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="polaria-text-caption text-polaria-w-50">
        {unique.length === 1
          ? "1 archivo adjunto"
          : `${unique.length} archivos adjuntos`}
      </p>
      {/* REQ-102: tarjetas uniformes y compactas; grid responsivo en Cypher. */}
      <ul className="grid grid-cols-2 gap-1 min-[360px]:grid-cols-3 min-[520px]:grid-cols-4">
        {unique.map((item, index) => {
          const url = item.url?.trim() || "";
          const path = item.path?.trim() || "";
          const viewUrl = origenAdjuntoViewUrl(item);
          const downloadUrl = origenAdjuntoDownloadUrl(item);
          const hasFile = Boolean(
            path || (url && !isBrokenCloudinaryPdfUrl(url)),
          );
          const tipo = labelTipoOrigenAdjunto(item);
          const previewable = canPreviewOrigenAdjunto(item);
          const size = formatBytes(item.bytes);

          return (
            <li
              key={`${item.nombre}-${index}`}
              data-adjunto-card=""
              className="flex h-[5.25rem] min-w-0 flex-col overflow-hidden rounded-md border border-polaria-t-20 bg-polaria-bg/40"
            >
              <div className="flex h-10 shrink-0 items-center justify-center overflow-hidden bg-polaria-t-08">
                {previewable && url && tipo === "IMG" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={item.nombre}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex items-center gap-1 text-polaria-teal">
                    <FileText className={ICONO_ADJUNTO_CLASS} aria-hidden />
                    <span className="rounded bg-polaria-teal/15 px-1 py-px text-[0.6rem] font-semibold leading-none">
                      {tipo}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex h-11 min-h-0 items-center gap-0.5 border-t border-polaria-w-08 bg-polaria-w-08 px-1">
                <span className="shrink-0 rounded bg-polaria-teal/20 px-0.5 py-px text-[0.55rem] font-bold leading-none text-polaria-teal">
                  {tipo}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[0.6rem] font-medium leading-tight text-polaria-w"
                    title={item.nombre}
                  >
                    {item.nombre}
                  </p>
                  <p
                    className={cn(
                      "truncate whitespace-nowrap text-[0.55rem] leading-tight",
                      size ? "text-polaria-w-50" : "invisible",
                    )}
                    aria-hidden={!size}
                  >
                    {size || "0 KB"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-0 self-center">
                  {hasFile && (viewUrl || downloadUrl) ? (
                    <>
                      {previewable && viewUrl ? (
                        onPreviewAdjunto ? (
                          <button
                            type="button"
                            className="rounded p-0.5 text-polaria-teal transition hover:bg-polaria-t-08"
                            title="Ver"
                            aria-label={`Ver ${item.nombre}`}
                            onClick={() => onPreviewAdjunto(item, viewUrl)}
                          >
                            <Eye className={ICONO_ADJUNTO_CLASS} aria-hidden />
                          </button>
                        ) : (
                          <a
                            href={viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded p-0.5 text-polaria-teal transition hover:bg-polaria-t-08"
                            title="Ver"
                            aria-label={`Ver ${item.nombre}`}
                          >
                            <Eye className={ICONO_ADJUNTO_CLASS} aria-hidden />
                          </a>
                        )
                      ) : null}
                      {downloadUrl ? (
                        <a
                          href={downloadUrl}
                          download={item.nombre}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded p-0.5 text-polaria-teal transition hover:bg-polaria-t-08"
                          title="Descargar"
                          aria-label={`Descargar ${item.nombre}`}
                        >
                          <Download
                            className={ICONO_ADJUNTO_CLASS}
                            aria-hidden
                          />
                        </a>
                      ) : null}
                    </>
                  ) : (
                    <span
                      className="max-w-[3rem] truncate text-right text-[0.55rem] leading-tight text-polaria-w-50"
                      title={
                        url && isBrokenCloudinaryPdfUrl(url)
                          ? "Cloudinary bloquea PDF en esta cuenta. Volvé a subir el archivo (ahora va a Supabase Storage)."
                          : "Este pedido solo guardó el nombre; no hay archivo descargable."
                      }
                    >
                      {url && isBrokenCloudinaryPdfUrl(url)
                        ? "PDF bloqueado"
                        : "Sin archivo"}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
