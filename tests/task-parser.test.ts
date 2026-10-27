import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { parseTaskDeterministic } from "@/lib/tasks/parser";

const NOW = DateTime.fromISO("2026-10-16T15:00:00", { zone: "Europe/London" });

describe("parseTaskDeterministic", () => {
  it("parses duration and relative afternoon window without inventing a deadline", () => {
    const draft = parseTaskDeterministic(
      "Revise Bayesian statistics for two hours tomorrow afternoon.",
      NOW
    );
    expect(draft.estimatedDurationMinutes).toBe(120);
    expect(draft.dueAt).toBeUndefined();
    expect(draft.schedulingWindow?.preference).toBe("afternoon");
    expect(draft.category).toBe("study");
  });

  it("treats by Friday as a deadline, not a work session", () => {
    const draft = parseTaskDeterministic(
      "Finish my responsible AI case study by Friday.",
      NOW
    );
    expect(draft.dueAt).toBeTruthy();
    expect(draft.estimatedDurationMinutes).toBeUndefined();
    expect(draft.category).toBe("coursework");
    const due = DateTime.fromISO(draft.dueAt!, { setZone: true });
    expect(due.weekday).toBe(5);
  });

  it("parses interview with duration and next Tuesday", () => {
    const draft = parseTaskDeterministic(
      "Prepare for my internship interview next Tuesday, one hour.",
      NOW
    );
    expect(draft.estimatedDurationMinutes).toBe(60);
    expect(draft.category).toBe("career");
    expect(draft.schedulingWindow || draft.preferredStartAt || draft.dueAt).toBeTruthy();
  });

  it("parses recurring boxing on Sunday", () => {
    const draft = parseTaskDeterministic("Go boxing every Sunday at 10 am.", NOW);
    expect(draft.recurrenceRule).toContain("WEEKLY");
    expect(draft.recurrenceRule).toContain("SU");
    expect(draft.category).toBe("sport");
    expect(draft.preferredStartAt).toBeTruthy();
  });

  it("does not invent duration when absent", () => {
    const draft = parseTaskDeterministic("Read the lecture notes tonight.", NOW);
    expect(draft.estimatedDurationMinutes).toBeUndefined();
    expect(draft.schedulingWindow?.preference).toBe("evening");
  });

  it("asks clarification when deadline reference is ambiguous", () => {
    const draft = parseTaskDeterministic(
      "Spend 90 minutes on my machine learning coursework before the deadline.",
      NOW
    );
    expect(draft.estimatedDurationMinutes).toBe(90);
    expect(draft.clarificationQuestion).toBeTruthy();
  });

  it("preserves original input", () => {
    const input = "Revise notes tomorrow";
    const draft = parseTaskDeterministic(input, NOW);
    expect(draft.originalInput).toBe(input);
  });
});
