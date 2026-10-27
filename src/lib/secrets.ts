import { promises as fs } from "fs";
import path from "path";
import { getDataDir } from "./data-dir";

interface SecretsFile {
  calendarIcsUrl?: string;
}

function secretsPath(): string {
  return path.join(getDataDir(), "secrets.json");
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(getDataDir(), { recursive: true });
}

async function readSecretsFile(): Promise<SecretsFile> {
  await ensureDir();
  try {
    const raw = await fs.readFile(secretsPath(), "utf8");
    return JSON.parse(raw) as SecretsFile;
  } catch {
    return {};
  }
}

async function writeSecretsFile(secrets: SecretsFile): Promise<void> {
  await ensureDir();
  const file = secretsPath();
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(secrets, null, 2), "utf8");
  await fs.rename(tmp, file);
}

/**
 * Resolve ICS URL: saved in-app secret first, then CALENDAR_ICS_URL env.
 * Never log the returned value.
 */
export async function getCalendarIcsUrl(): Promise<string | null> {
  const saved = (await readSecretsFile()).calendarIcsUrl?.trim();
  if (saved) return saved;
  const fromEnv = process.env.CALENDAR_ICS_URL?.trim();
  return fromEnv || null;
}

export async function isCalendarConfigured(): Promise<boolean> {
  return Boolean(await getCalendarIcsUrl());
}

export type CalendarUrlSource = "app" | "env" | "none";

export async function getCalendarConfigMeta(): Promise<{
  configured: boolean;
  source: CalendarUrlSource;
  host: string | null;
}> {
  const saved = (await readSecretsFile()).calendarIcsUrl?.trim();
  if (saved) {
    return {
      configured: true,
      source: "app",
      host: safeHost(saved),
    };
  }
  const fromEnv = process.env.CALENDAR_ICS_URL?.trim();
  if (fromEnv) {
    return {
      configured: true,
      source: "env",
      host: safeHost(fromEnv),
    };
  }
  return { configured: false, source: "none", host: null };
}

/** Hostname only — never return path (Outlook secrets live in the path). */
export function safeHost(url: string): string | null {
  try {
    return new URL(url).host || null;
  } catch {
    return null;
  }
}

export function validateIcsUrl(
  raw: string
): { ok: true; url: string } | { ok: false; error: string } {
  const url = raw.trim();
  if (!url) {
    return { ok: false, error: "Paste your Outlook ICS link first." };
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "That does not look like a valid URL." };
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, error: "The link must start with https:// (or http://)." };
  }
  return { ok: true, url };
}

export async function saveCalendarIcsUrl(
  raw: string
): Promise<{ host: string | null }> {
  const validated = validateIcsUrl(raw);
  if (!validated.ok) {
    throw new Error(validated.error);
  }
  const secrets = await readSecretsFile();
  secrets.calendarIcsUrl = validated.url;
  await writeSecretsFile(secrets);
  return { host: safeHost(validated.url) };
}

export async function clearCalendarIcsUrl(): Promise<void> {
  const secrets = await readSecretsFile();
  delete secrets.calendarIcsUrl;
  await writeSecretsFile(secrets);
}
