"use client";

import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";
import { useReagruparOtModal } from "../../hooks/use-reagrupar-ot-modal";
import { tieneHuecosSinCompletar } from "../../utils/ot/instrucciones-frecuentes-reagrupacion";
import { puedeGenerar } from "../../utils/ot/reagrupacion-modal-estado";
import { OrdenVentaCorreccionCorreoPanel } from "./OrdenVentaCorreccionCorreoPanel";
import { ReagrupacionDivisionPlan } from "./ReagrupacionDivisionPlan";
import { ReagruparOtAcciones } from "./ReagruparOtAcciones";
import { ReagruparOtCampoInstruccion } from "./ReagruparOtCampoInstruccion";
import { ReagruparOtMensajes } from "./ReagruparOtMensajes";
import { ReagruparOtPropuestaSection } from "./ReagruparOtPropuestaSection";
import type { OrdenVentaReagruparOtModalProps } from "./reagrupar-ot-modal.types";

export type {
  OrdenVentaReagruparOtModalProps,
  SolicitudReagrupacion,
} from "./reagrupar-ot-modal.types";

const DESCRIPCION_BASE =
  "Escribe qué quieres cambiar. Puedo crear, modificar o eliminar órdenes de trabajo (mover productos entre ellas, crear nuevas o dejar vacías las que sobren) y dividir la orden de venta por orden de compra, día u horario de entrega; no cambio cantidades ni datos del pedido.";
const DESCRIPCION_CON_CORRECCION =
  "Escribe qué quieres cambiar. Puedo mover productos entre órdenes de trabajo, crear nuevas o dejar vacías las que sobren, y dividir la orden de venta por orden de compra, día u horario de entrega. Si la orden quedó mal leída del correo (faltan productos u órdenes de compra, o el total no coincide), releo el correo y los archivos para corregirla.";
const DESCRIPCION_REVISAR_CORRECCION =
  "Comparé la orden con el correo y los archivos originales. Revisa la corrección antes de aplicarla.";

/**
 * Modal de reagrupación de OT con IA (POL-391 / REQ-125).
 *
 * Vive junto al panel Cypher (dock-left, z-100: Cypher queda visible). Solo pide una
 * PROPUESTA; no escribe nada. Todo texto que viene del modelo o del correo se muestra
 * como texto (React lo escapa); nunca como HTML.
 */
export function OrdenVentaReagruparOtModal(
  props: OrdenVentaReagruparOtModalProps,
) {
  const { open, folio, onClose, onAplicarCorreccion, onDividir } = props;
  const m = useReagruparOtModal(props);
  const { estado, propuestaCorreccion } = m;

  const descripcion = propuestaCorreccion
    ? DESCRIPCION_REVISAR_CORRECCION
    : onAplicarCorreccion
      ? DESCRIPCION_CON_CORRECCION
      : DESCRIPCION_BASE;

  return (
    <PolariaFormModal
      open={open}
      onClose={onClose}
      sectionLabel={folio ? `Orden de venta ${folio}` : "Orden de venta"}
      title={
        propuestaCorreccion
          ? "Corregir con el correo"
          : "Reorganizar órdenes de trabajo"
      }
      description={descripcion}
      layout="dock-left"
      stackLevel="base"
      scrollClassName="flex flex-col"
      asForm={false}
      onSubmit={(evento) => evento.preventDefault()}
      hideFooter
      closeOnEscape={false}
      closeOnBackdrop={false}
    >
      {propuestaCorreccion ? (
        <OrdenVentaCorreccionCorreoPanel
          propuesta={propuestaCorreccion.propuesta!}
          importeFormulario={propuestaCorreccion.importeFormulario}
          motivo={propuestaCorreccion.motivo}
          onAplicar={m.handleAplicarCorreccion}
          onDescartar={m.descartarCorreccion}
        />
      ) : null}
      {/* px-1: el contenedor con scroll del modal recorta el anillo de foco en el borde. */}
      <div
        className={cn(
          "flex w-full flex-1 flex-col gap-5 px-1",
          propuestaCorreccion && "hidden",
        )}
      >
        {estado.historial.length > 0 ? (
          <section aria-label="Intentos anteriores" className="flex flex-col gap-1.5">
            <p className="text-sm font-semibold tracking-wide text-polaria-w-50 lg:text-base">
              INTENTOS ANTERIORES
            </p>
            <ol className="list-decimal space-y-1.5 pl-5 text-base leading-relaxed text-polaria-w-50 lg:text-lg">
              {estado.historial.map((instruccion, indice) => (
                <li key={`${indice}-${instruccion}`} className="break-words">
                  {instruccion}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <ReagruparOtCampoInstruccion
          id={m.campoId}
          valor={estado.instruccion}
          bloqueado={m.textoBloqueado}
          gruposDisponibles={m.gruposInstruccion}
          placeholder={
            onAplicarCorreccion
              ? "Ejemplos: Junta las órdenes de comedor y de bares en una sola. · Faltan productos: el total de la factura es 27,905.25."
              : "Ejemplo: Junta las órdenes de comedor y de bares en una sola."
          }
          onCambio={(texto) => m.dispatch({ tipo: "ESCRIBIR", texto })}
        />

        <ReagruparOtMensajes
          aviso={estado.aviso}
          error={estado.error}
          errorCorreccion={m.errorCorreccion}
          cargando={m.cargando}
          interpretando={m.interpretando}
          leyendoCorreo={m.leyendoCorreo}
          motivoActual={m.motivoActual}
          onCancelarPeticion={m.handleCancelarPeticion}
        />

        {m.enDivision ? (
          <ReagrupacionDivisionPlan division={estado.division!} />
        ) : m.enPropuesta ? (
          <ReagruparOtPropuestaSection
            resumen={estado.propuesta!.resumen}
            movimientos={estado.movimientos}
          />
        ) : null}

        <ReagruparOtAcciones
          enPropuesta={m.enPropuesta}
          enDivision={m.enDivision}
          puedeDividir={Boolean(onDividir)}
          dividiendo={m.dividiendo}
          cargando={m.cargando}
          generarDeshabilitado={
            !puedeGenerar(estado) || tieneHuecosSinCompletar(estado.instruccion)
          }
          onClose={onClose}
          onRechazar={() => m.dispatch({ tipo: "RECHAZAR" })}
          onConfirmar={() => void m.handleConfirmar()}
          onGenerar={() => void m.handleGenerar()}
        />
      </div>
    </PolariaFormModal>
  );
}
