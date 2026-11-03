import { Trash2 } from "lucide-react";
import { PolariaFormField, PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { FolioFacturaCampos } from "../../surtido/guardar-folio-factura-captura.client";
import { OrigenPedidoSourceView } from "../shared/OrigenPedidoBodyView";
import { CaptureSection } from "./CaptureSection";
import { OrdenVentaCaptureFormEntrega } from "./OrdenVentaCaptureFormEntrega";
import { OrdenVentaCaptureFormCliente, OrdenVentaCaptureFormOcultos } from "./OrdenVentaCaptureForm";
import { OrdenVentaCaptureFormLineas } from "./OrdenVentaCaptureFormLineas";
import { OrdenVentaCaptureFormPedido } from "./OrdenVentaCaptureFormPedido";

export function OrdenVentaFormStep(input: Record<string, any>) {
  const { ordenesTrabajoForm, hijaFormActiva, setConfirmRemoveOtId, isEditing, setStep, setStartMode, setError, afterCutoff, successMessage, hasProductos, emptyCatalogMessage, startMode, origenTexto, origenArchivosNombres, vendedorNombre, idComprador, compradorLabel, compradorNombreIa, compradorSugerencias, missingFields, setPicker, codigoClienteCatalogo, denominacionComercialCatalogo, fechaCreacion, paginarPorOt, folioFactura, ordenCompraHotel, setOrdenCompraHotel, exigeOc, centroConsumo, setCentroConsumo, fechaEntrega, setFechaEntrega, esPorConfirmar, ventanaDesde, setVentanaDesde, ventanaHasta, setVentanaHasta, prioridad, setPrioridad, moneda, observaciones, setObservaciones, clearFieldMarks, autoFields, warnFields, direccion, setDireccion, setAvisoVerificarDireccion, avisoVerificarDireccion, contacto, setContacto, telefono, setTelefono, correo, setCorreo, lineasConIndice, subtotalVenta, ivaVenta, totalVenta, totalOvCompleta, mostrarTotalOv, puedeAgregarProducto, setReplaceLineaIndex, handleOpenReplaceProducto, handleLineaFieldChange, handleCantidadChange, handleCantidadBlur, handlePrecioChange, handlePrecioBlur, handleRemoveLinea, lineas, setLineas, aceptaSustituciones, setAceptaSustituciones, requiereLote, setRequiereLote, registrarTemperatura, setRegistrarTemperatura } = input;
  return (
    <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {ordenesTrabajoForm.length > 1 ? (
                hijaFormActiva ? (
                  <button
                    type="button"
                    onClick={() => setConfirmRemoveOtId(hijaFormActiva.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-2.5 py-1.5 polaria-text-caption font-semibold text-polaria-danger transition hover:opacity-90"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    Eliminar esta tarea
                  </button>
                ) : (
                  <span />
                )
              ) : ordenesTrabajoForm.length === 1 && hijaFormActiva ? (
                <button
                  type="button"
                  onClick={() => setConfirmRemoveOtId(hijaFormActiva.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-2.5 py-1.5 polaria-text-caption font-semibold text-polaria-danger transition hover:opacity-90"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  Eliminar tarea de almacén
                </button>
              ) : !isEditing ? (
                <button
                  type="button"
                  onClick={() => {
                    setStep("start");
                    setStartMode(null);
                    setError(null);
                  }}
                  className="polaria-text-caption text-polaria-w-50 transition hover:text-polaria-teal"
                >
                  ← Volver al inicio
                </button>
              ) : (
                <span />
              )}
              <p className="polaria-text-caption text-polaria-w-50">
                {afterCutoff
                  ? "Después del corte de las 17:00 — el almacén no tendrá a quién preguntarle hasta las 02:00"
                  : "Captura abierta"}
              </p>
            </div>

            {successMessage ? (
              <p
                role="status"
                className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3 polaria-text-body-sm text-polaria-teal"
              >
                {successMessage}
              </p>
            ) : null}

            {!hasProductos ? (
              <p className="rounded-xl border border-polaria-warning-border bg-polaria-warning-bg px-4 py-3 polaria-text-body-sm text-polaria-warning">
                {emptyCatalogMessage}
              </p>
            ) : null}

            {/* REQ-097: oculto (no eliminado) — Datos del pedido / Cliente quedan arriba. */}
            {startMode === "docs" &&
            (origenTexto.trim() || origenArchivosNombres.length > 0) ? (
              <div
                className="hidden"
                aria-hidden
                data-ov-origen-pedido="hidden"
              >
                <p className="polaria-text-label text-polaria-w">
                  De dónde salió este pedido
                </p>
                <div className="mt-2">
                  <OrigenPedidoSourceView
                    archivos={origenArchivosNombres}
                    tieneTexto={Boolean(origenTexto.trim())}
                  />
                </div>
                {vendedorNombre ? (
                  <p className="mt-2 polaria-text-caption text-polaria-w-50">
                    Capturado por {vendedorNombre}
                  </p>
                ) : null}
              </div>
            ) : null}

            {hasProductos ? (
              <>
                <CaptureSection title="Datos del pedido">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div data-ov-revision="cliente" className="sm:col-span-2">
                    <PolariaFormField
                      id="orden-venta-cliente"
                      label="Cliente: razón social"
                      compact
                      required
                    >
                      <>
                      <OrdenVentaCaptureFormCliente
                        idComprador={idComprador}
                        compradorLabel={compradorLabel}
                        compradorNombreIa={compradorNombreIa}
                        haySugerencias={compradorSugerencias.length > 0}
                        missingFields={missingFields}
                        onElegirCliente={() => setPicker("comprador")}
                      />
                      </>
                </PolariaFormField>
                    </div>

                    <PolariaFormInput
                      id="orden-venta-codigo-cliente"
                      label="Código de cliente"
                      value={codigoClienteCatalogo}
                      readOnly
                      placeholder="—"
                      compact
                    />

                    <PolariaFormInput
                      id="orden-venta-denominacion-comercial"
                      label="Denominación comercial"
                      value={denominacionComercialCatalogo}
                      readOnly
                      placeholder="—"
                      fieldClassName="sm:col-span-2"
                      compact
                    />

                    {isEditing ? (
                      <PolariaFormInput
                        id="orden-venta-fecha-creacion"
                        label="Fecha de creación"
                        value={formatDateTime(fechaCreacion)}
                        readOnly
                        placeholder="—"
                        compact
                      />
                    ) : null}

                    {isEditing ? (
                      <FolioFacturaCampos
                        paginar={paginarPorOt}
                        activa={hijaFormActiva}
                        ots={ordenesTrabajoForm}
                        valores={folioFactura.valores}
                        onChange={folioFactura.setValor}
                      />
                    ) : null}

                    <OrdenVentaCaptureFormPedido
                      ordenCompraHotel={ordenCompraHotel}
                      onOrdenCompraHotel={setOrdenCompraHotel}
                      exigeOc={exigeOc}
                      centroConsumo={centroConsumo}
                      onCentroConsumo={setCentroConsumo}
                      fechaEntrega={fechaEntrega}
                      onFechaEntrega={setFechaEntrega}
                      onClearFechaError={() => setError(null)}
                      esPorConfirmar={esPorConfirmar}
                      ventanaDesde={ventanaDesde}
                      onVentanaDesde={setVentanaDesde}
                      ventanaHasta={ventanaHasta}
                      onVentanaHasta={setVentanaHasta}
                      prioridad={prioridad}
                      onPrioridad={setPrioridad}
                      moneda={moneda}
                      onBuscarMoneda={() => setPicker("moneda")}
                      observaciones={observaciones}
                      onObservaciones={setObservaciones}
                      onClearField={clearFieldMarks}
                      marks={{ autoFields, warnFields, missingFields }}
                    />
</div>
                </CaptureSection>

                <OrdenVentaCaptureFormEntrega
                  direccion={direccion}
                  onDireccion={(value) => {
                    setDireccion(value);
                    setAvisoVerificarDireccion(false);
                  }}
                  avisoVerificarDireccion={avisoVerificarDireccion}
                  contacto={contacto}
                  onContacto={setContacto}
                  telefono={telefono}
                  onTelefono={setTelefono}
                  correo={correo}
                  onCorreo={setCorreo}
                  onClearField={clearFieldMarks}
                  autoFields={autoFields}
                  warnFields={warnFields}
                  missingFields={missingFields}
                />
                <OrdenVentaCaptureFormLineas
                  lineas={lineasConIndice}
                  subtotal={subtotalVenta}
                  iva={ivaVenta}
                  total={totalVenta}
                  totalOv={totalOvCompleta}
                  mostrarTotalOv={mostrarTotalOv}
                  otCount={ordenesTrabajoForm.length}
                  puedeAgregar={puedeAgregarProducto}
                  onAgregar={() => {
                    setReplaceLineaIndex(null);
                    setPicker("producto");
                  }}
                  onOpenReplace={handleOpenReplaceProducto}
                  onEspecificacion={(index, value) =>
                    handleLineaFieldChange(index, "especificacion", value)
                  }
                  onIva={(index, value) =>
                    handleLineaFieldChange(index, "ivaPct", value)
                  }
                  onCantidadChange={handleCantidadChange}
                  onCantidadBlur={handleCantidadBlur}
                  onPrecioChange={handlePrecioChange}
                  onPrecioBlur={handlePrecioBlur}
                  onRemove={handleRemoveLinea}
                />
                <OrdenVentaCaptureFormOcultos
                  lineas={lineas}
                  onCajas={(index, value) =>
                    setLineas((prev: Array<{ cajasInput?: string }>) =>
                      prev.map((row, i) =>
                        i === index ? { ...row, cajasInput: value } : row,
                      ),
                    )
                  }
                  onPresentacion={(index, value) =>
                    setLineas((prev: Array<{ presentacion?: string }>) =>
                      prev.map((row, i) =>
                        i === index ? { ...row, presentacion: value } : row,
                      ),
                    )
                  }
                  aceptaSustituciones={aceptaSustituciones}
                  onSustituciones={setAceptaSustituciones}
                  requiereLote={requiereLote}
                  onRequiereLote={setRequiereLote}
                  registrarTemperatura={registrarTemperatura}
                  onRegistrarTemperatura={setRegistrarTemperatura}
                />
</>
            ) : null}
          </div>
  );
}
