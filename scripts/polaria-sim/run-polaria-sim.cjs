#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");
const XLSX = require("xlsx");
const { chromium } = require("playwright");

const DEFAULT_BASE_URL = "http://127.0.0.1:3001";
const DEFAULT_SCENARIO_PATH = path.resolve(
  __dirname,
  "scenarios/polaria-simulaciones.json",
);
const DEFAULT_CATALOG_DIR = process.cwd();
const ARTIFACTS_DIR = path.resolve(
  process.cwd(),
  "artifacts",
  "polaria-sim",
);

function parseArgs(argv) {
  const args = {
    baseUrl: DEFAULT_BASE_URL,
    scenarioPath: DEFAULT_SCENARIO_PATH,
    catalogDir: DEFAULT_CATALOG_DIR,
    headed: false,
    includeProcessing: false,
    skipSetup: false,
    timeoutMs: 30_000,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--base-url") args.baseUrl = argv[++i];
    else if (token === "--scenario") args.scenarioPath = path.resolve(argv[++i]);
    else if (token === "--catalog-dir")
      args.catalogDir = path.resolve(argv[++i]);
    else if (token === "--headed") args.headed = true;
    else if (token === "--include-processing") args.includeProcessing = true;
    else if (token === "--skip-setup") args.skipSetup = true;
    else if (token === "--timeout-ms")
      args.timeoutMs = Number.parseInt(argv[++i], 10);
    else if (token === "--help") {
      printHelp();
      process.exit(0);
    }
  }

  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs < 5_000) {
    throw new Error("timeout-ms debe ser >= 5000.");
  }

  return args;
}

function printHelp() {
  console.log(`
Uso:
  node scripts/polaria-sim/run-polaria-sim.cjs [opciones]

Opciones:
  --base-url <url>          URL del frontend local (default: ${DEFAULT_BASE_URL})
  --scenario <path>         Ruta al JSON de simulaciones
  --catalog-dir <path>      Carpeta donde estan los Excel
  --headed                  Ejecuta Playwright con UI visible
  --include-processing      Incluye fase de procesamiento
  --skip-setup              Omite setup TI y maestros/catalogo
  --timeout-ms <number>     Timeout base por accion
  --help                    Muestra ayuda

Variables de entorno obligatorias:
  POLARIA_CONFIG_EMAIL
  POLARIA_CONFIG_PASSWORD
`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rxContains(value) {
  return new RegExp(escapeRegExp(value), "i");
}

function todayInputValue() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function ensureFileExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`No existe ${label}: ${filePath}`);
  }
}

function ensureArtifacts() {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

function createEvidenceImagePath() {
  ensureArtifacts();
  const outPath = path.join(ARTIFACTS_DIR, "evidencia-simulacion.png");
  if (fs.existsSync(outPath)) return outPath;

  // 1x1 PNG valido
  const pngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
  fs.writeFileSync(outPath, Buffer.from(pngBase64, "base64"));
  return outPath;
}

function describeCatalog(filePath) {
  const workbook = XLSX.readFile(filePath);
  const firstSheet = workbook.SheetNames[0];
  const rows = firstSheet
    ? XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: "" })
    : [];
  return {
    sheet: firstSheet || "(sin hoja)",
    rows: rows.length,
  };
}

class LiveMonitor {
  constructor(simulations) {
    this.rows = new Map();
    this.startAt = performance.now();
    for (const sim of simulations) {
      this.rows.set(sim.id, {
        id: sim.id,
        nombre: sim.nombre,
        status: "pending",
        step: "pendiente",
        done: 0,
        total: 0,
        notes: [],
        error: null,
      });
    }
    this.interval = null;
  }

  setTotal(id, total) {
    const row = this.rows.get(id);
    if (!row) return;
    row.total = total;
  }

  startStep(id, stepLabel) {
    const row = this.rows.get(id);
    if (!row) return;
    row.status = "running";
    row.step = stepLabel;
    this.render();
  }

  finishStep(id, note) {
    const row = this.rows.get(id);
    if (!row) return;
    row.done += 1;
    if (note) row.notes.push(note);
    this.render();
  }

  markDone(id, note) {
    const row = this.rows.get(id);
    if (!row) return;
    row.status = "done";
    row.step = "finalizado";
    if (note) row.notes.push(note);
    this.render();
  }

  markFailed(id, error) {
    const row = this.rows.get(id);
    if (!row) return;
    row.status = "failed";
    row.error = String(error?.message || error || "Error desconocido");
    row.step = "fallido";
    this.render();
  }

  start() {
    if (this.interval) return;
    this.interval = setInterval(() => this.render(), 1500);
    this.render();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.render();
  }

  render() {
    const elapsed = ((performance.now() - this.startAt) / 1000).toFixed(1);
    const lines = [];
    lines.push("=== POLARIA SIM RUNNER (concurrente) ===");
    lines.push(`Tiempo transcurrido: ${elapsed}s`);
    lines.push("");
    lines.push(
      "ID        | Estado   | Progreso | Paso actual                            | Error",
    );
    lines.push(
      "----------+----------+----------+----------------------------------------+----------------------",
    );
    for (const row of this.rows.values()) {
      const progress =
        row.total > 0 ? `${row.done}/${row.total}` : `${row.done}/?`;
      const step = (row.step || "").slice(0, 38).padEnd(38, " ");
      const err = row.error ? row.error.slice(0, 20) : "";
      lines.push(
        `${row.id.padEnd(8, " ")} | ${row.status.padEnd(8, " ")} | ${progress.padEnd(8, " ")} | ${step} | ${err}`,
      );
    }
    lines.push("");
    for (const row of this.rows.values()) {
      const tail = row.notes.slice(-2);
      if (tail.length === 0) continue;
      lines.push(`- ${row.id}: ${tail.join(" | ")}`);
    }
    process.stdout.write(`\x1Bc${lines.join("\n")}\n`);
  }
}

