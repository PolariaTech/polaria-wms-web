import type { DivisionReagrupacionApi } from "../../services/reagrupar-ot.client";
import {
  describirOrdenesNuevas,
  etiquetaDeValor,
  nombreDelCriterio,
  tituloDeLaDivision,
} from "./reagrupacion-modal-ui";

/**
 * REQ-262 / REQ-273: plan de dividir la orden de venta por orden de compra, día u horario
 * de entrega.
 *
 * Mismo contenedor que la propuesta de reorganizar. El estado se dice con texto y
 * color: «Se queda» en teal, «Pasa» en blanco al 50 %. Los valores son texto (React lo
 * escapa) y se leen en el mismo orden en que llegan.
 */
export function ReagrupacionDivisionPlan({
  division,
}: {
  division: DivisionReagrupacionApi;
}) {
  const { criterio, valoresSalen, valoresQuedan } = division;
  return (
    <section
      aria-label="Plan para dividir la orden"
      className="flex flex-col gap-4 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-5 py-5 lg:px-6 lg:py-6"
    >
      <h3 className="text-xl leading-tight font-semibold text-polaria-w lg:text-2xl">
        {tituloDeLaDivision(valoresSalen.length)}
      </h3>
      <p className="text-sm leading-relaxed text-polaria-w-50 lg:text-base">
        Se crea una orden de venta nueva por cada {nombreDelCriterio(criterio)}{" "}
        que sale, con los mismos datos de la orden. Lo que se queda sigue junto en
        esta orden. Los productos y las cantidades no cambian.
      </p>
      <p className="text-sm leading-relaxed text-polaria-w-50 lg:text-base">
        Se divide lo que ya está guardado. Si cambiaste algo en las tareas que
        salen, guárdalo antes de confirmar.
      </p>
      <dl className="flex flex-col gap-4 text-base leading-relaxed lg:text-lg">
        <div>
          <dt className="font-semibold text-polaria-teal">
            Se queda en esta orden
          </dt>
          <dd>
            <ul className="mt-1 text-polaria-w">
              {valoresQuedan.map((valor) => (
                <li key={valor} className="break-words tabular-nums">
                  {etiquetaDeValor(criterio, valor)}
                </li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-polaria-w-50">
            {describirOrdenesNuevas(criterio, valoresSalen.length)}
          </dt>
          <dd>
            <ul className="mt-1 text-polaria-w">
              {valoresSalen.map((valor) => (
                <li key={valor} className="break-words tabular-nums">
                  {etiquetaDeValor(criterio, valor)}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
    </section>
  );
}
