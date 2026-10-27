import ical, { type CalendarComponent, type VEvent } from "node-ical";
import { DateTime } from "luxon";
import { APP_TZ, toIso } from "../time";
import {
  extractModuleFromTitle,
  moduleIdFromName,
  UNCATEGORISED_ID,
} from "../modules/extract";
import type { AcademicEvent } from "../types";

export interface ParsedIcsResult {
  events: AcademicEvent[];
  discoveredModules: Array<{ code?: string; name: string }>;
}

function isVEvent(component: CalendarComponent): component is VEvent {
  return component.type === "VEVENT";
}

function asDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object" && value !== null && "toJSDate" in value) {
    const fn = (value as { toJSDate?: () => Date }).toJSDate;
    if (typeof fn === "function") return fn.call(value);
  }
  return null;
}

function eventTimezone(event: VEvent): string {
  const start = event.start as Date & { tz?: string };
  if (start?.tz) return String(start.tz);
  if (typeof event.datetype === "string" && event.datetype === "date") {
    return APP_TZ;
  }
  return APP_TZ;
}

function isAllDay(event: VEvent): boolean {
  if (event.datetype === "date") return true;
  const start = event.start as Date & { dateOnly?: boolean };
  return Boolean(start?.dateOnly);
}

function expandRecurring(
  event: VEvent,
  rangeStart: Date,
  rangeEnd: Date,
  syncedAt: string
): AcademicEvent[] {
  const results: AcademicEvent[] = [];
  const tz = eventTimezone(event);
  const extracted = extractModuleFromTitle(String(event.summary ?? "Untitled"));
  const moduleId = extracted.name
    ? moduleIdFromName(extracted.name, extracted.code)
    : UNCATEGORISED_ID;

  const baseStart = asDate(event.start);
  const baseEnd = asDate(event.end) ?? baseStart;
  if (!baseStart || !baseEnd) return results;

  const durationMs = baseEnd.getTime() - baseStart.getTime();
  const allDay = isAllDay(event);
  const uid = String(event.uid ?? `${event.summary}-${baseStart.toISOString()}`);
  const status = String(event.status ?? "").toUpperCase();

  if (status === "CANCELLED") {
    return results;
  }

  // Recurring event with rrule
  if (event.rrule) {
    const dates = event.rrule.between(rangeStart, rangeEnd, true);
    const exdates = new Set<number>();
    if (event.exdate) {
      for (const key of Object.keys(event.exdate)) {
        const d = asDate(event.exdate[key]);
        if (d) exdates.add(d.getTime());
      }
    }

    for (const occurrence of dates) {
      const occTime = occurrence.getTime();
      if (exdates.has(occTime)) continue;

      // Skip overridden instances handled separately via recurrenceid
      const startDt = DateTime.fromJSDate(occurrence, { zone: tz }).setZone(APP_TZ);
      const endDt = startDt.plus({ milliseconds: durationMs });
      const recurrenceId = startDt.toISO();

      results.push({
        id: `${uid}::${recurrenceId}`,
        sourceUid: uid,
        title: String(event.summary ?? "Untitled"),
        description: String(event.description ?? ""),
        startAt: toIso(startDt),
        endAt: toIso(endDt),
        timezone: APP_TZ,
        location: String(event.location ?? ""),
        moduleId,
        eventType: extracted.eventType,
        lastSyncedAt: syncedAt,
        isAllDay: allDay,
        recurrenceId: recurrenceId ?? undefined,
        status: status || undefined,
      });
    }
    return results;
  }

  // Single event (or recurrence exception)
  if (baseStart >= rangeStart && baseStart <= rangeEnd) {
    const startDt = DateTime.fromJSDate(baseStart, { zone: tz }).setZone(APP_TZ);
    const endDt = DateTime.fromJSDate(baseEnd, { zone: tz }).setZone(APP_TZ);
    const recurrenceId = event.recurrenceid
      ? DateTime.fromJSDate(asDate(event.recurrenceid) ?? baseStart, { zone: tz })
          .setZone(APP_TZ)
          .toISO()
      : undefined;

    results.push({
      id: recurrenceId ? `${uid}::${recurrenceId}` : uid,
      sourceUid: uid,
      title: String(event.summary ?? "Untitled"),
      description: String(event.description ?? ""),
      startAt: toIso(startDt),
      endAt: toIso(endDt),
      timezone: APP_TZ,
      location: String(event.location ?? ""),
      moduleId,
      eventType: extracted.eventType,
      lastSyncedAt: syncedAt,
      isAllDay: allDay,
      recurrenceId: recurrenceId ?? undefined,
      status: status || undefined,
    });
  }

  return results;
}

export function parseIcsFeed(
  icsText: string,
  options?: { rangeStart?: Date; rangeEnd?: Date; syncedAt?: string }
): ParsedIcsResult {
  const data = ical.sync.parseICS(icsText);
  const syncedAt = options?.syncedAt ?? new Date().toISOString();
  const rangeStart =
    options?.rangeStart ??
    DateTime.now().setZone(APP_TZ).minus({ months: 1 }).startOf("day").toJSDate();
  const rangeEnd =
    options?.rangeEnd ??
    DateTime.now().setZone(APP_TZ).plus({ months: 6 }).endOf("day").toJSDate();

  const events: AcademicEvent[] = [];
  const moduleMap = new Map<string, { code?: string; name: string }>();

  for (const key of Object.keys(data)) {
    const component = data[key];
    if (!component || !isVEvent(component)) continue;

    // Skip bare recurrence masters that will be expanded via rrule;
    // node-ical still exposes them as VEVENT with rrule.
    const expanded = expandRecurring(component, rangeStart, rangeEnd, syncedAt);
    for (const ev of expanded) {
      if (String(ev.status).toUpperCase() === "CANCELLED") continue;
      events.push(ev);
      const extracted = extractModuleFromTitle(ev.title);
      const mid = moduleIdFromName(extracted.name, extracted.code);
      if (!moduleMap.has(mid)) {
        moduleMap.set(mid, { code: extracted.code, name: extracted.name });
      }
    }
  }

  // Deduplicate by stable id (recurrence exceptions may collide)
  const byId = new Map<string, AcademicEvent>();
  for (const ev of events) {
    byId.set(ev.id, ev);
  }

  return {
    events: Array.from(byId.values()).sort((a, b) =>
      a.startAt.localeCompare(b.startAt)
    ),
    discoveredModules: Array.from(moduleMap.values()),
  };
}