class SessionPool {
  constructor(browser, baseUrl, timeoutMs) {
    this.browser = browser;
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
    this.sessions = new Map();
  }

  async get(roleKey, credentials) {
    const existing = this.sessions.get(roleKey);
    if (existing) return existing.page;
    const context = await this.browser.newContext({
      viewport: { width: 1520, height: 930 },
    });
    const page = await context.newPage();
    page.setDefaultTimeout(this.timeoutMs);
    await login(page, this.baseUrl, credentials, this.timeoutMs);
    this.sessions.set(roleKey, { context, page });
    return page;
  }

  async closeAll() {
    const entries = [...this.sessions.values()];
    for (const entry of entries) {
      await entry.context.close();
    }
    this.sessions.clear();
  }
}

async function login(page, baseUrl, credentials, timeoutMs) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel(/Correo electr[oó]nico/i).fill(credentials.email);
  await page.getByRole("button", { name: /Continuar/i }).click();

  // Si se pide empresa en prelogin.
  const empresaSelect = page.locator("#codigoEmpresa");
  if ((await empresaSelect.count()) > 0 && credentials.codigoEmpresa) {
    try {
      await empresaSelect.selectOption({ value: credentials.codigoEmpresa });
    } catch {
      // no-op
    }
  }

  await page.getByLabel(/Contrase[ñn]a/i).fill(credentials.password);
  await page.getByRole("button", { name: /Iniciar sesi[oó]n/i }).click();
  await page.waitForURL(/\/(dashboard|configurador)/, { timeout: timeoutMs });
}

async function gotoRoute(page, baseUrl, route) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
}

async function activeDialog(page, timeoutMs) {
  const dialog = page.locator('[role="dialog"]').last();
  await dialog.waitFor({ state: "visible", timeout: timeoutMs });
  return dialog;
}

async function clickFirstMatchingButton(scope, patterns) {
  for (const pattern of patterns) {
    const btn = scope.getByRole("button", { name: pattern }).first();
    if ((await btn.count()) > 0) {
      await btn.click();
      return true;
    }
  }
  return false;
}

async function openCreateModalFromList(page) {
  const ok = await clickFirstMatchingButton(page, [
    /Agregar/i,
    /Nueva/i,
    /Nuevo/i,
    /Crear/i,
  ]);
  if (!ok) {
    throw new Error("No se encontró botón para abrir modal de creación.");
  }
}

async function fillLabel(scope, label, value) {
  const input = scope.getByLabel(label).first();
  if ((await input.count()) === 0) {
    throw new Error(`No se encontró campo: ${label}`);
  }
  await input.fill(String(value));
}

async function selectOptionContaining(selectLocator, containsText) {
  const optionLocator = selectLocator.locator("option");
  const count = await optionLocator.count();
  for (let i = 0; i < count; i += 1) {
    const option = optionLocator.nth(i);
    const text = (await option.textContent()) || "";
    if (text.toLowerCase().includes(containsText.toLowerCase())) {
      const value = await option.getAttribute("value");
      if (value != null) {
        await selectLocator.selectOption(value);
        return true;
      }
    }
  }
  return false;
}

async function selectFromPicker(page, searchButtonLabel, itemText) {
  await page.getByRole("button", { name: searchButtonLabel }).first().click();
  const picker = await activeDialog(page, 10_000);
  if (itemText) {
    const itemBtn = picker.getByRole("button", { name: rxContains(itemText) }).first();
    if ((await itemBtn.count()) > 0) {
      await itemBtn.click();
      return;
    }
  }
  const row = picker.locator('tr[role="button"]').first();
  if ((await row.count()) === 0) {
    throw new Error("No hay filas seleccionables en picker.");
  }
  await row.click();
}

async function submitModal(
  page,
  submitNameRegex,
  { allowErrorRegex = null, timeoutMs = 15_000 } = {},
) {
  const dialog = await activeDialog(page, timeoutMs);
  const btn = dialog.getByRole("button", { name: submitNameRegex }).first();
  if ((await btn.count()) === 0) {
    throw new Error(`No se encontró submit del modal: ${submitNameRegex}`);
  }
  await btn.click();
  try {
    await dialog.waitFor({ state: "hidden", timeout: timeoutMs });
    return { submitted: true, skipped: false };
  } catch {
    const alert = dialog.getByRole("alert").first();
    const alertText =
      (await alert.count()) > 0 ? ((await alert.textContent()) || "").trim() : "";
    if (allowErrorRegex && alertText && allowErrorRegex.test(alertText)) {
      const closed = await clickFirstMatchingButton(dialog, [/Cancelar/i, /Cerrar/i]);
      if (closed) {
        await dialog.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {});
      }
      return { submitted: false, skipped: true, alertText };
    }
    throw new Error(
      alertText || "El modal no se cerró luego del envío; revisar validaciones.",
    );
  }
}

