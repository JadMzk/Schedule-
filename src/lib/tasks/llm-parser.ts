import { DateTime } from "luxon";
import { APP_TZ, nowLondon, toIso } from "../time";
import type { ParsedTaskDraft } from "../types";
import { parsedTaskDraftSchema } from "./schema";
import { parseTaskDeterministic } from "./parser";

const SYSTEM_PROMPT = `You convert natural-language personal task requests into structured JSON.
Rules:
- Timezone is Europe/London. "now" is provided.
- Never invent a deadline, duration, or recurrence the user did not specify.
- Distinguish deadlines ("by Friday") from preferred work sessions ("tomorrow afternoon").
- If a critical detail is ambiguous, set clarificationQuestion to one short question.
- priority: low|medium|high|urgent
- category: study|coursework|career|sport|personal|other
- recurrenceRule: iCalendar RRULE fragment when specified (e.g. FREQ=WEEKLY;BYDAY=SU), else omit
- Dates must be ISO-8601 with offset for Europe/London
Return ONLY JSON matching the schema.`;

export function isLlmConfigured(): boolean {
  return Boolean(process.env.LLM_API_KEY?.trim() && process.env.LLM_API_BASE_URL?.trim());
}

export async function parseTaskWithLlm(
  input: string,
  now: DateTime = nowLondon()
): Promise<ParsedTaskDraft> {
  const apiKey = process.env.LLM_API_KEY?.trim();
  const baseUrl = process.env.LLM_API_BASE_URL?.trim()?.replace(/\/$/, "");
  const model = process.env.LLM_MODEL?.trim() || "gpt-4o-mini";

  if (!apiKey || !baseUrl) {
    return parseTaskDeterministic(input, now);
  }

  const fallback = parseTaskDeterministic(input, now);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              now: toIso(now),
              timezone: APP_TZ,
              input,
              schemaHint: {
                title: "string",
                description: "string",
                dueAt: "ISO optional",
                estimatedDurationMinutes: "number optional",
                preferredStartAt: "ISO optional",
                schedulingWindow: {
                  startAt: "ISO optional",
                  endAt: "ISO optional",
                  preference: "morning|afternoon|evening|anytime",
                },
                priority: "low|medium|high|urgent",
                category: "study|coursework|career|sport|personal|other",
                recurrenceRule: "string optional",
                clarificationQuestion: "string optional",
                confidenceNotes: ["string"],
              },
            }),
          },
        ],
      }),
    });

    if (!res.ok) {
      fallback.confidenceNotes.push(
        `LLM request failed (HTTP ${res.status}); using deterministic parser.`
      );
      return fallback;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      fallback.confidenceNotes.push("LLM returned empty content; using deterministic parser.");
      return fallback;
    }

    const raw = JSON.parse(content) as Record<string, unknown>;
    const candidate = {
      ...raw,
      originalInput: input,
      description: typeof raw.description === "string" ? raw.description : input,
      parser: "llm" as const,
      confidenceNotes: Array.isArray(raw.confidenceNotes)
        ? [...(raw.confidenceNotes as string[]), "Parsed with configured LLM API."]
        : ["Parsed with configured LLM API."],
    };

    const validated = parsedTaskDraftSchema.safeParse(candidate);
    if (!validated.success) {
      fallback.confidenceNotes.push(
        `LLM output failed schema validation; using deterministic parser. (${validated.error.issues[0]?.message})`
      );
      return fallback;
    }
    return validated.data;
  } catch (err) {
    fallback.confidenceNotes.push(
      `LLM error: ${err instanceof Error ? err.message : "unknown"}; using deterministic parser.`
    );
    return fallback;
  }
}

export async function parseTask(input: string): Promise<ParsedTaskDraft> {
  if (isLlmConfigured()) {
    return parseTaskWithLlm(input);
  }
  const draft = parseTaskDeterministic(input);
  draft.confidenceNotes.push(
    "No LLM_API_KEY / LLM_API_BASE_URL configured — deterministic parser only."
  );
  return draft;
}
