export type {
  AdminPanelAction,
  AdminPanelActionId,
  AdminPanelProps,
} from "./shared/types/admin-panel.types";

export type {
  AdminAssignmentCreationPanelProps,
  AdminAssignmentOptionId,
  AdminCreationOptionId,
  AdminMenuOption,
} from "./shared/types/admin-assignment-creation.types";

export {
  ADMIN_PANEL_ACTIONS,
  ADMIN_PANEL_PLACEHOLDERS,
  ADMIN_PANEL_SUBTITLE,
  ADMIN_PANEL_TITLE,
  getAdminPanelActionHref,
} from "./shared/constants/admin-panel-actions";

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
} from "./shared/constants/admin-assignment-creation-options";

export {
  AdminPanel,
  AdminPanelConnected,
} from "./shared/components/AdminPanel";

export {
  AdminAssignmentCreationPanel,
  AdminAssignmentCreationPanelConnected,
} from "./shared/components/AdminAssignmentCreationPanel";

export { AdminBreadcrumb } from "./shared/components/AdminBreadcrumb";

export { AdminCatalogListShell } from "./shared/components/AdminCatalogListShell";
export { ProveedoresListView } from "./proveedores/components/ProveedoresListView";
export { ProveedorCreateModal } from "./proveedores/components/ProveedorCreateModal";
export { ClientesListView } from "./clientes/components/ClientesListView";
export { ClienteCreateModal } from "./clientes/components/ClienteCreateModal";
export { CompradoresListView } from "./compradores/components/CompradoresListView";
export { CompradorCreateModal } from "./compradores/components/CompradorCreateModal";
export { CamionesListView } from "./camiones/components/CamionesListView";
export { CamionCreateModal } from "./camiones/components/CamionCreateModal";
export { PlantasListView } from "./plantas/components/PlantasListView";
export { PlantaCreateModal } from "./plantas/components/PlantaCreateModal";
export { UsuariosAdminListView } from "./usuarios/components/UsuariosAdminListView";
export { UsuarioAdminCreateModal } from "./usuarios/components/UsuarioAdminCreateModal";
export { BodegaInternaAdminView } from "./bodega-interna/components/BodegaInternaAdminView";
export { VincularBodegaInternaModal } from "./bodega-interna/components/VincularBodegaInternaModal";
export { BodegaExternaAdminView } from "./bodega-externa/components/BodegaExternaAdminView";
export { VincularBodegaExternaModal } from "./bodega-externa/components/VincularBodegaExternaModal";
export { CatalogoListView } from "./catalogo/components/CatalogoListView";
export { ProductoCatalogoCreateModal } from "./catalogo/components/ProductoCatalogoCreateModal";
export { ProductoCatalogoEditModal } from "./catalogo/components/ProductoCatalogoEditModal";
export { ProductoSecundarioCreateModal } from "./catalogo/components/ProductoSecundarioCreateModal";
export { InventarioMercanciaReportView } from "./inventario-mercancia/components/InventarioMercanciaReportView";
export { InventarioMercanciaFlow } from "./inventario-mercancia/components/InventarioMercanciaFlow";

export type { ProveedorListRow, CreateProveedorInput } from "./proveedores/services/proveedores.service";
export {
  createProveedorAdmin,
  decodeProveedorRazonSocial,
  formatProveedorId,
  listProveedoresAdmin,
} from "./proveedores/services/proveedores.service";

export type { ClienteListRow, CreateClienteInput } from "./clientes/services/clientes.service";
export {
  createClienteAdmin,
  formatClienteId,
  listClientesAdmin,
} from "./clientes/services/clientes.service";

export type { CompradorListRow, CreateCompradorInput } from "./compradores/services/compradores.service";
export {
  createCompradorAdmin,
  listCompradoresAdmin,
} from "./compradores/services/compradores.service";

export type { CamionListRow, CreateCamionInput } from "./camiones/services/camiones.service";
export {
  createCamionAdmin,
  formatCamionId,
  listCamionesAdmin,
} from "./camiones/services/camiones.service";

export type { PlantaListRow, CreatePlantaInput } from "./plantas/services/plantas.service";
export {
  createPlantaAdmin,
  formatPlantaId,
  listPlantasAdmin,
} from "./plantas/services/plantas.service";

export type {
  UsuarioAdminListRow,
  CreateUsuarioAdminInput,
} from "./usuarios/services/usuarios-admin.service";
export {
  createUsuarioAdmin,
  formatUsuarioAdminCreatedAt,
  listUsuariosAdmin,
} from "./usuarios/services/usuarios-admin.service";

export type {
  BodegaInternaDisponibleRow,
  BodegaInternaVinculadaRow,
  VincularBodegaInternaInput,
} from "./bodega-interna/services/bodegas-internas-admin.service";
export {
  formatBodegaInternaId,
  listBodegasInternasDisponiblesAdmin,
  listBodegasInternasVinculadasAdmin,
  vincularBodegaInternaAdmin,
} from "./bodega-interna/services/bodegas-internas-admin.service";

export type {
  BodegaExternaDisponibleRow,
  BodegaExternaVinculadaRow,
  VincularBodegaExternaInput,
} from "./bodega-externa/services/bodegas-externas-admin.service";
export {
  formatBodegaExternaId,
  listBodegasExternasDisponiblesAdmin,
  listBodegasExternasVinculadasAdmin,
  vincularBodegaExternaAdmin,
} from "./bodega-externa/services/bodegas-externas-admin.service";

export type {
  CatalogoProductoListRow,
  CreateCatalogoProductoInput,
  ProductoPrimarioOption,
} from "./catalogo/services/productos-catalogo.service";
export {
  createCatalogoProductoPrimario,
  createCatalogoProductoSecundario,
  deactivateCatalogoProducto,
  getCatalogoProductoById,
  importCatalogoProductosFromFile,
  listCatalogoProductosAdmin,
  listProductosPrimariosCatalogo,
  updateCatalogoProducto,
} from "./catalogo/services/productos-catalogo.service";

export type {
  InventarioMercanciaEtapa,
  InventarioMercanciaEtapaId,
  InventarioMercanciaReport,
} from "./inventario-mercancia/services/inventario-mercancia-report.service";
export {
  formatInventarioKg,
  getInventarioEtapa,
  getInventarioEtapaDestacada,
  getInventarioMercanciaReport,
} from "./inventario-mercancia/services/inventario-mercancia-report.service";

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
  PLANTAS_EMPTY_MESSAGE,
  PLANTAS_PAGE_HINT,
  PLANTAS_PAGE_TITLE,
  PLANTAS_TABLE_SUBTITLE,
  PLANTAS_TABLE_TITLE,
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
  CLIENTES_EMPTY_MESSAGE,
  CLIENTES_PAGE_HINT,
  CLIENTES_PAGE_TITLE,
  CLIENTES_TABLE_SUBTITLE,
  CLIENTES_TABLE_TITLE,
  REPORTES_PAGE_HINT,
  REPORTES_PAGE_TITLE,
  USUARIOS_EMPTY_MESSAGE,
  USUARIOS_PAGE_HINT,
  USUARIOS_PAGE_TITLE,
  USUARIOS_TABLE_SUBTITLE,
  USUARIOS_TABLE_TITLE,
} from "./shared/constants/admin-catalog-list";
