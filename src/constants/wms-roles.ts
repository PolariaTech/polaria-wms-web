import { WmsRol } from "@/constants/roles";

/** Etiquetas legibles para los 9 roles WMS en formularios. */
export const WMS_ROL_LABELS: Record<WmsRol, string> = {
  [WmsRol.configurador]: "Configurador",
  [WmsRol.administrador_cuenta]: "Administrador de cuenta",
  [WmsRol.operador_cuenta]: "Operador de cuenta",
  [WmsRol.administrador_bodega]: "Administrador de bodega",
  [WmsRol.jefe_bodega]: "Jefe de bodega",
  [WmsRol.custodio]: "Custodio",
  [WmsRol.operario]: "Operario",
  [WmsRol.procesador]: "Procesador",
  [WmsRol.transportista]: "Transportista",
};

export const WMS_ROLES_ORDER: WmsRol[] = [
  WmsRol.configurador,
  WmsRol.administrador_cuenta,
  WmsRol.operador_cuenta,
  WmsRol.administrador_bodega,
  WmsRol.jefe_bodega,
  WmsRol.custodio,
  WmsRol.operario,
  WmsRol.procesador,
  WmsRol.transportista,
];
