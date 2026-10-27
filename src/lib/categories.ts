import type { TaskCategory } from "./types";

/** Single source of truth for task / calendar-block categories. */
export const TASK_CATEGORIES: TaskCategory[] = [
  "study",
  "coursework",
  "career",
  "sport",
  "personal",
  "other",
];

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  study: "Study",
  coursework: "Coursework",
  career: "Career",
  sport: "Sport",
  personal: "Personal",
  other: "Other",
};

/**
 * CSS colour values for each category (readable white text on these backgrounds).
 * Used by calendar blocks and any UI that needs category colour.
 */
export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  study: "#0f6e6e",
  coursework: "#3d5a80",
  career: "#6b4c9a",
  sport: "#c47a1a",
  personal: "#4a7c59",
  other: "#5a6a7e",
};

export function categoryLabel(category: TaskCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function categoryColor(category: TaskCategory | undefined | null): string {
  if (!category) return CATEGORY_COLORS.other;
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other;
}

export function isTaskCategory(value: string): value is TaskCategory {
  return (TASK_CATEGORIES as string[]).includes(value);
}
