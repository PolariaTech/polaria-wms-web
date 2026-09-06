"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaTableCode } from "@/components/shared/table/PolariaTableCells";
import { formatInternationalPhoneDisplay } from "@/constants/ui/phone-countries";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  getCompradorAdmin,
  type CompradorDetalleRow,
  type CompradorListRow,
} from "../services/compradores.service";
import {
  listCompradorProductoAliasAdmin,
  type CompradorProductoAliasListRow,
} from "../services/comprador-producto-alias.service";
import {
  displayAltaValue,
  emptyCompradorAltaFicha,
  type CompradorAltaFicha,
} from "../utils/comprador-alta";
import { CompradorEquivalenciasTable } from "./CompradorEquivalenciasTable";
import { CompradorModalTabs } from "./CompradorModalTabs";

interface CompradorDetalleModalProps {
  open: boolean;
  comprador: CompradorListRow | null;
  onClose: () => void;
}

type DetalleTab = "informacion" | "equivalencia";

const DETALLE_TABS = [
  { id: "informacion" as const, label: "Información" },
  { id: "equivalencia" as const, label: "Equivalencia" },
];

function CaptureSection({
  title,
  optional,
  children,
}: {
  title: string;
  optional?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-polaria-t-20 bg-polaria-t-08">
      <h3 className="flex items-center justify-between gap-3 border-b border-polaria-w-08 px-4 py-2.5 polaria-text-label uppercase tracking-wide text-polaria-teal">
        <span>{title}</span>
        {optional ? (
          <span className="normal-case tracking-normal text-polaria-w-50">
            {optional}
          </span>
        ) : null}
      </h3>
      <div className="p-4">{children}</div>
    </section>
  );
}

function MetaField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="polaria-text-label text-polaria-w-20">{label}</p>
      <div className="mt-1 break-words polaria-text-body-sm font-medium text-polaria-w">
        {children}
      </div>
    </div>
  );
}

function TextValue({ value }: { value: string | boolean | undefined }) {
  return <>{displayAltaValue(value)}</>;
}

