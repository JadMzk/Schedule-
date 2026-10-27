"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
  CATEGORY_LABELS,
  TASK_CATEGORIES,
} from "@/lib/categories";
import type { ParsedTaskDraft, Priority, TaskCategory } from "@/lib/types";

const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];

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

interface Props {
  draft: ParsedTaskDraft;
  onCancel: () => void;
  onConfirm: (draft: ParsedTaskDraft) => Promise<void>;
  /** Element to restore focus to when the dialog closes (e.g. quick-add input). */
  returnFocusRef?: RefObject<HTMLElement | null>;
}

export function TaskConfirmModal({
  draft: initial,
  onCancel,
  onConfirm,
  returnFocusRef,
}: Props) {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setDraft(initial);
  }, [initial]);

  useEffect(() => {
    if (!mounted) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      titleInputRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      returnFocusRef?.current?.focus();
    };
  }, [mounted, returnFocusRef]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!saving) onCancel();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !dialogRef.current.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel, saving]);

  async function handleConfirm() {
    if (!draft.title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onConfirm(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setSaving(false);
    }
  }

  function onBackdropClick(event: ReactMouseEvent<HTMLDivElement>) {
    // Require an explicit Cancel/Confirm — backdrop click must not discard silently.
    if (event.target === event.currentTarget) {
      // no-op by design
    }
  }

  function onDialogKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && !saving) {
      event.stopPropagation();
      onCancel();
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-hidden p-3 sm:p-6"
      style={{ isolation: "isolate" }}
      onClick={onBackdropClick}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[rgb(26_35_50/0.55)]"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
        className="relative z-[1] flex w-full max-w-xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow)] box-border"
      >
        <div className="shrink-0 border-b border-line px-5 py-4">
          <h2 id={titleId} className="font-display text-xl text-ink">
            Confirm task
          </h2>
          <p id={descId} className="mt-1 text-sm text-ink-muted">
            Review the interpretation before saving. Nothing is stored until you
            confirm.
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-5 py-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Title</span>
            <input
              ref={titleInputRef}
              className="box-border w-full rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-teal"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Original input</span>
            <textarea
              className="box-border w-full resize-y rounded-lg border border-line bg-paper-2 px-3 py-2 text-ink-muted outline-none"
              rows={2}
              value={draft.originalInput}
              readOnly
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink">Due</span>
              <input
                type="datetime-local"
                className="box-border w-full rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-teal"
                value={toLocalInput(draft.dueAt)}
                onChange={(e) =>
                  setDraft({ ...draft, dueAt: fromLocalInput(e.target.value) })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink">Preferred start</span>
              <input
                type="datetime-local"
                className="box-border w-full rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-teal"
                value={toLocalInput(draft.preferredStartAt)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    preferredStartAt: fromLocalInput(e.target.value),
                  })
                }
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink">Duration (min)</span>
              <input
                type="number"
                min={1}
                className="box-border w-full rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-teal"
                value={draft.estimatedDurationMinutes ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    estimatedDurationMinutes: e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined,
                  })
                }
                placeholder="—"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink">Priority</span>
              <select
                className="box-border w-full rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-teal"
                value={draft.priority}
                onChange={(e) =>
                  setDraft({ ...draft, priority: e.target.value as Priority })
                }
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink">Category</span>
              <select
                className="box-border w-full rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-teal"
                value={draft.category}
                onChange={(e) =>
                  setDraft({ ...draft, category: e.target.value as TaskCategory })
                }
              >
                {TASK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Recurrence (RRULE)</span>
            <input
              className="box-border w-full rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-teal"
              value={draft.recurrenceRule ?? ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  recurrenceRule: e.target.value || undefined,
                })
              }
              placeholder="e.g. FREQ=WEEKLY;BYDAY=SU"
            />
          </label>

          {draft.clarificationQuestion && (
            <div className="rounded-lg border border-amber/30 bg-amber-soft px-3 py-2 text-sm text-ink">
              <strong>Clarification:</strong> {draft.clarificationQuestion}
            </div>
          )}

          <div className="rounded-lg border border-line bg-paper px-3 py-2 text-xs text-ink-muted">
            <div className="mb-1 font-medium text-ink">Parser: {draft.parser}</div>
            <ul className="list-inside list-disc space-y-0.5">
              {draft.confidenceNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>

          {error && (
            <p className="text-sm text-coral" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="shrink-0 flex justify-end gap-2 border-t border-line bg-surface px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink-muted hover:bg-paper disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleConfirm()}
            className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-deep disabled:opacity-60"
          >
            {saving ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
