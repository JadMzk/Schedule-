import { toLondon } from "../time";
import type {
  AcademicEvent,
  Module,
  ScheduleSuggestion,
  Task,
  TimeSlot,
  WorkSession,
} from "../types";
import {
  collectBusyBlocks,
  findFreeSlots,
  hasConflict,
  priorityWeight,
} from "./free-time";

export function suggestSlotsForTask(options: {
  task: Task;
  academicEvents: AcademicEvent[];
  workSessions: WorkSession[];
  modules: Module[];
  nowIso: string;
  horizonDays?: number;
  maxSuggestions?: number;
}): ScheduleSuggestion[] {
  const {
    task,
    academicEvents,
    workSessions,
    modules,
    nowIso,
    horizonDays = 14,
    maxSuggestions = 5,
  } = options;

  if (!task.estimatedDurationMinutes) {
    return [];
  }

  const duration = task.estimatedDurationMinutes;
  const selectedModuleIds = new Set(
    modules.filter((m) => m.isSelected).map((m) => m.id)
  );

  const rangeStart = toLondon(nowIso);
  let rangeEnd = rangeStart.plus({ days: horizonDays });

  if (task.dueAt) {
    const due = toLondon(task.dueAt);
    if (due < rangeEnd) rangeEnd = due;
  }

  if (task.schedulingWindow?.endAt) {
    const winEnd = toLondon(task.schedulingWindow.endAt);
    if (winEnd < rangeEnd) rangeEnd = winEnd;
  }

  if (rangeEnd <= rangeStart) return [];

  const busy = collectBusyBlocks({
    academicEvents,
    workSessions: workSessions.filter((s) => s.status !== "cancelled"),
    selectedModuleIds,
    rangeStart: rangeStart.toISO()!,
    rangeEnd: rangeEnd.toISO()!,
  });

  let free = findFreeSlots({
    busy,
    rangeStart: rangeStart.toISO()!,
    rangeEnd: rangeEnd.toISO()!,
    minDurationMinutes: duration,
  });

  // Narrow to scheduling window / preferred start
  if (task.preferredStartAt) {
    const pref = toLondon(task.preferredStartAt);
    free = free.filter((slot) => {
      const s = toLondon(slot.startAt);
      const e = toLondon(slot.endAt);
      return pref >= s && pref.plus({ minutes: duration }) <= e;
    });
  } else if (task.schedulingWindow?.preference) {
    const pref = task.schedulingWindow.preference;
    free = free.filter((slot) => {
      const hour = toLondon(slot.startAt).hour;
      if (pref === "morning") return hour >= 8 && hour < 12;
      if (pref === "afternoon") return hour >= 12 && hour < 17;
      if (pref === "evening") return hour >= 17 && hour < 22;
      return true;
    });
  } else if (task.schedulingWindow?.startAt && task.schedulingWindow?.endAt) {
    const ws = toLondon(task.schedulingWindow.startAt);
    const we = toLondon(task.schedulingWindow.endAt);
    free = free.filter((slot) => {
      const s = toLondon(slot.startAt);
      const e = toLondon(slot.endAt);
      return e > ws && s < we;
    });
  }

  const suggestions: ScheduleSuggestion[] = [];

  for (const slot of free) {
    const candidateStart = task.preferredStartAt
      ? toLondon(task.preferredStartAt)
      : toLondon(slot.startAt);
    const candidateEnd = candidateStart.plus({ minutes: duration });

    if (candidateEnd > toLondon(slot.endAt)) continue;
    if (candidateEnd > rangeEnd) continue;

    const startAt = candidateStart.toISO()!;
    const endAt = candidateEnd.toISO()!;
    if (hasConflict(startAt, endAt, busy)) continue;

    const daysUntilDue = task.dueAt
      ? toLondon(task.dueAt).diff(candidateStart, "days").days
      : 7;
    const score =
      priorityWeight(task) * 10 +
      Math.max(0, 10 - daysUntilDue) +
      (task.preferredStartAt ? 5 : 0);

    suggestions.push({
      taskId: task.id,
      slot: {
        startAt,
        endAt,
        durationMinutes: duration,
      },
      reason: buildReason(task, { startAt, endAt, durationMinutes: duration }),
      score,
    });

    if (suggestions.length >= maxSuggestions * 3) break;
  }

  // Also carve earliest fit from each free slot when preferred start not set
  if (!task.preferredStartAt) {
    for (const slot of free) {
      const start = toLondon(slot.startAt);
      const end = start.plus({ minutes: duration });
      if (end > toLondon(slot.endAt)) continue;
      const startAt = start.toISO()!;
      const endAt = end.toISO()!;
      if (hasConflict(startAt, endAt, busy)) continue;
      if (suggestions.some((s) => s.slot.startAt === startAt)) continue;

      const daysUntilDue = task.dueAt
        ? toLondon(task.dueAt).diff(start, "days").days
        : 7;
      suggestions.push({
        taskId: task.id,
        slot: { startAt, endAt, durationMinutes: duration },
        reason: buildReason(task, { startAt, endAt, durationMinutes: duration }),
        score: priorityWeight(task) * 10 + Math.max(0, 8 - daysUntilDue),
      });
    }
  }

  return suggestions
    .sort((a, b) => b.score - a.score || a.slot.startAt.localeCompare(b.slot.startAt))
    .slice(0, maxSuggestions);
}

function buildReason(task: Task, slot: TimeSlot): string {
  const parts = [
    `${slot.durationMinutes} min free slot`,
    `priority ${task.priority}`,
  ];
  if (task.dueAt) parts.push(`before deadline`);
  if (task.schedulingWindow?.preference) {
    parts.push(`${task.schedulingWindow.preference} preference`);
  }
  return parts.join(" · ");
}

export function suggestForUnscheduledTasks(options: {
  tasks: Task[];
  academicEvents: AcademicEvent[];
  workSessions: WorkSession[];
  modules: Module[];
  nowIso: string;
}): ScheduleSuggestion[] {
  const unscheduled = options.tasks.filter(
    (t) =>
      t.status !== "completed" &&
      Boolean(t.estimatedDurationMinutes) &&
      !options.workSessions.some(
        (s) => s.taskId === t.id && (s.status === "confirmed" || s.status === "suggested")
      )
  );

  const all: ScheduleSuggestion[] = [];
  let sessions = [...options.workSessions];

  // Greedy: higher priority / sooner deadline first
  const ordered = [...unscheduled].sort((a, b) => {
    const pw = priorityWeight(b) - priorityWeight(a);
    if (pw !== 0) return pw;
    const ad = a.dueAt ?? "9999";
    const bd = b.dueAt ?? "9999";
    return ad.localeCompare(bd);
  });

  for (const task of ordered) {
    const suggestions = suggestSlotsForTask({
      ...options,
      task,
      workSessions: sessions,
      maxSuggestions: 1,
    });
    if (suggestions[0]) {
      all.push(suggestions[0]);
      // Reserve the slot tentatively so later tasks don't collide in this batch
      sessions = [
        ...sessions,
        {
          id: `tentative-${task.id}`,
          taskId: task.id,
          startAt: suggestions[0].slot.startAt,
          endAt: suggestions[0].slot.endAt,
          status: "suggested",
        },
      ];
    }
  }

  return all;
}
