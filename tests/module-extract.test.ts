import { describe, expect, it } from "vitest";
import {
  extractModuleFromTitle,
  mergeModules,
  moduleIdFromName,
} from "@/lib/modules/extract";

describe("extractModuleFromTitle", () => {
  it("parses bracket codes", () => {
    const r = extractModuleFromTitle("[COMP70001] Bayesian Methods — Lecture");
    expect(r.code).toBe("COMP70001");
    expect(r.name).toMatch(/Bayesian/i);
    expect(r.eventType).toMatch(/lecture/i);
  });

  it("parses colon-separated codes", () => {
    const r = extractModuleFromTitle("COMP70002: Machine Learning - Lab");
    expect(r.code).toBe("COMP70002");
    expect(r.name).toMatch(/Machine Learning/i);
    expect(r.eventType).toMatch(/lab/i);
  });

  it("parses parenthetical codes", () => {
    const r = extractModuleFromTitle("Responsible AI (COMP70003) Seminar");
    expect(r.code).toBe("COMP70003");
    expect(r.name).toMatch(/Responsible AI/i);
  });

  it("falls back to Uncategorised for empty titles", () => {
    const r = extractModuleFromTitle("   ");
    expect(r.name).toBe("Uncategorised");
  });
});

describe("module filtering helpers", () => {
  it("keeps stable ids and preserves selection on merge", () => {
    const id = moduleIdFromName("Bayesian Methods", "COMP70001");
    const existing = [
      {
        id,
        code: "COMP70001",
        name: "Bayesian Methods",
        isSelected: false,
        classificationSource: "automatic" as const,
      },
    ];
    const merged = mergeModules(existing, [
      { code: "COMP70001", name: "Bayesian Methods" },
      { name: "New Module" },
    ]);
    const bayes = merged.find((m) => m.id === id);
    expect(bayes?.isSelected).toBe(false);
    expect(merged.some((m) => m.name === "New Module" && m.isSelected)).toBe(true);
  });
});
