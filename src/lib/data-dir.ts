import path from "path";

/**
 * Writable data directory for store + secrets.
 * Electron sets SMART_SCHEDULER_DATA_DIR to the app userData folder.
 * Falls back to ./data in the project for `next dev` / `next start`.
 */
export function getDataDir(): string {
  const fromEnv = process.env.SMART_SCHEDULER_DATA_DIR?.trim();
  if (fromEnv) return fromEnv;
  return path.join(process.cwd(), "data");
}
