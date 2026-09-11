"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  PolariaFormField,
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import {
  IMPRESORA_MARCAS_CATALOG,
  IMPRESORA_TIPO_LABEL,
  findImpresoraMarcaByNombre,
  findImpresoraModeloByNombre,
  getImpresoraMarcaById,
  listImpresoraModelosByMarca,
  type ImpresoraMarcaCatalogItem,
  type ImpresoraModeloCatalogItem,
} from "@/modules/configurator/impresoras/catalog/impresora-carta.catalog";
import { ImpresoraTablePickerModal } from "@/modules/configurator/impresoras/components/ImpresoraTablePickerModal";
import {
  createImpresoraConfigurator,
  labelModoEnvio,
  labelTipoConexion,
  suggestModoEnvio,
  updateImpresoraConfigurator,
  type ImpresoraColorModo,
  type ImpresoraDuplex,
  type ImpresoraListRow,
  type ImpresoraModoEnvio,
  type ImpresoraOrientacion,
  type ImpresoraPais,
  type ImpresoraTamanoPapel,
  type ImpresoraTipoConexion,
} from "@/modules/configurator/impresoras/services/impresoras.service";
import {
  listBodegasAssignOptions,
  listCuentasAssignOptions,
  type BodegaAssignOption,
  type CuentaAssignOption,
} from "@/modules/configurator/usuarios/services/usuarios.service";

interface ImpresoraCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Si viene, el modal edita esa impresora. */
  impresora?: ImpresoraListRow | null;
}

type PickerKind = "marca" | "modelo" | null;

const INITIAL_FORM = {
  nombre: "",
  codigo: "",
  codigoCuenta: "",
  idBodega: "",
  marcaId: "",
  marca: "",
  modeloId: "",
  modelo: "",
  pais: "MX" as ImpresoraPais,
  ubicacionTexto: "",
  tipoConexion: "wifi" as ImpresoraTipoConexion,
  modoEnvio: "ipp" as ImpresoraModoEnvio,
  hostIp: "",
  puerto: "631",
  colaNombre: "",
  nombreSistema: "",
  idAgente: "",
  usaTls: false,
  tamanoPapel: "letter" as ImpresoraTamanoPapel,
  orientacion: "portrait" as ImpresoraOrientacion,
  duplex: "none" as ImpresoraDuplex,
  colorModo: "mono" as ImpresoraColorModo,
  bandeja: "",
  copiasDefault: "1",
  notas: "",
};

const TIPO_CONEXION_OPTIONS = (
  ["wifi", "ethernet", "usb", "bluetooth"] as const
).map((tipo) => ({
  value: tipo,
  label: labelTipoConexion(tipo),
}));

const MODO_ENVIO_OPTIONS = (
  ["ipp", "raw_9100", "sistema_local", "agente"] as const
).map((modo) => ({
  value: modo,
  label: labelModoEnvio(modo),
}));

const PAIS_OPTIONS = [
  { value: "CO", label: "Colombia" },
  { value: "MX", label: "México" },
  { value: "US", label: "Estados Unidos" },
] as const;

const PAPEL_OPTIONS = [
  { value: "letter", label: "Letter (carta 8.5×11)" },
  { value: "legal", label: "Legal" },
  { value: "a4", label: "A4" },
] as const;

const ORIENTACION_OPTIONS = [
  { value: "portrait", label: "Vertical" },
  { value: "landscape", label: "Horizontal" },
] as const;

const DUPLEX_OPTIONS = [
  { value: "none", label: "Una cara" },
  { value: "long_edge", label: "Doble cara (borde largo)" },
  { value: "short_edge", label: "Doble cara (borde corto)" },
] as const;

const COLOR_OPTIONS = [
  { value: "mono", label: "Blanco y negro" },
  { value: "color", label: "Color" },
] as const;

function defaultPuertoString(modo: ImpresoraModoEnvio): string {
  if (modo === "ipp") return "631";
  if (modo === "raw_9100") return "9100";
  return "";
}

function resolveDefaultBodegaId(
  cuenta: CuentaAssignOption | undefined,
  bodegasDeCuenta: BodegaAssignOption[],
): string {
  if (!cuenta) return "";
  if (
    cuenta.idBodegaDefault &&
    bodegasDeCuenta.some((b) => b.idBodega === cuenta.idBodegaDefault)
  ) {
    return cuenta.idBodegaDefault;
  }
  return bodegasDeCuenta[0]?.idBodega ?? "";
}

