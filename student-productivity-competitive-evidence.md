# Student productivity landscape — primary-source evidence
All URLs accessed 20 Oct 2026. Prices in USD unless stated; confirmed only where the vendor page states them. "Unknown" = not published on the fetched source.

## 1. MyStudyLife (mystudylife.com)
- **Target user:** school + university students; parents (Family Connect); schools/institutions.
- **Features:** class timetable incl. rotating / A-B week / block schedules; homework & tasks with 7 task types, partial completion, subtasks, recurring; exams + revision tasks; grades/GPA; Pomodoro/focus timer; widgets; offline mode; timetable photo/PDF scan.
- **AI:** "Scout" AI study coach — chat that adds classes, plans a week, answers "what's due", builds revision plans ("Scout turns one sentence into a fully planned week").
- **Pricing:** core planner "free forever"; MSL+ premium page states **£14.99/year** (page also carries a 2024-era `FRESHERS2024` code → current list price unverified).
- **Platforms:** Web, iOS, Android.
- **Calendar integrations:** import school calendar via iCal feed; mirror to Google & Apple calendars; homepage lists Google Calendar, Apple Calendar, Outlook, iCal, Blackboard, Canvas.
- **Student-specific:** very high (term dates, holidays, exam conflict warnings, rotating weeks, grade tracking).
- **AI type:** conversational LLM planning. No capacity model, duration estimation, or constraint solving claimed → **not constraint-based**.
- URL: https://mystudylife.com/ ; https://mystudylife.com/tour/ ; https://mystudylife.com/special-offers/

## 2. iStudiez Pro ("Legendary Planner")
- **Target user:** high-school / university students.
- **Features:** classic, alternating (A/B), rotating and block schedules; instructors + office hours; holidays and cancelled classes; homework by date/course/priority; weighted grades + GPA; Apple Watch app.
- **AI:** none claimed.
- **Pricing:** app free; **cloud sync requires a weekly/monthly/yearly subscription**; price not published in the listing (shown only in storefront) → **unknown**.
- **Platforms:** iPhone, iPad, Apple Watch (current App Store listing).
- **Calendar integrations:** can display third-party calendar events and export its schedule to calendars (no named providers).
- **Student-specific:** high (academic schedule types, GPA).
- **Signal:** App Store reviews repeatedly report no meaningful updates / no recurring assignments (user sentiment, 4.2 from 425 ratings; low update cadence).
- URL: https://apps.apple.com/us/app/istudiez-pro-legendary-planner/id310636441

## 3. Todoist
- **Target user:** general individuals and teams (no student positioning).
- **Features:** projects, sub-tasks, priorities, labels, filters, custom reminders, task duration, deadlines, calendar layout (Pro), board layout, Ramble voice capture, Task/Filter/Email Assist.
- **Pricing:** Free $0; **Pro $5/mo ($60/yr)**; **Business $8/user/mo ($96/yr)**.
- **Platforms:** web + mobile + desktop apps; "90+ integrations".
- **Calendar:** calendar layout (Pro) and "integrate email, calendar, and more"; specific two-way Google Calendar sync not stated on fetched pages → **unverified**.
- **AI:** LLM features for task/filter creation, email→task, voice capture. Does not auto-place tasks into time slots → **not constraint-based**.
- **Student-specific:** none.
- URL: https://todoist.com/pricing

## 4. TickTick
- **Target user:** general productivity individuals.
- **Features:** lists, kanban, calendar/timeline views (Premium), duration, Eisenhower matrix, habits, countdowns, NLP quick add, widgets.
- **Pricing:** Free (9 lists / 99 tasks per list); **Premium $49.99/year** (299 lists, 999 tasks, multiple calendar views, duration, email reminders, themes).
- **Platforms:** all platforms ("All Platforms").
- **Calendar:** multiple calendar views are Premium; subscription-calendar sync (Google/Outlook/iCal) not confirmed on the fetched pricing/integrations pages → **unverified**.
- **AI:** "AI Features" listed in the plan comparison with no mechanism described → **unknown, no scheduling claim**.
- **Student-specific:** none on fetched pages.
- URL: https://ticktick.com/about/upgrade ; https://ticktick.com/integrations

