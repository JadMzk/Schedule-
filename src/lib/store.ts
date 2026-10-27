import { promises as fs } from "fs";
import path from "path";
import { getDataDir } from "./data-dir";
import { EMPTY_STORE, type AppStore } from "./types";

function storePath(): string {
  return path.join(getDataDir(), "store.json");
}

let writeQueue: Promise<void> = Promise.resolve();

async function ensureStore(): Promise<void> {
  const dir = getDataDir();
  await fs.mkdir(dir, { recursive: true });
  const file = storePath();
  try {
    await fs.access(file);
  } catch {
    await fs.writeFile(file, JSON.stringify(EMPTY_STORE, null, 2), "utf8");
  }
}

export async function readStore(): Promise<AppStore> {
  await ensureStore();
  const raw = await fs.readFile(storePath(), "utf8");
  try {
    const parsed = JSON.parse(raw) as AppStore;
    return {
      ...EMPTY_STORE,
      ...parsed,
      sync: { ...EMPTY_STORE.sync, ...parsed.sync },
      academicEvents: parsed.academicEvents ?? [],
      modules: parsed.modules ?? [],
      tasks: parsed.tasks ?? [],
      workSessions: parsed.workSessions ?? [],
      moduleOverrides: parsed.moduleOverrides ?? {},
    };
  } catch {
    return structuredClone(EMPTY_STORE);
  }
}

export async function writeStore(store: AppStore): Promise<void> {
  await ensureStore();
  const file = storePath();
  const payload = JSON.stringify(store, null, 2);
  writeQueue = writeQueue.then(async () => {
    const tmp = `${file}.tmp`;
    await fs.writeFile(tmp, payload, "utf8");
    await fs.rename(tmp, file);
  });
  await writeQueue;
}

export async function updateStore(
  updater: (store: AppStore) => AppStore | Promise<AppStore>
): Promise<AppStore> {
  const current = await readStore();
  const next = await updater(structuredClone(current));
  await writeStore(next);
  return next;
}
