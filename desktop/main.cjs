/**
 * Electron main process for Smart Scheduler.
 * Starts the Next.js server, waits for /api/health, opens an app window,
 * and kills the server when the app quits.
 */
const { app, BrowserWindow, dialog, shell } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const net = require("net");
const path = require("path");

const LOG_DIR = path.join(app.getPath("userData"), "logs");
const LOG_FILE = path.join(LOG_DIR, "smart-scheduler.log");

let mainWindow = null;
let serverProcess = null;
let serverPort = null;
let isQuitting = false;

function ensureLogDir() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function log(line) {
  ensureLogDir();
  const entry = `[${new Date().toISOString()}] ${line}\n`;
  try {
    fs.appendFileSync(LOG_FILE, entry);
  } catch {
    // ignore log write failures
  }
}

function showError(title, detail) {
  log(`ERROR: ${title} — ${detail}`);
  dialog.showErrorBox(
    title,
    `${detail}\n\nLog file:\n${LOG_FILE}`
  );
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;
      server.close((err) => {
        if (err) reject(err);
        else if (!port) reject(new Error("Could not allocate a free port"));
        else resolve(port);
      });
    });
    server.on("error", reject);
  });
}

function waitForHealth(port, timeoutMs = 90000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      if (isQuitting) {
        reject(new Error("Application was closed during startup"));
        return;
      }
      const req = http.get(
        {
          hostname: "127.0.0.1",
          port,
          path: "/api/health",
          timeout: 1500,
        },
        (res) => {
          res.resume();
          if (res.statusCode === 200) {
            resolve();
            return;
          }
          scheduleRetry();
        }
      );
      req.on("error", scheduleRetry);
      req.on("timeout", () => {
        req.destroy();
        scheduleRetry();
      });
    };

    const scheduleRetry = () => {
      if (Date.now() - started > timeoutMs) {
        reject(
          new Error(
            `Server health check timed out after ${Math.round(timeoutMs / 1000)}s`
          )
        );
        return;
      }
      setTimeout(tryOnce, 400);
    };

    tryOnce();
  });
}

function resolveNodeBinary() {
  // Packaged builds must not depend on a system Node install (Finder PATH is empty).
  // Run the Next standalone server with Electron itself in Node mode.
  if (app.isPackaged) {
    return process.execPath;
  }

  const candidates = [
    process.env.SMART_SCHEDULER_NODE,
    "/usr/local/bin/node",
    "/opt/homebrew/bin/node",
    "/usr/bin/node",
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      // continue
    }
  }

  return "node";
}

function buildEnv(port, { asElectronNode = false } = {}) {
  const dataDir = path.join(app.getPath("userData"), "data");
  fs.mkdirSync(dataDir, { recursive: true });

  // Start from a clean subset — inherited Electron env vars can hang Node children.
  const env = {
    HOME: process.env.HOME,
    TMPDIR: process.env.TMPDIR,
    USER: process.env.USER,
    LANG: process.env.LANG,
    PATH: process.env.PATH,
    PORT: String(port),
    HOSTNAME: "127.0.0.1",
    SMART_SCHEDULER_DATA_DIR: dataDir,
    NODE_ENV: "production",
  };

  if (asElectronNode) {
    env.ELECTRON_RUN_AS_NODE = "1";
  }

  const extras = ["/usr/local/bin", "/opt/homebrew/bin", "/bin", "/usr/bin"];
  const pathParts = (env.PATH || "").split(path.delimiter).filter(Boolean);
  for (const extra of extras) {
    if (!pathParts.includes(extra)) pathParts.unshift(extra);
  }
  env.PATH = pathParts.join(path.delimiter);

  return env;
}

function startPackagedServer(port) {
  const standaloneDir = path.join(process.resourcesPath, "standalone");
  const serverJs = path.join(standaloneDir, "server.js");
  if (!fs.existsSync(serverJs)) {
    throw new Error(
      `Packaged server missing at:\n${serverJs}\nRebuild with: npm run build:desktop`
    );
  }

  const nodeBin = resolveNodeBinary();
  const asElectronNode = nodeBin === process.execPath;
  log(`Starting packaged server with ${nodeBin} on port ${port} (electronNode=${asElectronNode})`);
  log(`standaloneDir=${standaloneDir}`);

  serverProcess = spawn(nodeBin, [serverJs], {
    cwd: standaloneDir,
    env: buildEnv(port, { asElectronNode }),
    stdio: ["ignore", "pipe", "pipe"],
  });

  attachServerLogs(serverProcess);
  return serverProcess;
}