## 5. Google Calendar / Google Tasks
- **Target user:** everyone (consumer free); Workspace for organisations.
- **Pricing:** consumer Calendar/Tasks free with a Google account; Workspace **Starter $7, Standard $14, Plus $22 /user/mo** (annual pricing shown; Gemini in Gmail/Workspace bundled from Standard up).
- **Features:** shared calendars, appointment booking pages (Standard+), rooms, Tasks integration.
- **AI (Gemini):** Gemini Apps can **create, find, edit and cancel Google Calendar events** (incl. shared/secondary calendars) and can add events from photos/emails; Gemini in Gmail "Help me schedule" suggests meeting slots from calendar + email context (Google blog, Oct 2025).
- **Constraint model:** availability/time-zone slot suggestions only; no task-duration/capacity solver over workload → **not constraint-based scheduling**.
- **Student-specific:** none (free tier is the relevant hook).
- URLs: https://workspace.google.com/pricing ; https://support.google.com/gemini/answer/15305236

## 6. Motion (usemotion.com)
- **Target user:** professionals, SMBs, teams.
- **Features:** AI Calendar auto-schedules tasks from deadlines, duration, priorities; recalculates day/week when things change; aggregates projects/tasks/docs/meetings/notetaker.
- **Explicit capacity claim:** "schedules tasks based on your actual capacity and **flags when you've scheduled more than you can handle**"; "reshuffles your entire day (and week) in seconds"; "spots project bottlenecks".
- **Pricing (annual toggle shown):** **Pro AI $19/seat/mo** (7,500 credits), **Business AI $29/seat/mo** (15,000 credits); page advertises "Pay annually (save 33%)" — monthly list prices did not render → **monthly = unknown**.
- **Platforms:** iOS, Android, desktop.
- **Calendar:** Google/Outlook integrations implied (Gmail, Outlook, Teams listed); exact provider list not enumerated on pricing page → **partially verified**.
- **Student-specific:** none.
- **AI type:** **true constraint-based auto-scheduler** (capacity, deadlines, duration, priority, continuous re-planning).
- URLs: https://www.usemotion.com/pricing ; https://www.usemotion.com/features/ai-calendar

## 7. Reclaim.ai
- **Target user:** professionals/teams; free "Lite" for a single user.
- **Features:** Focus Time agents (weekly goal, proactive/reactive defence), Habits, buffer/travel time, Smart Meetings, auto-rescheduling, universal event priorities P1–P4, custom scheduling hours, Planner, AI assistant, scheduling links, task time-blocking (Google Tasks, Todoist, Asana, ClickUp, Jira, Linear), ChatGPT + Claude MCP integrations.
- **Pricing:** Lite free; Starter / Business / Enterprise tiers exist but **seat prices are not in the rendered page text → unknown** (third-party figures range $10–18/seat/mo and conflict; do not use).
- **Platforms:** web + Google Calendar/Gmail add-on, Slack, Raycast, MCP clients.
- **Calendar:** **Google and Outlook only**; connected calendars 2 (Lite) vs unlimited; scheduling range 1 week (Lite) vs 8/12 weeks.
- **Student-specific:** none.
- **AI type:** **constraint/rule-based optimizer** (hours, buffers, focus-time quotas, priority, time defence) plus LLM chat layer → closest to genuine constraint scheduling alongside Motion.
- URL: https://reclaim.ai/pricing

