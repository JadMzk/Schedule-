"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";

export default function ModulesPage() {
  const { data, setModules, patchModule } = useApp();
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");

  const modules = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.modules.filter((m) => {
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        (m.code?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [data, query]);

  if (!data) return null;

  const selectedCount = data.modules.filter((m) => m.isSelected).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl text-ink">My Modules</h2>
        <p className="text-sm text-ink-muted">
          Choose which academic modules appear on your calendar. Unselected events stay
          in the store and can be shown again later. Personal tasks are never filtered.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)]">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules…"
            className="min-w-[220px] flex-1 rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-teal"
          />
          <button
            type="button"
            onClick={() => void setModules("select_all")}
            className="rounded-lg border border-line px-3 py-2 text-sm font-medium"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => void setModules("clear_all")}
            className="rounded-lg border border-line px-3 py-2 text-sm font-medium"
          >
            Clear all
          </button>
          <span className="text-sm text-ink-muted">
            {selectedCount}/{data.modules.length} selected
          </span>
        </div>

        {data.modules.length === 0 ? (
          <p className="mt-6 text-sm text-ink-muted">
            No modules yet. Sync your Outlook ICS feed from Settings or use Refresh
            timetable — module names are discovered from event titles.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {modules.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-[var(--teal)]"
                    checked={m.isSelected}
                    onChange={(e) =>
                      void patchModule(m.id, { isSelected: e.target.checked })
                    }
                  />
                  <span>
                    <span className="block font-medium text-ink">
                      {m.code ? (
                        <>
                          <span className="text-teal">{m.code}</span> — {m.name}
                        </>
                      ) : (
                        m.name
                      )}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {m.classificationSource}
                      {" · "}
                      {
                        data.academicEvents.filter((e) => e.moduleId === m.id)
                          .length
                      }{" "}
                      events
                    </span>
                  </span>
                </label>
                <button
                  type="button"
                  className="text-sm font-medium text-teal hover:underline"
                  onClick={() => {
                    setEditingId(m.id);
                    setEditName(m.name);
                    setEditCode(m.code ?? "");
                  }}
                >
                  Rename
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(26_35_50/0.45)] p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]">
            <h3 className="font-display text-xl">Correct module</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Manual corrections are preserved across calendar syncs.
            </p>
            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-lg border border-line bg-paper px-3 py-2"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                placeholder="Code (optional)"
              />
              <input
                className="w-full rounded-lg border border-line bg-paper px-3 py-2"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Name"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setEditingId(null)} className="px-3 py-2 text-sm">
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white"
                onClick={() => {
                  void patchModule(editingId, {
                    name: editName.trim() || "Uncategorised",
                    code: editCode.trim() || null,
                  }).then(() => setEditingId(null));
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
