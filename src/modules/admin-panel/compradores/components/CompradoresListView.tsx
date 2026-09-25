"use client";

import { useCallback, useMemo, useState } from "react";
import { PolariaConfirmDialog } from "@/components/shared/form/PolariaConfirmDialog";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  PolariaTableActionGroup,
  PolariaTableBadge,
  PolariaTableCode,
  PolariaTableDisableButton,
  PolariaTableEditButton,
  PolariaTableEnableButton,
} from "@/components/shared/table/PolariaTableCells";
import { formatInternationalPhoneDisplay } from "@/constants/ui/phone-countries";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import {
  ADMIN_CATALOG_SECTION_LABEL,
  COMPRADORES_EMPTY_MESSAGE,
  COMPRADORES_PAGE_HINT,
  COMPRADORES_PAGE_TITLE,
  COMPRADORES_TABLE_SUBTITLE,
  COMPRADORES_TABLE_TITLE,
} from "@/modules/admin-panel/shared/constants/admin-catalog-list";
import { AdminMaestroViewShell } from "@/modules/admin-panel/shared/components/AdminMaestroViewShell";
import {
  useAdminMaestroScope,
  type AdminMaestroViewProps,
} from "@/modules/admin-panel/shared/hooks/useAdminMaestroScope";
import {
  activateCompradorAdmin,
  deactivateCompradorAdmin,
  listCompradoresAdmin,
  type CompradorListRow,
} from "../services/compradores.service";
import {
  importCompradorPreciosFromFile,
  listCompradorPreciosTemplateAdmin,
} from "../services/comprador-producto-alias.service";
import { listProductosMasVendidosAdmin } from "../services/producto-mas-vendido.service";
import { listGruposPertenecientesAdmin } from "../services/grupo-perteneciente.service";
import {
  downloadCompradorPreciosExcelTemplate,
  type CompradorPreciosExportFilters,
} from "../utils/comprador-precios-excel";
import type { CompradorPreciosPrintScope } from "../utils/comprador-precios-print";
import { CompradorCreateModal } from "./CompradorCreateModal";
import { CompradorDetalleModal } from "./CompradorDetalleModal";
import { CompradorEditModal } from "./CompradorEditModal";
import { CompradorPreciosGestionModal } from "./CompradorPreciosGestionModal";

type PendingToggle = { row: CompradorListRow; mode: "disable" | "enable" };

