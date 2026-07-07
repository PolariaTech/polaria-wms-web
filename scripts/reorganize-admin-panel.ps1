$ErrorActionPreference = "Stop"
$base = "src/modules/admin-panel"

$domains = @(
  @{
    name = "shared"
    components = @(
      "AdminBreadcrumb", "AdminBreadcrumb.test", "AdminPanel", "AdminPanelHeader",
      "AdminPanelActionsGrid", "AdminAssignmentCreationPanel", "AdminAssignmentCreationPanel.test",
      "AdminCatalogListShell", "AdminMenuRowCard", "AdminMenuSection"
    )
    services = @()
    constants = @(
      "admin-panel-actions", "admin-panel-actions.test",
      "admin-assignment-creation-options", "admin-assignment-creation-options.test",
      "admin-catalog-list"
    )
    types = @("admin-panel.types", "admin-assignment-creation.types")
    utils = @()
  },
  @{
    name = "catalogo"
    components = @(
      "CatalogoListView", "CatalogoFormFields", "ProductoCatalogoCreateModal",
      "ProductoCatalogoEditModal", "ProductoSecundarioCreateModal"
    )
    services = @("productos-catalogo.service", "productos-catalogo.service.test")
    constants = @("catalogo-producto", "catalogo-table-layout")
    types = @()
    utils = @("catalogo-excel-import", "catalogo-excel-import.test")
  },
  @{
    name = "proveedores"
    components = @("ProveedoresListView", "ProveedorCreateModal")
    services = @("proveedores.service", "proveedores.service.test")
    constants = @(); types = @(); utils = @()
  },
  @{
    name = "clientes"
    components = @("ClientesListView", "ClienteCreateModal")
    services = @("clientes.service", "clientes.service.test")
    constants = @(); types = @(); utils = @()
  },
  @{
    name = "compradores"
    components = @("CompradoresListView", "CompradorCreateModal")
    services = @("compradores.service", "compradores.service.test")
    constants = @(); types = @(); utils = @()
  },
  @{
    name = "camiones"
    components = @("CamionesListView", "CamionCreateModal")
    services = @("camiones.service", "camiones.service.test")
    constants = @("camion-types"); types = @(); utils = @()
  },
  @{
    name = "plantas"
    components = @("PlantasListView", "PlantaCreateModal")
    services = @("plantas.service", "plantas.service.test")
    constants = @(); types = @(); utils = @()
  },
  @{
    name = "usuarios"
    components = @("UsuariosAdminListView", "UsuarioAdminCreateModal")
    services = @("usuarios-admin.service", "usuarios-admin.service.test")
    constants = @(); types = @(); utils = @()
  },
  @{
    name = "bodega-interna"
    components = @("BodegaInternaAdminView", "VincularBodegaInternaModal")
    services = @("bodegas-internas-admin.service", "bodegas-internas-admin.service.test")
    constants = @(); types = @(); utils = @()
  },
  @{
    name = "bodega-externa"
    components = @("BodegaExternaAdminView", "VincularBodegaExternaModal")
    services = @("bodegas-externas-admin.service", "bodegas-externas-admin.service.test")
    constants = @(); types = @(); utils = @()
  },
  @{
    name = "inventario-mercancia"
    components = @("InventarioMercanciaReportView", "InventarioMercanciaFlow")
    services = @("inventario-mercancia-report.service", "inventario-mercancia-report.service.test")
    constants = @(); types = @(); utils = @()
  }
)

function Move-IfExists($src, $dest) {
  if (Test-Path $src) {
    $destDir = Split-Path $dest -Parent
    if (-not (Test-Path $destDir)) {
      New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    }
    git mv $src $dest
  }
}

foreach ($d in $domains) {
  $path = Join-Path $base $d.name
  foreach ($folder in @("components", "services", "constants", "types", "utils")) {
    New-Item -ItemType Directory -Force -Path (Join-Path $path $folder) | Out-Null
  }
  foreach ($c in $d.components) {
    Move-IfExists (Join-Path $base "components/$c.tsx") (Join-Path $path "components/$c.tsx")
  }
  foreach ($s in $d.services) {
    Move-IfExists (Join-Path $base "services/$s.ts") (Join-Path $path "services/$s.ts")
  }
  foreach ($c in $d.constants) {
    Move-IfExists (Join-Path $base "constants/$c.ts") (Join-Path $path "constants/$c.ts")
  }
  foreach ($t in $d.types) {
    Move-IfExists (Join-Path $base "types/$t.ts") (Join-Path $path "types/$t.ts")
  }
  foreach ($u in $d.utils) {
    Move-IfExists (Join-Path $base "utils/$u.ts") (Join-Path $path "utils/$u.ts")
  }
}

Write-Host "admin-panel file moves complete"
