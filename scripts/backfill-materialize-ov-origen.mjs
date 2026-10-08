/**
 * Backfill one-shot: OVs por_confirmar con origen_correo y sin líneas.
 * Uso: node scripts/backfill-materialize-ov-origen.mjs [codigoCuenta]
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");
  const text = readFileSync(envPath, "utf8");
  const out = {};
  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function normalize(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokens(s) {
  return normalize(s)
    .split(" ")
    .filter((t) => t.length > 1);
}

function scoreName(query, nombre) {
  const q = normalize(query);
  const n = normalize(nombre);
  if (!q || !n) return 0;
  if (q === n) return 1;
  if (n.includes(q) || q.includes(n)) return 0.75;
  const qt = tokens(query);
  const nt = new Set(tokens(nombre));
  if (!qt.length) return 0;
  let hit = 0;
  for (const t of qt) {
    if (nt.has(t)) hit += 1;
    else {
      for (const p of nt) {
        if (p.includes(t) || t.includes(p)) {
          hit += 0.6;
          break;
        }
      }
    }
  }
  return hit / qt.length;
}

function parseFecha(raw) {
  const s = String(raw ?? "").trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function parseNum(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(String(v ?? "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : 0;
}

function mostFreq(arr) {
  const c = new Map();
  for (const x of arr) {
    const k = String(x ?? "").trim();
    if (!k) continue;
    c.set(k, (c.get(k) ?? 0) + 1);
  }
  let best = null;
  let n = 0;
  for (const [k, v] of c) {
    if (v > n) {
      best = k;
      n = v;
    }
  }
  return best;
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  const codigoCuenta = process.argv[2] || "49M04";
  if (!url || !key) throw new Error("Missing Supabase URL/key");

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: ovs, error: ovErr } = await sb
    .from("orden_venta")
    .select(
      "id_orden_venta,codigo,id_comprador,orden_compra_hotel,centro_consumo,contacto_entrega,fecha_entrega,origen_correo",
    )
    .eq("codigo_cuenta", codigoCuenta)
    .eq("estado", "por_confirmar");
  if (ovErr) throw ovErr;

  const { data: productos, error: pErr } = await sb
    .from("producto")
    .select("id_producto,sku,descripcion,precio")
    .eq("codigo_cuenta", codigoCuenta)
    .eq("esta_activo", true);
  if (pErr) throw pErr;

  const { data: compradores, error: cErr } = await sb
    .from("comprador")
    .select("id_comprador,nombre,codigo,esta_activo")
    .eq("codigo_cuenta", codigoCuenta)
    .eq("esta_activo", true);
  if (cErr) throw cErr;

  let done = 0;
  for (const ov of ovs ?? []) {
    const origen = Array.isArray(ov.origen_correo) ? ov.origen_correo : [];
    if (!origen.length) continue;

    const { count } = await sb
      .from("orden_venta_linea")
      .select("id_linea_orden_venta", { count: "exact", head: true })
      .eq("id_orden_venta", ov.id_orden_venta);

    const needsLines = !count;
    const needsHeader =
      !ov.id_comprador ||
      !ov.orden_compra_hotel ||
      !ov.centro_consumo ||
      !ov.contacto_entrega ||
      !ov.fecha_entrega;
    if (!needsLines && !needsHeader) continue;

    const nombreCliente = origen
      .map((r) => r["Nombre cliente"])
      .find((x) => String(x ?? "").trim());

    let idComprador = ov.id_comprador;
    if (!idComprador && nombreCliente) {
      let best = null;
      let bestScore = 0;
      for (const c of compradores ?? []) {
        const s = Math.max(
          scoreName(nombreCliente, c.nombre),
          scoreName(nombreCliente, c.codigo),
        );
        if (s > bestScore) {
          bestScore = s;
          best = c;
        }
      }
      if (best && bestScore >= 0.45) idComprador = best.id_comprador;
    }

    const patch = {};
    if (!ov.id_comprador && idComprador) patch.id_comprador = idComprador;
    if (!ov.orden_compra_hotel) {
      const oc = mostFreq(origen.map((r) => r["Numero pedido"]));
      if (oc) patch.orden_compra_hotel = oc;
    }
    if (!ov.centro_consumo) {
      const cc = mostFreq(origen.map((r) => r.Almacen));
      if (cc) patch.centro_consumo = cc;
    }
    if (!ov.contacto_entrega) {
      const ct = mostFreq(origen.map((r) => r["Responsable externo"]));
      if (ct) patch.contacto_entrega = ct;
    }
    if (!ov.fecha_entrega) {
      const f = parseFecha(
        origen.map((r) => r.Fecha).find((x) => String(x ?? "").trim()),
      );
      if (f) patch.fecha_entrega = f;
    }

    if (Object.keys(patch).length) {
      const { error } = await sb
        .from("orden_venta")
        .update(patch)
        .eq("id_orden_venta", ov.id_orden_venta);
      if (error) throw error;
    }

    if (needsLines) {
      const lineas = [];
      for (const r of origen) {
        const qty = parseNum(r.Cantidad);
        if (qty <= 0) continue;
        const q = String(r.Producto ?? "").trim();
        if (!q) continue;
        let best = null;
        let bestScore = 0;
        for (const p of productos ?? []) {
          const s = scoreName(q, p.descripcion);
          if (s > bestScore) {
            bestScore = s;
            best = p;
          }
        }
        if (!best || bestScore < 0.4) continue;
        const precioDoc = parseNum(r.Precio);
        lineas.push({
          id_orden_venta: ov.id_orden_venta,
          id_producto: best.id_producto,
          cantidad_pedida: qty,
          precio_unitario:
            precioDoc > 0 ? precioDoc : Number(best.precio ?? 0) || 0,
          cajas: null,
          presentacion: null,
        });
      }
      if (lineas.length) {
        const { error } = await sb.from("orden_venta_linea").insert(lineas);
        if (error) throw error;
      }
      console.log(
        ov.codigo,
        "header",
        Object.keys(patch).length,
        "lineas",
        lineas.length,
      );
    } else {
      console.log(ov.codigo, "header-only", Object.keys(patch).length);
    }
    done += 1;
  }

  console.log("done", done, "of", (ovs ?? []).length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
