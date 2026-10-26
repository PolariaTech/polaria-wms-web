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
} from "../../utils/origen-adjuntos";

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function OrigenAdjuntosCards({
  adjuntos,
  className,
}: {
  adjuntos: readonly OrigenAdjunto[];
  className?: string;
}) {
  const unique = dedupeOrigenAdjuntos(adjuntos);
  if (unique.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="polaria-text-caption text-polaria-w-50">
        {unique.length === 1
          ? "1 archivo adjunto"
          : `${unique.length} archivos adjuntos`}
      </p>
      {/* REQ-102: ~50% del tamaño anterior para navegar varios adjuntos. */}
      <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
        {unique.map((item, index) => {
          const url = item.url?.trim() || "";
          const path = item.path?.trim() || "";
          const viewUrl = origenAdjuntoViewUrl(item);
          const downloadUrl = origenAdjuntoDownloadUrl(item);
          const hasFile = Boolean(path || (url && !isBrokenCloudinaryPdfUrl(url)));
          const tipo = labelTipoOrigenAdjunto(item);
          const previewable = canPreviewOrigenAdjunto(item);
          const size = formatBytes(item.bytes);

          return (
            <li
              key={`${item.nombre}-${index}`}
              className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-polaria-t-20 bg-polaria-bg/40"
            >
              <div className="flex aspect-[4/3] items-center justify-center bg-polaria-t-08">
                {previewable && url && tipo === "IMG" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={item.nombre}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-0.5 text-polaria-teal">
                    <FileText className="h-4 w-4" aria-hidden />
                    <span className="rounded bg-polaria-teal/15 px-1 py-px text-[0.65rem] font-semibold leading-none">
                      {tipo}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-start gap-1 border-t border-polaria-w-08 bg-polaria-w-08 px-1.5 py-1">
                <span className="mt-0.5 shrink-0 rounded bg-polaria-teal/20 px-0.5 py-px text-[0.6rem] font-bold leading-none text-polaria-teal">
                  {tipo}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[0.65rem] font-medium leading-tight text-polaria-w"
                    title={item.nombre}
                  >
                    {item.nombre}
                  </p>
                  {size ? (
                    <p className="text-[0.6rem] leading-tight text-polaria-w-50">
                      {size}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center">
                  {hasFile && (viewUrl || downloadUrl) ? (
                    <>
                      {previewable && viewUrl ? (
                        <a
                          href={viewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded p-0.5 text-polaria-teal transition hover:bg-polaria-t-08"
                          title="Ver"
                          aria-label={`Ver ${item.nombre}`}
                        >
                          <Eye className="h-3 w-3" aria-hidden />
                        </a>
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
                          <Download className="h-3 w-3" aria-hidden />
                        </a>
                      ) : null}
                    </>
                  ) : (
                    <span
                      className="max-w-[3.5rem] text-right text-[0.6rem] leading-tight text-polaria-w-50"
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
