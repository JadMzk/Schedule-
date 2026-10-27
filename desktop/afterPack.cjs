/**
 * electron-builder strips node_modules from extraResources.
 * Copy the Next.js standalone node_modules into the app bundle after pack.
 */
const fs = require("fs");
const path = require("path");

exports.default = async function afterPack(context) {
  const { appOutDir, packager, electronPlatformName } = context;
  if (electronPlatformName !== "darwin") return;

  const productFilename = packager.appInfo.productFilename;
  const standaloneDest = path.join(
    appOutDir,
    `${productFilename}.app`,
    "Contents",
    "Resources",
    "standalone"
  );
  const modulesSrc = path.join(
    packager.projectDir,
    ".next",
    "standalone",
    "node_modules"
  );
  const modulesDest = path.join(standaloneDest, "node_modules");

  if (!fs.existsSync(modulesSrc)) {
    throw new Error(`Missing standalone node_modules at ${modulesSrc}`);
  }
  if (!fs.existsSync(standaloneDest)) {
    throw new Error(`Missing packaged standalone at ${standaloneDest}`);
  }

  fs.rmSync(modulesDest, { recursive: true, force: true });
  fs.cpSync(modulesSrc, modulesDest, { recursive: true });
  console.log(`afterPack: copied node_modules → ${modulesDest}`);
};
