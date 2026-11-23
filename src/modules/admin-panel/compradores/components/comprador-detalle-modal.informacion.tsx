"use client";

import { PolariaTableCode } from "@/components/shared/table/PolariaTableCells";
import type { CompradorDetalleRow, CompradorListRow } from "../services/compradores.service";
import type { CompradorAltaFicha } from "../utils/comprador-alta";
import { CaptureSection, MetaField, TextValue } from "./comprador-detalle-modal.ui";

export function CompradorDetalleInformacionPanel({
  detalle,
  comprador,
  ficha,
  telefono,
}: {
  detalle: CompradorDetalleRow | null;
  comprador: CompradorListRow | null;
  ficha: CompradorAltaFicha;
  telefono: string;
}) {
  const centrosConDato = ficha.centros.filter((row) =>
    Object.values(row).some((value) => value.trim()),
  );
  const contactosConDato = ficha.contactos.filter((row) =>
    Object.values(row).some((value) => value.trim()),
  );
  return (
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
                  <MetaField label="D. Comercial">
                    <TextValue value={ficha.apodo} />
                  </MetaField>
                  <MetaField label="Grupo perteneciente">
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
  );
}
