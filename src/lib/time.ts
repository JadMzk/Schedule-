import { DateTime, Interval } from "luxon";

export const APP_TZ = "Europe/London";

export function nowLondon(): DateTime {
  return DateTime.now().setZone(APP_TZ);
}

export function toLondon(iso: string | Date): DateTime {
  if (iso instanceof Date) {
    return DateTime.fromJSDate(iso, { zone: APP_TZ });
  }
  const parsed = DateTime.fromISO(iso, { setZone: true });
  if (!parsed.isValid) {
    return DateTime.fromJSDate(new Date(iso), { zone: APP_TZ });
  }
  return parsed.setZone(APP_TZ);
}

export function toIso(dt: DateTime): string {
  return dt.setZone(APP_TZ).toISO() ?? dt.toISO()!;
}

export function startOfDay(isoOrDt: string | DateTime): DateTime {
  const dt = typeof isoOrDt === "string" ? toLondon(isoOrDt) : isoOrDt.setZone(APP_TZ);
  return dt.startOf("day");
}

export function endOfDay(isoOrDt: string | DateTime): DateTime {
  const dt = typeof isoOrDt === "string" ? toLondon(isoOrDt) : isoOrDt.setZone(APP_TZ);
  return dt.endOf("day");
}

export function startOfWeek(isoOrDt: string | DateTime): DateTime {
  const dt = typeof isoOrDt === "string" ? toLondon(isoOrDt) : isoOrDt.setZone(APP_TZ);
  // Monday-start week
  return dt.startOf("week");
}

export function formatDayHeading(dt: DateTime): string {
  return dt.toFormat("ccc d LLL");
}

export function formatTime(iso: string): string {
  return toLondon(iso).toFormat("HH:mm");
}

export function formatDateTime(iso: string): string {
  return toLondon(iso).toFormat("ccc d LLL, HH:mm");
}

export function formatRelativeSync(iso: string | null): string {
  if (!iso) return "Never";
  const dt = toLondon(iso);
  return dt.toRelative({ base: nowLondon() }) ?? dt.toFormat("d LLL HH:mm");
}

export function overlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  const a = Interval.fromDateTimes(toLondon(aStart), toLondon(aEnd));
  const b = Interval.fromDateTimes(toLondon(bStart), toLondon(bEnd));
  if (!a.isValid || !b.isValid) return false;
  return a.overlaps(b);
}

export function durationMinutes(startAt: string, endAt: string): number {
  return Math.max(0, Math.round(toLondon(endAt).diff(toLondon(startAt), "minutes").minutes));
}
