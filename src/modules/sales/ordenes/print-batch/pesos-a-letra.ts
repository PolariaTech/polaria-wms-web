const HASTA_20 = [
  "cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
  "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete",
  "dieciocho", "diecinueve", "veinte",
] as const;

const DECENAS = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"] as const;
const CENTENAS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"] as const;

function menoresDe100(valor: number): string {
  if (valor <= 20) return HASTA_20[valor] ?? "";
  if (valor < 30) return `veinti${HASTA_20[valor - 20]}`;
  const decena = DECENAS[Math.floor(valor / 10)] ?? "";
  const unidad = valor % 10;
  return unidad === 0 ? decena : `${decena} y ${HASTA_20[unidad]}`;
}

function menoresDe1000(valor: number): string {
  if (valor < 100) return menoresDe100(valor);
  if (valor === 100) return "cien";
  const resto = valor % 100;
  const centena = CENTENAS[Math.floor(valor / 100)] ?? "";
  return resto === 0 ? centena : `${centena} ${menoresDe100(resto)}`;
}

/** Entero en palabras, de 0 a 999 millones. */
export function enteroALetra(valor: number): string {
  const n = Math.floor(Math.abs(valor));
  if (n < 1000) return menoresDe1000(n);
  if (n < 1_000_000) {
    const miles = Math.floor(n / 1000);
    const resto = n % 1000;
    const texto = miles === 1 ? "mil" : `${menoresDe1000(miles)} mil`;
    return resto === 0 ? texto : `${texto} ${menoresDe1000(resto)}`;
  }
  const millones = Math.floor(n / 1_000_000);
  const resto = n % 1_000_000;
  const texto = millones === 1 ? "un millón" : `${menoresDe1000(millones)} millones`;
  return resto === 0 ? texto : `${texto} ${enteroALetra(resto)}`;
}

/** Importe como en la factura: «sesenta y nueve Pesos 00/100 M.N.». */
export function pesosALetra(monto: number): string {
  const absoluto = Math.abs(Number.isFinite(monto) ? monto : 0);
  const entero = Math.floor(absoluto + 1e-8);
  const centavos = Math.round((absoluto - entero) * 100);
  const palabras = entero === 1 ? "un" : enteroALetra(entero);
  const pesos = entero === 1 ? "Peso" : "Pesos";
  return `${palabras} ${pesos} ${String(centavos).padStart(2, "0")}/100 M.N.`;
}
