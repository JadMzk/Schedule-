import { DateTime } from "luxon";
import {
  categoryColor,
  categoryLabel,
} from "@/lib/categories";
import { APP_TZ, toLondon } from "@/lib/time";
import type { AcademicEvent, Module, Task, TaskCategory, WorkSession } from "@/lib/types";

export type CalendarItemKind = "academic" | "task-deadline" | "session" | "unscheduled";

export interface CalendarItem {
  id: string;
  kind: CalendarItemKind;
  title: string;
  subtitle?: string;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  color: string;
  meta?: Record<string, string>;
}

const HOUR_START = 7;
const HOUR_END = 22;
export const DAY_START_HOUR = HOUR_START;
export const DAY_END_HOUR = HOUR_END;
export const TOTAL_MINUTES = (HOUR_END - HOUR_START) * 60;

export function buildCalendarItems(options: {
  events: AcademicEvent[];
  modules: Module[];
  tasks: Task[];
  sessions: WorkSession[];
}): CalendarItem[] {
  const { events, modules, tasks, sessions } = options;
  const moduleById = new Map(modules.map((m) => [m.id, m]));
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const items: CalendarItem[] = [];

  for (const ev of events) {
    const mod = moduleById.get(ev.moduleId);
    items.push({
      id: `ev-${ev.id}`,
      kind: "academic",
      title: ev.title,
      subtitle: mod?.name ?? "Uncategorised",
      startAt: ev.startAt,
      endAt: ev.endAt,
      allDay: ev.isAllDay,
      color: "var(--academic)",
      meta: { eventId: ev.id, moduleId: ev.moduleId, location: ev.location },
    });
  }

  for (const session of sessions) {
    if (session.status === "cancelled") continue;
    const task = session.taskId ? taskById.get(session.taskId) : undefined;
    const title =
      session.title?.trim() ||
      task?.title ||
      (session.taskId ? "Work session" : "Personal block");
    const category: TaskCategory =
      session.category ?? task?.category ?? "personal";
    const statusBit = session.taskId
      ? session.status === "suggested"
        ? "Suggested"
        : "Scheduled"
      : null;
    items.push({
      id: `sess-${session.id}`,
      kind: "session",
      title,
      subtitle: statusBit
        ? `${categoryLabel(category)} · ${statusBit}`
        : categoryLabel(category),
      startAt: session.startAt,
      endAt: session.endAt,
      color: categoryColor(category),
      meta: {
        sessionId: session.id,
        category,
        ...(session.taskId ? { taskId: session.taskId } : {}),
      },
    });
  }

  for (const task of tasks) {
    if (task.status === "completed" || !task.dueAt) continue;
    const due = toLondon(task.dueAt);
    items.push({
      id: `due-${task.id}`,
      kind: "task-deadline",
      title: `Due: ${task.title}`,
      subtitle: `${categoryLabel(task.category)} · ${task.priority}`,
      startAt: due.minus({ minutes: 30 }).toISO()!,
      endAt: due.toISO()!,
      // Deadlines stay coral for scanability; category is in the subtitle.
      color: "var(--deadline)",
      meta: { taskId: task.id, category: task.category },
    });
  }

  return items;
}

export function itemsForDay(items: CalendarItem[], day: DateTime): CalendarItem[] {
  const start = day.startOf("day");
  const end = day.endOf("day");
  return items.filter((item) => {
    const s = toLondon(item.startAt);
    const e = toLondon(item.endAt);
    return e > start && s < end;
  });
}

export function positionInDay(startAt: string, endAt: string, day: DateTime) {
  const dayStart = day.set({
    hour: HOUR_START,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  const dayEnd = day.set({
    hour: HOUR_END,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  let s = toLondon(startAt);
  let e = toLondon(endAt);
  if (s < dayStart) s = dayStart;
  if (e > dayEnd) e = dayEnd;
  const top = Math.max(0, s.diff(dayStart, "minutes").minutes);
  const height = Math.max(18, e.diff(s, "minutes").minutes);
  return {
    topPct: (top / TOTAL_MINUTES) * 100,
    heightPct: (height / TOTAL_MINUTES) * 100,
  };
}

export function hoursLabel(): number[] {
  const hours: number[] = [];
  for (let h = HOUR_START; h <= HOUR_END; h++) hours.push(h);
  return hours;
}

export function nowTopPercent(day: DateTime): number | null {
  const now = DateTime.now().setZone(APP_TZ);
  if (!now.hasSame(day, "day")) return null;
  const dayStart = day.set({ hour: HOUR_START, minute: 0, second: 0, millisecond: 0 });
  const minutes = now.diff(dayStart, "minutes").minutes;
  if (minutes < 0 || minutes > TOTAL_MINUTES) return null;
  return (minutes / TOTAL_MINUTES) * 100;
}

export const SLOT_SNAP_MINUTES = 15;

/** Snap a minute-of-day offset within the visible grid to a 15-minute boundary. */
export function snapGridMinutes(rawMinutes: number, snap = SLOT_SNAP_MINUTES): number {
  const clamped = Math.max(0, Math.min(TOTAL_MINUTES, rawMinutes));
  return Math.round(clamped / snap) * snap;
}

/**
 * Map a Y position within a day column (height === TOTAL_MINUTES px) to a London DateTime.
 */
export function pointerYToDateTime(
  day: DateTime,
  clientY: number,
  columnTop: number,
  columnHeight: number
): DateTime {
  const ratio = columnHeight > 0 ? (clientY - columnTop) / columnHeight : 0;
  const minutes = snapGridMinutes(ratio * TOTAL_MINUTES);
  return day
    .setZone(APP_TZ)
    .startOf("day")
    .set({ hour: DAY_START_HOUR, minute: 0, second: 0, millisecond: 0 })
    .plus({ minutes });
}

export function normalizeRange(
  a: DateTime,
  b: DateTime,
  minDurationMinutes = SLOT_SNAP_MINUTES
): { startAt: string; endAt: string } {
  let start = a <= b ? a : b;
  let end = a <= b ? b : a;
  if (end.diff(start, "minutes").minutes < minDurationMinutes) {
    end = start.plus({ minutes: minDurationMinutes });
  }
  return {
    startAt: start.toISO()!,
    endAt: end.toISO()!,
  };
}

export interface DraftTimeRange {
  startAt: string;
  endAt: string;
}