export function CompradorDetalleModal({
  open,
  comprador,
  onClose,
}: CompradorDetalleModalProps) {
  const { codigoCuenta } = useCompany();
  const [detalle, setDetalle] = useState<CompradorDetalleRow | null>(null);
  const [equivalencias, setEquivalencias] = useState<
    CompradorProductoAliasListRow[]
  >([]);
  const [activeTab, setActiveTab] = useState<DetalleTab>("informacion");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !comprador) {
      setDetalle(null);
      setEquivalencias([]);
      setActiveTab("informacion");
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!codigoCuenta) {
      setDetalle(null);
      setEquivalencias([]);
      setActiveTab("informacion");
      setError("No se encontró la cuenta activa.");
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setActiveTab("informacion");

    void Promise.all([
      getCompradorAdmin({
        codigoCuenta,
        idComprador: comprador.idComprador,
      }),
      listCompradorProductoAliasAdmin({
        codigoCuenta,
        idComprador: comprador.idComprador,
      }),
    ])
      .then(([nextDetalle, nextEquivalencias]) => {
        if (cancelled) return;
        setDetalle(nextDetalle);
        setEquivalencias(nextEquivalencias);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setDetalle(null);
        setEquivalencias([]);
        setError(
          err instanceof DomainServiceError
            ? err.message
            : "No se pudo cargar el detalle del comprador.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, comprador, open]);

  const ficha: CompradorAltaFicha = detalle?.ficha ?? emptyCompradorAltaFicha();
  const telefono = detalle?.telefono?.trim()
    ? formatInternationalPhoneDisplay(detalle.telefono)
    : comprador?.telefono?.trim()
      ? formatInternationalPhoneDisplay(comprador.telefono)
      : "—";

  const centrosConDato = ficha.centros.filter((row) =>
    Object.values(row).some((value) => value.trim()),
  );
  const contactosConDato = ficha.contactos.filter((row) =>
    Object.values(row).some((value) => value.trim()),
  );

  return (
    <PolariaFormModal
      open={open && Boolean(comprador)}
      onClose={onClose}
      title={comprador?.comprador ?? "Comprador"}
      description={
        comprador
          ? `${comprador.codigo} — ficha de alta del comprador.`
          : undefined
      }
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      error={error}
      footerAction={<></>}
      cancelLabel="Cerrar"
      compact
      size="2xl"
      hideHeaderClose
    >
      <CompradorModalTabs
        tabs={DETALLE_TABS}
        active={activeTab}
        onChange={setActiveTab}
      />

      {isLoading ? (
        <p className="polaria-text-body-sm text-polaria-w-50">Cargando…</p>
      ) : null}

      {!isLoading && activeTab === "informacion" ? (
        <div className="flex flex-col gap-3">
          <CaptureSection title="Identificación comercial">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MetaField label="Código">
                <PolariaTableCode>
                  {detalle?.codigo ?? comprador?.codigo ?? "—"}
                </PolariaTableCode>
              </MetaField>
              <MetaField label="Nombre comercial">
                {detalle?.comprador ?? comprador?.comprador ?? "—"}
              </MetaField>
              <MetaField label="Teléfono">{telefono}</MetaField>
              <MetaField label="Apodo interno">
                <TextValue value={ficha.apodo} />
              </MetaField>
              <MetaField label="Grupo hotelero">
                <TextValue value={ficha.grupo} />
              </MetaField>
              <MetaField label="Vendedor asignado">
                <TextValue value={ficha.vendedor} />
              </MetaField>
              <MetaField label="Estado">
                <TextValue value={ficha.estado} />
              </MetaField>
            </div>
          </CaptureSection>

          <CaptureSection
            title="Datos fiscales"
            optional="Se copian de la Constancia de Situación Fiscal"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MetaField label="Razón social">
                <TextValue value={ficha.razonSocial} />
              </MetaField>
              <MetaField label="RFC">
                <TextValue value={ficha.rfc} />
              </MetaField>
              <MetaField label="Régimen fiscal">
                <TextValue value={ficha.regimen} />
              </MetaField>
              <MetaField label="CP del domicilio fiscal">
                <TextValue value={ficha.cpFiscal} />
              </MetaField>
              <MetaField label="Uso del CFDI por omisión">
                <TextValue value={ficha.usoCfdi} />
              </MetaField>
              <MetaField label="Constancia de Situación Fiscal">
                <TextValue value={ficha.constanciaNombre} />
              </MetaField>
              <MetaField label="Fecha de la constancia">
                <TextValue value={ficha.constanciaFecha} />
              </MetaField>
            </div>
          </CaptureSection>

          <CaptureSection title="Condiciones comerciales">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MetaField label="Días de crédito">
                <TextValue value={ficha.diasCredito} />
              </MetaField>
              <MetaField label="Límite de crédito (MXN)">
                <TextValue value={ficha.limiteCredito} />
              </MetaField>
              <MetaField label="Método de pago">
                <TextValue value={ficha.metodoPago} />
              </MetaField>
              <MetaField label="Forma de pago">
                <TextValue value={ficha.formaPago} />
              </MetaField>
              <MetaField label="Moneda">
                <TextValue value={ficha.moneda} />
              </MetaField>
              <MetaField label="¿Exige orden de compra para facturar?">
                <TextValue value={ficha.exigeOc} />
              </MetaField>
              <MetaField label="Correos para envío del CFDI">
                <TextValue value={ficha.correosCfdi} />
              </MetaField>
              <MetaField label="Complemento de pago">
                <TextValue value={ficha.complementoPago} />
              </MetaField>
            </div>
          </CaptureSection>

          <CaptureSection
            title="Centros de consumo y entrega"
            optional="Uno por cocina"
          >
            {centrosConDato.length === 0 ? (
              <p className="polaria-text-body-sm text-polaria-w-50">
                Sin centros de consumo registrados.
              </p>
            ) : (
              centrosConDato.map((centro, index) => (
                <div
                  key={`${centro.nombre}-${index}`}
                  className="mb-3 rounded-xl border border-polaria-w-08 bg-polaria-w-08 p-3 last:mb-0"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <MetaField label="Nombre del centro de consumo">
                      <TextValue value={centro.nombre} />
                    </MetaField>
                    <MetaField label="Días que recibe">
                      <TextValue value={centro.dias} />
                    </MetaField>
                    <MetaField label="Dirección">
                      <TextValue value={centro.direccion} />
                    </MetaField>
                    <MetaField label="CP">
                      <TextValue value={centro.cp} />
                    </MetaField>
                    <MetaField label="Andén / punto de recepción">
                      <TextValue value={centro.anden} />
                    </MetaField>
                    <MetaField label="Recibe desde">
                      <TextValue value={centro.desde} />
                    </MetaField>
                    <MetaField label="Recibe hasta">
                      <TextValue value={centro.hasta} />
                    </MetaField>
                    <MetaField label="Contacto en el andén">
                      <TextValue value={centro.contacto} />
                    </MetaField>
                    <MetaField label="Teléfono del andén">
                      <TextValue value={centro.telefono} />
                    </MetaField>
                    <MetaField label="¿La ruta usa carretera federal?">
                      <TextValue value={centro.carreteraFederal} />
                    </MetaField>
                    <MetaField label="Notas de acceso">
                      <TextValue value={centro.notas} />
                    </MetaField>
                  </div>
                </div>
              ))
            )}
          </CaptureSection>

          <CaptureSection title="Contactos">
            {contactosConDato.length === 0 ? (
              <p className="polaria-text-body-sm text-polaria-w-50">
                Sin contactos registrados.
              </p>
            ) : (
              contactosConDato.map((contacto, index) => (
                <div
                  key={`${contacto.nombre}-${index}`}
                  className="mb-3 rounded-xl border border-polaria-w-08 bg-polaria-w-08 p-3 last:mb-0"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <MetaField label="Nombre">
                      <TextValue value={contacto.nombre} />
                    </MetaField>
                    <MetaField label="Puesto">
                      <TextValue value={contacto.puesto} />
                    </MetaField>
                    <MetaField label="Rol">
                      <TextValue value={contacto.rol} />
                    </MetaField>
                    <MetaField label="Teléfono">
                      <TextValue value={contacto.telefono} />
                    </MetaField>
                    <MetaField label="Correo">
                      <TextValue value={contacto.correo} />
                    </MetaField>
                  </div>
                </div>
              ))
            )}
          </CaptureSection>

          <CaptureSection title="Canales de pedido">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MetaField label="Números de WhatsApp autorizados">
                <TextValue value={ficha.whatsapp} />
              </MetaField>
              <MetaField label="Formato habitual del pedido">
                <TextValue value={ficha.formatoPedido} />
              </MetaField>
              <MetaField label="Correos desde los que piden">
                <TextValue value={ficha.correosPedido} />
              </MetaField>
              <MetaField label="Portal de proveedores">
                <TextValue value={ficha.portalProveedores} />
              </MetaField>
              <MetaField label="Nota del portal">
                <TextValue value={ficha.portalNota} />
              </MetaField>
            </div>
          </CaptureSection>

          <CaptureSection title="Reglas de operación">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MetaField label="¿Acepta sustituciones?">
                <TextValue value={ficha.sustituciones} />
              </MetaField>
              <MetaField label="Tolerancia de peso">
                <TextValue value={ficha.tolerancia} />
              </MetaField>
              <MetaField label="Vida útil mínima al entregar (días)">
                <TextValue value={ficha.vidaUtil} />
              </MetaField>
              <MetaField label="¿Requiere lote y origen?">
                <TextValue value={ficha.requiereLote} />
              </MetaField>
              <MetaField label="¿Requiere temperatura al entregar?">
                <TextValue value={ficha.requiereTemp} />
              </MetaField>
              <MetaField label="¿Requiere ficha técnica del producto?">
                <TextValue value={ficha.requiereFicha} />
              </MetaField>
              <MetaField label="Política de rechazo y devolución">
                <TextValue value={ficha.politicaDevolucion} />
              </MetaField>
            </div>
          </CaptureSection>
        </div>
      ) : null}

      {!isLoading && activeTab === "equivalencia" ? (
        <div className="flex flex-col gap-3">
          <p className="polaria-text-body-sm text-polaria-w-50">
            Cómo le dice este hotel a cada producto del catálogo.
          </p>
          <CompradorEquivalenciasTable rows={equivalencias} />
        </div>
      ) : null}
    </PolariaFormModal>
  );
}
