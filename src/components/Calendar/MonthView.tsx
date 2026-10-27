"use client";

import { DateTime } from "luxon";
import {
  buildCalendarItems,
  itemsForDay,
  type CalendarItem,
} from "@/components/Calendar/calendarUtils";
import type { AcademicEvent, Module, Task, WorkSession } from "@/lib/types";

interface Props {
  anchor: DateTime;
  events: AcademicEvent[];
  modules: Module[];
  tasks: Task[];
  sessions: WorkSession[];
  onItemClick: (item: CalendarItem) => void;
  onSelectDay: (day: DateTime) => void;
}

export function MonthView({
  anchor,
  events,
  modules,
  tasks,
  sessions,
  onItemClick,
  onSelectDay,
}: Props) {
  const monthStart = anchor.startOf("month");
  const gridStart = monthStart.startOf("week");
  const days = Array.from({ length: 42 }, (_, i) => gridStart.plus({ days: i }));
  const items = buildCalendarItems({ events, modules, tasks, sessions });
  const today = DateTime.now().setZone(anchor.zoneName ?? "Europe/London");

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow)]">
      <div className="grid grid-cols-7 border-b border-line bg-paper/50">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div
            key={d}
            className="border-r border-line px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-muted last:border-r-0"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayItems = itemsForDay(items, day);
          const inMonth = day.hasSame(monthStart, "month");
          return (
            <div
              key={day.toISODate()}
              className={`min-h-[110px] border-b border-r border-line p-2 last:border-r-0 ${
                inMonth ? "bg-surface" : "bg-paper/40"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectDay(day)}
                className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                  day.hasSame(today, "day")
                    ? "bg-teal text-white"
                    : inMonth
                      ? "text-ink hover:bg-paper"
                      : "text-ink-muted"
                }`}
              >
                {day.day}
              </button>
              <div className="space-y-1">
                {dayItems.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onItemClick(item)}
                    className="block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] text-white"
                    style={{ background: item.color }}
                  >
                    {item.title}
                  </button>
                ))}
                {dayItems.length > 3 && (
                  <div className="text-[11px] text-ink-muted">
                    +{dayItems.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
