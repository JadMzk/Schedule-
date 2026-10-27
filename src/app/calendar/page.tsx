"use client";

import { DateTime } from "luxon";
import { useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import type {
  CalendarItem,
  DraftTimeRange,
} from "@/components/Calendar/calendarUtils";
import { DayView } from "@/components/Calendar/DayView";
import { MonthView } from "@/components/Calendar/MonthView";
import {
  TimeBlockEditor,
  type TimeBlockDraft,
} from "@/components/Calendar/TimeBlockEditor";
import { WeekView } from "@/components/Calendar/WeekView";
import { SuggestPanel } from "@/components/Scheduling/SuggestPanel";
import { CATEGORY_COLORS, CATEGORY_LABELS, TASK_CATEGORIES } from "@/lib/categories";
import { APP_TZ, formatDateTime, formatTime } from "@/lib/time";
import type { CalendarView } from "@/lib/types";

export default function CalendarPage() {
  const {
    data,
    visibleEvents,
    updateTask,
    reassignEvent,
    createSession,
    updateSession,
    deleteSession,
  } = useApp();
  const [view, setView] = useState<CalendarView>("week");
  const [anchorIso, setAnchorIso] = useState(() =>
    DateTime.now().setZone(APP_TZ).toISO()!
  );
  const [selected, setSelected] = useState<CalendarItem | null>(null);
  const [blockDraft, setBlockDraft] = useState<TimeBlockDraft | null>(null);

  const anchor = useMemo(
    () => DateTime.fromISO(anchorIso, { zone: APP_TZ }),
    [anchorIso]
  );

  if (!data) return null;

  const unscheduled = data.tasks.filter(
    (t) =>
      t.status === "todo" &&
      !data.workSessions.some(
        (s) => s.taskId === t.id && s.status !== "cancelled"
      )
  );

  function shift(unit: "day" | "week" | "month", dir: -1 | 1) {
    setAnchorIso(anchor.plus({ [unit]: dir }).toISO()!);
  }

  function goToday() {
    setAnchorIso(DateTime.now().setZone(APP_TZ).toISO()!);
  }

  function onCreateRange(range: DraftTimeRange) {
    setSelected(null);
    setBlockDraft({
      mode: "create",
      title: "",
      startAt: range.startAt,
      endAt: range.endAt,
      category: "personal",
    });
  }

  function onItemClick(item: CalendarItem) {
    if (item.kind === "session" && item.meta?.sessionId && data) {
      const session = data.workSessions.find((s) => s.id === item.meta?.sessionId);
      if (session) {
        const linked = session.taskId
          ? data.tasks.find((t) => t.id === session.taskId)
          : undefined;
        setSelected(null);
        setBlockDraft({
          mode: "edit",
          sessionId: session.id,
          title: item.title,
          startAt: session.startAt,
          endAt: session.endAt,
          taskId: session.taskId,
          category: session.category ?? linked?.category ?? "personal",
        });
        return;
      }
    }
    setBlockDraft(null);
    setSelected(item);
  }

  const title =
    view === "month"
      ? anchor.toFormat("LLLL yyyy")
      : view === "day"
        ? anchor.toFormat("cccc d LLL yyyy")
        : `Week of ${anchor.startOf("week").toFormat("d LLL")}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              shift(view === "month" ? "month" : view === "day" ? "day" : "week", -1)
            }
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() =>
              shift(view === "month" ? "month" : view === "day" ? "day" : "week", 1)
            }
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium"
          >
            Next
          </button>
          <h2 className="ml-1 font-display text-2xl text-ink">{title}</h2>
        </div>

        <div className="flex rounded-lg border border-line bg-surface p-1">
          {(["day", "week", "month"] as CalendarView[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${
                view === v ? "bg-teal text-white" : "text-ink-muted"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {(view === "week" || view === "day") && (
        <p className="text-sm text-ink-muted">
          Tip: click or drag on empty time to add a personal block. Click a
          coloured block to edit it.
        </p>
      )}

      <div className="flex flex-wrap gap-3 text-xs">
        <Legend color="var(--academic)" label="Academic" />
        {TASK_CATEGORIES.map((c) => (
          <Legend key={c} color={CATEGORY_COLORS[c]} label={CATEGORY_LABELS[c]} />
        ))}
        <Legend color="var(--deadline)" label="Deadline" />
        <Legend color="var(--task)" label="Unscheduled (sidebar)" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div>
          {view === "week" && (
            <WeekView
              anchor={anchor}
              events={visibleEvents}
              modules={data.modules}
              tasks={data.tasks}
              sessions={data.workSessions}
              onItemClick={onItemClick}
              onCreateRange={onCreateRange}
            />
          )}
          {view === "day" && (
            <DayView
              anchor={anchor}
              events={visibleEvents}
              modules={data.modules}
              tasks={data.tasks}
              sessions={data.workSessions}
              onItemClick={onItemClick}
              onCreateRange={onCreateRange}
            />
          )}
          {view === "month" && (
            <MonthView
              anchor={anchor}
              events={visibleEvents}
              modules={data.modules}
              tasks={data.tasks}
              sessions={data.workSessions}
              onItemClick={onItemClick}
              onSelectDay={(day) => {
                setAnchorIso(day.toISO()!);
                setView("day");
              }}
            />
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)]">
            <h3 className="font-display text-lg text-ink">Unscheduled</h3>
            {unscheduled.length === 0 ? (
              <p className="mt-2 text-sm text-ink-muted">Inbox empty</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {unscheduled.map((t) => (
                  <li
                    key={t.id}
                    className="rounded-lg border border-amber/25 bg-amber-soft/50 px-3 py-2"
                  >
                    <div className="text-sm font-medium text-ink">{t.title}</div>
                    <div className="text-xs text-ink-muted">
                      {t.estimatedDurationMinutes
                        ? `${t.estimatedDurationMinutes} min`
                        : "No duration"}
                      {t.dueAt ? ` · due ${formatDateTime(t.dueAt)}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <SuggestPanel />
        </div>
      </div>

      {selected && (
        <ItemDetail
          item={selected}
          modules={data.modules}
          onClose={() => setSelected(null)}
          onCompleteTask={async (taskId) => {
            await updateTask(taskId, { status: "completed" });
            setSelected(null);
          }}
          onReassign={async (eventId, moduleId) => {
            await reassignEvent(eventId, moduleId, true);
          }}
        />
      )}

      {blockDraft && (
        <TimeBlockEditor
          draft={blockDraft}
          tasks={data.tasks}
          onCancel={() => setBlockDraft(null)}
          onSave={async (draft, allowConflict) => {
            if (draft.mode === "create") {
              await createSession({
                title: draft.title || undefined,
                taskId: draft.taskId,
                category: draft.category,
                startAt: draft.startAt,
                endAt: draft.endAt,
                allowConflict,
              });
            } else if (draft.sessionId) {
              await updateSession(draft.sessionId, {
                title: draft.title || null,
                taskId: draft.taskId ?? null,
                category: draft.category,
                startAt: draft.startAt,
                endAt: draft.endAt,
                allowConflict,
              });
            }
            setBlockDraft(null);
          }}
          onDelete={
            blockDraft.mode === "edit" && blockDraft.sessionId
              ? async () => {
                  await deleteSession(blockDraft.sessionId!);
                  setBlockDraft(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-muted">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

function ItemDetail({
  item,
  modules,
  onClose,
  onCompleteTask,
  onReassign,
}: {
  item: CalendarItem;
  modules: { id: string; name: string; code?: string }[];
  onClose: () => void;
  onCompleteTask: (taskId: string) => Promise<void>;
  onReassign: (eventId: string, moduleId: string) => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgb(26_35_50/0.45)] p-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {item.kind}
            </p>
            <h3 className="font-display text-xl text-ink">{item.title}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-ink-muted hover:text-ink">
            Close
          </button>
        </div>
        <p className="text-sm text-ink-muted">
          {formatTime(item.startAt)} – {formatTime(item.endAt)}
        </p>
        {item.subtitle && <p className="mt-1 text-sm text-ink">{item.subtitle}</p>}
        {item.meta?.location && (
          <p className="mt-1 text-sm text-ink-muted">{item.meta.location}</p>
        )}

        {item.kind === "academic" && item.meta?.eventId && (
          <label className="mt-4 block text-sm">
            <span className="mb-1 block font-medium">Module assignment</span>
            <select
              className="w-full rounded-lg border border-line bg-paper px-3 py-2"
              defaultValue={item.meta.moduleId}
              onChange={(e) =>
                void onReassign(item.meta!.eventId!, e.target.value)
              }
            >
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code ? `${m.code} — ${m.name}` : m.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {item.kind === "task-deadline" && item.meta?.taskId && (
          <button
            type="button"
            className="mt-4 rounded-lg bg-teal px-3 py-2 text-sm font-semibold text-white"
            onClick={() => void onCompleteTask(item.meta!.taskId!)}
          >
            Mark task complete
          </button>
        )}
      </div>
    </div>
  );
}
