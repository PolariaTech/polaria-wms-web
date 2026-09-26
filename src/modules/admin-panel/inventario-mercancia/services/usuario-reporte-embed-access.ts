import { WmsRol } from "@/constants/wms/roles";

export interface ReporteEmbedAccessRow {
  idCuentaReporteEmbed: string;
}

export function canManageReporteEmbedPermisos(idRol: string | null | undefined): boolean {
  return idRol === WmsRol.administrador_cuenta;
}

export function canBypassReporteEmbedGrants(idRol: string | null | undefined): boolean {
  return (
    idRol === WmsRol.administrador_cuenta || idRol === WmsRol.configurador
  );
}

export function filterReportesEmbedForViewer<T extends ReporteEmbedAccessRow>(
  reports: readonly T[],
  grantedIds: readonly string[],
  idRol: string | null | undefined,
): T[] {
  if (canBypassReporteEmbedGrants(idRol)) {
    return [...reports];
  }

  const granted = new Set(
    grantedIds.map((id) => id.trim()).filter(Boolean),
  );

  return reports.filter((row) => granted.has(row.idCuentaReporteEmbed));
}

export function usuarioHasReporteEmbedGrant(
  idCuentaReporteEmbed: string,
  grantedIds: readonly string[],
  idRol: string | null | undefined,
): boolean {
  if (canBypassReporteEmbedGrants(idRol)) return true;

  const reportId = idCuentaReporteEmbed.trim();
  if (!reportId) return false;

  return grantedIds.some((id) => id.trim() === reportId);
}
