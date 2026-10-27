import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import {
  DAY_START_HOUR,
  normalizeRange,
  snapGridMinutes,
  TOTAL_MINUTES,
} from "@/components/Calendar/calendarUtils";

describe("calendar slot helpers", () => {
  it("snaps minutes to 15-minute grid", () => {
    expect(snapGridMinutes(0)).toBe(0);
    expect(snapGridMinutes(7)).toBe(0);
    expect(snapGridMinutes(8)).toBe(15);
    expect(snapGridMinutes(22)).toBe(15);
    expect(snapGridMinutes(TOTAL_MINUTES)).toBe(TOTAL_MINUTES);
  });

  it("normalizes inverted ranges and enforces minimum duration", () => {
    const day = DateTime.fromObject(
      { year: 2026, month: 10, day: 17, hour: DAY_START_HOUR },
      { zone: "Europe/London" }
    );
    const a = day.plus({ minutes: 60 });
    const b = day.plus({ minutes: 30 });
    const range = normalizeRange(a, b);
    expect(range.startAt < range.endAt).toBe(true);
    const start = DateTime.fromISO(range.startAt);
    const end = DateTime.fromISO(range.endAt);
    expect(end.diff(start, "minutes").minutes).toBeGreaterThanOrEqual(15);
  });

  it("extends a zero-length selection to 15 minutes", () => {
    const t = DateTime.fromISO("2026-10-17T10:00:00+01:00");
    const range = normalizeRange(t, t);
    expect(
      DateTime.fromISO(range.endAt).diff(DateTime.fromISO(range.startAt), "minutes")
        .minutes
    ).toBe(15);
  });
});
