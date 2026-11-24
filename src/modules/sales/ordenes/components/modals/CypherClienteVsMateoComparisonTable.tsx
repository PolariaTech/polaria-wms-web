import { PolariaTableBadge } from "@/components/shared/table/PolariaTableCells";
import {
  badgeVariantMateoCoincidencia,
  displayOrDash,
  displayOrPendiente,
  labelMateoCoincidencia,
} from "../../utils/match/mateo-coincidencia";
import type { CompareRow } from "./cypher-cliente-vs-mateo.types";

export function CypherClienteVsMateoComparisonTable({
  title,
  rows,
}: {
  title: string;
  rows: readonly CompareRow[];
}) {
  return (
    <div className="rounded-xl border border-polaria-t-20 bg-polaria-t-08">
      <div className="border-b border-polaria-t-20 px-3 py-2.5">
        <p className="polaria-text-caption font-bold tracking-[0.12em] text-polaria-w-50">
          {title}
        </p>
      </div>
      <div className="overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable]">
        <table className="w-max min-w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-polaria-w-08">
              {(
                ["Campo", "Correo", "Mateo", "Usuario", "Coincidencia"] as const
              ).map((header) => (
                <th
                  key={header}
                  className="whitespace-nowrap px-3 py-2 polaria-text-caption font-medium uppercase tracking-[0.08em] text-polaria-w-50"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const campoLabel = row.group
                ? `${row.group} · ${row.campo}`
                : row.campo;
              return (
                <tr
                  key={`${row.group ?? "g"}-${row.campo}-${index}`}
                  className="border-b border-polaria-w-08 last:border-b-0"
                >
                  <td className="whitespace-nowrap px-3 py-2 align-middle polaria-text-caption font-medium text-polaria-w-50">
                    {row.group ? (
                      <>
                        <span className="font-semibold text-polaria-teal">
                          {row.group}
                        </span>
                        <span className="text-polaria-w-20"> · </span>
                        <span>{row.campo}</span>
                      </>
                    ) : (
                      campoLabel
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-middle font-mono text-[11.5px] text-polaria-w-50">
                    {displayOrDash(row.correo)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-middle font-mono text-[11.5px] text-polaria-w">
                    {row.mateo.trim() || "Sin propuesta"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-middle font-mono text-[11.5px] text-polaria-w">
                    {displayOrPendiente(row.usuario)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-middle">
                    <PolariaTableBadge
                      variant={badgeVariantMateoCoincidencia(row.coincidencia)}
                    >
                      {labelMateoCoincidencia(row.coincidencia)}
                    </PolariaTableBadge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}