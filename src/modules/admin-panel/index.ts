export type {
  AdminPanelAction,
  AdminPanelActionId,
  AdminPanelProps,
} from "./types/admin-panel.types";

export type {
  AdminAssignmentCreationPanelProps,
  AdminAssignmentOptionId,
  AdminCreationOptionId,
  AdminMenuOption,
} from "./types/admin-assignment-creation.types";

export {
  ADMIN_PANEL_ACTIONS,
  ADMIN_PANEL_PLACEHOLDERS,
  ADMIN_PANEL_SUBTITLE,
  ADMIN_PANEL_TITLE,
  getAdminPanelActionHref,
} from "./constants/admin-panel-actions";

export {
  ADMIN_ASSIGNMENT_CREATION_PLACEHOLDERS,
  ADMIN_ASSIGNMENT_CREATION_SUBTITLE,
  ADMIN_ASSIGNMENT_CREATION_TITLE,
  ADMIN_ASSIGNMENT_OPTIONS,
  ADMIN_ASSIGNMENT_SECTION_TITLE,
  ADMIN_CREATION_OPTIONS,
  ADMIN_CREATION_SECTION_TITLE,
  getAdminAssignmentOptionHref,
  getAdminCreationOptionHref,
} from "./constants/admin-assignment-creation-options";

export {
  AdminPanel,
  AdminPanelConnected,
} from "./components/AdminPanel";

export {
  AdminAssignmentCreationPanel,
  AdminAssignmentCreationPanelConnected,
} from "./components/AdminAssignmentCreationPanel";

export { AdminBreadcrumb } from "./components/AdminBreadcrumb";

export { AdminCatalogListShell } from "./components/AdminCatalogListShell";
export { ProveedoresListView } from "./components/ProveedoresListView";
export { ProveedorCreateModal } from "./components/ProveedorCreateModal";
export { CompradoresListView } from "./components/CompradoresListView";
export { CompradorCreateModal } from "./components/CompradorCreateModal";
export { CamionesListView } from "./components/CamionesListView";
export { CamionCreateModal } from "./components/CamionCreateModal";
export { UsuariosAdminListView } from "./components/UsuariosAdminListView";
export { UsuarioAdminCreateModal } from "./components/UsuarioAdminCreateModal";
export { BodegaInternaAdminView } from "./components/BodegaInternaAdminView";
export { VincularBodegaInternaModal } from "./components/VincularBodegaInternaModal";
export { BodegaExternaAdminView } from "./components/BodegaExternaAdminView";
export { VincularBodegaExternaModal } from "./components/VincularBodegaExternaModal";
export { CatalogoListView } from "./components/CatalogoListView";
export { ProductoCatalogoCreateModal } from "./components/ProductoCatalogoCreateModal";
export { ProductoSecundarioCreateModal } from "./components/ProductoSecundarioCreateModal";
export { InventarioMercanciaReportView } from "./components/InventarioMercanciaReportView";
export { InventarioMercanciaFlow } from "./components/InventarioMercanciaFlow";

export type { ProveedorListRow, CreateProveedorInput } from "./services/proveedores.service";
export {
  createProveedorAdmin,
  decodeProveedorRazonSocial,
  formatProveedorId,
  listProveedoresAdmin,
} from "./services/proveedores.service";

export type { CompradorListRow, CreateCompradorInput } from "./services/compradores.service";
export {
  createCompradorAdmin,
  listCompradoresAdmin,
} from "./services/compradores.service";

export type { CamionListRow, CreateCamionInput } from "./services/camiones.service";
export {
  createCamionAdmin,
  formatCamionId,
  listCamionesAdmin,
} from "./services/camiones.service";

export type {
  UsuarioAdminListRow,
  CreateUsuarioAdminInput,
} from "./services/usuarios-admin.service";
export {
  createUsuarioAdmin,
  formatUsuarioAdminCreatedAt,
  listUsuariosAdmin,
} from "./services/usuarios-admin.service";

export type {
  BodegaInternaDisponibleRow,
  BodegaInternaVinculadaRow,
  VincularBodegaInternaInput,
} from "./services/bodegas-internas-admin.service";
export {
  formatBodegaInternaId,
  listBodegasInternasDisponiblesAdmin,
  listBodegasInternasVinculadasAdmin,
  vincularBodegaInternaAdmin,
} from "./services/bodegas-internas-admin.service";

export type {
  BodegaExternaDisponibleRow,
  BodegaExternaVinculadaRow,
  VincularBodegaExternaInput,
} from "./services/bodegas-externas-admin.service";
export {
  formatBodegaExternaId,
  listBodegasExternasDisponiblesAdmin,
  listBodegasExternasVinculadasAdmin,
  vincularBodegaExternaAdmin,
} from "./services/bodegas-externas-admin.service";

export type {
  CatalogoProductoListRow,
  CreateCatalogoProductoInput,
  ProductoPrimarioOption,
} from "./services/productos-catalogo.service";
export {
  createCatalogoProductoPrimario,
  createCatalogoProductoSecundario,
  listCatalogoProductosAdmin,
  listProductosPrimariosCatalogo,
} from "./services/productos-catalogo.service";

export type {
  InventarioMercanciaEtapa,
  InventarioMercanciaEtapaId,
  InventarioMercanciaReport,
} from "./services/inventario-mercancia-report.service";
export {
  formatInventarioKg,
  getInventarioEtapa,
  getInventarioEtapaDestacada,
  getInventarioMercanciaReport,
} from "./services/inventario-mercancia-report.service";

export {
  ADMIN_CATALOG_SECTION_LABEL,
  BODEGA_EXTERNA_PAGE_HINT,
  BODEGA_EXTERNA_PAGE_TITLE,
  BODEGA_INTERNA_PAGE_HINT,
  BODEGA_INTERNA_PAGE_TITLE,
  CATALOGO_EMPTY_MESSAGE,
  CATALOGO_PAGE_HINT,
  CATALOGO_PAGE_TITLE,
  CATALOGO_TABLE_SUBTITLE,
  CATALOGO_TABLE_TITLE,
  CAMIONES_EMPTY_MESSAGE,
  CAMIONES_PAGE_HINT,
  CAMIONES_PAGE_TITLE,
  CAMIONES_TABLE_SUBTITLE,
  CAMIONES_TABLE_TITLE,
  COMPRADORES_EMPTY_MESSAGE,
  COMPRADORES_PAGE_HINT,
  COMPRADORES_PAGE_TITLE,
  COMPRADORES_TABLE_SUBTITLE,
  COMPRADORES_TABLE_TITLE,
  PROVEEDORES_EMPTY_MESSAGE,
  PROVEEDORES_PAGE_HINT,
  PROVEEDORES_PAGE_TITLE,
  PROVEEDORES_TABLE_SUBTITLE,
  PROVEEDORES_TABLE_TITLE,
  REPORTES_PAGE_HINT,
  REPORTES_PAGE_TITLE,
  USUARIOS_EMPTY_MESSAGE,
  USUARIOS_PAGE_HINT,
  USUARIOS_PAGE_TITLE,
  USUARIOS_TABLE_SUBTITLE,
  USUARIOS_TABLE_TITLE,
} from "./constants/admin-catalog-list";
