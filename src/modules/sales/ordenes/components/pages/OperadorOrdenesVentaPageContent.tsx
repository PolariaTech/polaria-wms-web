"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { ROLES_NIVEL_CUENTA } from "@/constants/wms/roles";
import { AdminMaestroViewShell } from "@/modules/admin-panel/shared/components/AdminMaestroViewShell";
import {
  useAdminMaestroScope,
  type AdminMaestroViewProps,
} from "@/modules/admin-panel/shared/hooks/useAdminMaestroScope";
import { useAuthStore } from "@/stores/auth.store";
import type { EstadoOrdenVenta } from "../../../shared/types/sales.types";
import { useOrdenesVentaFilas } from "../../hooks/use-ordenes-venta-filas";
import { useOrdenesVentaListadoData } from "../../hooks/use-ordenes-venta-listado-data";
import { useOvCorreoNoEnviado } from "../../hooks/use-ov-correo-no-enviado";
import { useOvFeedback } from "../../hooks/use-ov-feedback";
import { useOvFotosCaptura } from "../../hooks/use-ov-fotos-captura";
import { useOvImpresion } from "../../hooks/use-ov-impresion";
import { useOvPaneles } from "../../hooks/use-ov-paneles";
import { buildOperadorOrdenesVentaColumns } from "./build-operador-ordenes-venta-columns";
import { crearOnBorrarOv } from "./crear-on-borrar-ov";
import { OperadorOrdenesVentaTabla } from "./OperadorOrdenesVentaTabla";

const OperadorOrdenesVentaCypher = dynamic(
  () =>
    import("./OperadorOrdenesVentaCypher").then((m) => ({
      default: m.OperadorOrdenesVentaCypher,
    })),
  { ssr: false, loading: () => null },
);

const OperadorOrdenesVentaFormularios = dynamic(
  () =>
    import("./OperadorOrdenesVentaFormularios").then((m) => ({
      default: m.OperadorOrdenesVentaFormularios,
    })),
  { ssr: false, loading: () => null },
);

const OperadorOrdenesVentaImpresionModales = dynamic(
  () =>
    import("./OperadorOrdenesVentaImpresionModales").then((m) => ({
      default: m.OperadorOrdenesVentaImpresionModales,
    })),
  { ssr: false, loading: () => null },
);

