"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AppProvider, useApp } from "@/components/AppProvider";
import { QuickAdd } from "@/components/QuickAdd";
import { formatRelativeSync } from "@/lib/time";

const SYNC_INTERVAL_MS = 30 * 60 * 1000;

const NAV = [
  { href: "/calendar", label: "Calendar" },
  { href: "/tasks", label: "Tasks" },
  { href: "/modules", label: "Modules" },
  { href: "/settings", label: "Settings" },
];

function ShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data, loading, syncing, syncCalendar } = useApp();

  useEffect(() => {
    if (!data?.meta.calendarConfigured) return;
    if (!data.sync.lastSuccessAt) {
      void syncCalendar();
    }
    const id = window.setInterval(() => {
      void syncCalendar();
    }, SYNC_INTERVAL_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.meta.calendarConfigured]);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col px-4 pb-10 pt-5 sm:px-6">
      <header className="animate-rise mb-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
              Personal
            </p>
            <h1 className="font-display text-3xl text-ink sm:text-4xl">
              Smart Scheduler
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            <span>
              Synced{" "}
              <span className="font-medium text-ink">
                {formatRelativeSync(data?.sync.lastSuccessAt ?? null)}
              </span>
            </span>
            {data?.sync.lastError && (
              <span className="rounded-md bg-coral-soft px-2 py-0.5 text-coral">
                Sync error
              </span>
            )}
            <button
              type="button"
              onClick={() => void syncCalendar()}
              disabled={syncing}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 font-medium text-ink hover:border-teal disabled:opacity-50"
            >
              {syncing ? "Refreshing…" : "Refresh timetable"}
            </button>
          </div>
        </div>

        <nav className="mb-4 flex flex-wrap gap-1 rounded-xl border border-line bg-surface/80 p-1 shadow-[var(--shadow)]">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-teal text-white"
                    : "text-ink-muted hover:bg-paper hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <QuickAdd />
      </header>

      <main className="animate-rise flex-1">
        {loading && !data ? (
          <div className="rounded-2xl border border-line bg-surface p-8 text-ink-muted shadow-[var(--shadow)]">
            Loading your schedule…
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <ShellInner>{children}</ShellInner>
    </AppProvider>
  );
}
