import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "src/modules/admin-panel");

const replacements = [
  [
    /from "\.\.\/constants\/admin-catalog-list"/g,
    'from "@/modules/admin-panel/shared/constants/admin-catalog-list"',
  ],
  [
    /from "\.\.\/constants\/admin-panel-actions"/g,
    'from "@/modules/admin-panel/shared/constants/admin-panel-actions"',
  ],
  [
    /from "\.\.\/constants\/admin-assignment-creation-options"/g,
    'from "@/modules/admin-panel/shared/constants/admin-assignment-creation-options"',
  ],
  [
    /from "\.\.\/types\/admin-panel\.types"/g,
    'from "@/modules/admin-panel/shared/types/admin-panel.types"',
  ],
  [
    /from "\.\.\/types\/admin-assignment-creation\.types"/g,
    'from "@/modules/admin-panel/shared/types/admin-assignment-creation.types"',
  ],
  [
    /from "\.\/AdminCatalogListShell"/g,
    'from "@/modules/admin-panel/shared/components/AdminCatalogListShell"',
  ],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const files = walk(root);
let changed = 0;

for (const file of files) {
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

console.log(`Updated ${changed} files under admin-panel`);