async function clickFirstTableRow(page, minRows = 1) {
  const rows = page.locator("table tbody tr");
  await rows.first().waitFor({ state: "visible", timeout: 12_000 });
  const total = await rows.count();
  if (total < minRows) {
    throw new Error("No hay filas suficientes en la tabla.");
  }
  await rows.first().click();
}

async function waitForToastOrPause(ms = 1200) {
  await sleep(ms);
}

async function ensureSetupTi(page, baseUrl, sim) {
  await gotoRoute(page, baseUrl, "/configurador/creacion/empresas");
  await openCreateModalFromList(page);
  {
    const dialog = await activeDialog(page, 10_000);
    await fillLabel(dialog, /Raz[oó]n social/i, sim.setup.empresa.razonSocial);
    await fillLabel(dialog, /Tel[eé]fono/i, sim.setup.empresa.telefono);
  }
  await submitModal(page, /Crear/i, {
    allowErrorRegex: /(existe|duplic|ya est[aá])/i,
  });

  await gotoRoute(page, baseUrl, "/configurador/creacion/cuentas");
  await openCreateModalFromList(page);
  {
    const dialog = await activeDialog(page, 10_000);
    await selectFromPicker(page, /Buscar Empresa/i, sim.setup.empresa.razonSocial);
    await fillLabel(dialog, /^Nombre$/i, sim.setup.cuenta.nombre);
  }
  await submitModal(page, /Crear/i, {
    allowErrorRegex: /(existe|duplic|ya est[aá])/i,
  });

  await gotoRoute(page, baseUrl, "/configurador/creacion/bodega-interna");
  await openCreateModalFromList(page);
  {
    const dialog = await activeDialog(page, 10_000);
    await selectFromPicker(page, /Buscar Cuenta destino/i, sim.setup.cuenta.nombre);
    await fillLabel(dialog, /^Nombre$/i, sim.setup.bodega.nombre);
    await fillLabel(dialog, /Capacidad/i, String(sim.setup.bodega.capacidad));
  }
  await submitModal(page, /Crear/i, {
    allowErrorRegex: /(existe|duplic|ya est[aá])/i,
  });
}

async function ensureUsers(page, baseUrl, sim) {
  await gotoRoute(page, baseUrl, "/configurador/asignacion/usuarios");
  for (const user of sim.setup.usuarios) {
    await openCreateModalFromList(page);
    const dialog = await activeDialog(page, 10_000);
    await fillLabel(dialog, /^Nombre$/i, user.nombre);
    await page.getByRole("button", { name: /Buscar Rol/i }).first().click();
    {
      const picker = await activeDialog(page, 10_000);
      const roleBtn = picker.getByRole("button", { name: rxContains(user.roleId) }).first();
      if ((await roleBtn.count()) > 0) {
        await roleBtn.click();
      } else {
        const first = picker.locator('tr[role="button"]').first();
        await first.click();
      }
    }

    if (user.assignmentType === "cuenta" || user.assignmentType === "bodega") {
      const assignSelect = dialog.locator("#usuario-asignado").first();
      if ((await assignSelect.count()) > 0) {
        const needle =
          user.assignmentType === "cuenta"
            ? sim.setup.cuenta.nombre
            : sim.setup.bodega.nombre;
        await selectOptionContaining(assignSelect, needle);
      }
    }

    await fillLabel(dialog, /Correo/i, user.email);
    await fillLabel(dialog, /^Clave$/i, sim.password);
    await submitModal(page, /Crear/i, {
      allowErrorRegex: /(existe|duplic|ya est[aá])/i,
    });
  }
}

