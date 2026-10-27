"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useApp } from "@/components/AppProvider";
import { SuggestPanel } from "@/components/Scheduling/SuggestPanel";
import { CATEGORY_LABELS, TASK_CATEGORIES } from "@/lib/categories";
import { formatDateTime } from "@/lib/time";
import type { Priority, Task, TaskCategory, TaskStatus } from "@/lib/types";

type SortKey = "deadline" | "priority" | "duration";

const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export default function TasksPage() {
  const { data, updateTask, deleteTask } = useApp();
  const [sort, setSort] = useState<SortKey>("deadline");
  const [category, setCategory] = useState<TaskCategory | "all">("all");
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [editing, setEditing] = useState<Task | null>(null);
  const [suggestFor, setSuggestFor] = useState<Task | null>(null);

  const tasks = useMemo(() => {
    if (!data) return [];
    let list = [...data.tasks];
    if (category !== "all") list = list.filter((t) => t.category === category);
    if (status !== "all") list = list.filter((t) => t.status === status);
    if (priority !== "all") list = list.filter((t) => t.priority === priority);

    list.sort((a, b) => {
      if (sort === "priority") {
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      }
      if (sort === "duration") {
        return (b.estimatedDurationMinutes ?? 0) - (a.estimatedDurationMinutes ?? 0);
      }
      const ad = a.dueAt ?? "9999";
      const bd = b.dueAt ?? "9999";
      return ad.localeCompare(bd);
    });
    return list;
  }, [data, sort, category, status, priority]);

  if (!data) return null;

  const now = Date.now();
  const overdue = tasks.filter(
    (t) => t.status !== "completed" && t.dueAt && new Date(t.dueAt).getTime() < now
  );
  const inbox = tasks.filter(
    (t) =>
      t.status === "todo" &&
      !data.workSessions.some((s) => s.taskId === t.id && s.status !== "cancelled")
  );
  const upcoming = tasks.filter(
    (t) => t.status !== "completed" && t.dueAt && new Date(t.dueAt).getTime() >= now
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-ink">Tasks</h2>
          <p className="text-sm text-ink-muted">
            Inbox, deadlines and scheduled work — edit without re-entering natural language.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Select
            label="Sort"
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={[
              ["deadline", "Deadline"],
              ["priority", "Priority"],
              ["duration", "Duration"],
            ]}
          />
          <Select
            label="Category"
            value={category}
            onChange={(v) => setCategory(v as TaskCategory | "all")}
            options={[
              ["all", "All"],
              ...TASK_CATEGORIES.map(
                (c) => [c, CATEGORY_LABELS[c]] as [string, string]
              ),
            ]}
          />
          <Select
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as TaskStatus | "all")}
            options={[
              ["all", "All"],
              ["todo", "To do"],
              ["scheduled", "Scheduled"],
              ["in_progress", "In progress"],
              ["completed", "Completed"],
            ]}
          />
          <Select
            label="Priority"
            value={priority}
            onChange={(v) => setPriority(v as Priority | "all")}
            options={[
              ["all", "All"],
              ["urgent", "Urgent"],
              ["high", "High"],
              ["medium", "Medium"],
              ["low", "Low"],
            ]}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <TaskSection title="Overdue" tasks={overdue} accent="coral">
            {(t) => (
              <TaskRow
                task={t}
                onEdit={() => setEditing(t)}
                onComplete={() => void updateTask(t.id, { status: "completed" })}
                onSuggest={() => setSuggestFor(t)}
                onDelete={() => void deleteTask(t.id)}
              />
            )}
          </TaskSection>
          <TaskSection title="Inbox (unscheduled)" tasks={inbox} accent="amber">
            {(t) => (
              <TaskRow
                task={t}
                onEdit={() => setEditing(t)}
                onComplete={() => void updateTask(t.id, { status: "completed" })}
                onSuggest={() => setSuggestFor(t)}
                onDelete={() => void deleteTask(t.id)}
              />
            )}
          </TaskSection>
          <TaskSection title="Upcoming" tasks={upcoming} accent="teal">
            {(t) => (
              <TaskRow
                task={t}
                onEdit={() => setEditing(t)}
                onComplete={() => void updateTask(t.id, { status: "completed" })}
                onSuggest={() => setSuggestFor(t)}
                onDelete={() => void deleteTask(t.id)}
              />
            )}
          </TaskSection>
          <TaskSection
            title="All filtered"
            tasks={tasks}
            accent="ink"
          >
            {(t) => (
              <TaskRow
                task={t}
                onEdit={() => setEditing(t)}
                onComplete={() => void updateTask(t.id, { status: "completed" })}
                onSuggest={() => setSuggestFor(t)}
                onDelete={() => void deleteTask(t.id)}
              />
            )}
          </TaskSection>
        </div>
        <SuggestPanel task={suggestFor} />
      </div>

      {editing && (
        <EditTaskModal
          task={editing}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            await updateTask(editing.id, patch);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function TaskSection({
  title,
  tasks,
  accent,
  children,
}: {
  title: string;
  tasks: Task[];
  accent: string;
  children: (t: Task) => ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)]">
      <h3 className="font-display text-lg text-ink">
        {title}{" "}
        <span className="text-sm font-sans font-normal text-ink-muted">
          ({tasks.length})
        </span>
      </h3>
      {tasks.length === 0 ? (
        <p className="mt-2 text-sm text-ink-muted">Nothing here</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {tasks.map((t) => (
            <li key={t.id} className="py-3">
              {children(t)}
            </li>
          ))}
        </ul>
      )}
      <span className="sr-only">{accent}</span>
    </section>
  );
}

