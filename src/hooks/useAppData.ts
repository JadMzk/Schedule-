"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AcademicEvent,
  AppStore,
  ParsedTaskDraft,
  ScheduleSuggestion,
  Task,
  WorkSession,
} from "@/lib/types";

export interface AppMeta {
  calendarConfigured: boolean;
  calendarSource?: "app" | "env" | "none";
  calendarHost?: string | null;
  llmConfigured: boolean;
  timezone: string;
}

export type AppData = AppStore & { meta: AppMeta };

export function useAppData() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load app data");
      const json = (await res.json()) as AppData;
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const syncCalendar = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/calendar/sync", { method: "POST" });
      const json = (await res.json()) as { ok: boolean; error?: string };
      await refresh();
      return json;
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  const saveIcsUrl = useCallback(
    async (url: string) => {
      const res = await fetch("/api/calendar/ics-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = (await res.json()) as { error?: string; host?: string | null };
      if (!res.ok) throw new Error(json.error ?? "Could not save calendar link");
      await refresh();
      return json;
    },
    [refresh]
  );

  const clearIcsUrl = useCallback(async () => {
    const res = await fetch("/api/calendar/ics-url", { method: "DELETE" });
    if (!res.ok) throw new Error("Could not clear calendar link");
    await refresh();
  }, [refresh]);

  const testIcsConnection = useCallback(async (url?: string) => {
    const res = await fetch("/api/calendar/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(url?.trim() ? { url } : {}),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      host?: string | null;
      eventCount?: number;
      message?: string;
      error?: string;
    };
    if (!res.ok || !json.ok) {
      throw new Error(json.error ?? "Connection test failed");
    }
    return json;
  }, []);

  const parseTask = useCallback(async (text: string) => {
    const res = await fetch("/api/tasks/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const json = (await res.json()) as { draft?: ParsedTaskDraft; error?: string };
    if (!res.ok) throw new Error(json.error ?? "Parse failed");
    return json.draft!;
  }, []);

  const createTask = useCallback(
    async (draft: Partial<Task> & { title: string }) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const json = (await res.json()) as { task?: Task; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Could not create task");
      await refresh();
      return json.task!;
    },
    [refresh]
  );

  const updateTask = useCallback(
    async (id: string, patch: Partial<Task>) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Could not update task");
      await refresh();
    },
    [refresh]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete task");
      await refresh();
    },
    [refresh]
  );

  const setModules = useCallback(
    async (action: "select_all" | "clear_all" | "set", selectedIds?: string[]) => {
      const res = await fetch("/api/modules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, selectedIds }),
      });
      if (!res.ok) throw new Error("Could not update modules");
      await refresh();
    },
    [refresh]
  );

  const patchModule = useCallback(
    async (
      id: string,
      patch: {
        isSelected?: boolean;
        name?: string;
        code?: string | null;
      }
    ) => {
      const res = await fetch(`/api/modules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Could not update module");
      await refresh();
    },
    [refresh]
  );

  const confirmSession = useCallback(
    async (taskId: string, startAt: string, endAt: string) => {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, startAt, endAt, status: "confirmed" }),
      });
      const json = (await res.json()) as { error?: string; conflict?: boolean };
      if (!res.ok) throw new Error(json.error ?? "Could not confirm session");
      await refresh();
    },
    [refresh]
  );

  const createSession = useCallback(
    async (input: {
      title?: string;
      taskId?: string;
      category?: WorkSession["category"];
      startAt: string;
      endAt: string;
      allowConflict?: boolean;
    }) => {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, status: "confirmed" }),
      });
      const json = (await res.json()) as { error?: string; conflict?: boolean };
      if (!res.ok) throw new Error(json.error ?? "Could not create block");
      await refresh();
      return json;
    },
    [refresh]
  );

  const updateSession = useCallback(
    async (
      id: string,
      patch: {
        startAt?: string;
        endAt?: string;
        status?: WorkSession["status"];
        title?: string | null;
        taskId?: string | null;
        category?: WorkSession["category"] | null;
        allowConflict?: boolean;
      }
    ) => {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = (await res.json()) as { error?: string; conflict?: boolean };
      if (!res.ok) throw new Error(json.error ?? "Could not update session");
      await refresh();
      return json;
    },
    [refresh]
  );

  const deleteSession = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete session");
      await refresh();
    },
    [refresh]
  );

  const fetchSuggestions = useCallback(async (taskId?: string) => {
    const qs = taskId ? `?taskId=${encodeURIComponent(taskId)}` : "";
    const res = await fetch(`/api/schedule/suggest${qs}`);
    const json = (await res.json()) as {
      suggestions: ScheduleSuggestion[];
      message?: string;
    };
    if (!res.ok) throw new Error("Could not fetch suggestions");
    return json;
  }, []);

  const reassignEvent = useCallback(
    async (eventId: string, moduleId: string, applyToSourceUid = true) => {
      const res = await fetch("/api/events/reassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, moduleId, applyToSourceUid }),
      });
      if (!res.ok) throw new Error("Could not reassign event");
      await refresh();
    },
    [refresh]
  );

  const visibleEvents = (data?.academicEvents ?? []).filter((ev: AcademicEvent) => {
    const mod = data?.modules.find((m) => m.id === ev.moduleId);
    return mod?.isSelected !== false;
  });

  return {
    data,
    loading,
    error,
    syncing,
    refresh,
    syncCalendar,
    saveIcsUrl,
    clearIcsUrl,
    testIcsConnection,
    parseTask,
    createTask,
    updateTask,
    deleteTask,
    setModules,
    patchModule,
    confirmSession,
    createSession,
    updateSession,
    deleteSession,
    fetchSuggestions,
    reassignEvent,
    visibleEvents,
  };
}
