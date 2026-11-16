"use client";

import { CypherClienteVsMateoSection } from "./CypherClienteVsMateoSection";
import { CypherDatosFiscalesSection } from "./CypherDatosFiscalesSection";
import { CypherStageAccordion } from "./CypherStageAccordion";
import { CypherBitacoraSection } from "./CypherBitacoraSection";
import { CypherRecepcionCorreoStage } from "./CypherRecepcionCorreoStage";
import { CypherConfirmacionStage } from "./CypherConfirmacionStage";
import { CypherCambioEstadoPipelineStage } from "./CypherCambioEstadoPipelineStage";
import type { OrdenVentaCypherStagesBodyProps } from "./orden-venta-cypher-stages-body.types";

export type { OrdenVentaCypherStagesBodyProps } from "./orden-venta-cypher-stages-body.types";

export function OrdenVentaCypherStagesBody({
  orden,
  codigoCuenta,
  companionIdComprador,
  openStages,
  toggleAccordionStage,
  correoChrome,
  origenNombres,
  recibida,
  cuerpoCompleto,
  cuerpoMensaje,
  origenAdjuntosStored,
  emlInnerAdjuntos,
  emlInnerLoading,
  origenAdjuntos,
  activeOtPicker,
  estado,
  comprador,
  occ,
  zonaHoraria,
  lineas,
  hijasFromOrden,
  puedeAlmacen,
  onFotos,
  estadosSuperiores,
  estadoCambiando,
  setCambioEstadoError,
  setEstadoPendiente,
  logLoading,
  logEntries,
  idOrdenTrabajoBitacora,
}: OrdenVentaCypherStagesBodyProps) {
  return (
    <>
      <CypherRecepcionCorreoStage
        orden={orden}
        codigoCuenta={codigoCuenta}
        openStages={openStages}
        toggleAccordionStage={toggleAccordionStage}
        correoChrome={correoChrome}
        origenNombres={origenNombres}
        recibida={recibida}
        cuerpoCompleto={cuerpoCompleto}
        cuerpoMensaje={cuerpoMensaje}
        origenAdjuntosStored={origenAdjuntosStored}
        emlInnerAdjuntos={emlInnerAdjuntos}
        emlInnerLoading={emlInnerLoading}
        origenAdjuntos={origenAdjuntos}
      />

      <CypherStageAccordion
        stageId="fiscales"
        num="01"
        title="Datos fiscales — referencia"
        open={openStages.has("fiscales")}
        onToggle={toggleAccordionStage}
      >
        <CypherDatosFiscalesSection
          codigoCuenta={codigoCuenta}
          idComprador={companionIdComprador?.trim() || orden.id_comprador}
        />
      </CypherStageAccordion>

      <CypherConfirmacionStage
        openStages={openStages}
        toggleAccordionStage={toggleAccordionStage}
        orden={orden}
        activeOtPicker={activeOtPicker}
        estado={estado}
        comprador={comprador}
        occ={occ}
        zonaHoraria={zonaHoraria}
        lineas={lineas}
      />

      <CypherStageAccordion
        stageId="cliente-vs-mateo"
        num="03"
        title="Correo vs Mateo IA vs usuario"
        open={openStages.has("cliente-vs-mateo")}
        onToggle={toggleAccordionStage}
      >
        {orden ? (
          <CypherClienteVsMateoSection orden={orden} hijas={hijasFromOrden} />
        ) : (
          <p className="rounded-xl border border-dashed border-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50">
            Cargando comparación…
          </p>
        )}
      </CypherStageAccordion>

      <CypherCambioEstadoPipelineStage
        openStages={openStages}
        toggleAccordionStage={toggleAccordionStage}
        orden={orden}
        estado={estado}
        hijasFromOrden={hijasFromOrden}
        puedeAlmacen={puedeAlmacen}
        onFotos={onFotos}
        estadosSuperiores={estadosSuperiores}
        estadoCambiando={estadoCambiando}
        setCambioEstadoError={setCambioEstadoError}
        setEstadoPendiente={setEstadoPendiente}
      />

      <CypherStageAccordion
        stageId="bitacora"
        num="05"
        title="Bitácora de eventos"
        open={openStages.has("bitacora")}
        onToggle={toggleAccordionStage}
      >
        <CypherBitacoraSection
          logLoading={logLoading}
          logEntries={logEntries}
          zonaHoraria={zonaHoraria}
          idOrdenTrabajoBitacora={idOrdenTrabajoBitacora}
          activeOtPicker={activeOtPicker}
        />
      </CypherStageAccordion>
    </>
  );
}
