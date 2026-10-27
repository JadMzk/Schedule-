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
import { formatDayHeading } from "@/lib/time";
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

function DayColumn({
  day,
  dayItems,
  onItemClick,
  onCreateRange,
}: {
  day: DateTime;
  dayItems: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
  onCreateRange: (range: DraftTimeRange) => void;
}) {
  const hours = hoursLabel();
  const nowPct = nowTopPercent(day);
  const slot = useSlotDrag(day, onCreateRange);

  return (
    <div
      ref={slot.columnRef}
      className="relative cursor-crosshair border-r border-line last:border-r-0 select-none"
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
        >
          <span className="absolute -left-0.5 -top-1.5 h-3 w-3 rounded-full bg-coral" />
        </div>
      )}
      {slot.previewStyle && (
        <div
          className="pointer-events-none absolute inset-x-1 z-[5] rounded-md border border-sage bg-sage/35"
          style={slot.previewStyle}
        />
      )}
      {dayItems.map((item) => {
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
            className="absolute inset-x-1 z-10 cursor-pointer overflow-hidden rounded-md px-1.5 py-1 text-left text-[11px] text-white shadow-sm transition hover:brightness-110"
            style={{
              top: `${pos.topPct}%`,
              height: `${pos.heightPct}%`,
              background: item.color,
              minHeight: 22,
            }}
            title={item.title}
          >
            <div className="truncate font-semibold leading-tight">{item.title}</div>
            {item.subtitle && (
              <div className="truncate opacity-90">{item.subtitle}</div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function WeekView({
  anchor,
  events,
  modules,
  tasks,
  sessions,
  onItemClick,
  onCreateRange,
}: Props) {
  const weekStart = anchor.startOf("week");
  const days = Array.from({ length: 7 }, (_, i) => weekStart.plus({ days: i }));
  const items = buildCalendarItems({ events, modules, tasks, sessions });
  const hours = hoursLabel();

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-[var(--shadow)]">
      <div className="min-w-[820px]">
        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-line">
          <div className="border-r border-line bg-paper/60" />
          {days.map((day) => (
            <div
              key={day.toISODate()}
              className={`border-r border-line px-2 py-3 text-center last:border-r-0 ${
                day.hasSame(
                  DateTime.now().setZone(day.zoneName ?? "Europe/London"),
                  "day"
                )
                  ? "bg-teal-soft/60"
                  : "bg-paper/40"
              }`}
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {day.toFormat("ccc")}
              </div>
              <div className="font-display text-lg text-ink">{day.day}</div>
              <div className="text-[11px] text-ink-muted">
                {formatDayHeading(day)}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
          <div
            className="relative border-r border-line"
            style={{ height: TOTAL_MINUTES }}
          >
            {hours.map((h) => (
              <div
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[11px] text-ink-muted"
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

          {days.map((day) => (
            <DayColumn
              key={day.toISODate()}
              day={day}
              dayItems={itemsForDay(items, day).filter((i) => !i.allDay)}
              onItemClick={onItemClick}
              onCreateRange={onCreateRange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
