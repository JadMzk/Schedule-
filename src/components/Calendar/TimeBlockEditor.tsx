"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  CATEGORY_LABELS,
  TASK_CATEGORIES,
  categoryColor,
} from "@/lib/categories";
import type { Task, TaskCategory } from "@/lib/types";

function toLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export interface TimeBlockDraft {
  mode: "create" | "edit";
  sessionId?: string;
  title: string;
  startAt: string;
  endAt: string;
  taskId?: string;
  category: TaskCategory;
}

interface Props {
  draft: TimeBlockDraft;
  tasks: Task[];
  onCancel: () => void;
  onSave: (draft: TimeBlockDraft, allowConflict: boolean) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function TimeBlockEditor({
  draft: initial,
  tasks,
  onCancel,
  onSave,
  onDelete,
}: Props) {
  const [draft, setDraft] = useState(initial);
  const [linkTask, setLinkTask] = useState(Boolean(initial.taskId));
  const [allowConflict, setAllowConflict] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    setDraft(initial);
    setLinkTask(Boolean(initial.taskId));
  }, [initial]);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => titleRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        event.preventDefault();
        onCancel();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel, saving]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.title.trim() && !(linkTask && draft.taskId)) {
      setError("Enter a title, or link an existing task.");
      return;
    }
    if (!draft.startAt || !draft.endAt || draft.endAt <= draft.startAt) {
      setError("End time must be after start time.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(
        {
          ...draft,
          title: draft.title.trim(),
          taskId: linkTask ? draft.taskId : undefined,
        },
        allowConflict
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setSaving(false);
    }
  }

  function onDialogKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && !saving) {
      event.stopPropagation();
      onCancel();
    }
  }

  const openTasks = tasks.filter((t) => t.status !== "completed");

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-hidden p-3 sm:p-6">
      <div aria-hidden className="absolute inset-0 bg-[rgb(26_35_50/0.55)]" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
        className="relative z-[1] flex w-full max-w-md max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow)]"
      >
        <div className="shrink-0 border-b border-line px-5 py-4">
          <h2 id={titleId} className="font-display text-xl text-ink">
            {draft.mode === "create" ? "New calendar block" : "Edit calendar block"}
          </h2>
          <p id={descId} className="mt-1 text-sm text-ink-muted">
            Personal time on your calendar — separate from the university timetable.
          </p>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink">Title</span>
              <input
                ref={titleRef}
                className="box-border w-full rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-teal"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. Boxing"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 flex items-center gap-2 font-medium text-ink">
                Category
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ background: categoryColor(draft.category) }}
                  aria-hidden
                />
              </span>
              <select
                className="box-border w-full rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-teal"
                value={draft.category}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    category: e.target.value as TaskCategory,
                  })
                }
              >
                {TASK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-ink">Start</span>
                <input
                  type="datetime-local"
                  className="box-border w-full rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-teal"
                  value={toLocalInput(draft.startAt)}
                  onChange={(e) => {
                    const v = fromLocalInput(e.target.value);
                    if (v) setDraft({ ...draft, startAt: v });
                  }}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-ink">End</span>
                <input
                  type="datetime-local"
                  className="box-border w-full rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-teal"
                  value={toLocalInput(draft.endAt)}
                  onChange={(e) => {
                    const v = fromLocalInput(e.target.value);
                    if (v) setDraft({ ...draft, endAt: v });
                  }}
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={linkTask}
                onChange={(e) => {
                  setLinkTask(e.target.checked);
                  if (!e.target.checked) {
                    setDraft({ ...draft, taskId: undefined });
                  }
                }}
              />
              Link to an existing task
            </label>

            {linkTask && (
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-ink">Task</span>
                <select
                  className="box-border w-full rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-teal"
                  value={draft.taskId ?? ""}
                  onChange={(e) => {
                    const id = e.target.value || undefined;
                    const task = openTasks.find((t) => t.id === id);
                    setDraft({
                      ...draft,
                      taskId: id,
                      title: draft.title.trim() || task?.title || draft.title,
                      category: task?.category ?? draft.category,
                    });
                  }}
                >
                  <option value="">Select a task…</option>
                  {openTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({CATEGORY_LABELS[t.category]})
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="flex items-start gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={allowConflict}
                onChange={(e) => setAllowConflict(e.target.checked)}
              />
              <span>
                Allow overlap with classes or other sessions (not recommended)
              </span>
            </label>

            {error && (
              <p className="text-sm text-coral" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-4">
            <div>
              {draft.mode === "edit" && onDelete && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void onDelete()}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-coral hover:bg-coral-soft disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={onCancel}
                className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
