import { DateTime, Interval } from "luxon";
import { APP_TZ, toIso, toLondon } from "../time";
import type { AcademicEvent, Task, TimeSlot, WorkSession } from "../types";

export interface BusyBlock {
  startAt: string;
  endAt: string;
  label: string;
}

export function collectBusyBlocks(options: {
  academicEvents: AcademicEvent[];
  workSessions: WorkSession[];
  selectedModuleIds: Set<string>;
  rangeStart: string;
  rangeEnd: string;
}): BusyBlock[] {
  const { academicEvents, workSessions, selectedModuleIds, rangeStart, rangeEnd } =
    options;
  const blocks: BusyBlock[] = [];

  for (const ev of academicEvents) {
    if (!selectedModuleIds.has(ev.moduleId)) continue;
    if (ev.endAt <= rangeStart || ev.startAt >= rangeEnd) continue;
    blocks.push({
      startAt: ev.startAt,
      endAt: ev.endAt,
      label: ev.title,
    });
  }

  for (const session of workSessions) {
    if (session.status === "cancelled") continue;
    if (session.endAt <= rangeStart || session.startAt >= rangeEnd) continue;
    blocks.push({
      startAt: session.startAt,
      endAt: session.endAt,
      label: `Session ${session.id}`,
    });
  }

  return mergeBlocks(blocks);
}

function mergeBlocks(blocks: BusyBlock[]): BusyBlock[] {
  if (blocks.length === 0) return [];
  const sorted = [...blocks].sort((a, b) => a.startAt.localeCompare(b.startAt));
  const merged: BusyBlock[] = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const cur = sorted[i];
    if (cur.startAt <= last.endAt) {
      if (cur.endAt > last.endAt) last.endAt = cur.endAt;
      last.label = `${last.label}; ${cur.label}`;
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

export function findFreeSlots(options: {
  busy: BusyBlock[];
  rangeStart: string;
  rangeEnd: string;
  dayStartHour?: number;
  dayEndHour?: number;
  minDurationMinutes?: number;
}): TimeSlot[] {
  const dayStartHour = options.dayStartHour ?? 8;
  const dayEndHour = options.dayEndHour ?? 22;
  const minDuration = options.minDurationMinutes ?? 30;

  const rangeStart = toLondon(options.rangeStart);
  const rangeEnd = toLondon(options.rangeEnd);
  const slots: TimeSlot[] = [];

  let day = rangeStart.startOf("day");
  while (day < rangeEnd) {
    const windowStart = day.set({
      hour: dayStartHour,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    const windowEnd = day.set({
      hour: dayEndHour,
      minute: 0,
      second: 0,
      millisecond: 0,
    });

    const dayBusy = options.busy
      .map((b) =>
        Interval.fromDateTimes(toLondon(b.startAt), toLondon(b.endAt))
      )
      .filter((iv) => iv.isValid)
      .filter((iv) => iv.overlaps(Interval.fromDateTimes(windowStart, windowEnd)));

    let cursor = windowStart < rangeStart ? rangeStart : windowStart;
    const endCap = windowEnd > rangeEnd ? rangeEnd : windowEnd;

    const intersections = dayBusy
      .map((iv) => iv.intersection(Interval.fromDateTimes(windowStart, windowEnd)))
      .filter((iv): iv is Interval => Boolean(iv?.isValid))
      .sort((a, b) => a.start!.toMillis() - b.start!.toMillis());

    for (const busy of intersections) {
      if (busy.start && cursor < busy.start) {
        const minutes = busy.start.diff(cursor, "minutes").minutes;
        if (minutes >= minDuration) {
          slots.push({
            startAt: toIso(cursor),
            endAt: toIso(busy.start),
            durationMinutes: Math.round(minutes),
          });
        }
      }
      if (busy.end && busy.end > cursor) cursor = busy.end;
    }

    if (cursor < endCap) {
      const minutes = endCap.diff(cursor, "minutes").minutes;
      if (minutes >= minDuration) {
        slots.push({
          startAt: toIso(cursor),
          endAt: toIso(endCap),
          durationMinutes: Math.round(minutes),
        });
      }
    }

    day = day.plus({ days: 1 });
  }

  return slots;
}

export function hasConflict(
  startAt: string,
  endAt: string,
  busy: BusyBlock[]
): boolean {
  const candidate = Interval.fromDateTimes(toLondon(startAt), toLondon(endAt));
  if (!candidate.isValid) return true;
  return busy.some((b) => {
    const iv = Interval.fromDateTimes(toLondon(b.startAt), toLondon(b.endAt));
    return iv.isValid && iv.overlaps(candidate);
  });
}

export function priorityWeight(task: Task): number {
  switch (task.priority) {
    case "urgent":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

export function workingHoursInZone(
  iso: string,
  hour: number,
  minute = 0
): DateTime {
  return toLondon(iso).set({
    hour,
    minute,
    second: 0,
    millisecond: 0,
  }).setZone(APP_TZ);
}