function startDevServer(port) {
  const projectRoot = path.resolve(__dirname, "..");
  const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
  const nodeBin = resolveNodeBinary();

  if (!fs.existsSync(nextBin)) {
    throw new Error(`Next.js binary not found at ${nextBin}. Run npm install.`);
  }

  log(`Starting Next.js (dev/local) with ${nodeBin} on port ${port}`);
  // Prefer production `next start` if a build exists; otherwise `next dev`
  const hasBuild = fs.existsSync(path.join(projectRoot, ".next", "BUILD_ID"));
  const args = hasBuild
    ? [nextBin, "start", "-H", "127.0.0.1", "-p", String(port)]
    : [nextBin, "dev", "-H", "127.0.0.1", "-p", String(port)];

  const env = buildEnv(port, { asElectronNode: false });
  if (!hasBuild) env.NODE_ENV = "development";

  serverProcess = spawn(nodeBin, args, {
    cwd: projectRoot,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  attachServerLogs(serverProcess);
  return serverProcess;
}

function attachServerLogs(child) {
  child.stdout?.on("data", (buf) => log(`[server] ${String(buf).trimEnd()}`));
  child.stderr?.on("data", (buf) => log(`[server:err] ${String(buf).trimEnd()}`));
  child.on("error", (err) => {
    log(`Server spawn error: ${err.message}`);
  });
  child.on("exit", (code, signal) => {
    log(`Server exited code=${code} signal=${signal}`);
    serverProcess = null;
    if (!isQuitting && mainWindow && !mainWindow.isDestroyed()) {
      showError(
        "Smart Scheduler stopped unexpectedly",
        `The local server exited (code ${code ?? "unknown"}).`
      );
    }
  });
}

function stopServer() {
  if (!serverProcess || serverProcess.killed) return;
  log("Stopping server…");
  try {
    serverProcess.kill("SIGTERM");
  } catch (err) {
    log(`Kill failed: ${err}`);
  }
  // Force kill after a short grace period
  const child = serverProcess;
  setTimeout(() => {
    if (child && !child.killed) {
      try {
        child.kill("SIGKILL");
      } catch {
        // ignore
      }
    }
  }, 2000);
  serverProcess = null;
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: "Smart Scheduler",
    backgroundColor: "#f3f1eb",
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    if (mainWindow) mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const url = `http://127.0.0.1:${port}`;
  log(`Loading ${url}`);
  mainWindow.loadURL(url);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function migrateProjectDataIfNeeded() {
  const dataDir = path.join(app.getPath("userData"), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const targetStore = path.join(dataDir, "store.json");
  if (fs.existsSync(targetStore)) return;

  // One-time copy from the development project folder when present
  const projectData = path.resolve(__dirname, "..", "data");
  for (const name of ["store.json", "secrets.json"]) {
    const from = path.join(projectData, name);
    const to = path.join(dataDir, name);
    if (fs.existsSync(from) && !fs.existsSync(to)) {
      try {
        fs.copyFileSync(from, to);
        log(`Migrated ${name} into userData`);
      } catch (err) {
        log(`Migration skipped for ${name}: ${err}`);
      }
    }
  }
}

async function bootstrap() {
  ensureLogDir();
  log(`App starting (packaged=${app.isPackaged})`);
  migrateProjectDataIfNeeded();

  try {
    const port = await getFreePort();
    serverPort = port;

    if (app.isPackaged) {
      startPackagedServer(port);
    } else if (process.env.ELECTRON_START_URL) {
      // External server already running (advanced/dev)
      const external = process.env.ELECTRON_START_URL;
      log(`Using external URL ${external}`);
      createWindowFromUrl(external);
      return;
    } else {
      startDevServer(port);
    }

    await waitForHealth(port);
    log("Health check passed");
    createWindow(port);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    showError("Smart Scheduler failed to start", message);
    stopServer();
    app.quit();
  }
}

function createWindowFromUrl(url) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: "Smart Scheduler",
    backgroundColor: "#f3f1eb",
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.loadURL(url);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    void bootstrap();
  });

  app.on("window-all-closed", () => {
    isQuitting = true;
    stopServer();
    app.quit();
  });

  app.on("before-quit", () => {
    isQuitting = true;
    stopServer();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0 && serverPort) {
      createWindow(serverPort);
    }
  });
}
