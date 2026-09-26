"use client";

import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { PolariaFormField } from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";
import { CamionCatalogTablePickerModal } from "@/modules/admin-panel/camiones/components/CamionCatalogTablePickerModal";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import type { UsuarioAdminListRow } from "../services/usuarios-admin.service";
import {
  getUsuarioReportePermisos,
  saveUsuarioReportePermisos,
} from "../services/usuario-reporte-permisos.client";
import type { BodegaExternaEmbedReportOption } from "@/modules/admin-panel/inventario-mercancia/services/cuenta-reporte-embed.client";

interface UsuarioReportePermisosModalProps {
  open: boolean;
  usuarios: readonly UsuarioAdminListRow[];
  onClose: () => void;
}

function reportLabel(report: BodegaExternaEmbedReportOption): string {
  return report.descripcion?.trim() || report.reporteId?.trim() || report.id;
}

function usuarioFieldLabel(usuario: UsuarioAdminListRow): string {
  return `${usuario.nombre} (${usuario.codigo})`;
}

export function UsuarioReportePermisosModal({
  open,
  usuarios,
  onClose,
}: UsuarioReportePermisosModalProps) {
  const formId = useId();
  const [idUsuario, setIdUsuario] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reports, setReports] = useState<BodegaExternaEmbedReportOption[]>([]);
  const [grantedIds, setGrantedIds] = useState<string[]>([]);
  const [baselineGrantedIds, setBaselineGrantedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedUsuario = useMemo(
    () => usuarios.find((row) => row.idUsuario === idUsuario) ?? null,
    [idUsuario, usuarios],
  );

  const isDirty = useMemo(() => {
    if (!idUsuario) return false;
    if (grantedIds.length !== baselineGrantedIds.length) return true;
    const baseline = new Set(baselineGrantedIds);
    return grantedIds.some((id) => !baseline.has(id));
  }, [baselineGrantedIds, grantedIds, idUsuario]);

  useEffect(() => {
    if (!open) return;

    setIdUsuario("");
    setPickerOpen(false);
    setReports([]);
    setGrantedIds([]);
    setBaselineGrantedIds([]);
    setError(null);
    setIsLoading(false);
    setIsSubmitting(false);
  }, [open]);

  useEffect(() => {
    if (!open || !idUsuario) {
      setReports([]);
      setGrantedIds([]);
      setBaselineGrantedIds([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void getUsuarioReportePermisos(idUsuario)
      .then((data) => {
        if (cancelled) return;
        setReports(data.reports);
        setGrantedIds(data.grantedIds);
        setBaselineGrantedIds(data.grantedIds);
      })
      .catch((err) => {
        if (cancelled) return;
        setReports([]);
        setGrantedIds([]);
        setBaselineGrantedIds([]);
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los permisos.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [idUsuario, open]);

  const toggleReport = (reportId: string) => {
    setGrantedIds((current) =>
      current.includes(reportId)
        ? current.filter((id) => id !== reportId)
        : [...current, reportId],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!idUsuario || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const saved = await saveUsuarioReportePermisos(idUsuario, grantedIds);
      setGrantedIds(saved);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron guardar los permisos.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PolariaFormModal
        open={open}
        onClose={onClose}
        sectionLabel="Usuarios"
        title="Permisos de reportes"
        description="Elige un usuario y los reportes a los que puede entrar por URL."
        onSubmit={handleSubmit}
        error={error}
        isSubmitting={isSubmitting}
        submitDisabled={!idUsuario || isLoading || isSubmitting}
        submitLabel="Guardar"
        compact
        size="md"
        closeOnEscape={!pickerOpen && !isSubmitting}
        closeOnBackdrop={!pickerOpen && !isDirty && !isSubmitting}
      >
        <div className="grid gap-4">
          <PolariaFormField
            id={`${formId}-usuario`}
            label="Usuario"
            compact
            required
          >
            <JefeBodegaModalSearchField
              id={`${formId}-usuario`}
              value={selectedUsuario ? usuarioFieldLabel(selectedUsuario) : ""}
              placeholder="Selecciona un usuario"
              ariaLabel="Usuario"
              compact
              onSearchClick={() => setPickerOpen(true)}
            />
          </PolariaFormField>

          {!idUsuario ? (
            <p className="polaria-text-body-sm text-polaria-w-50">
              Selecciona un usuario para ver los reportes de la cuenta.
            </p>
          ) : isLoading ? (
            <p className="polaria-text-body-sm text-polaria-w-50">
              Cargando reportes…
            </p>
          ) : reports.length === 0 ? (
            <p className="polaria-text-body-sm text-polaria-w-50">
              Esta cuenta no tiene reportes configurados.
            </p>
          ) : (
            <fieldset className="grid gap-2">
              <legend className="polaria-text-caption text-polaria-w-50">
                Reportes
              </legend>
              {reports.map((report) => {
                const checked = grantedIds.includes(report.id);
                const inputId = `${formId}-${report.id}`;
                return (
                  <label
                    key={report.id}
                    htmlFor={inputId}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2",
                      checked
                        ? "border-polaria-t-20 bg-polaria-t-08"
                        : "border-polaria-w-08 bg-polaria-w-08",
                    )}
                  >
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleReport(report.id)}
                      className="h-4 w-4 accent-polaria-teal"
                    />
                    <span className="polaria-text-body-sm text-polaria-w">
                      {reportLabel(report)}
                    </span>
                  </label>
                );
              })}
            </fieldset>
          )}
        </div>
      </PolariaFormModal>

      <CamionCatalogTablePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Seleccionar usuario"
        description="Usuarios de la cuenta a los que puedes asignar reportes."
        rows={usuarios}
        columns={[
          {
            id: "codigo",
            header: "Código",
            cell: (row: UsuarioAdminListRow) => row.codigo,
            className: "w-[22%] font-medium text-polaria-teal",
          },
          {
            id: "nombre",
            header: "Nombre",
            cell: (row: UsuarioAdminListRow) => row.nombre,
          },
          {
            id: "correo",
            header: "Correo",
            cell: (row: UsuarioAdminListRow) => row.correo,
            className: "w-[38%] text-polaria-w-50",
          },
        ]}
        getRowKey={(row) => row.idUsuario}
        getSearchHaystack={(row) =>
          `${row.nombre} ${row.codigo} ${row.correo}`
        }
        selectedKey={idUsuario || null}
        searchPlaceholder="Buscar por nombre, código o correo"
        emptyMessage="No hay usuarios en la cuenta."
        onSelect={(row) => setIdUsuario(row.idUsuario)}
      />
    </>
  );
}
