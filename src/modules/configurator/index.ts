export type {
  ConfiguratorAction,
  ConfiguratorActionId,
  ConfiguratorPanelProps,
} from "./shared/types/configurator.types";

export type {
  CreationOption,
  CreationOptionId,
  CreationPanelProps,
} from "./shared/types/creation.types";

export {
  CONFIGURATOR_ACTIONS,
  CONFIGURATOR_BRAND,
  CONFIGURATOR_PANEL_SUBTITLE,
  CONFIGURATOR_PANEL_TITLE,
  CONFIGURATOR_PLACEHOLDERS,
  getConfiguratorActionHref,
} from "./shared/constants/configurator-actions";

export type {
  AssignmentOption,
  AssignmentOptionId,
  AssignmentPanelProps,
} from "./shared/types/assignment.types";

export {
  ASSIGNMENT_OPTIONS,
  ASSIGNMENT_SUBTITLE,
  ASSIGNMENT_TITLE,
  getAssignmentOptionHref,
} from "./shared/constants/assignment-options";

export {
  CREATION_OPTIONS,
  CREATION_SUBTITLE,
  CREATION_TITLE,
  getCreationOptionHref,
} from "./shared/constants/creation-options";

export { AssignmentOptionsGrid } from "./shared/components/AssignmentOptionsGrid";
export {
  AssignmentPanel,
  AssignmentPanelConnected,
} from "./shared/components/AssignmentPanel";

export {
  BODEGA_EXTERNA_EMPTY_MESSAGE,
  BODEGA_EXTERNA_TABLE_SUBTITLE,
  BODEGA_EXTERNA_TABLE_TITLE,
  BODEGA_INTERNA_EMPTY_MESSAGE,
  BODEGA_INTERNA_TABLE_SUBTITLE,
  BODEGA_INTERNA_TABLE_TITLE,
  CONFIGURATOR_LIST_HINT,
  CONFIGURATOR_SECTION_LABEL,
  EMPRESAS_EMPTY_MESSAGE,
  EMPRESAS_TABLE_SUBTITLE,
  EMPRESAS_TABLE_TITLE,
  CUENTAS_EMPTY_MESSAGE,
  CUENTAS_TABLE_SUBTITLE,
  CUENTAS_TABLE_TITLE,
  USUARIOS_EMPTY_MESSAGE,
  USUARIOS_TABLE_SUBTITLE,
  USUARIOS_TABLE_TITLE,
} from "./shared/constants/configurator-list";

export { ConfiguratorActionCard } from "./shared/components/ConfiguratorActionCard";
export { ConfiguratorActionsGrid } from "./shared/components/ConfiguratorActionsGrid";
export { BodegaExternaCreateModal } from "./bodega-externa/components/BodegaExternaCreateModal";
export { BodegaExternaListView } from "./bodega-externa/components/BodegaExternaListView";
export { BodegaInternaCreateModal } from "./bodega-interna/components/BodegaInternaCreateModal";
export { BodegaInternaListView } from "./bodega-interna/components/BodegaInternaListView";
export { IntegracionView } from "./integracion/components/IntegracionView";
export { ConfiguratorBreadcrumb } from "./shared/components/ConfiguratorBreadcrumb";
export { ConfiguratorHeader } from "./shared/components/ConfiguratorHeader";
export { ConfiguratorListShell } from "./shared/components/ConfiguratorListShell";
export { CuentaCreateModal } from "./cuentas/components/CuentaCreateModal";
export { CuentasListView } from "./cuentas/components/CuentasListView";
export { EmpresaCreateModal } from "./empresas/components/EmpresaCreateModal";
export { EmpresasListView } from "./empresas/components/EmpresasListView";
export { UsuarioCreateModal } from "./usuarios/components/UsuarioCreateModal";
export { UsuariosListView } from "./usuarios/components/UsuariosListView";
export {
  ConfiguratorPanel,
  ConfiguratorPanelConnected,
} from "./shared/components/ConfiguratorPanel";
export {
  CreationPanel,
  CreationPanelConnected,
} from "./shared/components/CreationPanel";
export { CreationOptionsGrid } from "./shared/components/CreationOptionsGrid";
export {
  PolariaSelectionCard,
  type PolariaSelectionOption,
} from "@/components/shared/cards/PolariaSelectionCard";
/** @deprecated Usar PolariaSelectionCard desde @/components/shared */
export {
  PolariaSelectionCard as CreationOptionCard,
  type PolariaSelectionOption as ConfiguratorSelectionOption,
} from "@/components/shared/cards/PolariaSelectionCard";

export type {
  CreateEmpresaInput,
  EmpresaListRow,
} from "./empresas/services/empresas.service";
export {
  createEmpresaConfigurator,
  listEmpresasConfigurator,
} from "./empresas/services/empresas.service";

export type {
  CuentaListRow,
  CreateCuentaInput,
  EmpresaAssignOption,
} from "./cuentas/services/cuentas.service";
export {
  createCuentaConfigurator,
  listCuentasConfigurator,
  listEmpresasAssignOptions,
} from "./cuentas/services/cuentas.service";

export type {
  BodegaInternaListRow,
  CreateBodegaInternaInput,
} from "./bodega-interna/services/bodegas-internas.service";
export {
  createBodegaInternaConfigurator,
  listBodegasInternasConfigurator,
} from "./bodega-interna/services/bodegas-internas.service";

export type {
  BodegaExternaListRow,
  CreateBodegaExternaInput,
} from "./bodega-externa/services/bodegas-externas.service";
export {
  createBodegaExternaConfigurator,
  listBodegasExternasConfigurator,
} from "./bodega-externa/services/bodegas-externas.service";

export type {
  BodegaAssignOption,
  CreateUsuarioInput,
  CuentaAssignOption,
  RolOption,
  UsuarioListRow,
} from "./usuarios/services/usuarios.service";
export {
  createUsuarioConfigurator,
  listBodegasAssignOptions,
  listCuentasAssignOptions,
  listRolesConfigurator,
  listUsuariosConfigurator,
} from "./usuarios/services/usuarios.service";
