import { createHash } from "crypto";
import type { ClassificationSource, Module } from "../types";

export interface ExtractedModule {
  code?: string;
  name: string;
  eventType: string;
}

const UNCATEGORISED_ID = "module-uncategorised";

export function uncategorisedModule(isSelected = true): Module {
  return {
    id: UNCATEGORISED_ID,
    name: "Uncategorised",
    isSelected,
    classificationSource: "automatic",
  };
}

export function moduleIdFromName(name: string, code?: string): string {
  const key = (code ? `${code}|${name}` : name).toLowerCase().trim();
  if (key === "uncategorised" || key === "other") return UNCATEGORISED_ID;
  const hash = createHash("sha1").update(key).digest("hex").slice(0, 12);
  return `module-${hash}`;
}

/**
 * Robust extraction for Imperial/Outlook-style titles.
 * Tries: [CODE] Name — Type | CODE: Name | Name (CODE) | trailing type suffixes.
 */
export function extractModuleFromTitle(title: string): ExtractedModule {
  const cleaned = title.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return { name: "Uncategorised", eventType: "event" };
  }

  const eventType = detectEventType(cleaned);

  // [COMP70001] Bayesian Methods — Lecture
  const bracket = cleaned.match(/^\[([A-Z]{2,}\d[\w-]*)\]\s*(.+)$/i);
  if (bracket) {
    const code = bracket[1].toUpperCase();
    const rest = stripEventTypeSuffix(bracket[2]);
    return { code, name: rest || code, eventType };
  }

  // COMP70001: Bayesian Methods / COMP70001 - Bayesian Methods
  const colon = cleaned.match(/^([A-Z]{2,}\d[\w-]*)\s*[:\-–—]\s*(.+)$/i);
  if (colon) {
    const code = colon[1].toUpperCase();
    const rest = stripEventTypeSuffix(colon[2]);
    return { code, name: rest || code, eventType };
  }

  // Bayesian Methods (COMP70001)
  const paren = cleaned.match(/^(.+?)\s*\(([A-Z]{2,}\d[\w-]*)\)\s*(.*)$/i);
  if (paren) {
    const code = paren[2].toUpperCase();
    const name = stripEventTypeSuffix(paren[1]).trim() || code;
    return { code, name, eventType };
  }

  // Leading code without separator: COMP70001 Bayesian Methods Lecture
  const leading = cleaned.match(/^([A-Z]{2,}\d[\w-]*)\s+(.+)$/i);
  if (leading && /[A-Za-z]/.test(leading[2])) {
    const code = leading[1].toUpperCase();
    const rest = stripEventTypeSuffix(leading[2]);
    return { code, name: rest || code, eventType };
  }

  // Category-like prefixes used by some calendars
  const category = cleaned.match(/^(Lecture|Lab|Tutorial|Seminar|Workshop|Class)\s*[:\-–—]\s*(.+)$/i);
  if (category) {
    return {
      name: stripEventTypeSuffix(category[2]) || category[2],
      eventType: category[1].toLowerCase(),
    };
  }

  const withoutType = stripEventTypeSuffix(cleaned);
  if (!withoutType || withoutType.length < 2) {
    return { name: "Uncategorised", eventType };
  }

  return { name: withoutType, eventType };
}

const TYPE_PATTERN =
  /\b(lecture|lectures|lab|laboratory|tutorial|seminar|workshop|class|practical|exam|test|assessment|deadline|office\s*hours?)\b/i;

export function detectEventType(title: string): string {
  const match = title.match(TYPE_PATTERN);
  return match ? match[1].toLowerCase().replace(/\s+/g, " ") : "event";
}

function stripEventTypeSuffix(text: string): string {
  return text
    .replace(
      /\s*[\-–—:|]\s*(lecture|lectures|lab|laboratory|tutorial|seminar|workshop|class|practical|exam|test|assessment|office\s*hours?)\s*$/i,
      ""
    )
    .replace(
      /\s+\b(lecture|lectures|lab|laboratory|tutorial|seminar|workshop|class|practical|exam|test|assessment|office\s*hours?)\s*$/i,
      ""
    )
    .trim();
}

export function mergeModules(
  existing: Module[],
  discovered: Array<{ code?: string; name: string }>,
  preserveSelection = true
): Module[] {
  const byId = new Map<string, Module>();
  for (const mod of existing) {
    byId.set(mod.id, { ...mod });
  }

  if (!byId.has(UNCATEGORISED_ID)) {
    byId.set(UNCATEGORISED_ID, uncategorisedModule(true));
  }

  for (const d of discovered) {
    const id = moduleIdFromName(d.name, d.code);
    const prev = byId.get(id);
    if (prev) {
      byId.set(id, {
        ...prev,
        code: d.code ?? prev.code,
        name: d.name || prev.name,
        classificationSource:
          prev.classificationSource === "manual" ? "manual" : "automatic",
      });
    } else {
      byId.set(id, {
        id,
        code: d.code,
        name: d.name,
        isSelected: true,
        classificationSource: "automatic" as ClassificationSource,
      });
    }
  }

  // Preserve selection flags from existing when requested
  if (preserveSelection) {
    for (const mod of existing) {
      const cur = byId.get(mod.id);
      if (cur) cur.isSelected = mod.isSelected;
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export { UNCATEGORISED_ID };
