$ErrorActionPreference = "Stop"
$base = "src/modules/warehouses"

$domains = @(
  @{
    name = "shared"
    components = @("BodegaOperacionTabs")
    services = @(); constants = @(); types = @(); utils = @()
  },
  @{
    name = "estado-bodega"
    components = @(
      "EstadoBodegaPageContent", "EstadoBodegaSectionPanel", "EstadoBodegaSlotGrid",
      "EstadoBodegaSlotCell", "EstadoBodegaZonePanelModal"
    )
    services = @("estado-bodega.service", "estado-bodega-zone.service")
    constants = @("estado-bodega-layout", "estado-bodega-zone-panel")
    types = @("estado-bodega.types")
    utils = @("estado-bodega-mapper", "estado-bodega-mapper.test", "estado-bodega-zone-panel", "estado-bodega-zone-panel.test")
  },
  @{
    name = "bodega-reportes"
    components = @(
      "BodegaReportesPageContent", "BodegaReportesResumenCard", "BodegaReportesBarChart", "BodegaReportesDonutChart"
    )
    services = @("bodega-reportes.service", "bodega-reportes.service.test")
    constants = @("bodega-reportes-config")
    types = @("bodega-reportes.types")
    utils = @()
  }
)

function Move-IfExists($src, $dest) {
  if (Test-Path $src) {
    $destDir = Split-Path $dest -Parent
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Force -Path $destDir | Out-Null }
    if (Test-Path $dest) { Remove-Item $dest -Force }
    Move-Item $src $dest
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

Write-Host "warehouses file moves complete (Move-Item)"
