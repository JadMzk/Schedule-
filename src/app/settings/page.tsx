"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { formatDateTime, formatRelativeSync } from "@/lib/time";

export default function SettingsPage() {
  const {
    data,
    syncing,
    syncCalendar,
    saveIcsUrl,
    clearIcsUrl,
    testIcsConnection,
  } = useApp();
  const [icsInput, setIcsInput] = useState("");
  const [busy, setBusy] = useState<"save" | "test" | "clear" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!data) return null;

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setBusy("save");
    setError(null);
    setMessage(null);
    try {
      const result = await saveIcsUrl(icsInput);
      setIcsInput("");
      setMessage(
        result.host
          ? `Saved link for ${result.host}. Use Refresh calendar to import events.`
          : "Calendar link saved."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save link");
    } finally {
      setBusy(null);
    }
  }

  async function onTest() {
    setBusy("test");
    setError(null);
    setMessage(null);
    try {
      const result = await testIcsConnection(icsInput || undefined);
      setMessage(
        result.message ??
          `Connection OK${result.host ? ` (${result.host})` : ""}${
            typeof result.eventCount === "number"
              ? ` — ${result.eventCount} events`
              : ""
          }`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection test failed");
    } finally {
      setBusy(null);
    }
  }

  async function onRefresh() {
    setError(null);
    setMessage(null);
    const sync = await syncCalendar();
    if (!sync.ok) {
      setError(sync.error ?? "Calendar refresh failed");
    } else {
      setMessage("Calendar refreshed.");
    }
  }

  async function onClear() {
    setBusy("clear");
    setError(null);
    setMessage(null);
    try {
      await clearIcsUrl();
      setMessage("Removed the saved calendar link from this app.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not clear link");
    } finally {
      setBusy(null);
    }
  }

  const working = busy !== null || syncing;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl text-ink">Settings</h2>
        <p className="text-sm text-ink-muted">
          Paste your Outlook calendar link below. It is stored only on this Mac and
          never shown back in full.
        </p>
      </div>

      <section className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]">
        <h3 className="font-display text-xl text-ink">Outlook calendar link</h3>
        <p className="mt-2 text-sm text-ink-muted">
          In Outlook on the web: open your calendar → share / publish → copy the{" "}
          <strong className="font-medium text-ink">ICS</strong> subscription link (it
          usually ends in <code className="rounded bg-paper px-1">.ics</code>).
        </p>

        <form onSubmit={(e) => void onSave(e)} className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">
              Private Outlook ICS URL
            </span>
            <input
              type="url"
              name="ics-url"
              autoComplete="off"
              spellCheck={false}
              placeholder="https://outlook.office365.com/owa/calendar/…/calendar.ics"
              value={icsInput}
              onChange={(e) => setIcsInput(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-teal"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={working || !icsInput.trim()}
              className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-deep disabled:opacity-50"
            >
              {busy === "save" ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              disabled={working || (!icsInput.trim() && !data.meta.calendarConfigured)}
              onClick={() => void onTest()}
              className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {busy === "test" ? "Testing…" : "Test connection"}
            </button>
            <button
              type="button"
              disabled={working || !data.meta.calendarConfigured}
              onClick={() => void onRefresh()}
              className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {syncing ? "Refreshing…" : "Refresh calendar"}
            </button>
            {data.meta.calendarSource === "app" && (
              <button
                type="button"
                disabled={working}
                onClick={() => void onClear()}
                className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-coral hover:bg-coral-soft disabled:opacity-50"
              >
                Remove saved link
              </button>
            )}
          </div>
        </form>

        <div className="mt-4 rounded-lg border border-line bg-paper px-3 py-2 text-sm">
          <div className="font-medium text-ink">
            Status:{" "}
            {data.meta.calendarConfigured ? (
              <span className="text-sage">Configured</span>
            ) : (
              <span className="text-amber">Not configured</span>
            )}
          </div>
          {data.meta.calendarHost && (
            <div className="mt-1 text-ink-muted">
              Host: {data.meta.calendarHost}
              {data.meta.calendarSource === "env"
                ? " (from environment)"
                : data.meta.calendarSource === "app"
                  ? " (saved in this app)"
                  : ""}
            </div>
          )}
          <p className="mt-2 text-xs text-ink-muted">
            The full URL is never returned to the interface or written to logs — only
            the host name is shown.
          </p>
        </div>

        {message && (
          <p className="mt-3 text-sm text-sage" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-3 text-sm text-coral" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]">
        <h3 className="font-display text-xl text-ink">Synchronisation</h3>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-muted">Last successful sync</dt>
            <dd className="font-medium text-ink">
              {data.sync.lastSuccessAt
                ? `${formatDateTime(data.sync.lastSuccessAt)} (${formatRelativeSync(data.sync.lastSuccessAt)})`
                : "Never"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Last attempt</dt>
            <dd className="font-medium text-ink">
              {data.sync.lastAttemptAt
                ? formatDateTime(data.sync.lastAttemptAt)
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Events stored</dt>
            <dd className="font-medium text-ink">{data.sync.eventCount}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Modules discovered</dt>
            <dd className="font-medium text-ink">{data.modules.length}</dd>
          </div>
        </dl>

        {data.sync.lastError && (
          <div className="mt-4 rounded-lg border border-coral/30 bg-coral-soft px-3 py-2 text-sm text-ink">
            <strong>Last error:</strong> {data.sync.lastError}
            <p className="mt-1 text-ink-muted">
              The previous successful snapshot is still available on the calendar.
            </p>
          </div>
        )}

        <div className="mt-4">
          <Link
            href="/modules"
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium"
          >
            Manage modules
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]">
        <h3 className="font-display text-xl text-ink">Natural-language parsing</h3>
        <p className="mt-2 text-sm text-ink-muted">
          {data.meta.llmConfigured
            ? "LLM API is configured. Structured JSON output is validated against a schema, with a deterministic fallback."
            : "No LLM API configured. The built-in deterministic parser handles common dates, durations and recurrence patterns."}
        </p>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]">
        <h3 className="font-display text-xl text-ink">Data & timezone</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
          <li>
            Desktop app data lives in your macOS user library (Electron userData).
          </li>
          <li>
            Dev mode also uses{" "}
            <code className="rounded bg-paper px-1">data/</code> in the project folder.
          </li>
          <li>Timezone: {data.meta.timezone}</li>
          <li>
            Tasks: {data.tasks.length} · Modules: {data.modules.length} · Work sessions:{" "}
            {data.workSessions.length}
          </li>
        </ul>
      </section>
    </div>
  );
}
