export type {
  BodegaReportesApiResumen,
  CreateOrdenTrabajoApiInput,
  FlujoOrdenTrabajoApi,
  OperarioDisponibleApiRow,
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
  listOperariosDisponiblesApi,
  listOrdenesTrabajoApi,
  listTareasColaApi,
} from "./shared/services/operations-api.service";
