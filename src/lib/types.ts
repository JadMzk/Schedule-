export type Priority = "low" | "medium" | "high" | "urgent";
export type TaskCategory =
  | "study"
  | "coursework"
  | "career"
  | "sport"
  | "personal"
  | "other";
export type TaskStatus = "todo" | "scheduled" | "in_progress" | "completed";
export type WorkSessionStatus = "suggested" | "confirmed" | "completed" | "cancelled";
export type ClassificationSource = "automatic" | "manual";
export type CalendarView = "day" | "week" | "month";

export interface AcademicEvent {
  id: string;
  sourceUid: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  timezone: string;
  location: string;
  moduleId: string;
  eventType: string;
  lastSyncedAt: string;
  isAllDay: boolean;
  recurrenceId?: string;
  status?: string;
}

export interface Module {
  id: string;
  code?: string;
  name: string;
  isSelected: boolean;
  classificationSource: ClassificationSource;
}

export interface SchedulingWindow {
  startAt?: string;
  endAt?: string;
  preference?: "morning" | "afternoon" | "evening" | "anytime";
}

export interface Task {
  id: string;
  title: string;
  originalInput: string;
  description: string;
  dueAt?: string;
  estimatedDurationMinutes?: number;
  preferredStartAt?: string;
  schedulingWindow?: SchedulingWindow;
  priority: Priority;
  category: TaskCategory;
  status: TaskStatus;
  recurrenceRule?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkSession {
  id: string;
  /** Linked task when this block was scheduled for a task; omit for standalone blocks. */
  taskId?: string;
  /** Display title for standalone blocks (or override); falls back to task title when linked. */
  title?: string;
  /** Same TaskCategory enum as tasks — drives calendar block colour. */
  category?: TaskCategory;
  startAt: string;
  endAt: string;
  status: WorkSessionStatus;
}

export interface SyncState {
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  lastError: string | null;
  eventCount: number;
}

export interface AppStore {
  academicEvents: AcademicEvent[];
  modules: Module[];
  tasks: Task[];
  workSessions: WorkSession[];
  sync: SyncState;
  moduleOverrides: Record<string, string>;
}

export interface ParsedTaskDraft {
  title: string;
  description: string;
  originalInput: string;
  dueAt?: string;
  estimatedDurationMinutes?: number;
  preferredStartAt?: string;
  schedulingWindow?: SchedulingWindow;
  priority: Priority;
  category: TaskCategory;
  recurrenceRule?: string;
  clarificationQuestion?: string;
  parser: "deterministic" | "llm";
  confidenceNotes: string[];
}

export interface TimeSlot {
  startAt: string;
  endAt: string;
  durationMinutes: number;
}

export interface ScheduleSuggestion {
  taskId: string;
  slot: TimeSlot;
  reason: string;
  score: number;
}

export const EMPTY_STORE: AppStore = {
  academicEvents: [],
  modules: [],
  tasks: [],
  workSessions: [],
  sync: {
    lastSuccessAt: null,
    lastAttemptAt: null,
    lastError: null,
    eventCount: 0,
  },
  moduleOverrides: {},
};
