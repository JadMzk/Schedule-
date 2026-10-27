"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { formatDateTime } from "@/lib/time";
import type { ScheduleSuggestion, Task } from "@/lib/types";

interface Props {
  task?: Task | null;
}

export function SuggestPanel({ task = null }: Props) {
  const { fetchSuggestions, confirmSession, updateSession, data } = useApp();
  const [suggestions, setSuggestions] = useState<ScheduleSuggestion[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSuggestions(task?.id);
      setSuggestions(result.suggestions);
      setMessage(result.message ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, data?.tasks.length, data?.workSessions.length, data?.academicEvents.length]);

  async function accept(s: ScheduleSuggestion) {
    setBusyId(`${s.taskId}-${s.slot.startAt}`);
    try {
      await confirmSession(s.taskId, s.slot.startAt, s.slot.endAt);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept");
    } finally {
      setBusyId(null);
    }
  }

  const pendingSuggested =
    data?.workSessions.filter((s) => s.status === "suggested") ?? [];

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-lg text-ink">
          {task ? "Suggested slots" : "Scheduling assistant"}
        </h3>
        <button
          type="button"
          onClick={() => void load()}
          className="text-sm font-medium text-teal hover:underline"
        >
          Refresh
        </button>
      </div>

      <p className="mb-3 text-sm text-ink-muted">
        Suggestions never move existing events. Accept a slot to schedule a work session.
      </p>

      {loading && <p className="text-sm text-ink-muted">Finding free time…</p>}
      {error && <p className="text-sm text-coral">{error}</p>}
      {message && <p className="text-sm text-amber">{message}</p>}

      {!loading && suggestions.length === 0 && !message && (
        <p className="text-sm text-ink-muted">
          No suggestions right now. Add a duration to unscheduled tasks to enable
          scheduling.
        </p>
      )}

      <ul className="space-y-2">
        {suggestions.map((s) => {
          const t = data?.tasks.find((x) => x.id === s.taskId);
          const key = `${s.taskId}-${s.slot.startAt}`;
          return (
            <li
              key={key}
              className="rounded-xl border border-line bg-paper px-3 py-2"
            >
              <div className="font-medium text-ink">{t?.title ?? "Task"}</div>
              <div className="text-sm text-ink-muted">
                {formatDateTime(s.slot.startAt)} → {formatDateTime(s.slot.endAt)}
              </div>
              <div className="mt-1 text-xs text-ink-muted">{s.reason}</div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={busyId === key}
                  onClick={() => void accept(s)}
                  className="rounded-lg bg-sage px-3 py-1.5 text-xs font-semibold text-white hover:brightness-95 disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSuggestions((prev) => prev.filter((x) => x !== s))
                  }
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-surface"
                >
                  Reject
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {pendingSuggested.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <h4 className="mb-2 text-sm font-semibold text-ink">Pending suggested sessions</h4>
          <ul className="space-y-2">
            {pendingSuggested.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-ink-muted">{formatDateTime(s.startAt)}</span>
                <button
                  type="button"
                  onClick={() => void updateSession(s.id, { status: "cancelled" })}
                  className="text-coral hover:underline"
                >
                  Dismiss
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
