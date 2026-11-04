import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import { createOrdenVenta } from "../../shared/services/sales.service";
import { uploadOvAdjuntosClient } from "../services/ov-adjuntos.client";
import type { OrigenCorreoRenglon } from "../utils/origen/origen-correo-ordenes-trabajo";

interface BorradorDesdeDocsParams {
  /** Renglones que Mateo interpretó del archivo o mensaje. */
  origenRows: OrigenCorreoRenglon[];
  /** Texto del correo o mensaje que se guarda como origen (ya limpio). */
  textoOrigen: string;
  /** Cliente identificado; vacío si Mateo aún no lo reconoce. */
  idComprador: string;
}

/**
 * REQ-199: al leer el archivo o el mensaje, crea la OV como borrador (origen + adjuntos, sin
 * líneas) para que el «+» de Cypher y Guardar ya tengan un id. No toca una orden que ya existe.
 *
 * @returns un aviso para mostrar si no se pudo crear (el formulario sigue disponible), o `null`.
 */
export async function crearBorradorDesdeDocs(
  estado: OrdenVentaFormEstado,
  params: BorradorDesdeDocsParams,
): Promise<string | null> {
  if (estado.editingId || estado.pendingEmitId) return null;

  try {
    let adjuntos = estado.origenAdjuntos;
    if (estado.origenArchivoFiles.length > 0) {
      adjuntos = await uploadOvAdjuntosClient(estado.origenArchivoFiles, estado.codigoCuenta);
      estado.setOrigenAdjuntos(adjuntos);
      estado.setOrigenArchivoFiles([]);
    }
    const fila = await createOrdenVenta({
      codigoCuenta: estado.codigoCuenta,
      idBodega: estado.activeBodegaId,
      idComprador: params.idComprador || undefined,
      lineas: [],
      origenTexto: params.textoOrigen || undefined,
      origenArchivos: adjuntos,
      origenCorreo: params.origenRows.length > 0 ? params.origenRows : undefined,
      guardarAvance: true,
      idCreador: estado.idCreador || null,
    });
    estado.setPendingEmitId(fila.idOrdenVenta);
    estado.setEditingEstado("por_confirmar");
    estado.onOrdenIdReady?.(fila.idOrdenVenta);
    estado.onCreated();
    return null;
  } catch (error) {
    return error instanceof Error
      ? `No se pudo preparar Cypher: ${error.message}`
      : "No se pudo preparar Cypher con el archivo leído.";
  }
}