function TaskRow({
  task,
  onEdit,
  onComplete,
  onSuggest,
  onDelete,
}: {
  task: Task;
  onEdit: () => void;
  onComplete: () => void;
  onSuggest: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="font-medium text-ink">{task.title}</div>
        <div className="mt-0.5 text-xs text-ink-muted">
          {task.priority} · {task.category} · {task.status}
          {task.dueAt ? ` · due ${formatDateTime(task.dueAt)}` : ""}
          {task.estimatedDurationMinutes
            ? ` · ${task.estimatedDurationMinutes} min`
            : ""}
        </div>
        {task.originalInput && (
          <div className="mt-1 text-xs italic text-ink-muted">
            “{task.originalInput}”
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {task.status !== "completed" && (
          <button
            type="button"
            onClick={onComplete}
            className="rounded-md bg-sage px-2.5 py-1 text-xs font-semibold text-white"
          >
            Complete
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md border border-line px-2.5 py-1 text-xs font-medium"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onSuggest}
          className="rounded-md border border-line px-2.5 py-1 text-xs font-medium"
        >
          Schedule
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-coral"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-ink-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-line bg-surface px-2 py-1.5"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function toLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EditTaskModal({
  task,
  onClose,
  onSave,
}: {
  task: Task;
  onClose: () => void;
  onSave: (patch: Partial<Task>) => Promise<void>;
}) {
  const [title, setTitle] = useState(task.title);
  const [dueAt, setDueAt] = useState(toLocalInput(task.dueAt));
  const [duration, setDuration] = useState(
    task.estimatedDurationMinutes?.toString() ?? ""
  );
  const [priority, setPriority] = useState(task.priority);
  const [category, setCategory] = useState(task.category);
  const [status, setStatus] = useState(task.status);
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(26_35_50/0.45)] p-4">
      <div className="animate-rise w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]">
        <h3 className="font-display text-xl text-ink">Edit task</h3>
        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-lg border border-line bg-paper px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="datetime-local"
            className="w-full rounded-lg border border-line bg-paper px-3 py-2"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
          <input
            type="number"
            min={1}
            placeholder="Duration (minutes)"
            className="w-full rounded-lg border border-line bg-paper px-3 py-2"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
          <div className="grid grid-cols-3 gap-2">
            <select
              className="rounded-lg border border-line bg-paper px-2 py-2"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              {(["low", "medium", "high", "urgent"] as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-line bg-paper px-2 py-2"
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
            >
              {TASK_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-line bg-paper px-2 py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              {(
                ["todo", "scheduled", "in_progress", "completed"] as TaskStatus[]
              ).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {task.originalInput && (
            <p className="text-xs text-ink-muted">Original: {task.originalInput}</p>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            onClick={() => {
              setSaving(true);
              void onSave({
                title,
                dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
                estimatedDurationMinutes: duration
                  ? parseInt(duration, 10)
                  : undefined,
                priority,
                category,
                status,
              }).finally(() => setSaving(false));
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
