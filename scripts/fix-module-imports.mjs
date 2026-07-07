import fs from "node:fs";
import path from "node:path";

const modules = [
  {
    root: "src/modules/configurator",
    replacements: [
      [/from "\.\.\/constants\/configurator-list"/g, 'from "@/modules/configurator/shared/constants/configurator-list"'],
      [/from "\.\.\/constants\/configurator-actions"/g, 'from "@/modules/configurator/shared/constants/configurator-actions"'],
      [/from "\.\.\/constants\/creation-options"/g, 'from "@/modules/configurator/shared/constants/creation-options"'],
      [/from "\.\.\/constants\/assignment-options"/g, 'from "@/modules/configurator/shared/constants/assignment-options"'],
      [/from "\.\.\/types\/configurator\.types"/g, 'from "@/modules/configurator/shared/types/configurator.types"'],
      [/from "\.\.\/types\/creation\.types"/g, 'from "@/modules/configurator/shared/types/creation.types"'],
      [/from "\.\.\/types\/assignment\.types"/g, 'from "@/modules/configurator/shared/types/assignment.types"'],
      [/from "\.\/ConfiguratorListShell"/g, 'from "@/modules/configurator/shared/components/ConfiguratorListShell"'],
      [/from "\.\/ConfiguratorBreadcrumb"/g, 'from "@/modules/configurator/shared/components/ConfiguratorBreadcrumb"'],
      [/from "\.\/ConfiguratorHeader"/g, 'from "@/modules/configurator/shared/components/ConfiguratorHeader"'],
      [/from "\.\/ConfiguratorPanel"/g, 'from "@/modules/configurator/shared/components/ConfiguratorPanel"'],
      [/from "\.\/CreationPanel"/g, 'from "@/modules/configurator/shared/components/CreationPanel"'],
      [/from "\.\/AssignmentPanel"/g, 'from "@/modules/configurator/shared/components/AssignmentPanel"'],
      [/from "\.\/CreationOptionsGrid"/g, 'from "@/modules/configurator/shared/components/CreationOptionsGrid"'],
      [/from "\.\/AssignmentOptionsGrid"/g, 'from "@/modules/configurator/shared/components/AssignmentOptionsGrid"'],
      [/from "\.\/ConfiguratorActionCard"/g, 'from "@/modules/configurator/shared/components/ConfiguratorActionCard"'],
      [/from "\.\/ConfiguratorActionsGrid"/g, 'from "@/modules/configurator/shared/components/ConfiguratorActionsGrid"'],
      [/from "\.\.\/services\/usuarios\.service"/g, 'from "@/modules/configurator/usuarios/services/usuarios.service"'],
    ],
    legacyDirs: ["components", "services", "constants", "types"],
  },
  {
    root: "src/modules/warehouses",
    replacements: [
      [/from "\.\/BodegaOperacionTabs"/g, 'from "@/modules/warehouses/shared/components/BodegaOperacionTabs"'],
    ],
    legacyDirs: ["components", "services", "constants", "types", "utils"],
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

for (const mod of modules) {
  const files = walk(path.join(process.cwd(), mod.root));
  let changed = 0;
  for (const file of files) {
    let content = fs.readFileSync(file, "utf8");
    const original = content;
    for (const [pattern, replacement] of mod.replacements) {
      content = content.replace(pattern, replacement);
    }
    if (content !== original) {
      fs.writeFileSync(file, content);
      changed += 1;
    }
  }
  console.log(`${mod.root}: updated ${changed} files`);

  for (const legacy of mod.legacyDirs) {
    const legacyPath = path.join(process.cwd(), mod.root, legacy);
    if (fs.existsSync(legacyPath)) {
      fs.rmSync(legacyPath, { recursive: true, force: true });
      console.log(`Removed legacy ${legacyPath}`);
    }
  }
}
