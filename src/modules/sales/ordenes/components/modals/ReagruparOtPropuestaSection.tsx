import type {
  MovimientoVista,
  PropuestaReagrupacionApi,
} from "../../utils/ot/reagrupar-ordenes-trabajo";
import { describirCambioDeOt, formatearCantidad } from "./reagrupacion-modal-ui";

export interface ReagruparOtPropuestaSectionProps {
  resumen: PropuestaReagrupacionApi["resumen"];
  movimientos: MovimientoVista[];
}

/** Resumen de la propuesta de reagrupación: conteo de OT y renglones que se mueven. */
export function ReagruparOtPropuestaSection({
  resumen,
  movimientos,
}: ReagruparOtPropuestaSectionProps) {
  return (
    <section
      aria-label="Propuesta"
      className="flex flex-col gap-4 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-5 py-5 lg:px-6 lg:py-6"
    >
      <h3 className="text-xl leading-tight font-semibold text-polaria-w lg:text-2xl">
        {`${resumen.antes} OT → ${resumen.despues} OT`}
      </h3>
      <p className="text-sm leading-relaxed text-polaria-w-50 lg:text-base">
        {describirCambioDeOt(resumen.nuevas, resumen.vacias)}
        Ningún renglón se elimina; solo cambian de orden de trabajo.
      </p>
      {movimientos.length > 0 ? (
        <ul className="flex flex-col gap-2 text-base leading-relaxed text-polaria-w lg:text-lg">
          {movimientos.map((movimiento, indice) => (
            <li key={`${indice}-${movimiento.producto}`} className="break-words">
              <span className="font-semibold">{movimiento.producto}</span>{" "}
              <span className="tabular-nums text-polaria-teal">
                ({formatearCantidad(movimiento.cantidad)} kg)
              </span>
              : {movimiento.desde} → {movimiento.hacia}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