## 8. Morgen
- **Target user:** professionals (claims 248,000+ users).
- **Features:** unified calendar + task time-blocking, calendar automations, booking pages/scheduling links, desktop + mobile apps.
- **AI:** "AI Planner" time-blocking; comparison table positions it as **"Auto + Manual"** while Motion is "Auto-moves" — i.e. user stays in control.
- **Pricing:** Pro **$30/mo** monthly or **$15/mo** billed yearly; Team **$25/seat/mo** monthly or **$10/seat/mo** yearly (min 2 seats); 14-day trial. **Students/academics/non-profits 25% off forever**; 15% switching discount.
- **Platforms:** Windows, macOS, Linux, mobile (iOS/Android), browser.
- **Calendar integrations:** Google, Outlook/Microsoft 365, iCloud, CalDAV, Fastmail, Zoho; task integrations incl. Todoist, Notion, Linear, ClickUp, Obsidian, Google Tasks, Microsoft To Do.
- **Student-specific:** discount only, no academic features.
- **AI type:** semi-automatic time-blocking (assisted), **not a full constraint solver**.
- URL: https://morgen.so/pricing

## 9. Structured
- **Target user:** consumers / ADHD / "overwhelmed" planners; timeline-based day planning.
- **Features:** single visual timeline, tasks split across the day, calendar import, weekly/monthly views, widgets, Apple Watch, focus timer.
- **AI:** "Structured AI" builds daily schedules, **scans physical planners/timetables**, manages tasks; "Replan" moves missed tasks to today.
- **Pricing:** free tier; Pro **$2.99/mo or $11.99/yr** (US App Store listing); a one-time purchase plan also exists (help centre).
- **Platforms:** iOS, Android, macOS/desktop, web app, Apple Watch.
- **Calendar:** "import your existing calendar(s)"; two-way sync not claimed on fetched pages → **unverified**.
- **Student-specific:** timetable scanning is student-relevant; no student pricing/features.
- **AI type:** generative/heuristic plan drafting — no capacity, deadline-risk, or constraint optimisation claimed → **not constraint-based**.
- URLs: https://structured.app/ ; https://structured.app/planning-assistance ; https://apps.apple.com/pa/app/structured-daily-planner-todo/id1499198946

## 10. Notion / Notion Calendar
- **Pricing (Notion):** Free $0; **Plus $10/seat/mo**; **Business $20/seat/mo**; Enterprise custom. **Plus is free for students & educators** (1-member workspace, school email).
- **Notion Calendar:** free; desktop (macOS/Windows), iOS, Android; **syncs Google Calendar, Outlook, Apple iCloud**; shows Notion database items beside events; Google Calendar events cannot be imported into a Notion database.
- **AI:** Notion Agent / AI Meeting Notes on Business+; Notion Calendar has **no AI scheduling claim**.
- **Student-specific:** free Plus plan + templates; no academic scheduling semantics (terms, rotating weeks, exam weighting).
- URLs: https://www.notion.com/pricing ; https://www.notion.com/product/calendar

## 11. Forest
- **Target user:** students, remote workers, ADHD; distraction/focus.
- **Features:** Pomodoro-style timer, tree grows/dies, Deep Focus app blocking, Time Guard scheduled blocks, Mindful Space, focus analytics, Plant Together group sessions, real tree planting.
- **Pricing:** free core (timer, app blocking, group focus, wellbeing tools); **Plus price not displayed in fetched text → unknown**. Legacy "Pro" no longer sold to new users.
- **Platforms:** iOS, Android, Apple Watch, browser.
- **Calendar integration:** none claimed.
- **AI:** none claimed.
- **Student-specific:** exam-study positioning; no scheduling features.
- URL: https://www.forestapp.cc/

## 12. Tiimo
- **Target user:** neurodivergent users (ADHD/autism) plus anyone needing structure; students implicit.
- **Features:** visual timeline, to-do list with AI priority suggestion, focus timer, widgets/Live Activities/Dynamic Island, profiles, mood/wellbeing.
- **AI:** "AI Co-planner" — speak/type a brain-dump, it breaks tasks down, **adds time estimates** and builds a plan; unlimited AI planning in Pro.
- **Pricing:** free tier (mobile only); Pro monthly or yearly, **local pricing only at checkout → unknown** (store listing shows ~$54/yr and ~$7/mo variants; treat as indicative, not confirmed).
- **Platforms:** iOS, iPadOS, watchOS, Android, Mac, Web.
- **Calendar:** imports Apple, Google, Outlook (one-way import per FAQ language).
- **Student-specific:** no academic calendar semantics; strong for task initiation.
- **AI type:** LLM task breakdown + estimation; **not a constraint solver** (no documented capacity/deadline optimisation).
- URLs: https://www.tiimoapp.com/product ; https://www.tiimoapp.com/faq

