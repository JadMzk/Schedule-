/**
 * Prepares Next.js standalone output for Electron packaging.
 * - Removes any copied local data/secrets from the standalone tree
 * - Ensures .next/static and public are present beside server.js
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");
const staticSrc = path.join(root, ".next", "static");
const publicSrc = path.join(root, "public");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

if (!fs.existsSync(path.join(standalone, "server.js"))) {
  console.error("Missing .next/standalone/server.js — run next build first.");
  process.exit(1);
}

// Never ship local calendars/secrets inside the app bundle
const dataDir = path.join(standalone, "data");
if (fs.existsSync(dataDir)) {
  fs.rmSync(dataDir, { recursive: true, force: true });
  console.log("Removed standalone/data");
}

const staticDest = path.join(standalone, ".next", "static");
if (fs.existsSync(staticSrc)) {
  fs.rmSync(staticDest, { recursive: true, force: true });
  copyDir(staticSrc, staticDest);
  console.log("Copied .next/static → standalone/.next/static");
}

const publicDest = path.join(standalone, "public");
if (fs.existsSync(publicSrc)) {
  fs.rmSync(publicDest, { recursive: true, force: true });
  copyDir(publicSrc, publicDest);
  console.log("Copied public → standalone/public");
}

console.log("Standalone ready for Electron packaging.");
