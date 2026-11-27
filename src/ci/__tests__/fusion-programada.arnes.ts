/**
 * Arnés para probar `.github/workflows/fusion-programada.yml` sin tocar GitHub.
 *
 * Extrae el bloque `run:` real del workflow y lo ejecuta con bash, con un `gh` simulado y el `jq` de
 * verdad (así también se prueba el filtro de los PR que se fusionan). Las pruebas están en
 * `../fusion-programada.*.test.ts`.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";

export const REPO = "org/repo";
export const SHA_MAIN = "0123456789abcdef0123456789abcdef01234567";
export const URL_DEPLOY = "https://github.com/org/repo/actions/runs/1";
const RUTA_WORKFLOW = resolve(process.cwd(), ".github/workflows/fusion-programada.yml");

// gh simulado (en su propio archivo): lee su comportamiento de los archivos del escenario.
const leerGhSimulado = (): string =>
  readFileSync(resolve(process.cwd(), "src/ci/__tests__/fusion-programada.gh-simulado.sh"), "utf8").replace(/\r/g, "");

/** Nombres de las comprobaciones que el workflow exige, leídos del propio archivo. */
export const OBLIGATORIAS = JSON.parse(
  /CHECKS_OBLIGATORIOS: .(\[.*\])./.exec(readFileSync(RUTA_WORKFLOW, "utf8"))?.[1] ?? "[]",
) as string[];

export const VERCEL = { context: "Vercel", state: "SUCCESS" };
export const ciEnVerde = (): { name: string; conclusion: string }[] =>
  OBLIGATORIAS.map((name) => ({ name, conclusion: "SUCCESS" }));

export interface Pr {
  number: number;
  title: string;
  isDraft: boolean;
  reviewDecision: string;
  mergeable: string;
  labels: { name: string }[];
  statusCheckRollup: { name?: string; context?: string; conclusion?: string | null; state?: string }[];
  createdAt: string;
  headRefName: string;
  headRefOid: string;
  baseRefName: string;
  state: string;
  isCrossRepository: boolean;
  mergeStateStatus: string;
}

export interface Escenario {
  prs: Pr[];
  /** Estado de fusión por número de PR; por defecto CLEAN. */
  estados?: Record<number, string>;
  /** Números de los PR apilados sobre cada rama. */
  hijos?: Record<string, number[]>;
  /** Llamadas de gh que deben fallar (nombre del archivo marcador, sin extensión). */
  fallan?: string[];
  soloSimular?: boolean;
  /**
   * Resultado de las comprobaciones de un PR, una por cada vez que el robot las consulta tras actualizar
   * su rama (la última se repite). Por defecto, verde.
   */
  comprobaciones?: Record<number, EstadoComprobaciones[]>;
  /** Commits de main que le faltan a cada PR; por defecto 0 (al día). */
  atras?: Record<number, number>;
  /** Cuántas veces la lista de PR responde UNKNOWN antes de tener la respuesta. */
  listasSinCalcular?: number;
  /** PR cuya rama no cambia de commit tras `pr update-branch`. */
  sinCommitNuevo?: number[];
  /** Segundos de PRESUPUESTO_SEGUNDOS; por defecto, de sobra. */
  presupuesto?: number;
}

export type EstadoComprobaciones = "verde" | "rojo" | "pendiente" | "sinCi";

const COMPROBACION: Record<EstadoComprobaciones, () => object[]> = {
  verde: ciEnVerde,
  rojo: () => [{ name: OBLIGATORIAS[0], conclusion: "FAILURE" }],
  pendiente: () => [{ name: OBLIGATORIAS[0], conclusion: "", status: "IN_PROGRESS" }],
  sinCi: () => [VERCEL],
};

export interface Resultado {
  codigo: number | null;
  llamadas: string[];
  resumen: string;
  salida: string;
  /** Token con el que se pidió cada `pr update-branch`. */
  tokensDeActualizar: string[];
}

