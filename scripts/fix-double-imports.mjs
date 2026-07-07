#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fixes = [
  ["@/services/api/api/api", "@/services/api/api"],
  ["@/types/auth/auth/auth", "@/types/auth/auth"],
  ["@/constants/brand/brand/brand", "@/constants/brand/brand"],
  ["@/types/layout/layout/layout", "@/types/layout/layout"],
  ["@/providers/tenant/CompanyProvider/CompanyProvider", "@/providers/tenant/CompanyProvider"],
  ["@/providers/auth/AuthProvider/AuthProvider", "@/providers/auth/AuthProvider"],
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx?|jsx?|mjs)$/.test(entry.name)) files.push(full);
  }
  return files;
}

let changed = 0;
for (const file of walk(path.join(root, "src"))) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;
  for (const [from, to] of fixes) {
    content = content.split(from).join(to);
  }
  if (content !== original) {
    fs.writeFileSync(file, content);
    changed += 1;
  }
}

console.log(`Fixed double-import paths in ${changed} files`);