export function OperadorOrdenesVentaPageContent({
  codigoCuenta: codigoCuentaProp,
  mode = "manage",
}: AdminMaestroViewProps = {}) {
  const { codigoCuenta, inspect, runScoped } = useAdminMaestroScope({
    codigoCuenta: codigoCuentaProp,
    mode,
  });
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoOrdenVenta | null>(null); // null = Todos

  const listado = useOrdenesVentaListadoData({ codigoCuenta, runScoped });
  const { data, reload, zonaHoraria } = listado;
  const { rows, rowsDelDia, filteredRows, countsByEstado, fechaFiltroDia, rowsRef } =
    useOrdenesVentaFilas({ data, codigoCuenta, inspect, zonaHoraria, estadoFiltro });
  const { idsCorreoNoEnviado, marcarCorreoNoEnviado, quitarCorreoNoEnviado } =
    useOvCorreoNoEnviado({ idsServidor: data?.idsCorreoNoEnviado, reload });
  const paneles = useOvPaneles({ codigoCuenta, inspect, reload });
  const { feedback, setFeedback, showFeedback, handleEmitSuccess, handleAutoPrintResult } =
    useOvFeedback({ quitarCorreoNoEnviado });
  const impresion = useOvImpresion({
    codigoCuenta,
    runScoped,
    zonaHoraria,
    setFeedback,
    showFeedback,
    marcarCorreoNoEnviado,
    quitarCorreoNoEnviado,
    rowsRef,
  });
  const fotos = useOvFotosCaptura({
    printingLockRef: impresion.printingLockRef,
    setBusyAction: impresion.setBusyAction,
  });

  const viewerId = useAuthStore((s) => s.session?.idUsuario) ?? null;
  const { setDetalleId, setCypherId, cypherId } = paneles;
  const columns = useMemo(
    () =>
      buildOperadorOrdenesVentaColumns({
        inspect,
        cypherId,
        idsCorreoNoEnviado,
        viewerId,
        setDetalleId,
        setCypherId,
      }),
    [idsCorreoNoEnviado, inspect, cypherId, viewerId, setDetalleId, setCypherId],
  );
  const recargar = () => {
    void reload();
  };
  const onBorrar = crearOnBorrarOv({
    codigoCuenta,
    inspect,
    runScoped,
    rows,
    paneles,
    setBusyAction: impresion.setBusyAction,
    reload,
  });

  const body = (
    <>
      <OperadorOrdenesVentaTabla
        estadoFiltro={estadoFiltro}
        onEstadoFiltroChange={setEstadoFiltro}
        totalDelDia={rowsDelDia.length}
        countsByEstado={countsByEstado}
        isLoading={listado.isLoading}
        error={listado.error}
        codigoCuenta={codigoCuenta}
        rows={filteredRows}
        columns={columns}
        fechaFiltroDia={fechaFiltroDia}
        inspect={inspect}
        isRefreshing={listado.isRefreshing}
        onRefresh={recargar}
        onNuevaVenta={paneles.abrirNuevaVenta}
        onRowClick={paneles.alClickFila}
      />

      <OperadorOrdenesVentaCypher
        paneles={paneles}
        codigoCuenta={codigoCuenta}
        inspect={inspect}
        rows={rows}
        busyAction={impresion.busyAction}
        onReload={recargar}
        onBorrar={onBorrar}
        abrirSeleccionOt={impresion.abrirSeleccionOt}
        openFotosCaptura={fotos.openFotosCaptura}
        setSeleccionOt={impresion.setSeleccionOt}
        setPdfPreview={impresion.setPdfPreview}
      />

      <OperadorOrdenesVentaFormularios
        paneles={paneles}
        codigoCuenta={codigoCuenta}
        inspect={inspect}
        rows={rows}
        onReload={recargar}
        onEmitSuccess={handleEmitSuccess}
        onAutoPrintResult={handleAutoPrintResult}
      />

      <OperadorOrdenesVentaImpresionModales
        cypherId={cypherId}
        busyAction={impresion.busyAction}
        seleccionOt={impresion.seleccionOt}
        onCerrarSeleccionOt={() => impresion.setSeleccionOt(null)}
        cargarHojas={impresion.loadPrintSheets}
        onConfirmarSeleccionOt={(actual, ots) => {
          impresion.setSeleccionOt(null);
          if (actual.accion === "imprimir") void impresion.executePrint(actual.row, "inicial", ots);
          else void impresion.openPdfPreview(actual.row, ots);
        }}
        feedback={feedback}
        onReintentar={impresion.reintentarEnvio}
        onCerrarFeedback={() => setFeedback(null)}
        pdfPreview={impresion.pdfPreview}
        onCerrarPdf={() => impresion.setPdfPreview(null)}
        fotosPreview={fotos.fotosPreview}
        onSelectFotosOt={(id) => void fotos.selectFotosOt(id)}
        onVolverALasOt={fotos.volverALasOt}
        onCerrarFotos={fotos.cerrarFotos}
      />
    </>
  );

  if (inspect) {
    return (
      <AdminMaestroViewShell inspect sectionLabel="" title="" hint="">
        {body}
      </AdminMaestroViewShell>
    );
  }

  return (
    <OperationalModuleShell
      title="Órdenes venta"
      gate={{ roles: ROLES_NIVEL_CUENTA }}
      dockForCypher={Boolean(cypherId)}
      compactoEnPantallaBaja
    >
      {body}
    </OperationalModuleShell>
  );
}
