import { mergeModules } from "../modules/extract";
import { getCalendarIcsUrl } from "../secrets";
import { readStore, writeStore } from "../store";
import { nowLondon, toIso } from "../time";
import type { AppStore } from "../types";
import { parseIcsFeed } from "./parse";

export interface SyncResult {
  ok: boolean;
  store: AppStore;
  error?: string;
}

/**
 * Fetches the ICS URL server-side only. Never log the URL.
 */
export async function fetchIcsText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/calendar, text/plain, */*",
        "User-Agent": "SmartScheduler/1.0",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Calendar feed returned HTTP ${res.status}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function syncCalendarFromEnv(): Promise<SyncResult> {
  const store = await readStore();
  const attemptedAt = toIso(nowLondon());
  store.sync.lastAttemptAt = attemptedAt;

  const url = await getCalendarIcsUrl();
  if (!url) {
    store.sync.lastError =
      "No calendar link saved yet. Paste your Outlook ICS URL in Settings.";
    await writeStore(store);
    return { ok: false, store, error: store.sync.lastError };
  }

  try {
    const icsText = await fetchIcsText(url);
    if (!icsText.includes("BEGIN:VCALENDAR") && !icsText.includes("BEGIN:VEVENT")) {
      throw new Error("Response did not look like a valid ICS calendar feed.");
    }

    const parsed = parseIcsFeed(icsText, { syncedAt: attemptedAt });

    // Apply manual module overrides for event classification
    const events = parsed.events.map((ev) => {
      const override = store.moduleOverrides[ev.sourceUid] ?? store.moduleOverrides[ev.id];
      return override ? { ...ev, moduleId: override } : ev;
    });

    store.academicEvents = events;
    store.modules = mergeModules(store.modules, parsed.discoveredModules, true);
    store.sync.lastSuccessAt = attemptedAt;
    store.sync.lastError = null;
    store.sync.eventCount = events.length;

    await writeStore(store);
    return { ok: true, store };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Calendar fetch timed out."
          : err.message
        : "Unknown calendar sync error.";
    // Keep last successful snapshot; only update error metadata
    store.sync.lastError = message;
    await writeStore(store);
    return { ok: false, store, error: message };
  }
}
