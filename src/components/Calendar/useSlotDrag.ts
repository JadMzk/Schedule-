"use client";

import { DateTime } from "luxon";
import {
  useCallback,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  normalizeRange,
  pointerYToDateTime,
  positionInDay,
  type DraftTimeRange,
} from "@/components/Calendar/calendarUtils";

/**
 * Click / drag on an empty day column to select a time range.
 * Ignores interactions that start on a child with data-calendar-item.
 */
export function useSlotDrag(
  day: DateTime,
  onRangeCommit: (range: DraftTimeRange) => void
) {
  const columnRef = useRef<HTMLDivElement>(null);
  const dragOrigin = useRef<DateTime | null>(null);
  const [preview, setPreview] = useState<DraftTimeRange | null>(null);
  const dragging = useRef(false);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-calendar-item]")) return;

      const el = columnRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const start = pointerYToDateTime(day, event.clientY, rect.top, rect.height);
      dragOrigin.current = start;
      dragging.current = true;
      setPreview(normalizeRange(start, start.plus({ minutes: 15 })));
      el.setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    [day]
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragging.current || !dragOrigin.current) return;
      const el = columnRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const current = pointerYToDateTime(
        day,
        event.clientY,
        rect.top,
        rect.height
      );
      setPreview(normalizeRange(dragOrigin.current, current));
    },
    [day]
  );

  const finish = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragging.current || !dragOrigin.current) return;
      const el = columnRef.current;
      dragging.current = false;
      if (el?.hasPointerCapture(event.pointerId)) {
        el.releasePointerCapture(event.pointerId);
      }
      const rect = el?.getBoundingClientRect();
      const current = rect
        ? pointerYToDateTime(day, event.clientY, rect.top, rect.height)
        : dragOrigin.current;
      const range = normalizeRange(dragOrigin.current, current);
      dragOrigin.current = null;
      setPreview(null);
      onRangeCommit(range);
    },
    [day, onRangeCommit]
  );

  const previewStyle = preview
    ? (() => {
        const pos = positionInDay(preview.startAt, preview.endAt, day);
        return {
          top: `${pos.topPct}%`,
          height: `${pos.heightPct}%`,
        };
      })()
    : null;

  return {
    columnRef,
    preview,
    previewStyle,
    onPointerDown,
    onPointerMove,
    onPointerUp: finish,
    onPointerCancel: finish,
  };
}
