import { describe, expect, it } from "vitest";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  TASK_CATEGORIES,
  categoryColor,
  categoryLabel,
} from "../src/lib/categories";
import { buildCalendarItems } from "../src/components/Calendar/calendarUtils";
import type { WorkSession } from "../src/lib/types";

describe("categories", () => {
  it("has a colour and label for every TaskCategory", () => {
    for (const c of TASK_CATEGORIES) {
      expect(CATEGORY_COLORS[c]).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(CATEGORY_LABELS[c].length).toBeGreaterThan(0);
      expect(categoryColor(c)).toBe(CATEGORY_COLORS[c]);
      expect(categoryLabel(c)).toBe(CATEGORY_LABELS[c]);
    }
  });

  it("colours session blocks from session.category with task fallback", () => {
    const sessions: WorkSession[] = [
      {
        id: "s1",
        title: "Boxing",
        category: "sport",
        startAt: "2026-10-17T10:00:00.000Z",
        endAt: "2026-10-17T11:00:00.000Z",
        status: "confirmed",
      },
      {
        id: "s2",
        taskId: "t1",
        startAt: "2026-10-17T12:00:00.000Z",
        endAt: "2026-10-17T13:00:00.000Z",
        status: "confirmed",
      },
    ];
    const items = buildCalendarItems({
      events: [],
      modules: [],
      tasks: [
        {
          id: "t1",
          title: "Essay",
          originalInput: "Essay",
          description: "",
          category: "coursework",
          priority: "medium",
          status: "scheduled",
          createdAt: "2026-10-01T00:00:00.000Z",
          updatedAt: "2026-10-01T00:00:00.000Z",
        },
      ],
      sessions,
    });
    const boxing = items.find((i) => i.id === "sess-s1");
    const essay = items.find((i) => i.id === "sess-s2");
    expect(boxing?.color).toBe(CATEGORY_COLORS.sport);
    expect(boxing?.subtitle).toBe("Sport");
    expect(essay?.color).toBe(CATEGORY_COLORS.coursework);
    expect(essay?.subtitle).toContain("Coursework");
  });
});
