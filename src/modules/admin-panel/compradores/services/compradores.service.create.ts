import { requireCodigoCuenta, runDomainMutation } from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { generateCodigoCuentaFromNombre, normalizeCodigoCuentaInput } from "@/lib/utils/generate-codigo-cuenta";
import { isValidInternationalPhone, normalizeInternationalPhone } from "@/constants/ui/phone-countries";
import { type CompradorAltaFicha } from "../utils/comprador-alta";

import { COMPRADOR_LIST_COLUMNS, mapCompradorRow, type CompradorDbRow, type CompradorListRow } from "./compradores.service.types";

export interface CreateCompradorInput {
  codigoCuenta: string;
  nombre: string;
  telefono?: string | null;
  ficha?: CompradorAltaFicha | null;
}

/** Crea un comprador para la cuenta activa (scope tenant). */
export async function createCompradorAdmin(
  input: CreateCompradorInput,
): Promise<CompradorListRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const nombre = input.nombre.trim();
  const telefonoRaw = input.telefono?.trim() ?? "";
  const codigo = normalizeCodigoCuentaInput(
    generateCodigoCuentaFromNombre(nombre),
  );

  if (!nombre) {
    throw new DomainServiceError(
      "El nombre del comprador es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  if (!codigo) {
    throw new DomainServiceError(
      "No se pudo generar el código del comprador.",
      "INVALID_ARGUMENT",
    );
  }

  if (telefonoRaw && !isValidInternationalPhone(telefonoRaw)) {
    throw new DomainServiceError(
      "El teléfono del comprador no es válido.",
      "INVALID_ARGUMENT",
    );
  }

  const telefono = telefonoRaw
    ? normalizeInternationalPhone(telefonoRaw)
    : null;

  const ficha = input.ficha ?? null;
  const payload: Record<string, unknown> = {
    codigo_cuenta: codigoCuenta,
    codigo,
    nombre,
    telefono,
    esta_activo: true,
  };

  if (ficha) {
    payload.razon_social = ficha.razonSocial;
    payload.rfc = ficha.rfc;
    payload.regimen = ficha.regimen;
    payload.cp_fiscal = ficha.cpFiscal;
    payload.uso_cfdi = ficha.usoCfdi;
    payload.constancia_nombre = ficha.constanciaNombre;
    payload.constancia_fecha = ficha.constanciaFecha;
    payload.apodo = ficha.apodo;
    payload.grupo = ficha.grupo;
    payload.vendedor = ficha.vendedor;
    payload.estado = ficha.estado;
    payload.lista_precios = ficha.listaPrecios;
    payload.dias_credito = ficha.diasCredito;
    payload.limite_credito = ficha.limiteCredito;
    payload.metodo_pago = ficha.metodoPago;
    payload.forma_pago = ficha.formaPago;
    payload.moneda = ficha.moneda;
    payload.exige_oc = ficha.exigeOc;
    payload.correos_cfdi = ficha.correosCfdi;
    payload.complemento_pago = ficha.complementoPago;
    payload.whatsapp = ficha.whatsapp;
    payload.formato_pedido = ficha.formatoPedido;
    payload.correos_pedido = ficha.correosPedido;
    payload.portal_proveedores = ficha.portalProveedores;
    payload.portal_nota = ficha.portalNota;
    payload.sustituciones = ficha.sustituciones;
    payload.tolerancia = ficha.tolerancia;
    payload.vida_util = ficha.vidaUtil;
    payload.requiere_lote = ficha.requiereLote;
    payload.requiere_temp = ficha.requiereTemp;
    payload.requiere_ficha = ficha.requiereFicha;
    payload.politica_devolucion = ficha.politicaDevolucion;

    const centro = ficha.centros?.[0];
    if (centro) {
      payload.centro_nombre = centro.nombre;
      payload.centro_dias = centro.dias;
      payload.centro_direccion = centro.direccion;
      payload.centro_cp = centro.cp;
      payload.centro_anden = centro.anden;
      payload.centro_desde = centro.desde;
      payload.centro_hasta = centro.hasta;
      payload.centro_contacto = centro.contacto;
      payload.centro_telefono = centro.telefono;
      payload.centro_carretera_federal = centro.carreteraFederal;
      payload.centro_notas = centro.notas;
    }

    const contacto = ficha.contactos?.[0];
    if (contacto) {
      payload.contacto_nombre = contacto.nombre;
      payload.contacto_puesto = contacto.puesto;
      payload.contacto_rol = contacto.rol;
      payload.contacto_telefono = contacto.telefono;
      payload.contacto_correo = contacto.correo;
    }
  }

  const insertComprador = (body: Record<string, unknown>, columns: string) =>
    runDomainMutation<CompradorDbRow | null>((client) => {
      const query = client
        .from("comprador")
        .insert(body)
        .select(columns)
        .single();

      return query as unknown as Promise<{
        data: CompradorDbRow | null;
        error: { message: string } | null;
      }>;
    });

  const inserted = await insertComprador(payload, COMPRADOR_LIST_COLUMNS);

  if (!inserted) {
    throw new DomainServiceError(
      "No se pudo crear el comprador.",
      "MUTATION_FAILED",
    );
  }

  return mapCompradorRow(inserted);
}
