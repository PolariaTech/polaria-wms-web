#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const scopedReplacements = [
  {
    dir: "src/modules/sales/ordenes",
    replacements: [
      [/from "\.\.\/services\/sales\.service"/g, 'from "../../shared/services/sales.service"'],
      [/from "\.\.\/types\/sales\.types"/g, 'from "../../shared/types/sales.types"'],
      [/from "\.\.\/constants\/sales-status"/g, 'from "../../shared/constants/sales-status"'],
    ],
  },
  {
    dir: "src/modules/processing/solicitudes",
    replacements: [
      [/from "\.\.\/services\/processing\.service"/g, 'from "../../shared/services/processing.service"'],
      [/from "\.\.\/types\/processing\.types"/g, 'from "../../shared/types/processing.types"'],
      [/from "\.\.\/constants\/processing-status"/g, 'from "../../shared/constants/processing-status"'],
    ],
  },
  {
    dir: "src/modules/processing/operador",
    replacements: [
      [/from "\.\.\/services\/processing\.service"/g, 'from "../../shared/services/processing.service"'],
      [/from "\.\.\/types\/processing\.types"/g, 'from "../../shared/types/processing.types"'],
      [/from "\.\.\/constants\/processing-status"/g, 'from "../../shared/constants/processing-status"'],
    ],
  },
  {
    dir: "src/modules/inventory/mapa",
    replacements: [
      [/from "\.\.\/services\/inventory/g, 'from "../../shared/services/inventory'],
      [/from "\.\.\/types\/inventory/g, 'from "../../shared/types/inventory'],
      [/from "\.\.\/constants\/inventory/g, 'from "../../shared/constants/inventory'],
    ],
  },
  {
    dir: "src/modules/transport/guias",
    replacements: [
      [/from "\.\.\/services\/transport\.service"/g, 'from "../../shared/services/transport.service"'],
      [/from "\.\.\/types\/transport\.types"/g, 'from "../../shared/types/transport.types"'],
    ],
  },
  {
    dir: "src/modules/account-integration/integracion",
    replacements: [
      [/from "\.\.\/types\/integration\.types"/g, 'from "../../shared/types/integration.types"'],
    ],
  },
  {
    dir: "src/modules/account-integration/shared/types",
    replacements: [
      [/from "\.\.\/constants\/integration-types"/g, 'from "../../integracion/constants/integration-types"'],
    ],
  },
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full);
  }
  return files;
}

let changed = 0;
for (const { dir, replacements } of scopedReplacements) {
  const fullDir = path.join(root, dir);
  for (const file of walk(fullDir)) {
    let content = fs.readFileSync(file, "utf8");
    const original = content;
    for (const [pattern, replacement] of replacements) {
      content = content.replace(pattern, replacement);
    }
    if (content !== original) {
      fs.writeFileSync(file, content);
      changed += 1;
    }
  }
}
console.log(`Fixed ${changed} files in scoped modules`);
