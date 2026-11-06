import type { DivisionReagrupacionApi } from "../../services/reagrupar-ot.client";
import {
  describirOrdenesNuevas,
  tituloDeLaDivision,
} from "./reagrupacion-modal-ui";

/**
 * REQ-262 / REQ-273: plan de dividir la orden de venta por orden de compra.
 *
 * Mismo contenedor que la propuesta de reorganizar. El estado se dice con texto y
 * color: «Se queda» en teal, «Pasa» en blanco al 50 %. Las órdenes de compra son
 * texto (React lo escapa) y se leen en el mismo orden en que llegan.
 */
export function ReagrupacionDivisionPlan({
  division,
}: {
  division: DivisionReagrupacionApi;
}) {
  const { ocSalen, ocQuedan } = division;
  return (
    <section
      aria-label="Plan para dividir la orden"
      className="flex flex-col gap-4 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-5 py-5 lg:px-6 lg:py-6"
    >
      <h3 className="text-xl leading-tight font-semibold text-polaria-w lg:text-2xl">
        {tituloDeLaDivision(ocSalen.length, ocQuedan.length)}
      </h3>
      <p className="text-sm leading-relaxed text-polaria-w-50 lg:text-base">
        Cada orden de compra queda en su propia orden de venta, con los mismos
        datos de entrega. Los productos y las cantidades no cambian.
      </p>
      <dl className="flex flex-col gap-4 text-base leading-relaxed lg:text-lg">
        <div>
          <dt className="font-semibold text-polaria-teal">
            Se queda en esta orden
          </dt>
          <dd>
            <ul className="mt-1 text-polaria-w">
              {ocQuedan.map((oc) => (
                <li key={oc} className="break-words tabular-nums">
                  Orden de compra {oc}
                </li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-polaria-w-50">
            {describirOrdenesNuevas(ocSalen.length)}
          </dt>
          <dd>
            <ul className="mt-1 text-polaria-w">
              {ocSalen.map((oc) => (
                <li key={oc} className="break-words tabular-nums">
                  Orden de compra {oc}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
    </section>
  );
}
