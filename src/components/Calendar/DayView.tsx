"use client";

import { DateTime } from "luxon";
import {
  buildCalendarItems,
  hoursLabel,
  itemsForDay,
  nowTopPercent,
  positionInDay,
  TOTAL_MINUTES,
  type CalendarItem,
  type DraftTimeRange,
} from "@/components/Calendar/calendarUtils";
import { useSlotDrag } from "@/components/Calendar/useSlotDrag";
import { formatTime } from "@/lib/time";
import type { AcademicEvent, Module, Task, WorkSession } from "@/lib/types";

interface Props {
  anchor: DateTime;
  events: AcademicEvent[];
  modules: Module[];
  tasks: Task[];
  sessions: WorkSession[];
  onItemClick: (item: CalendarItem) => void;
  onCreateRange: (range: DraftTimeRange) => void;
}

export function DayView({
  anchor,
  events,
  modules,
  tasks,
  sessions,
  onItemClick,
  onCreateRange,
}: Props) {
  const day = anchor.startOf("day");
  const items = itemsForDay(
    buildCalendarItems({ events, modules, tasks, sessions }),
    day
  );
  const hours = hoursLabel();
  const nowPct = nowTopPercent(day);
  const slot = useSlotDrag(day, onCreateRange);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow)]">
        <div className="border-b border-line bg-paper/50 px-4 py-3">
          <div className="font-display text-xl text-ink">
            {day.toFormat("cccc, d LLLL yyyy")}
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Click or drag on empty time to add a personal block
          </p>
        </div>
        <div className="grid grid-cols-[64px_1fr]">
          <div
            className="relative border-r border-line"
            style={{ height: TOTAL_MINUTES }}
          >
            {hours.map((h) => (
              <div
                key={h}
                className="absolute right-2 -translate-y-1/2 text-xs text-ink-muted"
                style={{
                  top:
                    ((h - hours[0]) / (hours[hours.length - 1] - hours[0])) *
                      100 +
                    "%",
                }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          <div
            ref={slot.columnRef}
            className="relative cursor-crosshair select-none"
            style={{ height: TOTAL_MINUTES }}
            onPointerDown={slot.onPointerDown}
            onPointerMove={slot.onPointerMove}
            onPointerUp={slot.onPointerUp}
            onPointerCancel={slot.onPointerCancel}
          >
            {hours.slice(0, -1).map((h, idx) => (
              <div
                key={h}
                className="pointer-events-none absolute inset-x-0 border-t border-line/70"
                style={{ top: (idx / (hours.length - 1)) * 100 + "%" }}
              />
            ))}
            {nowPct !== null && (
              <div
                className="now-line pointer-events-none absolute inset-x-0 z-20 border-t-2 border-coral"
                style={{ top: `${nowPct}%` }}
              />
            )}
            {slot.previewStyle && (
              <div
                className="pointer-events-none absolute inset-x-3 z-[5] rounded-lg border border-sage bg-sage/35"
                style={slot.previewStyle}
              />
            )}
            {items
              .filter((i) => !i.allDay)
              .map((item) => {
                const pos = positionInDay(item.startAt, item.endAt, day);
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-calendar-item
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemClick(item);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute inset-x-3 z-10 cursor-pointer overflow-hidden rounded-lg px-3 py-2 text-left text-sm text-white shadow-sm"
                    style={{
                      top: `${pos.topPct}%`,
                      height: `${pos.heightPct}%`,
                      background: item.color,
                      minHeight: 28,
                    }}
                  >
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-xs opacity-90">
                      {formatTime(item.startAt)}–{formatTime(item.endAt)}
                      {item.subtitle ? ` · ${item.subtitle}` : ""}
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      <aside className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)]">
        <h3 className="font-display text-lg text-ink">All-day / notes</h3>
        <ul className="mt-3 space-y-2">
          {items.filter((i) => i.allDay).length === 0 && (
            <li className="text-sm text-ink-muted">No all-day items</li>
          )}
          {items
            .filter((i) => i.allDay)
            .map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onItemClick(item)}
                  className="w-full rounded-lg border border-line px-3 py-2 text-left text-sm hover:bg-paper"
                >
                  {item.title}
                </button>
              </li>
            ))}
        </ul>
      </aside>
    </div>
  );
}
