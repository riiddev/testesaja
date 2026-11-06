import fs from "fs";
import path from "path";

function walk(dir, list = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      if (f.name !== "node_modules" && f.name !== ".git" && f.name !== "dist" && f.name !== "legacy") {
        walk(full, list);
      }
    } else if (/\.(jsx|js)$/.test(f.name) && !f.name.endsWith("Icons.jsx")) {
      list.push(full);
    }
  }
  return list;
}

const files = walk("src");
let totalFixed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  
  // Find all <IconXYZ
  const matches = content.match(/<Icon[A-Za-z0-9]+/g) || [];
  const usedIcons = Array.from(new Set(matches.map(m => m.replace("<", "")))).sort();
  
  if (usedIcons.length === 0) continue;

  // Determine correct relative path to Icons.jsx
  const relPath = path.relative(path.dirname(file), path.join("src", "components", "common", "Icons.jsx")).replace(/\\/g, "/");
  const importPath = relPath.startsWith(".") ? relPath : "./" + relPath;

  // Check if Icons.jsx is already imported
  const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"][^'"]*Icons(?:\.jsx)?['"];?/;
  const existingImport = content.match(importRegex);

  let updatedContent = content;

  if (existingImport) {
    const currentlyImported = existingImport[1]
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const merged = Array.from(new Set([...currentlyImported, ...usedIcons])).sort();
    
    // Check if anything was actually missing
    const isMissing = usedIcons.some(ic => !currentlyImported.includes(ic));
    if (isMissing) {
      const newImport = `import {\n  ${merged.join(",\n  ")}\n} from "${importPath}";`;
      updatedContent = content.replace(existingImport[0], newImport);
      fs.writeFileSync(file, updatedContent, "utf8");
      console.log(`[UPDATED IMPORT] ${file} -> added ${usedIcons.filter(ic => !currentlyImported.includes(ic)).join(", ")}`);
      totalFixed++;
    }
  } else {
    // Add new import at top
    const newImport = `import {\n  ${usedIcons.join(",\n  ")}\n} from "${importPath}";\n`;
    updatedContent = newImport + content;
    fs.writeFileSync(file, updatedContent, "utf8");
    console.log(`[ADDED NEW IMPORT] ${file} -> imported ${usedIcons.join(", ")}`);
    totalFixed++;
  }
}

console.log(`=== FINISHED: Fixed ${totalFixed} files with missing icon imports! ===`);

