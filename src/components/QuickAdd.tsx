"use client";

import { FormEvent, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { TaskConfirmModal } from "@/components/TaskConfirmModal";
import type { ParsedTaskDraft } from "@/lib/types";

export function QuickAdd() {
  const { parseTask, createTask } = useApp();
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<ParsedTaskDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const parsed = await parseTask(text.trim());
      setDraft(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not parse task");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={(e) => void onSubmit(e)} className="w-full">
        <label className="sr-only" htmlFor="quick-add">
          Add a task
        </label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            id="quick-add"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a task… e.g. Revise statistics for 2 hours tomorrow afternoon"
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-[15px] shadow-[var(--shadow)] outline-none transition focus:border-teal"
          />
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="shrink-0 rounded-xl bg-teal px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow)] transition hover:bg-teal-deep disabled:opacity-50"
          >
            {busy ? "Parsing…" : "Add"}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-coral" role="alert">
            {error}
          </p>
        )}
      </form>

      {draft && (
        <TaskConfirmModal
          draft={draft}
          returnFocusRef={inputRef}
          onCancel={() => setDraft(null)}
          onConfirm={async (confirmed) => {
            await createTask({
              title: confirmed.title,
              originalInput: confirmed.originalInput,
              description: confirmed.description,
              dueAt: confirmed.dueAt,
              estimatedDurationMinutes: confirmed.estimatedDurationMinutes,
              preferredStartAt: confirmed.preferredStartAt,
              schedulingWindow: confirmed.schedulingWindow,
              priority: confirmed.priority,
              category: confirmed.category,
              recurrenceRule: confirmed.recurrenceRule,
              status: "todo",
            });
            setDraft(null);
            setText("");
          }}
        />
      )}
    </>
  );
}
