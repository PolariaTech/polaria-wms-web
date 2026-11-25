export interface CompradorAltaCentro {
  nombre: string;
  dias: string;
  direccion: string;
  cp: string;
  anden: string;
  desde: string;
  hasta: string;
  contacto: string;
  telefono: string;
  carreteraFederal: string;
  notas: string;
}

export interface CompradorAltaContacto {
  nombre: string;
  puesto: string;
  rol: string;
  telefono: string;
  correo: string;
}

export interface CompradorAltaFicha {
  razonSocial: string;
  rfc: string;
  regimen: string;
  cpFiscal: string;
  usoCfdi: string;
  constanciaNombre: string;
  constanciaFecha: string;
  apodo: string;
  grupo: string;
  vendedor: string;
  estado: string;
  listaPrecios: string;
  diasCredito: string;
  limiteCredito: string;
  metodoPago: string;
  formaPago: string;
  moneda: string;
  exigeOc: string;
  correosCfdi: string;
  complementoPago: boolean;
  centros: CompradorAltaCentro[];
  contactos: CompradorAltaContacto[];
  whatsapp: string;
  formatoPedido: string;
  correosPedido: string;
  portalProveedores: boolean;
  portalNota: string;
  sustituciones: string;
  tolerancia: string;
  vidaUtil: string;
  requiereLote: string;
  requiereTemp: string;
  requiereFicha: string;
  politicaDevolucion: string;
}

export type CompradorAltaCentroRow = CompradorAltaCentro & { key: string };
export type CompradorAltaContactoRow = CompradorAltaContacto & { key: string };

export type CompradorAltaFormFicha = Omit<CompradorAltaFicha, "centros" | "contactos"> & {
  centros: CompradorAltaCentroRow[];
  contactos: CompradorAltaContactoRow[];
};

export interface CompradorAltaFormState {
  nombreComercial: string;
  telefono: string;
  ficha: CompradorAltaFormFicha;
}