## 13. Goblin Tools
- **Target user:** neurodivergent people facing overwhelm; general.
- **Features:** Magic ToDo (task breakdown with "spiciness" levels), Estimator (time guesses), Taskmaster (one task at a time), Compiler (brain-dump → actions), Professor, Formalizer, Judge, Consultant, Chef.
- **Pricing:** **web tools free forever, no ads/paywall**; mobile apps sold at a low one-off price; **Goblin Tools Pro** low monthly subscription for cost-heavy advanced features (price not stated → unknown).
- **Platforms:** web, iOS, Android; accounts now sync history/lists.
- **Calendar integration:** none.
- **AI:** explicitly "general purpose models … accuracy can vary … only guesswork" — **not constraint-based, no scheduling**.
- URL: https://goblin.tools/ ; https://goblin.tools/About

## 14. Canvas / Moodle / Blackboard (LMS)
- **Canvas (Instructure):** LMS; **"Canvas LMS is 100% free for students"** (student accounts via institution or free account); institutional pricing **not published** (sales-led; third-party estimates $4–30/student/yr conflict → unknown). Feature set: assignments, due dates, course calendar.
- **Moodle:** open-source LMS, free core; hosted MoodleCloud available; **no public price** on the fetched page (form-driven quote). AI: "AI, your way" — AI Principles, optional AI subsystem, not scheduling.
- **Blackboard (Anthology):** enterprise LMS, **no public rate card**, custom institutional subscription (confirmed by vendor positioning + secondary sources).
- **Relevance:** these are the **source of truth for deadlines** (assignment due dates, course calendars) that student planners ingest (MyStudyLife explicitly lists Canvas and Blackboard sync). None offers personal workload scheduling.
- URLs: https://www.instructure.com/lms-learning-management-system ; https://moodle.com/pricing/ ; https://www.blackboard.com/why-choose-blackboard

## 15. ChatGPT / Claude / Gemini calendar capabilities
**ChatGPT (OpenAI)**
- Connected apps framework: connect services, read + "supported actions", approval prompts, per-app permissions ("always ask" → "allow all actions"), event-triggered tasks.
- Calendar-specific: **Outlook Email and Calendar app** documented; Google Drive app documented. Google Calendar direct app is not enumerated in the fetched help article → **partial**.
- No persistent task→slot scheduler; scheduling is conversational.

**Claude (Anthropic)**
- **Google Workspace connectors (Gmail, Google Calendar, Drive) available to all users** on Claude and Claude Desktop.
- Calendar actions: view events/calendars incl. shared; **create, update, delete** events; **find mutual availability across attendees**; manage attendee lists/RSVPs; recurring meetings.
- Approval required by default; admin enablement on Team/Enterprise.
- No autonomous rescheduling or workload/capacity model → **assistant, not scheduler**.

**Gemini (Google)**
- Create / find / edit / cancel events across Google, Samsung, Xiaomi, OPPO, HONOR, TECNO calendars; works on secondary/shared calendars; supports turning photos, emails, itineraries into events.
- Gmail "Help me schedule" proposes slots from calendar + email context.
- Constraint reasoning limited to availability/time zones → **not capacity-based**.
- URLs: https://help.openai.com/en/articles/11487775-connectors-in-chatgpt ; https://support.claude.com/en/articles/10166901-use-google-workspace-connectors ; https://support.google.com/gemini/answer/15305236

---

# Assessment: true constraint-based scheduling vs generic AI

**Genuine constraint-based (evidence in product claims):**
- **Motion** — strongest. Explicit inputs (deadline, duration, priority, capacity), continuous re-optimisation, over-capacity flagging, bottleneck detection. This is a solver/optimiser product, not an LLM wrapper.
- **Reclaim.ai** — rule/constraint optimiser: scheduling hours, buffers, weekly focus quotas, P1–P4 priorities, time defence, auto-reschedule across a 1–12 week horizon. LLM is a control surface, not the engine.

