import { DateTime } from "luxon";
import { APP_TZ, nowLondon, toIso } from "../time";
import type { ParsedTaskDraft, Priority, TaskCategory } from "../types";

const WEEKDAYS: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

function matchDuration(text: string): { minutes: number; matched: string } | null {
  const patterns: Array<{ re: RegExp; parse: (m: RegExpMatchArray) => number }> = [
    {
      re: /\b(\d+(?:\.\d+)?)\s*h(?:ou)?rs?\b/i,
      parse: (m) => Math.round(parseFloat(m[1]) * 60),
    },
    {
      re: /\b(\d+)\s*h(?:ou)?r?\s*(?:and\s*)?(\d+)\s*m(?:in(?:ute)?s?)?\b/i,
      parse: (m) => parseInt(m[1], 10) * 60 + parseInt(m[2], 10),
    },
    {
      re: /\b(\d+)\s*m(?:in(?:ute)?s?)?\b/i,
      parse: (m) => parseInt(m[1], 10),
    },
    {
      re: /\b(an|one|a)\s+hour\b/i,
      parse: () => 60,
    },
    {
      re: /\b(two|three|four|five|six)\s+hours?\b/i,
      parse: (m) => {
        const map: Record<string, number> = {
          two: 2,
          three: 3,
          four: 4,
          five: 5,
          six: 6,
        };
        return (map[m[1].toLowerCase()] ?? 1) * 60;
      },
    },
    {
      re: /\b(ninety|90)\s+minutes?\b/i,
      parse: () => 90,
    },
    {
      re: /\b(half\s+an\s+hour|30\s*mins?)\b/i,
      parse: () => 30,
    },
  ];

  for (const { re, parse } of patterns) {
    const m = text.match(re);
    if (m) return { minutes: parse(m), matched: m[0] };
  }
  return null;
}

function parseClock(text: string): { hour: number; minute: number; matched: string } | null {
  const m = text.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const minute = m[2] ? parseInt(m[2], 10) : 0;
  const meridiem = m[3]?.toLowerCase();
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (!meridiem && hour <= 7) {
    // Ambiguous bare hour like "at 10" for morning sports — keep as-is;
    // "tonight" contexts handled separately.
  }
  if (hour > 23 || minute > 59) return null;
  return { hour, minute, matched: m[0] };
}

function nextWeekday(from: DateTime, weekday: number, nextWeek = false): DateTime {
  let candidate = from.startOf("day");
  // luxon: Monday=1 … Sunday=7
  while (candidate.weekday !== weekday) {
    candidate = candidate.plus({ days: 1 });
  }
  if (nextWeek || candidate <= from.startOf("day")) {
    if (candidate <= from.startOf("day") || (nextWeek && candidate.hasSame(from, "day"))) {
      candidate = candidate.plus({ weeks: 1 });
    }
  }
  // "next Tuesday" when today is Tuesday → next week
  if (nextWeek && candidate.hasSame(from, "day")) {
    candidate = candidate.plus({ weeks: 1 });
  }
  return candidate;
}