async function ensureMastersAndCatalog(page, baseUrl, sim, catalogPath) {
  // Proveedor
  await gotoRoute(
    page,
    baseUrl,
    "/dashboard/administracion/asignacion-creacion/proveedores",
  );
  await openCreateModalFromList(page);
  {
    const dialog = await activeDialog(page, 10_000);
    await fillLabel(dialog, /^Proveedor$/i, sim.maestros.proveedor.nombre);
    await fillLabel(dialog, /^Nombre$/i, sim.maestros.proveedor.contacto);
    await fillLabel(dialog, /Tel[eé]fono/i, sim.maestros.proveedor.telefono);
    await fillLabel(dialog, /Email/i, sim.maestros.proveedor.email);
  }
  await submitModal(page, /Crear/i, {
    allowErrorRegex: /(existe|duplic|ya est[aá])/i,
  });

  // Cliente
  await gotoRoute(
    page,
    baseUrl,
    "/dashboard/administracion/asignacion-creacion/clientes",
  );
  await openCreateModalFromList(page);
  {
    const dialog = await activeDialog(page, 10_000);
    await fillLabel(dialog, /^Nombre$/i, sim.maestros.cliente.nombre);
    await fillLabel(dialog, /^NIT$/i, sim.maestros.cliente.nit);
    await fillLabel(dialog, /Tel[eé]fono/i, sim.maestros.cliente.telefono);
  }
  await submitModal(page, /Crear/i, {
    allowErrorRegex: /(existe|duplic|ya est[aá])/i,
  });

  // Comprador
  await gotoRoute(
    page,
    baseUrl,
    "/dashboard/administracion/asignacion-creacion/compradores",
  );
  await openCreateModalFromList(page);
  {
    const dialog = await activeDialog(page, 10_000);
    await fillLabel(
      dialog,
      /Nombre del comprador/i,
      sim.maestros.comprador.nombre,
    );
    await fillLabel(dialog, /Tel[eé]fono/i, sim.maestros.comprador.telefono);
  }
  await submitModal(page, /Crear/i, {
    allowErrorRegex: /(existe|duplic|ya est[aá])/i,
  });

  // Camion
  await gotoRoute(
    page,
    baseUrl,
    "/dashboard/administracion/asignacion-creacion/camiones",
  );
  await openCreateModalFromList(page);
  {
    const dialog = await activeDialog(page, 10_000);
    await fillLabel(dialog, /Placa/i, sim.maestros.camion.placa);
    await page.getByRole("button", { name: /Buscar Marca/i }).first().click();
    {
      const picker = await activeDialog(page, 10_000);
      await picker.locator('tr[role="button"]').first().click();
    }
    await page.getByRole("button", { name: /Buscar Modelo/i }).first().click();
    {
      const picker = await activeDialog(page, 10_000);
      await picker.locator('tr[role="button"]').first().click();
    }
    await fillLabel(dialog, /Peso m[aá]x/i, String(sim.maestros.camion.capacidadKg));
    await fillLabel(dialog, /Volumen/i, String(sim.maestros.camion.capacidadM3));
    await fillLabel(
      dialog,
      /Cap\. pallets/i,
      String(sim.maestros.camion.capacidadPallets),
    );
  }
  await submitModal(page, /Crear/i, {
    allowErrorRegex: /(existe|duplic|ya est[aá])/i,
  });

  // Catalogo: importar Excel
  await gotoRoute(page, baseUrl, "/dashboard/administracion/catalogo");
  await page.getByRole("button", { name: /Importar Excel/i }).click();
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(catalogPath);
  await waitForToastOrPause(2500);

  // Producto primario de referencia
  await page.getByRole("button", { name: /Nuevo producto/i }).click();
  {
    const dialog = await activeDialog(page, 10_000);
    await fillLabel(dialog, /T[ií]tulo \*/i, sim.productosReferencia.primario.titulo);
    await fillLabel(
      dialog,
      /Identificador URL/i,
      sim.productosReferencia.primario.slug,
    );
    await fillLabel(
      dialog,
      /Descripci[oó]n \*/i,
      sim.productosReferencia.primario.descripcion,
    );
    await fillLabel(dialog, /Proveedor \*/i, sim.maestros.proveedor.nombre);
    await fillLabel(
      dialog,
      /Categor[ií]a producto \*/i,
      sim.productosReferencia.primario.categoria,
    );
    await fillLabel(dialog, /Precio \*/i, sim.productosReferencia.primario.precio);
    await fillLabel(dialog, /Etiquetas/i, sim.productosReferencia.primario.etiquetas);
    const unidadSelect = dialog.locator("#producto-unidad-visualizacion");
    if ((await unidadSelect.count()) > 0) {
      await selectOptionContaining(unidadSelect, "peso");
    }
  }
  await submitModal(page, /Crear producto/i, {
    allowErrorRegex: /(existe|duplic|ya est[aá])/i,
    timeoutMs: 20_000,
  });

  // Producto secundario de referencia
  await page.getByRole("button", { name: /Crear secundario/i }).click();
  {
    const dialog = await activeDialog(page, 12_000);
    await fillLabel(
      dialog,
      /T[ií]tulo \*/i,
      sim.productosReferencia.secundario.titulo,
    );
    await fillLabel(
      dialog,
      /Descripci[oó]n \*/i,
      sim.productosReferencia.secundario.descripcion,
    );
    const proveedorSelect = dialog.locator("#secundario-proveedor");
    await selectOptionContaining(proveedorSelect, sim.maestros.proveedor.nombre);
    const categoriaSelect = dialog.locator("#secundario-categoria");
    await selectOptionContaining(
      categoriaSelect,
      sim.productosReferencia.secundario.categoria,
    );
    await fillLabel(dialog, /Precio \*/i, sim.productosReferencia.secundario.precio);
    await fillLabel(
      dialog,
      /G por unidad \*/i,
      sim.productosReferencia.secundario.gramosPorUnidad,
    );
    await fillLabel(dialog, /Merma \(%\)/i, sim.productosReferencia.secundario.mermaPct);
    await page
      .getByRole("button", { name: /Buscar Incluido primario/i })
      .first()
      .click();
    {
      const picker = await activeDialog(page, 10_000);
      const btn = picker
        .getByRole("button", {
          name: rxContains(sim.productosReferencia.primario.titulo),
        })
        .first();
      if ((await btn.count()) > 0) {
        await btn.click();
      } else {
        await picker.locator('tr[role="button"]').first().click();
      }
    }
  }
  await submitModal(page, /Crear producto secundario/i, {
    allowErrorRegex: /(existe|duplic|ya est[aá])/i,
    timeoutMs: 25_000,
  });
}

