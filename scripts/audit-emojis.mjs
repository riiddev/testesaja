import fs from "fs";
import path from "path";

// Regex matching Unicode emojis and common symbolic glyphs used as icons
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FAFF}🎯⏳⏱🔒🔓✓✔✕✖↗↘↖↙←→↑↓↻↺💡⭐🌟🏆🔥🪙🎉✨🧭🧩📌📜🤔🔊]/u;

function walk(dir, list = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== "dist" && entry.name !== "legacy") {
        walk(fullPath, list);
      }
    } else if (/\.(jsx?|html|css)$/.test(entry.name)) {
      list.push(fullPath);
    }
  }
  return list;
}

const files = walk("src");
const report = [];

for (const file of files) {
  // Exclude data JSON/corpus if any, but we scan JS/JSX
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, lineIdx) => {
    // Check if line contains emoji
    const match = line.match(new RegExp(EMOJI_REGEX, "gu"));
    if (match) {
      report.push({
        file,
        lineNum: lineIdx + 1,
        emojis: Array.from(new Set(match)),
        line: line.trim()
      });
    }
  });
}

console.log(`Found ${report.length} lines with emojis in src/:`);
const fileGroups = {};
report.forEach(r => {
  if (!fileGroups[r.file]) fileGroups[r.file] = [];
  fileGroups[r.file].push(r);
});

Object.entries(fileGroups).forEach(([file, list]) => {
  console.log(`\n📄 ${file} (${list.length} occurrences):`);
  list.slice(0, 10).forEach(item => {
    console.log(`  L${item.lineNum}: [${item.emojis.join(" ")}] ${item.line.slice(0, 80)}`);
  });
  if (list.length > 10) console.log(`  ... and ${list.length - 10} more`);
});

console.log(`\nTotal affected files: ${Object.keys(fileGroups).length}`);

