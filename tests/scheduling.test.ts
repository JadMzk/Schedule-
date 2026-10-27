import { describe, expect, it } from "vitest";
import {
  collectBusyBlocks,
  findFreeSlots,
  hasConflict,
} from "@/lib/scheduling/free-time";
import { suggestSlotsForTask } from "@/lib/scheduling/suggest";
import type { AcademicEvent, Module, Task, WorkSession } from "@/lib/types";

const modules: Module[] = [
  {
    id: "module-a",
    name: "Bayesian",
    isSelected: true,
    classificationSource: "automatic",
  },
  {
    id: "module-b",
    name: "Hidden",
    isSelected: false,
    classificationSource: "automatic",
  },
];

const events: AcademicEvent[] = [
  {
    id: "e1",
    sourceUid: "e1",
    title: "Lecture",
    description: "",
    startAt: "2026-10-20T10:00:00.000+01:00",
    endAt: "2026-10-20T11:00:00.000+01:00",
    timezone: "Europe/London",
    location: "",
    moduleId: "module-a",
    eventType: "lecture",
    lastSyncedAt: "2026-10-16T12:00:00.000Z",
    isAllDay: false,
  },
  {
    id: "e2",
    sourceUid: "e2",
    title: "Hidden Lab",
    description: "",
    startAt: "2026-10-20T12:00:00.000+01:00",
    endAt: "2026-10-20T13:00:00.000+01:00",
    timezone: "Europe/London",
    location: "",
    moduleId: "module-b",
    eventType: "lab",
    lastSyncedAt: "2026-10-16T12:00:00.000Z",
    isAllDay: false,
  },
];

describe("free time and conflicts", () => {
  it("ignores unselected modules when collecting busy blocks", () => {
    const busy = collectBusyBlocks({
      academicEvents: events,
      workSessions: [],
      selectedModuleIds: new Set(["module-a"]),
      rangeStart: "2026-10-20T00:00:00.000+01:00",
      rangeEnd: "2026-10-20T23:59:00.000+01:00",
    });
    expect(busy).toHaveLength(1);
    expect(busy[0].label).toBe("Lecture");
  });

  it("finds free slots around classes", () => {
    const busy = collectBusyBlocks({
      academicEvents: events,
      workSessions: [],
      selectedModuleIds: new Set(["module-a"]),
      rangeStart: "2026-10-20T08:00:00.000+01:00",
      rangeEnd: "2026-10-20T18:00:00.000+01:00",
    });
    const free = findFreeSlots({
      busy,
      rangeStart: "2026-10-20T08:00:00.000+01:00",
      rangeEnd: "2026-10-20T18:00:00.000+01:00",
      minDurationMinutes: 60,
    });
    expect(free.length).toBeGreaterThan(0);
    expect(
      free.some(
        (s) =>
          s.startAt <= "2026-10-20T09:00:00.000+01:00" &&
          s.endAt >= "2026-10-20T10:00:00.000+01:00"
      )
    ).toBe(true);
  });

  it("detects overlapping conflicts", () => {
    const busy = collectBusyBlocks({
      academicEvents: events,
      workSessions: [],
      selectedModuleIds: new Set(["module-a"]),
      rangeStart: "2026-10-20T00:00:00.000+01:00",
      rangeEnd: "2026-10-21T00:00:00.000+01:00",
    });
    expect(
      hasConflict(
        "2026-10-20T10:30:00.000+01:00",
        "2026-10-20T11:30:00.000+01:00",
        busy
      )
    ).toBe(true);
    expect(
      hasConflict(
        "2026-10-20T11:00:00.000+01:00",
        "2026-10-20T12:00:00.000+01:00",
        busy
      )
    ).toBe(false);
  });
});

describe("suggestSlotsForTask", () => {
  it("suggests slots that avoid classes and respect duration", () => {
    const task: Task = {
      id: "t1",
      title: "Revise",
      originalInput: "Revise for 90 minutes",
      description: "",
      estimatedDurationMinutes: 90,
      priority: "high",
      category: "study",
      status: "todo",
      createdAt: "2026-10-16T12:00:00.000Z",
      updatedAt: "2026-10-16T12:00:00.000Z",
    };
    const sessions: WorkSession[] = [];
    const suggestions = suggestSlotsForTask({
      task,
      academicEvents: events,
      workSessions: sessions,
      modules,
      nowIso: "2026-10-20T08:00:00.000+01:00",
      horizonDays: 1,
    });
    expect(suggestions.length).toBeGreaterThan(0);
    for (const s of suggestions) {
      expect(s.slot.durationMinutes).toBe(90);
      expect(
        hasConflict(
          s.slot.startAt,
          s.slot.endAt,
          collectBusyBlocks({
            academicEvents: events,
            workSessions: sessions,
            selectedModuleIds: new Set(["module-a"]),
            rangeStart: "2026-10-20T00:00:00.000+01:00",
            rangeEnd: "2026-10-21T00:00:00.000+01:00",
          })
        )
      ).toBe(false);
    }
  });

  it("returns no suggestions without a duration", () => {
    const task: Task = {
      id: "t2",
      title: "No duration",
      originalInput: "Finish essay by Friday",
      description: "",
      dueAt: "2026-10-24T23:59:00.000+01:00",
      priority: "medium",
      category: "coursework",
      status: "todo",
      createdAt: "2026-10-16T12:00:00.000Z",
      updatedAt: "2026-10-16T12:00:00.000Z",
    };
    const suggestions = suggestSlotsForTask({
      task,
      academicEvents: events,
      workSessions: [],
      modules,
      nowIso: "2026-10-20T08:00:00.000+01:00",
    });
    expect(suggestions).toHaveLength(0);
  });
});