async function createSolicitud(page, baseUrl, sim, cantidadKg) {
  await gotoRoute(page, baseUrl, "/dashboard/compras");
  await page.getByRole("button", { name: /Nueva solicitud/i }).click();
  const dialog = await activeDialog(page, 10_000);

  await selectFromPicker(page, /Buscar Proveedor/i, sim.maestros.proveedor.nombre);
  await selectFromPicker(
    page,
    /Buscar Producto/i,
    sim.productosReferencia.primario.titulo,
  );
  await fillLabel(dialog, /Peso \(kg\)/i, String(cantidadKg));
  await dialog.getByRole("button", { name: /^Agregar$/i }).click();
  await submitModal(page, /Guardar solicitud/i, { timeoutMs: 20_000 });
}

async function enviarAprobacionSolicitud(page, baseUrl) {
  await gotoRoute(page, baseUrl, "/dashboard/compras");
  await clickFirstTableRow(page);
  const dialog = await activeDialog(page, 10_000);
  const action = dialog.getByRole("button", { name: /Enviar aprobaci[oó]n/i });
  if ((await action.count()) === 0) {
    throw new Error("No se encontró acción 'Enviar aprobación'.");
  }
  await action.first().click();
  await dialog.waitFor({ state: "hidden", timeout: 15_000 });
}

async function aprobarYConvertir(page, baseUrl) {
  await gotoRoute(page, baseUrl, "/dashboard/compras");
  await clickFirstTableRow(page);
  {
    const dialog = await activeDialog(page, 10_000);
    const aprobar = dialog.getByRole("button", { name: /^Aprobar$/i }).first();
    if ((await aprobar.count()) === 0) {
      throw new Error("No se encontró acción 'Aprobar'.");
    }
    await aprobar.click();
    await dialog.waitFor({ state: "hidden", timeout: 15_000 });
  }

  await clickFirstTableRow(page);
  {
    const dialog = await activeDialog(page, 10_000);
    const convertir = dialog
      .getByRole("button", { name: /Convertir a OC/i })
      .first();
    if ((await convertir.count()) === 0) {
      throw new Error("No se encontró acción 'Convertir a OC'.");
    }
    await convertir.click();
    await dialog.waitFor({ state: "hidden", timeout: 15_000 });
  }
}

async function configurarYEmitirOC(page, baseUrl, bodegaNombre) {
  await gotoRoute(page, baseUrl, "/dashboard/compras");
  await page.getByRole("button", { name: /[ÓO]rdenes/i }).click();
  await clickFirstTableRow(page);
  const dialog = await activeDialog(page, 12_000);
  const fechaInput = dialog.locator("#orden-fecha-entrega");
  if ((await fechaInput.count()) > 0) {
    await fechaInput.fill(todayInputValue());
  }
  const tipoSelect = dialog.locator("#orden-destino-tipo");
  if ((await tipoSelect.count()) > 0) {
    await selectOptionContaining(tipoSelect, "interna");
  }
  const bodegaSelect = dialog.locator("#orden-destino-bodega");
  if ((await bodegaSelect.count()) > 0) {
    const ok = await selectOptionContaining(bodegaSelect, bodegaNombre);
    if (!ok) {
      const fallbackOptions = await bodegaSelect.locator("option").allTextContents();
      const firstValid = fallbackOptions.find((opt) => opt && !/selecciona/i.test(opt));
      if (firstValid) {
        await selectOptionContaining(bodegaSelect, firstValid);
      }
    }
  }
  await waitForToastOrPause(1200);
  const emitir = dialog.getByRole("button", { name: /Emitir orden/i }).first();
  if ((await emitir.count()) === 0) {
    throw new Error("No se encontró acción 'Emitir orden'.");
  }
  await emitir.click();
  await dialog.waitFor({ state: "hidden", timeout: 20_000 });
}

async function recepcionarOC(page, baseUrl, temperatura, peso) {
  await gotoRoute(page, baseUrl, "/dashboard/custodio/ingreso");
  await selectFromPicker(page, /Buscar Orden de compra/i, null);
  await waitForToastOrPause(1000);

  const tempInputs = page.getByLabel(/Temperatura \([°º]C\)/i);
  const tempCount = await tempInputs.count();
  for (let i = 0; i < tempCount; i += 1) {
    await tempInputs.nth(i).fill(String(temperatura));
  }

  const pesoInputs = page.getByLabel(/Peso recibido \(kg\)/i);
  const pesoCount = await pesoInputs.count();
  for (let i = 0; i < pesoCount; i += 1) {
    await pesoInputs.nth(i).fill(String(peso));
  }

  await page
    .getByRole("button", { name: /Registrar ingreso/i })
    .first()
    .click();
  await waitForToastOrPause(2500);
}

async function crearIngresoJefe(page, baseUrl, operarioNombre) {
  await gotoRoute(page, baseUrl, "/dashboard/jefe-bodega/estado-bodega");
  await page.getByRole("button", { name: /^Ingresos$/i }).click();
  await activeDialog(page, 10_000);
  await selectFromPicker(page, /Buscar Producto en ingreso/i, null);
  await selectFromPicker(page, /Buscar Posici[oó]n en bodega/i, null);

  const operarioSearch = page.getByRole("button", { name: /Buscar Operario/i }).first();
  if ((await operarioSearch.count()) > 0) {
    await operarioSearch.click();
    const picker = await activeDialog(page, 10_000);
    const operarioBtn = picker
      .getByRole("button", { name: rxContains(operarioNombre) })
      .first();
    if ((await operarioBtn.count()) > 0) {
      await operarioBtn.click();
    } else {
      await picker.locator('tr[role="button"]').first().click();
    }
  }

  await submitModal(page, /Crear ingreso/i, { timeoutMs: 20_000 });
}

