import { z } from "zod";

export const prioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export const categorySchema = z.enum([
  "study",
  "coursework",
  "career",
  "sport",
  "personal",
  "other",
]);
export const taskStatusSchema = z.enum([
  "todo",
  "scheduled",
  "in_progress",
  "completed",
]);

const isoString = z.string().min(1);

export const schedulingWindowSchema = z.object({
  startAt: isoString.optional(),
  endAt: isoString.optional(),
  preference: z.enum(["morning", "afternoon", "evening", "anytime"]).optional(),
});

export const parsedTaskDraftSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  originalInput: z.string(),
  dueAt: isoString.optional(),
  estimatedDurationMinutes: z.number().int().positive().optional(),
  preferredStartAt: isoString.optional(),
  schedulingWindow: schedulingWindowSchema.optional(),
  priority: prioritySchema,
  category: categorySchema,
  recurrenceRule: z.string().optional(),
  clarificationQuestion: z.string().optional(),
  parser: z.enum(["deterministic", "llm"]),
  confidenceNotes: z.array(z.string()),
});

export const createTaskSchema = z.object({
  title: z.string().min(1),
  originalInput: z.string().default(""),
  description: z.string().default(""),
  dueAt: z.string().optional().nullable(),
  estimatedDurationMinutes: z.number().int().positive().optional().nullable(),
  preferredStartAt: z.string().optional().nullable(),
  schedulingWindow: schedulingWindowSchema.optional().nullable(),
  priority: prioritySchema.default("medium"),
  category: categorySchema.default("other"),
  status: taskStatusSchema.default("todo"),
  recurrenceRule: z.string().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().min(1),
});
