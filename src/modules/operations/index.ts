export type {
  BodegaReportesApiResumen,
  CreateOrdenTrabajoApiInput,
  FlujoOrdenTrabajoApi,
  OrdenTrabajoApiRow,
} from "./shared/types/operations-api.types";

export {
  asignarTareaColaApi,
  completarTareaColaApi,
  createOrdenTrabajoApi,
  crearLlamadaJefeApi,
  ejecutarOrdenTrabajoApi,
  getBodegaReportesApi,
  listAlertasOperativasApi,
  listOrdenesTrabajoApi,
  listTareasColaApi,
} from "./shared/services/operations-api.service";