async function completarTareasOperario(page, baseUrl, maxIter = 8) {
  await gotoRoute(page, baseUrl, "/dashboard/operario/operacion");
  for (let i = 0; i < maxIter; i += 1) {
    const taskCard = page.locator('button:has-text("ID de tarea")').first();
    if ((await taskCard.count()) === 0) break;
    await taskCard.click();
    await waitForToastOrPause(1800);
  }
}

async function crearYEmitirVenta(page, baseUrl, sim, cantidadKg) {
  await gotoRoute(page, baseUrl, "/dashboard/ventas");
  await page.getByRole("button", { name: /Nueva venta/i }).click();
  const dialog = await activeDialog(page, 12_000);

  await selectFromPicker(page, /Buscar Comprador/i, sim.maestros.comprador.nombre);
  await selectFromPicker(
    page,
    /Buscar Producto/i,
    sim.productosReferencia.primario.titulo,
  );
  await fillLabel(dialog, /Cantidad \(kg\)/i, String(cantidadKg));
  await dialog.getByRole("button", { name: /^Agregar$/i }).click();
  await fillLabel(dialog, /Observaciones/i, `Venta automatica ${sim.id}`);
  await submitModal(page, /Crear venta/i, { timeoutMs: 25_000 });

  await clickFirstTableRow(page);
  const detalle = await activeDialog(page, 10_000);
  const emitir = detalle.getByRole("button", { name: /Emitir venta/i }).first();
  if ((await emitir.count()) > 0) {
    await emitir.click();
    await waitForToastOrPause(2200);
  }
  const closeBtn = detalle.getByRole("button", { name: /Cancelar|Cerrar/i }).first();
  if ((await closeBtn.count()) > 0) {
    await closeBtn.click();
    await detalle.waitFor({ state: "hidden", timeout: 8_000 }).catch(() => {});
  }
}

async function crearSalidaJefe(page, baseUrl, operarioNombre) {
  await gotoRoute(page, baseUrl, "/dashboard/jefe-bodega/estado-bodega");
  await page.getByRole("button", { name: /Crear Salida/i }).click();
  await activeDialog(page, 12_000);
  await selectFromPicker(page, /Buscar Orden de venta/i, null);
  await selectFromPicker(page, /Buscar Destino/i, null);

  const operarioSearch = page.getByRole("button", { name: /Buscar Operario/i }).first();
  if ((await operarioSearch.count()) > 0) {
    await operarioSearch.click();
    const picker = await activeDialog(page, 10_000);
    const operarioBtn = picker
      .getByRole("button", { name: rxContains(operarioNombre) })
      .first();
    if ((await operarioBtn.count()) > 0) {
      await operarioBtn.click();
    } else {
      await picker.locator('tr[role="button"]').first().click();
    }
  }
  await submitModal(page, /Crear salida/i, { timeoutMs: 20_000 });
}

async function armarYEnviarPaqueteCustodio(page, baseUrl, placaCamion) {
  await gotoRoute(page, baseUrl, "/dashboard/custodio/ingreso");
  await selectFromPicker(page, /Buscar Ventas para el paquete/i, null);
  await page.getByRole("button", { name: /Armar paquete de despacho/i }).click();
  await waitForToastOrPause(900);
  await selectFromPicker(page, /Buscar Cami[oó]n asignado/i, placaCamion);
  await page
    .getByRole("button", { name: /Enviar paquete al transporte/i })
    .click();
  await waitForToastOrPause(2500);
}

async function drawSignature(modal, page) {
  const canvas = modal.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error("No se encontró canvas de firma.");
  }
  await page.mouse.move(box.x + 20, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y + 60);
  await page.mouse.move(box.x + 220, box.y + 40);
  await page.mouse.up();
}

async function registrarEntregaTransportista(
  page,
  baseUrl,
  evidenciaPath,
  { conforme, motivo } = { conforme: true, motivo: "" },
) {
  await gotoRoute(page, baseUrl, "/dashboard/transporte");
  await page.getByRole("button", { name: /Realizar entrega/i }).first().click();
  const modal = await activeDialog(page, 12_000);

  const checks = modal.locator('input[type="checkbox"]');
  const checkCount = await checks.count();
  for (let i = 0; i < checkCount; i += 1) {
    await checks.nth(i).check();
  }
  await modal.getByRole("button", { name: /Siguiente/i }).click();

  await modal.locator('input[type="file"]').setInputFiles(evidenciaPath);
  await modal.getByRole("button", { name: /Siguiente/i }).click();

  await drawSignature(modal, page);
  await modal.getByRole("button", { name: /Siguiente/i }).click();

  if (conforme) {
    await modal.getByRole("button", { name: /S[ií], conforme/i }).click();
  } else {
    await modal.getByRole("button", { name: /No conforme/i }).click();
    const reason = motivo || "Incidencia de cadena de frio detectada";
    await modal.getByPlaceholder(/Describ[ií] la incidencia/i).fill(reason);
  }

  await modal.getByRole("button", { name: /Cerrar entrega/i }).click();
  await modal.waitFor({ state: "hidden", timeout: 45_000 });
}