function formFromImpresora(row: ImpresoraListRow): typeof INITIAL_FORM {
  const marca = findImpresoraMarcaByNombre(row.marca);
  const modelo = findImpresoraModeloByNombre(marca?.id ?? "", row.modelo);
  return {
    nombre: row.nombre,
    codigo: row.codigo ?? "",
    codigoCuenta: row.codigoCuenta,
    idBodega: row.idBodega ?? "",
    marcaId: marca?.id ?? "",
    marca: row.marca ?? "",
    modeloId: modelo?.id ?? "",
    modelo: row.modelo ?? "",
    pais: row.pais,
    ubicacionTexto: row.ubicacionTexto ?? "",
    tipoConexion: row.tipoConexion,
    modoEnvio: row.modoEnvio,
    hostIp: row.hostIp ?? "",
    puerto: row.puerto != null ? String(row.puerto) : defaultPuertoString(row.modoEnvio),
    colaNombre: row.colaNombre ?? "",
    nombreSistema: row.nombreSistema ?? "",
    idAgente: row.idAgente ?? "",
    usaTls: row.usaTls,
    tamanoPapel: row.tamanoPapel,
    orientacion: row.orientacion,
    duplex: row.duplex,
    colorModo: row.colorModo,
    bandeja: row.bandeja ?? "",
    copiasDefault: String(row.copiasDefault || 1),
    notas: row.notas ?? "",
  };
}

