# Smart Scheduler (Schedule+)

Personal academic timetable and natural-language task planner. Built for Imperial College London-style workflows (Outlook ICS, modules, coursework), usable on any campus that can export a calendar feed.

Repo: [github.com/JadMzk/Schedule-](https://github.com/JadMzk/Schedule-)

It combines:

- a **private Outlook / ICS calendar feed** (no Microsoft Graph or Entra setup)
- **module filtering** so only the courses you care about appear
- **natural-language task capture** with confirm-before-save
- a **light scheduler** that suggests conflict-free blocks around lectures
- **in-place personal blocks** on the calendar, coloured by the same categories as tasks

Persistence is **local JSON** (project `data/` in development, Application Support in the macOS app). Single-user. Calendar secrets never go to the LLM.

## Features

- Day / week / month calendar in Europe/London
- ICS ingest (VEVENT, time zones, RRULE, EXDATE)
- Module extraction from Imperial/Outlook-style titles, with manual reassignment
- Quick-add, e.g. `Revise statistics for 2 hours tomorrow afternoon`
- Work sessions: create, edit, delete, optional task link and category
- Greedy free-slot suggestions with accept / reject
- Optional LLM parser (`LLM_API_KEY`) with a deterministic fallback
- macOS Electron app with local server lifecycle

## Requirements

- Node.js 20+
- macOS for the desktop package (`npm run build:desktop`)
- An ICS URL from Outlook (or another calendar) for academic events

## Quick start (browser)

```bash
git clone https://github.com/JadMzk/Schedule-.git
cd Schedule-
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
```

Copy `.env.example` to `.env.local` only if you want an ICS fallback or an LLM key. The app itself stores the calendar link under **Settings**.

## Desktop app (macOS)

Packaged with Electron: double-click opens a window; the local Next.js server starts with the app and stops when you quit.

```bash
npm install
npm run build:desktop
```

Output:

```text
dist-desktop/mac-arm64/Smart Scheduler.app   # Apple Silicon
dist-desktop/mac/Smart Scheduler.app         # Intel
```

The first time macOS Gatekeeper warns, **right-click → Open**. The build is unsigned.

Optional:

```bash
npm run install:macos    # copy into /Applications
npm run sync:desktop     # point ~/Desktop/Smart Scheduler.app at the latest build (symlink)
```

`npm run build:desktop` already runs `sync:desktop` at the end. Quit the app before replacing the `.app`.

Local data (desktop):

```text
~/Library/Application Support/smart-scheduler/data/
~/Library/Application Support/smart-scheduler/logs/smart-scheduler.log
```

Logs do not contain the full ICS URL.

## Using the app

1. **Settings** — paste the private ICS URL → Save → Test connection → Refresh calendar
2. **Modules** — tick the courses that should appear (unselected events are kept, not deleted)
3. **Quick-add** — type a task in plain English, confirm fields, save
4. **Calendar** — click or drag empty time to add a personal block; click a coloured block to edit
5. **Tasks** — inbox, overdue, upcoming, filters, schedule suggestions

| Settings action | Purpose |
|---|---|
| Save | Store the ICS URL locally (credential; never shown back in full) |
| Test connection | Fetch once, report host + event count |
| Refresh calendar | Import / update academic events |
| Remove saved link | Delete the stored URL |

Optional env (dev only): `CALENDAR_ICS_URL`, `LLM_API_KEY`, `LLM_API_BASE_URL`, `LLM_MODEL`.

## Project layout

```text
desktop/              Electron main process + packaging
src/app/              Next.js App Router pages and API routes
src/components/       Calendar, tasks, scheduling UI
src/lib/ics/          ICS fetch, parse, sync
src/lib/modules/      Module extraction
src/lib/tasks/        NL parsing (deterministic + optional LLM)
src/lib/scheduling/   Free time + suggestions
src/lib/categories.ts Shared TaskCategory colours
docs/                 Competitive / market HTML briefings
tests/                Vitest unit tests
```

## Troubleshooting

| Symptom | What to try |
|---|---|
| Stale Desktop icon | `npm run build:desktop` or `npm run sync:desktop` after quitting the app |
| Gatekeeper blocks open | Right-click → Open |
| Blank window | Check `~/Library/Application Support/smart-scheduler/logs/smart-scheduler.log` |
| Calendar sync fails | Settings → Test connection; confirm the ICS link still works |
| Port already in use | Quit Smart Scheduler fully (Activity Monitor if needed) |

## Limitations

- Unsigned desktop build (one-time Gatekeeper Open)
- ICS title formats vary; module names may need a manual fix
- NL parsing is limited without an LLM key
- Calendar refresh needs network; the rest of the UI works offline once loaded
- Not a multi-user cloud product

## Research notes

`docs/accio-synthesis-en.html` and `docs/accio-synthesis-fr.html` summarise competitive and market sizing notes (English and French). Source markdown sits at the repo root.