**Hybrid / assisted blocking:**
- **Morgen** — AI Planner auto-blocks but explicitly "you stay in control" (auto + manual), narrower optimisation claims than Motion/Reclaim.

**Generative planning, not constraint solving:**
- **MyStudyLife Scout**, **Tiimo AI Co-planner**, **Structured AI + Replan**, **Goblin Tools**, **ChatGPT/Claude/Gemini** — natural-language generation of plans/tasks/estimates. None publishes a capacity model, deadline-risk calculation, or re-optimisation guarantee.
- **Todoist / TickTick** — AI is limited to capture, filters, task writing; scheduling is manual (calendar layout only).
- **Forest / Notion Calendar / iStudiez** — no AI scheduling claim.

**Structural gap for a student product:**
1. No surveyed tool combines **academic calendar semantics** (rotating A/B weeks, term/holiday dates, exam periods, credit weighting, class-vs-exam conflicts) with a **constraint solver**. MyStudyLife models the semantics but schedules generically via chat; Motion/Reclaim solve constraints but are work-calendar tools with no concept of a term, a timetable rotation, or an exam.
2. **Weekly/term horizon** is where students fail: Reclaim caps at 8–12 weeks, Motion re-plans day/week, MyStudyLife/Structured plan a week but without capacity maths.
3. **Free-tier expectation**: student leaders are free (MyStudyLife, iStudiez core, Google, Forest, Goblin Tools, Notion for students). Paid student willingness is benchmarked by MSL+ at £14.99/yr — two orders of magnitude below Motion ($228/yr) and Reclaim.
4. **LMS deadline ingestion** is an available moat (Canvas/Blackboard/Moodle feeds) that only MyStudyLife partially claims.

---

# Source list (all accessed 20 Oct 2026)
1. MyStudyLife — https://mystudylife.com/
2. MyStudyLife tour — https://mystudylife.com/tour/
3. MyStudyLife offers/pricing — https://mystudylife.com/special-offers/
4. iStudiez Pro App Store — https://apps.apple.com/us/app/istudiez-pro-legendary-planner/id310636441
5. Todoist pricing — https://todoist.com/pricing
6. TickTick pricing — https://ticktick.com/about/upgrade
7. TickTick integrations — https://ticktick.com/integrations
8. Google Workspace pricing — https://workspace.google.com/pricing
9. Gemini Apps calendar help — https://support.google.com/gemini/answer/15305236
10. Motion pricing — https://www.usemotion.com/pricing
11. Motion AI Calendar — https://www.usemotion.com/features/ai-calendar
12. Reclaim pricing — https://reclaim.ai/pricing
13. Morgen pricing — https://morgen.so/pricing
14. Structured home — https://structured.app/
15. Structured AI planning — https://structured.app/planning-assistance
16. Structured App Store — https://apps.apple.com/pa/app/structured-daily-planner-todo/id1499198946
17. Notion pricing — https://www.notion.com/pricing
18. Notion Calendar — https://www.notion.com/product/calendar
19. Forest — https://www.forestapp.cc/
20. Tiimo product — https://www.tiimoapp.com/product
21. Tiimo FAQ/pricing — https://www.tiimoapp.com/faq
22. Goblin Tools — https://goblin.tools/
23. Goblin Tools About — https://goblin.tools/About
24. Instructure/Canvas — https://www.instructure.com/lms-learning-management-system
25. Moodle — https://moodle.com/pricing/
26. Blackboard/Anthology — https://www.blackboard.com/why-choose-blackboard
27. ChatGPT connected apps — https://help.openai.com/en/articles/11487775-connectors-in-chatgpt
28. Claude Google Workspace connectors — https://support.claude.com/en/articles/10166901-use-google-workspace-connectors
29. Google Workspace blog, Gemini "Help me schedule" — https://blog.google/products-and-platforms/products/workspace/help-me-schedule-gmail-gemini/
