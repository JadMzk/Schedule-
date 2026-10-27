import { describe, expect, it } from "vitest";
import { parseIcsFeed } from "@/lib/ics/parse";

const SAMPLE_ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//EN
BEGIN:VEVENT
UID:lecture-1@imperial
DTSTART;TZID=Europe/London:20261020T100000
DTEND;TZID=Europe/London:20261020T110000
SUMMARY:[COMP70001] Bayesian Methods — Lecture
LOCATION:Huxley 340
DESCRIPTION:Week 3
END:VEVENT
BEGIN:VEVENT
UID:weekly-lab@imperial
DTSTART;TZID=Europe/London:20261021T140000
DTEND;TZID=Europe/London:20261021T160000
RRULE:FREQ=WEEKLY;COUNT=3
SUMMARY:COMP70002: Machine Learning - Lab
LOCATION:Lab 1
END:VEVENT
BEGIN:VEVENT
UID:cancelled@imperial
DTSTART;TZID=Europe/London:20261022T090000
DTEND;TZID=Europe/London:20261022T100000
SUMMARY:Cancelled Seminar
STATUS:CANCELLED
END:VEVENT
BEGIN:VEVENT
UID:allday@imperial
DTSTART;VALUE=DATE:20261023
DTEND;VALUE=DATE:20261024
SUMMARY:Reading Week
END:VEVENT
END:VCALENDAR`;

describe("parseIcsFeed", () => {
  it("parses single events with stable ids and module discovery", () => {
    const result = parseIcsFeed(SAMPLE_ICS, {
      rangeStart: new Date("2026-10-01T00:00:00Z"),
      rangeEnd: new Date("2026-11-30T00:00:00Z"),
      syncedAt: "2026-10-16T12:00:00.000Z",
    });

    const lecture = result.events.find((e) => e.sourceUid === "lecture-1@imperial");
    expect(lecture).toBeTruthy();
    expect(lecture!.title).toContain("Bayesian");
    expect(lecture!.eventType).toMatch(/lecture/i);
    expect(lecture!.id).toBe("lecture-1@imperial");
    expect(result.discoveredModules.some((m) => m.code === "COMP70001")).toBe(true);
  });

  it("expands recurring events without duplicates", () => {
    const result = parseIcsFeed(SAMPLE_ICS, {
      rangeStart: new Date("2026-10-01T00:00:00Z"),
      rangeEnd: new Date("2026-11-30T00:00:00Z"),
      syncedAt: "2026-10-16T12:00:00.000Z",
    });

    const labs = result.events.filter((e) => e.sourceUid === "weekly-lab@imperial");
    expect(labs.length).toBe(3);
    const ids = new Set(labs.map((e) => e.id));
    expect(ids.size).toBe(3);
  });

  it("skips cancelled events", () => {
    const result = parseIcsFeed(SAMPLE_ICS, {
      rangeStart: new Date("2026-10-01T00:00:00Z"),
      rangeEnd: new Date("2026-11-30T00:00:00Z"),
    });
    expect(result.events.some((e) => e.sourceUid === "cancelled@imperial")).toBe(
      false
    );
  });

  it("marks all-day events", () => {
    const result = parseIcsFeed(SAMPLE_ICS, {
      rangeStart: new Date("2026-10-01T00:00:00Z"),
      rangeEnd: new Date("2026-11-30T00:00:00Z"),
    });
    const allday = result.events.find((e) => e.sourceUid === "allday@imperial");
    expect(allday?.isAllDay).toBe(true);
  });
});
