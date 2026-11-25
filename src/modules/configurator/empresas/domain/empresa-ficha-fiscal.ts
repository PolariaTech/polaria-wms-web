export interface EmpresaFichaCampos {
  rfc: string;
  regimenFiscal: string;
  codigoPostalExpedicion: string;
  nombreCuentaBancaria: string;
  banco: string;
  clabe: string;
  correoCobranza: string;
  serieFactura: string;
}

export interface EmpresaFichaGuardada {
  rfc: string | null;
  regimenFiscal: string | null;
  codigoPostalExpedicion: string | null;
  nombreCuentaBancaria: string | null;
  banco: string | null;
  clabe: string | null;
  correoCobranza: string | null;
  serieFactura: string | null;
  logoPath: string | null;
}

export const FICHA_EN_BLANCO: EmpresaFichaCampos = {
  rfc: "",
  regimenFiscal: "",
  codigoPostalExpedicion: "",
  nombreCuentaBancaria: "",
  banco: "",
  clabe: "",
  correoCobranza: "",
  serieFactura: "",
};

const TRES_DIGITOS = /^[0-9]{3}$/;
const CORREO = /^[^@ ]+@[^@ ]+[.][^@ ]+$/;

export const LOGO_MAX_BYTES = 1_048_576;

function texto(valor: string): string | null {
  const limpio = valor.trim();
  return limpio.length === 0 ? null : limpio;
}

export function fichaDesdeEmpresa(
  empresa: EmpresaFichaGuardada,
): EmpresaFichaCampos {
  return {
    rfc: empresa.rfc ?? "",
    regimenFiscal: empresa.regimenFiscal ?? "",
    codigoPostalExpedicion: empresa.codigoPostalExpedicion ?? "",
    nombreCuentaBancaria: empresa.nombreCuentaBancaria ?? "",
    banco: empresa.banco ?? "",
    clabe: empresa.clabe ?? "",
    correoCobranza: empresa.correoCobranza ?? "",
    serieFactura: empresa.serieFactura ?? "",
  };
}

export function fichaParaGuardar(
  campos: EmpresaFichaCampos,
): Omit<EmpresaFichaGuardada, "logoPath"> {
  return {
    rfc: texto(campos.rfc),
    regimenFiscal: texto(campos.regimenFiscal),
    codigoPostalExpedicion: texto(campos.codigoPostalExpedicion),
    nombreCuentaBancaria: texto(campos.nombreCuentaBancaria),
    banco: texto(campos.banco),
    clabe: texto(campos.clabe),
    correoCobranza: texto(campos.correoCobranza),
    serieFactura: texto(campos.serieFactura),
  };
}

export function mensajeFicha(campos: EmpresaFichaCampos): string | null {
  const guardada = fichaParaGuardar(campos);
  if (guardada.regimenFiscal && !TRES_DIGITOS.test(guardada.regimenFiscal)) {
    return "El régimen fiscal no es válido.";
  }
  if (guardada.correoCobranza && !CORREO.test(guardada.correoCobranza)) {
    return "El correo de cobranza no es válido.";
  }
  return null;
}

export function mensajeLogo(archivo: { size: number; type: string }): string | null {
  if (archivo.size > LOGO_MAX_BYTES) return "El logo supera 1 MB.";
  const tipo = archivo.type.toLowerCase();
  if (tipo !== "image/jpeg" && tipo !== "image/png") {
    return "El logo debe ser JPEG o PNG.";
  }
  return null;
}

export function fichaTieneTexto(campos: EmpresaFichaCampos): boolean {
  return Object.values(campos).some((valor) => valor.trim().length > 0);
}

export function empresaTieneFicha(empresa: EmpresaFichaGuardada): boolean {
  return Boolean(
    empresa.rfc ||
      empresa.regimenFiscal ||
      empresa.codigoPostalExpedicion ||
      empresa.nombreCuentaBancaria ||
      empresa.banco ||
      empresa.clabe ||
      empresa.correoCobranza ||
      empresa.serieFactura ||
      empresa.logoPath,
  );
}

export function cuerpoConLogo(
  campos: Record<string, string | boolean | null>,
  logo: File,
): FormData {
  const cuerpo = new FormData();
  for (const [clave, valor] of Object.entries(campos)) {
    if (valor === null) {
      cuerpo.append(clave, "");
      continue;
    }
    cuerpo.append(clave, String(valor));
  }
  cuerpo.append("logo", logo);
  return cuerpo;
}
