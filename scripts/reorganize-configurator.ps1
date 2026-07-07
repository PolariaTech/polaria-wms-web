$ErrorActionPreference = "Stop"
$base = "src/modules/configurator"

$domains = @(
  @{
    name = "shared"
    components = @(
      "ConfiguratorPanel", "ConfiguratorHeader", "ConfiguratorBreadcrumb",
      "ConfiguratorListShell", "ConfiguratorActionsGrid", "ConfiguratorActionCard",
      "ConfiguratorActionsGrid.test", "CreationPanel", "CreationPanel.test",
      "AssignmentPanel", "AssignmentPanel.test", "CreationOptionsGrid", "AssignmentOptionsGrid"
    )
    services = @()
    constants = @("configurator-actions", "configurator-actions.test", "configurator-list", "assignment-options", "creation-options")
    types = @("configurator.types", "creation.types", "assignment.types")
    utils = @()
  },
  @{
    name = "empresas"
    components = @("EmpresasListView", "EmpresaCreateModal")
    services = @("empresas.service", "empresas.service.test")
    constants = @(); types = @(); utils = @()
  },
  @{
    name = "cuentas"
    components = @("CuentasListView", "CuentaCreateModal", "CuentaCreateModal.test")
    services = @("cuentas.service", "cuentas.service.test")
    constants = @(); types = @(); utils = @()
  },
  @{
    name = "bodega-interna"
    components = @("BodegaInternaListView", "BodegaInternaCreateModal", "BodegaInternaCreateModal.test")
    services = @("bodegas-internas.service", "bodegas-internas.service.test")
    constants = @(); types = @(); utils = @()
  },
  @{
    name = "bodega-externa"
    components = @("BodegaExternaListView", "BodegaExternaCreateModal")
    services = @("bodegas-externas.service", "bodegas-externas.service.test")
    constants = @(); types = @(); utils = @()
  },
  @{
    name = "usuarios"
    components = @("UsuariosListView", "UsuarioCreateModal")
    services = @("usuarios.service", "usuarios.service.test")
    constants = @("usuario-rol-asignacion", "usuario-rol-asignacion.test")
    types = @(); utils = @()
  },
  @{
    name = "integracion"
    components = @("IntegracionView", "IntegracionView.test", "IntegracionSolicitudCard", "IntegracionSolicitudCard.test")
    services = @("integracion.service", "integracion.service.test")
    constants = @("integration")
    types = @(); utils = @()
  }
)

function Move-IfExists($src, $dest) {
  if (Test-Path $src) {
    $destDir = Split-Path $dest -Parent
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Force -Path $destDir | Out-Null }
    git mv $src $dest
  }
}

foreach ($d in $domains) {
  $path = Join-Path $base $d.name
  foreach ($folder in @("components", "services", "constants", "types", "utils")) {
    New-Item -ItemType Directory -Force -Path (Join-Path $path $folder) | Out-Null
  }
  foreach ($c in $d.components) { Move-IfExists (Join-Path $base "components/$c.tsx") (Join-Path $path "components/$c.tsx") }
  foreach ($s in $d.services) { Move-IfExists (Join-Path $base "services/$s.ts") (Join-Path $path "services/$s.ts") }
  foreach ($c in $d.constants) { Move-IfExists (Join-Path $base "constants/$c.ts") (Join-Path $path "constants/$c.ts") }
  foreach ($t in $d.types) { Move-IfExists (Join-Path $base "types/$t.ts") (Join-Path $path "types/$t.ts") }
  foreach ($u in $d.utils) { Move-IfExists (Join-Path $base "utils/$u.ts") (Join-Path $path "utils/$u.ts") }
}

Write-Host "configurator file moves complete"