function resolveRelativeDate(
  text: string,
  now: DateTime
): {
  date: DateTime;
  kind: "deadline" | "preferred" | "window";
  preference?: "morning" | "afternoon" | "evening" | "anytime";
  matched: string[];
} | null {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  let date = now.startOf("day");
  let found = false;
  let kind: "deadline" | "preferred" | "window" = "preferred";
  let preference: "morning" | "afternoon" | "evening" | "anytime" | undefined;

  if (/\bby\b|\bdeadline\b|\bdue\b|\bbefore the deadline\b/i.test(text)) {
    kind = "deadline";
  }

  if (/\btomorrow\b/i.test(lower)) {
    date = now.plus({ days: 1 }).startOf("day");
    matched.push("tomorrow");
    found = true;
  } else if (/\btoday\b/i.test(lower)) {
    date = now.startOf("day");
    matched.push("today");
    found = true;
  } else if (/\btonight\b/i.test(lower)) {
    date = now.startOf("day");
    preference = "evening";
    matched.push("tonight");
    found = true;
    kind = kind === "deadline" ? "deadline" : "window";
  } else if (/\bin\s+(\d+)\s+days?\b/i.test(lower)) {
    const m = lower.match(/\bin\s+(\d+)\s+days?\b/i)!;
    date = now.plus({ days: parseInt(m[1], 10) }).startOf("day");
    matched.push(m[0]);
    found = true;
  } else if (/\bin\s+two\s+weeks?\b/i.test(lower)) {
    date = now.plus({ weeks: 2 }).startOf("day");
    matched.push("in two weeks");
    found = true;
  } else if (/\bin\s+(\d+)\s+weeks?\b/i.test(lower)) {
    const m = lower.match(/\bin\s+(\d+)\s+weeks?\b/i)!;
    date = now.plus({ weeks: parseInt(m[1], 10) }).startOf("day");
    matched.push(m[0]);
    found = true;
  } else {
    const nextDay = lower.match(
      /\b(?:next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
    );
    if (nextDay) {
      const weekday = WEEKDAYS[nextDay[1].toLowerCase()];
      const forceNext = /\bnext\b/i.test(nextDay[0]);
      date = nextWeekday(now, weekday, forceNext);
      matched.push(nextDay[0]);
      found = true;
    } else if (/\bthis\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(lower)) {
      const m = lower.match(
        /\bthis\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
      )!;
      date = nextWeekday(now, WEEKDAYS[m[1].toLowerCase()], false);
      matched.push(m[0]);
      found = true;
    } else if (/\bfriday\b/i.test(lower)) {
      date = nextWeekday(now, 5, false);
      matched.push("friday");
      found = true;
    }
  }

  if (/\bthis\s+evening\b|\bevening\b/i.test(lower)) {
    preference = "evening";
    matched.push("evening");
    if (!found) {
      date = now.startOf("day");
      found = true;
    }
    kind = kind === "deadline" ? "deadline" : "window";
  } else if (/\bafternoon\b/i.test(lower)) {
    preference = "afternoon";
    matched.push("afternoon");
    kind = kind === "deadline" ? "deadline" : "window";
  } else if (/\bmorning\b/i.test(lower)) {
    preference = "morning";
    matched.push("morning");
    kind = kind === "deadline" ? "deadline" : "window";
  }

  if (!found) return null;
  return { date, kind, preference, matched };
}

function detectRecurrence(text: string): string | undefined {
  const every = text.match(
    /\bevery\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
  );
  if (every) {
    const map: Record<string, string> = {
      monday: "MO",
      tuesday: "TU",
      wednesday: "WE",
      thursday: "TH",
      friday: "FR",
      saturday: "SA",
      sunday: "SU",
    };
    return `FREQ=WEEKLY;BYDAY=${map[every[1].toLowerCase()]}`;
  }
  if (/\bevery\s+day\b|\bdaily\b/i.test(text)) return "FREQ=DAILY";
  if (/\bevery\s+week\b|\bweekly\b/i.test(text)) return "FREQ=WEEKLY";
  return undefined;
}

function detectCategory(text: string): TaskCategory {
  const lower = text.toLowerCase();
  if (/\bboxing|gym|run|sport|football|tennis|swim|workout|exercise\b/.test(lower)) {
    return "sport";
  }
  if (/\binternship|interview|career|cv|resume|job\b/.test(lower)) return "career";
  if (/\bcoursework|assignment|case study|essay|report\b/.test(lower)) return "coursework";
  if (/\brevise|revision|lecture|study|notes|exam|reading\b/.test(lower)) return "study";
  if (/\bpersonal|errand|shop|call\b/.test(lower)) return "personal";
  return "other";
}

function detectPriority(text: string): Priority {
  const lower = text.toLowerCase();
  if (/\burgent|asap|critical\b/.test(lower)) return "urgent";
  if (/\bhigh priority|important\b/.test(lower)) return "high";
  if (/\blow priority\b/.test(lower)) return "low";
  return "medium";
}

function buildTitle(text: string, stripParts: string[]): string {
  let title = text.trim();
  for (const part of stripParts) {
    title = title.replace(new RegExp(escapeRegExp(part), "ig"), " ");
  }
  title = title
    .replace(/\b(for|by|at|before|after|every|this|next|in)\b/gi, " ")
    .replace(/[,.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!title) title = text.trim().slice(0, 80);
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function preferenceWindow(
  date: DateTime,
  preference?: "morning" | "afternoon" | "evening" | "anytime"
): { startAt: string; endAt: string; preference: typeof preference } | undefined {
  if (!preference || preference === "anytime") return undefined;
  const ranges = {
    morning: [9, 12],
    afternoon: [12, 17],
    evening: [18, 22],
  } as const;
  const [h1, h2] = ranges[preference];
  return {
    startAt: toIso(date.set({ hour: h1, minute: 0, second: 0, millisecond: 0 })),
    endAt: toIso(date.set({ hour: h2, minute: 0, second: 0, millisecond: 0 })),
    preference,
  };
}

/**
 * Deterministic natural-language task parser.
 * Never invents deadline/duration/recurrence when not specified.
 */
export function parseTaskDeterministic(
  input: string,
  now: DateTime = nowLondon()
): ParsedTaskDraft {
  const text = input.trim();
  const notes: string[] = [];
  const stripParts: string[] = [];

  if (!text) {
    return {
      title: "",
      description: "",
      originalInput: input,
      priority: "medium",
      category: "other",
      parser: "deterministic",
      confidenceNotes: ["Empty input"],
      clarificationQuestion: "What task would you like to add?",
    };
  }

  const duration = matchDuration(text);
  if (duration) {
    stripParts.push(duration.matched);
    notes.push(`Duration: ${duration.minutes} minutes`);
  }

  const recurrenceRule = detectRecurrence(text);
  if (recurrenceRule) {
    const m = text.match(/\bevery\s+\w+/i);
    if (m) stripParts.push(m[0]);
    notes.push(`Recurrence: ${recurrenceRule}`);
  }

  const relative = resolveRelativeDate(text, now);
  let dueAt: string | undefined;
  let preferredStartAt: string | undefined;
  let schedulingWindow: ParsedTaskDraft["schedulingWindow"];

  const clock = parseClock(text);
  if (clock) stripParts.push(clock.matched);

  if (relative) {
    stripParts.push(...relative.matched);
    const base = relative.date.setZone(APP_TZ);

    if (relative.kind === "deadline") {
      // Deadline: end of that day unless a time is given
      if (clock) {
        dueAt = toIso(
          base.set({
            hour: clock.hour,
            minute: clock.minute,
            second: 0,
            millisecond: 0,
          })
        );
      } else {
        dueAt = toIso(base.endOf("day").set({ second: 0, millisecond: 0 }));
      }
      notes.push(`Deadline: ${dueAt}`);
    } else if (clock && recurrenceRule) {
      preferredStartAt = toIso(
        base.set({
          hour: clock.hour,
          minute: clock.minute,
          second: 0,
          millisecond: 0,
        })
      );
      notes.push(`Preferred start: ${preferredStartAt}`);
    } else if (clock) {
      preferredStartAt = toIso(
        base.set({
          hour: clock.hour,
          minute: clock.minute,
          second: 0,
          millisecond: 0,
        })
      );
      notes.push(`Preferred start: ${preferredStartAt}`);
    } else if (relative.preference) {
      schedulingWindow = preferenceWindow(base, relative.preference);
      notes.push(`Scheduling window: ${relative.preference}`);
    } else if (relative.kind === "preferred" || relative.kind === "window") {
      // Date mentioned without "by" — treat as preferred day window
      schedulingWindow = {
        startAt: toIso(base.startOf("day")),
        endAt: toIso(base.endOf("day")),
        preference: "anytime",
      };
      notes.push("Preferred day inferred (not treated as a hard deadline)");
    }
  } else if (clock && recurrenceRule) {
    // every Sunday at 10am — next occurrence
    const byday = recurrenceRule.match(/BYDAY=([A-Z]{2})/);
    const dayMap: Record<string, number> = {
      MO: 1,
      TU: 2,
      WE: 3,
      TH: 4,
      FR: 5,
      SA: 6,
      SU: 7,
    };
    if (byday) {
      const d = nextWeekday(now, dayMap[byday[1]], false);
      preferredStartAt = toIso(
        d.set({ hour: clock.hour, minute: clock.minute, second: 0, millisecond: 0 })
      );
    }
  }

  // "before the deadline" without a date — ask
  let clarificationQuestion: string | undefined;
  if (/\bbefore the deadline\b/i.test(text) && !dueAt) {
    clarificationQuestion = "Which deadline should this be scheduled before?";
  }

  if (duration && !dueAt && !preferredStartAt && !schedulingWindow && !recurrenceRule) {
    notes.push("Duration found but no date/time — task will stay unscheduled until you pick a slot.");
  }

  const category = detectCategory(text);
  const priority = detectPriority(text);
  const title = buildTitle(text, stripParts);

  if (!duration && !dueAt && !preferredStartAt && !recurrenceRule) {
    notes.push("No duration, deadline or recurrence detected — fields left empty intentionally.");
  }

  notes.push("Parsed with the built-in deterministic parser (no LLM configured or used).");

  return {
    title,
    description: text,
    originalInput: text,
    dueAt,
    estimatedDurationMinutes: duration?.minutes,
    preferredStartAt,
    schedulingWindow,
    priority,
    category,
    recurrenceRule,
    clarificationQuestion,
    parser: "deterministic",
    confidenceNotes: notes,
  };
}