async function runCycleA(sim, ctx) {
  const {
    baseUrl,
    sessions,
    evidenceImage,
    roles,
  } = ctx;

  await createSolicitud(
    await sessions.get("operador", roles.operador),
    baseUrl,
    sim,
    sim.cycleA.compraKg,
  );
  await enviarAprobacionSolicitud(
    await sessions.get("operador", roles.operador),
    baseUrl,
  );
  await aprobarYConvertir(await sessions.get("admin", roles.admin), baseUrl);
  await configurarYEmitirOC(
    await sessions.get("admin", roles.admin),
    baseUrl,
    sim.setup.bodega.nombre,
  );

  await recepcionarOC(
    await sessions.get("custodio", roles.custodio),
    baseUrl,
    sim.cycleA.recepcionTempC,
    sim.cycleA.recepcionKg,
  );

  await crearIngresoJefe(
    await sessions.get("jefe", roles.jefe),
    baseUrl,
    sim.setup.usuarios.find((u) => u.key === "operario").nombre,
  );
  await completarTareasOperario(
    await sessions.get("operario", roles.operario),
    baseUrl,
  );

  if (ctx.includeProcessing) {
    // El flujo de procesamiento depende de stock y asignación; se deja como
    // opcional para no bloquear el runner principal.
    await gotoRoute(await sessions.get("admin", roles.admin), baseUrl, "/dashboard/procesamiento");
    await waitForToastOrPause(1200);
  }

  await crearYEmitirVenta(
    await sessions.get("operador", roles.operador),
    baseUrl,
    sim,
    sim.cycleA.ventaKg,
  );
  await crearSalidaJefe(
    await sessions.get("jefe", roles.jefe),
    baseUrl,
    sim.setup.usuarios.find((u) => u.key === "operario").nombre,
  );
  await completarTareasOperario(
    await sessions.get("operario", roles.operario),
    baseUrl,
  );
  await armarYEnviarPaqueteCustodio(
    await sessions.get("custodio", roles.custodio),
    baseUrl,
    sim.maestros.camion.placa,
  );
  await registrarEntregaTransportista(
    await sessions.get("transportista", roles.transportista),
    baseUrl,
    evidenceImage,
    { conforme: Boolean(sim.cycleA.deliveryConforme), motivo: "" },
  );
}

async function runCycleB(sim, ctx) {
  const { baseUrl, sessions, evidenceImage, roles } = ctx;
  const cycleB = sim.cycleB;
  if (!cycleB || !cycleB.type) return;

  if (cycleB.type === "recepcion_diferencia") {
    await createSolicitud(
      await sessions.get("operador", roles.operador),
      baseUrl,
      sim,
      cycleB.compraKg,
    );
    await enviarAprobacionSolicitud(
      await sessions.get("operador", roles.operador),
      baseUrl,
    );
    await aprobarYConvertir(await sessions.get("admin", roles.admin), baseUrl);
    await configurarYEmitirOC(
      await sessions.get("admin", roles.admin),
      baseUrl,
      sim.setup.bodega.nombre,
    );
    await recepcionarOC(
      await sessions.get("custodio", roles.custodio),
      baseUrl,
      cycleB.recepcionTempC,
      cycleB.recepcionKg,
    );
    return;
  }

  if (cycleB.type === "entrega_no_conforme") {
    await createSolicitud(
      await sessions.get("operador", roles.operador),
      baseUrl,
      sim,
      cycleB.compraKg,
    );
    await enviarAprobacionSolicitud(
      await sessions.get("operador", roles.operador),
      baseUrl,
    );
    await aprobarYConvertir(await sessions.get("admin", roles.admin), baseUrl);
    await configurarYEmitirOC(
      await sessions.get("admin", roles.admin),
      baseUrl,
      sim.setup.bodega.nombre,
    );
    await recepcionarOC(
      await sessions.get("custodio", roles.custodio),
      baseUrl,
      cycleB.recepcionTempC,
      cycleB.recepcionKg,
    );
    await crearIngresoJefe(
      await sessions.get("jefe", roles.jefe),
      baseUrl,
      sim.setup.usuarios.find((u) => u.key === "operario").nombre,
    );
    await completarTareasOperario(
      await sessions.get("operario", roles.operario),
      baseUrl,
    );
    await crearYEmitirVenta(
      await sessions.get("operador", roles.operador),
      baseUrl,
      sim,
      cycleB.ventaKg,
    );
    await crearSalidaJefe(
      await sessions.get("jefe", roles.jefe),
      baseUrl,
      sim.setup.usuarios.find((u) => u.key === "operario").nombre,
    );
    await completarTareasOperario(
      await sessions.get("operario", roles.operario),
      baseUrl,
    );
    await armarYEnviarPaqueteCustodio(
      await sessions.get("custodio", roles.custodio),
      baseUrl,
      sim.maestros.camion.placa,
    );
    await registrarEntregaTransportista(
      await sessions.get("transportista", roles.transportista),
      baseUrl,
      evidenceImage,
      {
        conforme: false,
        motivo: cycleB.motivoNoConformidad || "Cadena de frio interrumpida en ruta",
      },
    );
  }
}