export function CompradoresListView({
  codigoCuenta: codigoCuentaProp,
  mode = "manage",
}: AdminMaestroViewProps = {}) {
  const { codigoCuenta, inspect, runScoped } = useAdminMaestroScope({
    codigoCuenta: codigoCuentaProp,
    mode,
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingComprador, setEditingComprador] =
    useState<CompradorListRow | null>(null);
  const [detalleComprador, setDetalleComprador] =
    useState<CompradorListRow | null>(null);
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(
    null,
  );
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [isPreciosModalOpen, setIsPreciosModalOpen] = useState(false);
  const [isExportingPrecios, setIsExportingPrecios] = useState(false);
  const [isImportingPrecios, setIsImportingPrecios] = useState(false);
  const [isPrintingPrecios, setIsPrintingPrecios] = useState(false);
  const [preciosError, setPreciosError] = useState<string | null>(null);
  const [preciosStatus, setPreciosStatus] = useState<string | null>(null);

  const fetchCompradores = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return runScoped(() =>
      listCompradoresAdmin({ codigoCuenta, soloActivos: false }),
    );
  }, [codigoCuenta, runScoped]);

  const { data, isLoading, isRefreshing, error, reload } = useAsyncQuery(
    fetchCompradores,
    Boolean(codigoCuenta),
  );

  const fetchProductos = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return runScoped(() => listProductosMasVendidosAdmin({ codigoCuenta }));
  }, [codigoCuenta, runScoped]);

  const { data: productosData } = useAsyncQuery(
    fetchProductos,
    Boolean(codigoCuenta),
  );

  const fetchGrupos = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([] as string[]);
    }

    return runScoped(() => listGruposPertenecientesAdmin({ codigoCuenta }));
  }, [codigoCuenta, runScoped]);

  const { data: gruposData } = useAsyncQuery(
    fetchGrupos,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];
  const productos = productosData ?? [];
  const gruposDisponibles = gruposData ?? [];

  const handleConfirmToggle = useCallback(async () => {
    if (!codigoCuenta || !pendingToggle || isToggling) return;

    setIsToggling(true);
    setToggleError(null);
    try {
      if (pendingToggle.mode === "disable") {
        await deactivateCompradorAdmin({
          codigoCuenta,
          idComprador: pendingToggle.row.idComprador,
        });
      } else {
        await activateCompradorAdmin({
          codigoCuenta,
          idComprador: pendingToggle.row.idComprador,
        });
      }
      setPendingToggle(null);
      await reload();
    } catch {
      setToggleError(
        pendingToggle.mode === "disable"
          ? "No se pudo deshabilitar el comprador."
          : "No se pudo habilitar el comprador.",
      );
    } finally {
      setIsToggling(false);
    }
  }, [codigoCuenta, isToggling, pendingToggle, reload]);

  const handleExportPrecios = useCallback(
    async (filters: CompradorPreciosExportFilters) => {
      if (
        !codigoCuenta ||
        isExportingPrecios ||
        isImportingPrecios ||
        isPrintingPrecios
      ) {
        return;
      }

      setIsExportingPrecios(true);
      setPreciosError(null);
      setPreciosStatus(null);

      try {
        const nextRows = await runScoped(() =>
          listCompradorPreciosTemplateAdmin({ codigoCuenta, filters }),
        );

        await downloadCompradorPreciosExcelTemplate(nextRows, {
          fechaInicio: filters.fechaInicio,
          fechaFin: filters.fechaFin,
        });
        setIsPreciosModalOpen(false);
      } catch (error: unknown) {
        setPreciosError(
          error instanceof DomainServiceError
            ? error.message
            : "No se pudo exportar la plantilla de precios.",
        );
      } finally {
        setIsExportingPrecios(false);
      }
    },
    [
      codigoCuenta,
      isExportingPrecios,
      isImportingPrecios,
      isPrintingPrecios,
      runScoped,
    ],
  );

  const handleImportPrecios = useCallback(
    async (file: File) => {
      if (
        !codigoCuenta ||
        isImportingPrecios ||
        isExportingPrecios ||
        isPrintingPrecios
      ) {
        return;
      }

      setIsImportingPrecios(true);
      setPreciosError(null);
      setPreciosStatus(null);

      try {
        const result = await runScoped(() =>
          importCompradorPreciosFromFile(codigoCuenta, file),
        );

        const parts: string[] = [];
        if (result.imported > 0) {
          parts.push(`Se importaron ${result.imported} fila(s).`);
        }
        if (result.errors.length) {
          parts.push(result.errors.slice(0, 5).join(" "));
        }

        if (result.imported === 0) {
          setPreciosError(
            result.errors.slice(0, 5).join(" ") ||
              "No hay cambios para importar.",
          );
          return;
        }

        setPreciosStatus(parts.join(" "));
        if (result.errors.length) {
          setPreciosError(result.errors.slice(0, 5).join(" "));
        }
        await reload();
      } catch (error: unknown) {
        setPreciosError(
          error instanceof DomainServiceError
            ? error.message
            : "No se pudo importar la plantilla de precios.",
        );
      } finally {
        setIsImportingPrecios(false);
      }
    },
    [
      codigoCuenta,
      isExportingPrecios,
      isImportingPrecios,
      isPrintingPrecios,
      reload,
      runScoped,
    ],
  );

  const handlePrintPrecios = useCallback(
    async (scope: CompradorPreciosPrintScope) => {
      if (
        !codigoCuenta ||
        isPrintingPrecios ||
        isExportingPrecios ||
        isImportingPrecios
      ) {
        return;
      }

      setIsPrintingPrecios(true);
      setPreciosError(null);
      setPreciosStatus(null);

      try {
        const nextRows = await runScoped(() =>
          listCompradorPreciosTemplateAdmin({
            codigoCuenta,
            filters: {
              grupos: scope.grupos,
              codigosComprador: scope.codigosComprador,
            },
          }),
        );
        await downloadCompradorPreciosExcelTemplate(nextRows, {
          variant: "print",
        });
        setPreciosStatus("Excel de lista de precios generado.");
        setIsPreciosModalOpen(false);
      } catch (error: unknown) {
        setPreciosError(
          error instanceof DomainServiceError
            ? error.message
            : "No se pudo generar el Excel de precios.",
        );
      } finally {
        setIsPrintingPrecios(false);
      }
    },
    [
      codigoCuenta,
      isExportingPrecios,
      isImportingPrecios,
      isPrintingPrecios,
      runScoped,
    ],
  );

  const preciosPrintOptions = useMemo(
    () =>
      rows.map((row) => ({
        codigo: row.codigo,
        nombre: row.comprador,
        grupo: row.grupo,
      })),
    [rows],
  );

  const preciosProductoOptions = useMemo(
    () =>
      productos.map((row) => ({
        idProducto: row.idProducto,
        codigo: row.codigo,
        nombre: row.nombre,
      })),
    [productos],
  );

  const preciosActions = inspect
    ? undefined
    : [
        {
          label: "Gestión de precios",
          onClick: () => {
            setPreciosError(null);
            setPreciosStatus(null);
            setIsPreciosModalOpen(true);
          },
        },
      ];

  const columns = useMemo(
    () =>
      [
        {
          id: "codigo",
          header: "Código",
          cell: (row: CompradorListRow) => (
            <PolariaTableCode>{row.codigo}</PolariaTableCode>
          ),
        },
        {
          id: "comprador",
          header: "Comprador",
          cell: (row: CompradorListRow) => row.comprador,
        },
        {
          id: "telefono",
          header: "Teléfono",
          cell: (row: CompradorListRow) =>
            formatInternationalPhoneDisplay(row.telefono),
        },
        {
          id: "estado",
          header: "Estado",
          cell: (row: CompradorListRow) =>
            row.estaActivo ? (
              <PolariaTableBadge>Activo</PolariaTableBadge>
            ) : (
              <PolariaTableBadge variant="neutral">Deshabilitado</PolariaTableBadge>
            ),
        },
        {
          id: "acciones",
          header: "Acciones",
          cell: (row: CompradorListRow) => (
            <span
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <PolariaTableActionGroup>
                <PolariaTableEditButton
                  disabled={!row.estaActivo}
                  onClick={() => setEditingComprador(row)}
                />
                {row.estaActivo ? (
                  <PolariaTableDisableButton
                    onClick={() => {
                      setToggleError(null);
                      setPendingToggle({ row, mode: "disable" });
                    }}
                  />
                ) : (
                  <PolariaTableEnableButton
                    onClick={() => {
                      setToggleError(null);
                      setPendingToggle({ row, mode: "enable" });
                    }}
                  />
                )}
              </PolariaTableActionGroup>
            </span>
          ),
        },
      ] as const,
    [],
  );

  return (
    <AdminMaestroViewShell
      inspect={inspect}
      sectionLabel={ADMIN_CATALOG_SECTION_LABEL}
      title={COMPRADORES_PAGE_TITLE}
      hint={COMPRADORES_PAGE_HINT}
    >
      <PolariaDataTable
        title={COMPRADORES_TABLE_TITLE}
        subtitle={COMPRADORES_TABLE_SUBTITLE}
        isLoading={isLoading}
        error={
          error ??
          (!codigoCuenta ? "No se encontró la cuenta activa." : null)
        }
        rows={rows}
        columns={
          inspect
            ? columns.filter((column) => column.id !== "acciones")
            : columns
        }
        getRowKey={(row) => row.idComprador}
        emptyMessage={COMPRADORES_EMPTY_MESSAGE}
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        additionalActions={preciosActions}
        primaryAction={
          inspect
            ? undefined
            : {
                label: "+ Comprador",
                showIcon: false,
                onClick: () => setIsCreateOpen(true),
              }
        }
        onRowClick={inspect ? undefined : (row) => setDetalleComprador(row)}
        getRowAriaLabel={
          inspect ? undefined : (row) => `Ver detalle de ${row.comprador}`
        }
      />

      <CompradorPreciosGestionModal
        open={isPreciosModalOpen}
        onClose={() => {
          if (isExportingPrecios || isImportingPrecios || isPrintingPrecios) {
            return;
          }
          setIsPreciosModalOpen(false);
          setPreciosError(null);
          setPreciosStatus(null);
        }}
        onExport={(filters) => {
          void handleExportPrecios(filters);
        }}
        onImport={(file) => {
          void handleImportPrecios(file);
        }}
        onPrint={(scope) => {
          void handlePrintPrecios(scope);
        }}
        compradores={preciosPrintOptions}
        productos={preciosProductoOptions}
        gruposDisponibles={gruposDisponibles}
        isExporting={isExportingPrecios}
        isImporting={isImportingPrecios}
        isPrinting={isPrintingPrecios}
        exportDisabled={!codigoCuenta}
        importDisabled={!codigoCuenta}
        printDisabled={!codigoCuenta || rows.length === 0}
        error={preciosError}
        status={preciosStatus}
      />

      <CompradorCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        grupoOptions={gruposDisponibles}
        onCreated={() => {
          void reload();
        }}
      />

      <CompradorDetalleModal
        open={Boolean(detalleComprador)}
        comprador={detalleComprador}
        onClose={() => setDetalleComprador(null)}
      />

      <CompradorEditModal
        open={Boolean(editingComprador)}
        comprador={editingComprador}
        onClose={() => setEditingComprador(null)}
        grupoOptions={gruposDisponibles}
        onUpdated={() => {
          void reload();
        }}
      />

      <PolariaConfirmDialog
        open={Boolean(pendingToggle)}
        title={
          pendingToggle?.mode === "enable"
            ? "Habilitar comprador"
            : "Deshabilitar comprador"
        }
        description={
          pendingToggle
            ? pendingToggle.mode === "enable"
              ? `¿Habilitar a "${pendingToggle.row.comprador}"? Volverá a aparecer en formularios.`
              : `¿Deshabilitar a "${pendingToggle.row.comprador}"? Seguirá visible en esta tabla, pero no aparecerá en formularios.`
            : ""
        }
        confirmLabel={
          pendingToggle?.mode === "enable" ? "Habilitar" : "Deshabilitar"
        }
        isSubmitting={isToggling}
        error={toggleError}
        onClose={() => {
          if (isToggling) return;
          setPendingToggle(null);
          setToggleError(null);
        }}
        onConfirm={() => {
          void handleConfirmToggle();
        }}
      />
    </AdminMaestroViewShell>
  );
}