/** PR listo para fusionar; `cambios` rompe una condición. Los números menores son más antiguos. */
export function pr(numero: number, cambios: Partial<Pr> = {}): Pr {
  return {
    number: numero,
    title: `PR ${numero}`,
    isDraft: false,
    reviewDecision: "APPROVED",
    mergeable: "MERGEABLE",
    labels: [],
    statusCheckRollup: ciEnVerde(),
    headRefOid: `aaa${numero}`,
    baseRefName: "main",
    state: "OPEN",
    isCrossRepository: false,
    mergeStateStatus: "CLEAN",
    createdAt: new Date(Date.UTC(2026, 10, 1, 0, 0, numero)).toISOString(),
    headRefName: `dani/pr-${numero}`,
    ...cambios,
  };
}

const claveDeRama = (rama: string): string => rama.replace(/\//g, "_");

/** Saca el contenido del `run: |` del workflow, sin la sangría del YAML ni retornos de carro. */
function extraerScript(texto: string): string {
  const lineas = texto.replace(/\r/g, "").split("\n");
  const inicio = lineas.findIndex((linea) => /^\s+run: \|\s*$/.test(linea));
  if (inicio === -1) throw new Error("No se encontró el bloque `run: |` en el workflow");
  const sangria = (/^\s*/.exec(lineas[inicio])?.[0].length ?? 0) + 2;
  const cuerpo: string[] = [];
  for (const linea of lineas.slice(inicio + 1)) {
    if (linea.trim() !== "" && !linea.startsWith(" ".repeat(sangria))) break;
    cuerpo.push(linea.slice(sangria));
  }
  return cuerpo.join("\n") + "\n";
}

function existe(comando: string): boolean {
  return spawnSync(comando, ["--version"], { stdio: "ignore" }).status === 0;
}

/**
 * Necesita `bash` y `jq`. En CI (variable CI) nunca se salta: si falta alguno, la prueba debe fallar.
 * En local, sin ellos, las pruebas se saltan. En Windows hace falta Git Bash (no el bash de WSL, que es el
 * que aparece primero en el PATH de PowerShell) y jq instalado (`winget install jqlang.jq`).
 */
export const hayHerramientas = (existe("bash") && existe("jq")) || Boolean(process.env.CI);

const carpetas: string[] = [];

export function limpiarEscenarios(): void {
  for (const carpeta of carpetas.splice(0)) rmSync(carpeta, { recursive: true, force: true });
}

/**
 * En Windows el jq nativo termina cada línea con CRLF y `read` del script recibiría "10\r". Su opción
 * `--binary` lo evita y deja la salida igual que en Linux. En Linux (CI) no hace falta envolverlo.
 */
function envolverJqEnWindows(carpeta: string): void {
  if (process.platform !== "win32") return;
  const real = spawnSync("bash", ["-c", "command -v jq"], {
    encoding: "utf8",
  }).stdout.trim();
  writeFileSync(`${carpeta}/bin/jq`, `#!/usr/bin/env bash\nexec "${real}" --binary "$@"\n`, { mode: 0o755 });
}

function escribirPrs(carpeta: string, escenario: Escenario): void {
  // Los PR apilados que solo se nombran en `hijos` se crean listos para fusionar.
  const nombrados = Object.values(escenario.hijos ?? {}).flat();
  const faltantes = nombrados.filter((numero) => !escenario.prs.some((p) => p.number === numero));
  const todos = [...escenario.prs, ...faltantes.map((numero) => pr(numero))].map((p) => ({
    ...p,
    mergeStateStatus: escenario.estados?.[p.number] ?? p.mergeStateStatus,
  }));
  const haciaMain = todos.filter((p) => p.baseRefName === "main" && !faltantes.includes(p.number));
  writeFileSync(`${carpeta}/lista-de-prs.json`, JSON.stringify(haciaMain));
  for (const p of todos) {
    writeFileSync(`${carpeta}/pr-${p.number}.json`, JSON.stringify(p));
    writeFileSync(`${carpeta}/atras-${p.headRefOid}`, String(escenario.atras?.[p.number] ?? 0));
    const secuencia = escenario.comprobaciones?.[p.number] ?? ["verde"];
    writeFileSync(
      `${carpeta}/comprobaciones-${p.number}.json`,
      JSON.stringify(secuencia.map((estado) => COMPROBACION[estado]())),
    );
  }
}

function prepararEscenario(escenario: Escenario): string {
  const carpeta = mkdtempSync(join(tmpdir(), "fusion-programada-")).replace(/\\/g, "/");
  carpetas.push(carpeta);
  mkdirSync(`${carpeta}/bin`);
  writeFileSync(`${carpeta}/bin/gh`, leerGhSimulado(), { mode: 0o755 });
  envolverJqEnWindows(carpeta);
  writeFileSync(`${carpeta}/listas-sin-calcular`, String(escenario.listasSinCalcular ?? 0));
  escribirPrs(carpeta, escenario);
  for (const [rama, numeros] of Object.entries(escenario.hijos ?? {})) {
    writeFileSync(`${carpeta}/hijos-${claveDeRama(rama)}`, numeros.join("\n") + "\n");
  }
  for (const numero of escenario.sinCommitNuevo ?? []) writeFileSync(`${carpeta}/oid-${numero}.nocambia`, "");
  for (const marcador of escenario.fallan ?? []) writeFileSync(`${carpeta}/${marcador}.fallo`, "");
  writeFileSync(`${carpeta}/fusionar.sh`, extraerScript(readFileSync(RUTA_WORKFLOW, "utf8")));
  return carpeta;
}

function leerArchivo(ruta: string): string {
  try {
    return readFileSync(ruta, "utf8");
  } catch {
    return "";
  }
}

export function ejecutar(escenario: Escenario): Resultado {
  const carpeta = prepararEscenario(escenario);
  const proceso = spawnSync("bash", ["fusionar.sh"], {
    cwd: carpeta,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${carpeta}/bin${delimiter}${process.env.PATH ?? ""}`,
      ESCENARIO: carpeta,
      REPO,
      SHA_MAIN,
      URL_DEPLOY,
      SOLO_SIMULAR: escenario.soloSimular ? "true" : "false",
      GH_TOKEN: "token-del-workflow",
      APP_TOKEN: "token-de-la-app",
      CHECKS_OBLIGATORIOS: JSON.stringify(OBLIGATORIAS),
      // Sin esperas reales: 3 consultas sin pausa.
      CALCULO_INTENTOS: "3",
      CALCULO_INTERVALO: "0",
      ESPERA_INTENTOS: "3",
      ESPERA_INTERVALO: "0",
      PRESUPUESTO_SEGUNDOS: String(escenario.presupuesto ?? 100000),
      GITHUB_STEP_SUMMARY: `${carpeta}/resumen.md`,
    },
  });
  return {
    codigo: proceso.status,
    llamadas: leerArchivo(`${carpeta}/llamadas.log`).split("\n").filter(Boolean),
    resumen: leerArchivo(`${carpeta}/resumen.md`),
    salida: `${proceso.stdout}${proceso.stderr}`,
    tokensDeActualizar: leerArchivo(`${carpeta}/tokens-actualizar.log`).split("\n").filter(Boolean),
  };
}

export const llamadasA = (resultado: Resultado, subcomando: string): string[] =>
  resultado.llamadas.filter((llamada) => llamada.startsWith(subcomando));

/** Número de PR de cada llamada (`pr merge 10 --repo …` → "10"). */
export const numerosDe = (resultado: Resultado, subcomando: string): string[] =>
  llamadasA(resultado, subcomando).map((llamada) => llamada.split(" ")[2]);