function buildRoleCredentials(sim) {
  const byKey = new Map(sim.setup.usuarios.map((u) => [u.key, u]));
  return {
    admin: {
      email: byKey.get("adminCuenta").email,
      password: sim.password,
    },
    operador: {
      email: byKey.get("operadorCuenta").email,
      password: sim.password,
    },
    jefe: {
      email: byKey.get("jefeBodega").email,
      password: sim.password,
    },
    custodio: {
      email: byKey.get("custodio").email,
      password: sim.password,
    },
    operario: {
      email: byKey.get("operario").email,
      password: sim.password,
    },
    transportista: {
      email: byKey.get("transportista").email,
      password: sim.password,
    },
    procesador: byKey.has("procesador")
      ? {
          email: byKey.get("procesador").email,
          password: sim.password,
        }
      : null,
  };
}

async function runSimulation(sim, shared) {
  const { args, browser, monitor, catalogMap, configCredentials, evidenceImage } =
    shared;
  const roles = buildRoleCredentials(sim);
  const sessions = new SessionPool(browser, args.baseUrl, args.timeoutMs);
  const steps = [];
  if (!args.skipSetup) {
    steps.push("setup-ti", "setup-usuarios", "setup-maestros-catalogo");
  }
  steps.push("prewarm-roles", "ciclo-a", "ciclo-b");
  monitor.setTotal(sim.id, steps.length);

  const runStep = async (label, fn, note) => {
    monitor.startStep(sim.id, label);
    await fn();
    monitor.finishStep(sim.id, note || label);
  };

  try {
    const configurador = {
      email: configCredentials.email,
      password: configCredentials.password,
      codigoEmpresa: configCredentials.codigoEmpresa || undefined,
    };

    if (!args.skipSetup) {
      await runStep(
        "setup-ti",
        async () => {
          const page = await sessions.get("configurador", configurador);
          await ensureSetupTi(page, args.baseUrl, sim);
        },
        "Empresa, cuenta y bodega listas",
      );

      await runStep(
        "setup-usuarios",
        async () => {
          const page = await sessions.get("configurador", configurador);
          await ensureUsers(page, args.baseUrl, sim);
        },
        "Usuarios creados/asegurados",
      );

      await runStep(
        "setup-maestros-catalogo",
        async () => {
          const page = await sessions.get("admin", roles.admin);
          await ensureMastersAndCatalog(
            page,
            args.baseUrl,
            sim,
            catalogMap.get(sim.id).path,
          );
        },
        `Catalogo importado (${catalogMap.get(sim.id).meta.rows} filas)`,
      );
    }

    await runStep(
      "prewarm-roles",
      async () => {
        await Promise.all([
          sessions.get("admin", roles.admin),
          sessions.get("operador", roles.operador),
          sessions.get("jefe", roles.jefe),
          sessions.get("custodio", roles.custodio),
          sessions.get("operario", roles.operario),
          sessions.get("transportista", roles.transportista),
        ]);
      },
      "Sesiones activas por rol",
    );

    await runStep("ciclo-a", async () => {
      await runCycleA(sim, {
        baseUrl: args.baseUrl,
        sessions,
        includeProcessing: args.includeProcessing,
        roles,
        evidenceImage,
      });
    });

    await runStep("ciclo-b", async () => {
      await runCycleB(sim, {
        baseUrl: args.baseUrl,
        sessions,
        includeProcessing: args.includeProcessing,
        roles,
        evidenceImage,
      });
    });

    monitor.markDone(sim.id, "Simulacion completa");
  } finally {
    await sessions.closeAll();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const configEmail = process.env.POLARIA_CONFIG_EMAIL;
  const configPassword = process.env.POLARIA_CONFIG_PASSWORD;
  const configEmpresaCode = process.env.POLARIA_CONFIG_EMPRESA_CODE || "";

  if (!configEmail || !configPassword) {
    throw new Error(
      "Faltan POLARIA_CONFIG_EMAIL y/o POLARIA_CONFIG_PASSWORD en el entorno.",
    );
  }

  ensureFileExists(args.scenarioPath, "scenario json");
  const scenario = readJson(args.scenarioPath);
  const simulations = scenario.simulations || [];
  if (!Array.isArray(simulations) || simulations.length === 0) {
    throw new Error("El scenario no tiene simulaciones.");
  }

  const catalogMap = new Map();
  for (const sim of simulations) {
    const catalogPath = path.resolve(args.catalogDir, sim.catalogFile);
    ensureFileExists(catalogPath, `catalogo de ${sim.id}`);
    const meta = describeCatalog(catalogPath);
    catalogMap.set(sim.id, { path: catalogPath, meta });
  }

  const evidenceImage = createEvidenceImagePath();
  const monitor = new LiveMonitor(simulations);
  monitor.start();

  const browser = await chromium.launch({ headless: !args.headed });
  try {
    await Promise.all(
      simulations.map((sim) =>
        runSimulation(sim, {
          args,
          browser,
          monitor,
          catalogMap,
          configCredentials: {
            email: configEmail,
            password: configPassword,
            codigoEmpresa: configEmpresaCode,
          },
          evidenceImage,
        }),
      ),
    );
  } catch (error) {
    // Marcar fallas en simulaciones pendientes.
    for (const sim of simulations) {
      const row = monitor.rows.get(sim.id);
      if (row && row.status !== "done" && row.status !== "failed") {
        monitor.markFailed(sim.id, error);
      }
    }
    throw error;
  } finally {
    await browser.close();
    monitor.stop();
  }
}

main().catch((error) => {
  console.error("\nERROR EN RUNNER:", error?.stack || error?.message || error);
  process.exit(1);
});