export function ImpresoraCreateModal({
  open,
  onClose,
  onSaved,
  impresora = null,
}: ImpresoraCreateModalProps) {
  const isEdit = Boolean(impresora?.idImpresora);
  const [form, setForm] = useState(INITIAL_FORM);
  const [cuentas, setCuentas] = useState<CuentaAssignOption[]>([]);
  const [bodegas, setBodegas] = useState<BodegaAssignOption[]>([]);
  const [picker, setPicker] = useState<PickerKind>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const cuentaOptions = useMemo(
    () =>
      cuentas.map((cuenta) => ({
        value: cuenta.codigoCuenta,
        label: `${cuenta.nombreComercial} (${cuenta.codigoCuenta})`,
      })),
    [cuentas],
  );

  const bodegasFiltradas = useMemo(
    () =>
      form.codigoCuenta
        ? bodegas.filter((b) => b.codigoCuenta === form.codigoCuenta)
        : [],
    [bodegas, form.codigoCuenta],
  );

  const bodegaOptions = useMemo(
    () => [
      { value: "", label: "Sin bodega específica" },
      ...bodegasFiltradas.map((bodega) => ({
        value: bodega.idBodega,
        label: `${bodega.nombre} (${bodega.codigo})`,
      })),
    ],
    [bodegasFiltradas],
  );

  const modelosDeMarca = useMemo(
    () =>
      form.marcaId ? listImpresoraModelosByMarca(form.marcaId) : [],
    [form.marcaId],
  );

  const needsNetwork =
    form.modoEnvio === "ipp" || form.modoEnvio === "raw_9100";
  const needsSistemaLocal = form.modoEnvio === "sistema_local";
  const needsAgente = form.modoEnvio === "agente";

  useEffect(() => {
    if (!open) return;

    setForm(impresora ? formFromImpresora(impresora) : INITIAL_FORM);
    setPicker(null);
    setError(null);
    setIsSubmitting(false);
    setIsLoadingOptions(true);

    void Promise.all([
      listCuentasAssignOptions(),
      listBodegasAssignOptions(),
    ])
      .then(([nextCuentas, nextBodegas]) => {
        setCuentas(nextCuentas);
        setBodegas(nextBodegas);
      })
      .catch(() => {
        setError("No se pudieron cargar cuentas o bodegas.");
      })
      .finally(() => {
        setIsLoadingOptions(false);
      });
  }, [open, impresora]);

  const updateField = useCallback(
    <K extends keyof typeof INITIAL_FORM>(
      key: K,
      value: (typeof INITIAL_FORM)[K],
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleCuentaChange = (codigoCuenta: string) => {
    const cuenta = cuentas.find((c) => c.codigoCuenta === codigoCuenta);
    const bodegasDeCuenta = bodegas.filter(
      (b) => b.codigoCuenta === codigoCuenta,
    );
    setForm((prev) => ({
      ...prev,
      codigoCuenta,
      idBodega: resolveDefaultBodegaId(cuenta, bodegasDeCuenta),
    }));
  };

  const handleTipoConexionChange = (tipo: ImpresoraTipoConexion) => {
    const modo = suggestModoEnvio(tipo);
    setForm((prev) => ({
      ...prev,
      tipoConexion: tipo,
      modoEnvio: modo,
      puerto: defaultPuertoString(modo),
    }));
  };

  const handleModoEnvioChange = (modo: ImpresoraModoEnvio) => {
    setForm((prev) => ({
      ...prev,
      modoEnvio: modo,
      puerto: defaultPuertoString(modo),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const puertoRaw = form.puerto.trim();
    const puerto = puertoRaw === "" ? null : Number.parseInt(puertoRaw, 10);
    const copiasDefault = Number.parseInt(form.copiasDefault.trim(), 10);

    try {
      const payload = {
        nombre: form.nombre,
        codigo: form.codigo || null,
        codigoCuenta: form.codigoCuenta,
        idBodega: form.idBodega || null,
        marca: form.marca || null,
        modelo: form.modelo || null,
        pais: form.pais,
        ubicacionTexto: form.ubicacionTexto || null,
        tipoConexion: form.tipoConexion,
        modoEnvio: form.modoEnvio,
        hostIp: form.hostIp || null,
        puerto,
        colaNombre: form.colaNombre || null,
        nombreSistema: form.nombreSistema || null,
        idAgente: form.idAgente || null,
        usaTls: form.usaTls,
        tamanoPapel: form.tamanoPapel,
        orientacion: form.orientacion,
        duplex: form.duplex,
        colorModo: form.colorModo,
        bandeja: form.bandeja || null,
        copiasDefault: Number.isFinite(copiasDefault) ? copiasDefault : 1,
        notas: form.notas || null,
      };

      if (isEdit && impresora) {
        await updateImpresoraConfigurator({
          ...payload,
          idImpresora: impresora.idImpresora,
          estaActiva: impresora.estaActiva,
        });
      } else {
        await createImpresoraConfigurator(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo guardar la impresora.",
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
        sectionLabel="Configurador"
        title={isEdit ? "Editar impresora" : "Configurar impresora"}
        description="Papel carta (Letter). Se asigna a todos los usuarios de la cuenta. Para imprimir sin diálogo: instala la impresora en Windows, pon su nombre de cola en «Nombre en Windows (QZ Tray)», e instala QZ Tray (qz.io) en el PC que imprime."
        onSubmit={handleSubmit}
        error={error}
        isSubmitting={isSubmitting}
        submitDisabled={isLoadingOptions}
        submitLabel={isEdit ? "Guardar cambios" : "Guardar impresora"}
        size="xl"
        compact
        closeOnEscape={picker === null}
      >
        <div className="space-y-5">
          <section className="space-y-3">
            <h3 className="polaria-text-body-sm font-semibold text-polaria-teal">
              Identidad
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <PolariaFormInput
                id="imp-nombre"
                label="Nombre"
                value={form.nombre}
                onChange={(e) => updateField("nombre", e.target.value)}
                placeholder="Ej. Impresora oficina Bogotá"
                required
                compact
              />
              <PolariaFormInput
                id="imp-codigo"
                label="Código interno"
                value={form.codigo}
                onChange={(e) => updateField("codigo", e.target.value)}
                placeholder="Opcional"
                compact
              />
              <PolariaFormSelect
                id="imp-cuenta"
                label="Cuenta"
                value={form.codigoCuenta}
                onChange={(e) => handleCuentaChange(e.target.value)}
                required
                disabled={isLoadingOptions}
                placeholder="Selecciona una cuenta"
                options={cuentaOptions}
                compact
              />
              <PolariaFormSelect
                id="imp-bodega"
                label="Bodega"
                value={form.idBodega}
                onChange={(e) => updateField("idBodega", e.target.value)}
                disabled={!form.codigoCuenta || isLoadingOptions}
                options={bodegaOptions}
                compact
              />
              <PolariaFormSelect
                id="imp-pais"
                label="País"
                value={form.pais}
                onChange={(e) =>
                  updateField("pais", e.target.value as ImpresoraPais)
                }
                required
                options={PAIS_OPTIONS}
                compact
              />
              <PolariaFormInput
                id="imp-ubicacion"
                label="Ubicación"
                value={form.ubicacionTexto}
                onChange={(e) => updateField("ubicacionTexto", e.target.value)}
                placeholder="Ej. Recepción, piso 2"
                compact
              />
              <PolariaFormField id="imp-marca" label="Marca" compact>
                <JefeBodegaModalSearchField
                  id="imp-marca"
                  value={form.marca}
                  placeholder="Selecciona una marca"
                  ariaLabel="Marca"
                  compact
                  onSearchClick={
                    !isSubmitting ? () => setPicker("marca") : undefined
                  }
                />
              </PolariaFormField>
              <PolariaFormField id="imp-modelo" label="Modelo" compact>
                <JefeBodegaModalSearchField
                  id="imp-modelo"
                  value={form.modelo}
                  placeholder={
                    form.marcaId
                      ? "Selecciona un modelo"
                      : "Primero elige una marca"
                  }
                  ariaLabel="Modelo"
                  compact
                  onSearchClick={
                    form.marcaId && !isSubmitting
                      ? () => setPicker("modelo")
                      : undefined
                  }
                />
              </PolariaFormField>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="polaria-text-body-sm font-semibold text-polaria-teal">
              Conexión
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <PolariaFormSelect
                id="imp-tipo"
                label="Tipo de conexión"
                value={form.tipoConexion}
                onChange={(e) =>
                  handleTipoConexionChange(
                    e.target.value as ImpresoraTipoConexion,
                  )
                }
                required
                options={TIPO_CONEXION_OPTIONS}
                compact
              />
              <PolariaFormSelect
                id="imp-modo"
                label="Modo de envío"
                value={form.modoEnvio}
                onChange={(e) =>
                  handleModoEnvioChange(e.target.value as ImpresoraModoEnvio)
                }
                required
                options={MODO_ENVIO_OPTIONS}
                compact
              />

              {needsNetwork ? (
                <>
                  <PolariaFormInput
                    id="imp-host"
                    label="IP o hostname"
                    value={form.hostIp}
                    onChange={(e) => updateField("hostIp", e.target.value)}
                    placeholder="192.168.1.50 o impresora.local"
                    required
                    compact
                  />
                  <PolariaFormInput
                    id="imp-puerto"
                    label="Puerto"
                    value={form.puerto}
                    onChange={(e) => updateField("puerto", e.target.value)}
                    inputMode="numeric"
                    placeholder={
                      form.modoEnvio === "raw_9100" ? "9100" : "631"
                    }
                    compact
                  />
                  <PolariaFormInput
                    id="imp-cola"
                    label="Nombre de cola IPP"
                    value={form.colaNombre}
                    onChange={(e) => updateField("colaNombre", e.target.value)}
                    placeholder="Opcional (IPP)"
                    compact
                  />
                  <PolariaFormField id="imp-tls" label="TLS / IPPS" compact>
                    <label className="flex h-10 items-center gap-2 rounded-lg border border-polaria-w-08 bg-polaria-w-08 px-3 text-sm text-polaria-w">
                      <input
                        id="imp-tls"
                        type="checkbox"
                        checked={form.usaTls}
                        onChange={(e) =>
                          updateField("usaTls", e.target.checked)
                        }
                        className="accent-polaria-teal"
                      />
                      Usar conexión cifrada
                    </label>
                  </PolariaFormField>
                </>
              ) : null}

              {needsSistemaLocal ? (
                <PolariaFormInput
                  id="imp-sistema"
                  label="Nombre en el sistema"
                  value={form.nombreSistema}
                  onChange={(e) =>
                    updateField("nombreSistema", e.target.value)
                  }
                  placeholder="Nombre exacto de la cola en Windows / macOS / Linux"
                  required
                  compact
                  fieldClassName="sm:col-span-2"
                />
              ) : null}

              {needsNetwork ? (
                <PolariaFormInput
                  id="imp-sistema-qz"
                  label="Nombre en Windows (QZ Tray)"
                  value={form.nombreSistema}
                  onChange={(e) =>
                    updateField("nombreSistema", e.target.value)
                  }
                  placeholder="Ej. EPSON L3250 Series (como aparece en Impresoras de Windows)"
                  compact
                  fieldClassName="sm:col-span-2"
                />
              ) : null}

              {needsAgente ? (
                <>
                  <PolariaFormInput
                    id="imp-agente"
                    label="ID del agente"
                    value={form.idAgente}
                    onChange={(e) => updateField("idAgente", e.target.value)}
                    placeholder="QZ Tray / PrintNode / similar"
                    compact
                  />
                  <PolariaFormInput
                    id="imp-agente-cola"
                    label="Nombre de cola del agente"
                    value={form.nombreSistema}
                    onChange={(e) =>
                      updateField("nombreSistema", e.target.value)
                    }
                    placeholder="Cola expuesta por el agente"
                    compact
                  />
                </>
              ) : null}
            </div>
            <p className="polaria-text-body-sm text-polaria-w-50">
              USB o Bluetooth desde el navegador requieren un agente local en la
              PC (p. ej. QZ Tray). Wi‑Fi/Ethernet usan IPP (631) o JetDirect
              (9100).
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="polaria-text-body-sm font-semibold text-polaria-teal">
              Trabajo de impresión
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <PolariaFormSelect
                id="imp-papel"
                label="Tamaño de papel"
                value={form.tamanoPapel}
                onChange={(e) =>
                  updateField(
                    "tamanoPapel",
                    e.target.value as ImpresoraTamanoPapel,
                  )
                }
                options={PAPEL_OPTIONS}
                compact
              />
              <PolariaFormSelect
                id="imp-orientacion"
                label="Orientación"
                value={form.orientacion}
                onChange={(e) =>
                  updateField(
                    "orientacion",
                    e.target.value as ImpresoraOrientacion,
                  )
                }
                options={ORIENTACION_OPTIONS}
                compact
              />
              <PolariaFormSelect
                id="imp-duplex"
                label="Dúplex"
                value={form.duplex}
                onChange={(e) =>
                  updateField("duplex", e.target.value as ImpresoraDuplex)
                }
                options={DUPLEX_OPTIONS}
                compact
              />
              <PolariaFormSelect
                id="imp-color"
                label="Color"
                value={form.colorModo}
                onChange={(e) =>
                  updateField(
                    "colorModo",
                    e.target.value as ImpresoraColorModo,
                  )
                }
                options={COLOR_OPTIONS}
                compact
              />
              <PolariaFormInput
                id="imp-bandeja"
                label="Bandeja"
                value={form.bandeja}
                onChange={(e) => updateField("bandeja", e.target.value)}
                placeholder="Opcional"
                compact
              />
              <PolariaFormInput
                id="imp-copias"
                label="Copias por defecto"
                value={form.copiasDefault}
                onChange={(e) => updateField("copiasDefault", e.target.value)}
                inputMode="numeric"
                compact
              />
              <PolariaFormInput
                id="imp-notas"
                label="Notas"
                value={form.notas}
                onChange={(e) => updateField("notas", e.target.value)}
                placeholder="Instrucciones para el operador"
                compact
                fieldClassName="sm:col-span-2"
              />
            </div>
          </section>
        </div>
      </PolariaFormModal>

      <ImpresoraTablePickerModal
        open={picker === "marca"}
        onClose={() => setPicker(null)}
        title="Seleccionar marca"
        description="Marcas de impresoras carta (Letter) usadas en CO, MX y USA."
        rows={IMPRESORA_MARCAS_CATALOG}
        columns={[
          {
            id: "nombre",
            header: "Marca",
            cell: (row: ImpresoraMarcaCatalogItem) => row.nombre,
          },
          {
            id: "origen",
            header: "Origen",
            cell: (row) => row.origen,
            className: "text-polaria-w-50",
          },
        ]}
        getRowKey={(row) => row.id}
        getSearchHaystack={(row) => `${row.nombre} ${row.origen}`}
        selectedKey={form.marcaId || null}
        searchPlaceholder="Buscar marca"
        onSelect={(marca) => {
          setForm((current) => ({
            ...current,
            marcaId: marca.id,
            marca: marca.nombre,
            modeloId: "",
            modelo: "",
          }));
        }}
      />

      <ImpresoraTablePickerModal
        open={picker === "modelo"}
        onClose={() => setPicker(null)}
        title={`Modelos · ${form.marca || "marca"}`}
        description={`Modelos carta de ${getImpresoraMarcaById(form.marcaId)?.nombre ?? "la marca"}.`}
        rows={modelosDeMarca}
        columns={[
          {
            id: "nombre",
            header: "Modelo",
            cell: (row: ImpresoraModeloCatalogItem) => row.nombre,
          },
          {
            id: "tipo",
            header: "Tipo",
            cell: (row) => IMPRESORA_TIPO_LABEL[row.tipo],
            className: "text-polaria-w-50",
          },
        ]}
        getRowKey={(row) => row.id}
        getSearchHaystack={(row) =>
          `${row.nombre} ${IMPRESORA_TIPO_LABEL[row.tipo]}`
        }
        selectedKey={form.modeloId || null}
        searchPlaceholder="Buscar modelo"
        emptyMessage="No hay modelos para esta marca en el catálogo."
        onSelect={(modelo) => {
          setForm((current) => ({
            ...current,
            modeloId: modelo.id,
            modelo: modelo.nombre,
          }));
        }}
      />
    </>
  );
}
