"use client";

import { cn } from "@/lib/utils/cn";
import { parseOrigenPedidoBlocks } from "../utils/texto-origen-pedido";

/**
 * Muestra el cuerpo del correo/mensaje con tablas HTML reales cuando el texto
 * trae columnas alineadas (salida dataTable de html-to-text).
 */
export function OrigenPedidoBodyView({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const blocks = parseOrigenPedidoBlocks(text);
  if (blocks.length === 0) return null;

  return (
    <div className={cn("mt-2 space-y-3", className)}>
      {blocks.map((block, index) => {
        if (block.type === "text") {
          return (
            <p
              key={`t-${index}`}
              className="whitespace-pre-wrap border-l-2 border-polaria-teal pl-3 polaria-text-body-sm text-polaria-w"
            >
              {block.text}
            </p>
          );
        }

        const [header, ...bodyRows] = block.rows;
        const dataRows = bodyRows.length > 0 ? bodyRows : [];

        return (
          <div
            key={`tbl-${index}`}
            className="overflow-x-auto rounded-xl border border-polaria-t-20 bg-polaria-t-08"
          >
            <table className="min-w-full border-collapse text-left">
              {header ? (
                <thead>
                  <tr className="border-b border-polaria-t-20 bg-polaria-w-08">
                    {header.map((cell, cellIndex) => (
                      <th
                        key={`h-${cellIndex}`}
                        className="whitespace-nowrap px-2.5 py-2 polaria-text-caption font-semibold text-polaria-teal"
                      >
                        {cell || "—"}
                      </th>
                    ))}
                  </tr>
                </thead>
              ) : null}
              <tbody>
                {dataRows.map((row, rowIndex) => (
                  <tr
                    key={`r-${rowIndex}`}
                    className="border-b border-polaria-w-08 last:border-b-0"
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`c-${rowIndex}-${cellIndex}`}
                        className="whitespace-nowrap px-2.5 py-1.5 polaria-text-caption text-polaria-w"
                      >
                        {cell || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
