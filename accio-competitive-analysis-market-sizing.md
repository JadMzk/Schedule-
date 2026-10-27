# Accio — Competitive Analysis & Market Sizing

**Product under study:** Schedule+ / Smart Scheduler + Ike fusion
**Audience:** founders and investors
**Research date:** 20 October 2026
**Evidence convention:** `[FACT]` = sourced observation; `[ESTIMATE]` = model assumption or scenario; `[INFERENCE]` = analyst conclusion. Unknown means not publicly verified.

## 1. One-paragraph verdict

**[INFERENCE] There is a wedge, but it is not “AI planning.”** The defensible problem is academic workload feasibility: a student has a real timetable, multiple course-specific deadlines, finite free time, variable energy, and a need for one trustworthy answer to “what now, and when can I actually do it?” Academic planners such as MyStudyLife understand classes, terms and exams but do not publicly demonstrate a deadline/capacity solver; Motion and Reclaim demonstrate genuine constraint scheduling but target professionals and lack academic ontology. The launch wedge should therefore be **read-only academic calendar/ICS ingestion + module-aware deadlines + deterministic feasibility and slot packing + bounded LLM explanation + confirm-before-schedule**. Students are price-sensitive and have strong free substitutes, so B2C should be a generous free product with a low annual paid tier; the credible 24-month revenue path is a hybrid of self-serve student adoption and a small number of university pilots. Do not lead with “LLM”; lead with “never miss the work that fits around your actual timetable.”

## 2. Problem & JTBD

### Primary customer

A full-time university student with a mostly fixed timetable, several concurrent modules, coursework and exam deadlines, plus sport, work, commuting, internships or personal commitments. The design-centre case is an Imperial/UK STEM student with 4–8 contact hours on some days, an assignment due Tuesday 23:59, and a mixture of lecture, tutorial and open time.

### Core jobs to be done

1. **Capture:** “Between lectures, capture ‘revise statistics for two hours tomorrow afternoon’ in one sentence.”
2. **Know reality:** “Show what is due, how much work remains, and whether my remaining free time is enough.”
3. **Choose now:** “Given my energy and the time available, tell me whether to do a Quick Win or a Big Rock.”
4. **Place work:** “Suggest a conflict-free block that respects lectures, existing work sessions, preferred hours and the deadline.”
5. **Protect life:** “Keep coursework, career, sport and personal work on the same board without coursework erasing everything else.”
6. **Trust the system:** “Suggest useful work without flooding me with invented tasks from every lecture.”

### Triggers and constraints

| Trigger | Constraint the product must model |
|---|---|
| New assignment, exam or tutorial task | Due date, estimated effort, module/course, task type |
| Timetable changes | Recurring events, cancellations, moved rooms/times, time zone |
| Monday morning planning | Fixed lectures/labs plus open windows from 08:00–22:00 |
| Low energy or executive dysfunction | Smaller tasks, effort/resistance, explainable recommendation |
| Part-time job, commute or sport | Busy blocks outside academic calendar |
| Clustered deadlines | Remaining effort versus remaining free minutes; at-risk status |
| Exam season | Revision horizon, repeated sessions, no fake certainty |

**[INFERENCE] The substitute is not another app.** At 08:00 on Monday, a student typically checks Outlook/university timetable or LMS, looks at a paper diary/notes/to-do list, mentally scans deadlines, and chooses the most salient or easiest task. The real competitor is this fragmented workflow plus last-minute cramming.

## 3. Product snapshot

### Intended product and architecture

**[FACT — internal product brief]** The fusion is an LLM-assisted student task scheduler. The deterministic engine owns dates, free time, feasibility, packing and calendar writes. The LLM owns natural-language parsing, soft judgement, bounded re-ranking and explanations. If the model fails, a rule-based ranker still returns an answer. The positioning hypothesis is: **“A student planning assistant that reads your timetable, understands your tasks in natural language, ranks what matters, and suggests conflict-free timeslots — recommend, never hijack the calendar.”**

### Status map

#### Calendar and academic context

- **[SHIPPED Schedule+]** Private Outlook ICS URL ingest: save, test, refresh, remove; local secret storage; optional environment fallback.
- **[SHIPPED Schedule+]** `node-ical` parsing for VEVENT, all-day, time zones, RRULE, EXDATE; cancelled events skipped.
- **[SHIPPED Schedule+]** Module extraction from Imperial/Outlook-style titles, event types for lecture/lab/tutorial/seminar/workshop/class, uncategorised bucket, manual reassignment.
- **[SHIPPED Schedule+]** Module picker, search, select-all/clear-all; selected modules only appear on the calendar while unselected events remain retained; personal tasks are never filtered.
- **[SHIPPED Schedule+]** Day/week/month views, today, previous/next navigation and Europe/London time zone.
- **[SHIPPED Schedule+]** Colour-coded study, coursework, career, sport, personal and other blocks; clickable academic events; reassignment; refresh every 30 minutes.
- **[SHIPPED Schedule+]** macOS Electron app with local server lifecycle, Application Support storage, secret-like ICS handling, offline UI after load; network required for sync.
- **[DESIGNED fusion]** Provider-normalised schema for university timetable, Google Calendar, Outlook OAuth and generic ICS; event types include lecture, tutorial, lab, exam, deadline, meeting, personal-busy and other.
- **[DESIGNED fusion]** Read-only, per-calendar opt-in, tokens never sent to the LLM, raw payload discard and rolling retention of roughly −14 to +60 days; incremental diffs and event-driven recompute.

#### Task capture

- **[SHIPPED Schedule+]** Natural-language quick add, e.g. “Revise statistics for 2 hours tomorrow afternoon.”
- **[SHIPPED Schedule+]** Deterministic parser for durations, weekdays, due/deadline versus preferred window, and morning/afternoon/evening; optional structured LLM parser with Europe/London time zone; validation and fallback.
- **[SHIPPED Schedule+]** Confirm-before-save modal with editable title, due date, duration, preferred start/window, priority, category, recurrence and confidence/clarification notes.
- **[SHIPPED Schedule+]** Structured task fields: original input, description, dueAt, estimated duration, preferred start/window, priority, category, status and recurrence.
- **[SHIPPED both]** Categories covering study, coursework, career, sport, personal and other; Ike additionally had admin, work and health.
- **[SHIPPED Ike]** Importance/urgency/effort sliders and presets; growth rate is hidden.
- **[SHIPPED Ike / gap Schedule+]** Google Sign-In, cloud path, Supabase/RLS and optional email allowlist exist in Ike; Schedule+ is currently single-user/local. Fusion likely needs accounts for cross-device sync.

#### Prioritisation and AI

- **[SHIPPED Ike]** Continuous importance × current urgency, with `current_urgency = min(10, initial + growth_rate × days)` and score `importance × current_urgency`; low/medium/high/critical badges.
- **[SHIPPED Ike]** Effort/resistance model, 2D priority landscape, Quick Wins/Big Rocks/Nice to Do/Postpone quadrants, time projection to today/+7/+30 days, live-score home list and top-three Focus badge.
- **[SHIPPED Ike]** Local 1–10 motivation check-in that shifts recommendations toward Quick Wins at low energy and Big Rocks at high energy; hidden category resistance learns from completions/neglect.
- **[DESIGNED fusion]** Real deadlines replace synthetic urgency ramps; feature engine computes hours-to-deadline, slack, workload versus free time and at-risk flags.
- **[DESIGNED fusion]** LLM is a bounded re-ranker of top-N candidates with “why”; temperature 0, schema, validator and rule-based fallback.
- **[DESIGNED fusion]** Focus card answers “What should I work on now?” with Start/Why/Not now; optional “Ask Ike” for “I have two hours.” Supported questions: what now, top three today, I have N hours, and plan my day around the timetable.

#### Scheduling

- **[SHIPPED Schedule+]** Busy intervals are selected academic events plus non-cancelled work sessions, merged before free-slot search.
- **[SHIPPED Schedule+]** Free slots inside 08:00–22:00 by default, with minimum task duration, 14-day horizon, due-date/window clipping and morning/afternoon/evening or exact-start preferences.
- **[SHIPPED Schedule+]** Greedy batch ordering by priority/deadline, tentative reservation to avoid collisions, reasons for suggestions, Accept/Reject, and work-session states suggested/confirmed/completed/cancelled.
- **[SHIPPED Schedule+]** Drag-to-create blocks, optional conflict flag, tasks inbox, overdue/unscheduled/upcoming filters, category/status/priority filters, deadline/priority/duration sort, task editing and completion.
- **[DESIGNED fusion]** Separate solver: weighted earliest-deadline-first at MVP, CP-SAT/ILP later; splittable jobs, buffers, course-specific estimation bias and auto-replan without calling the LLM.
- **[DESIGNED fusion]** LLM supplies soft weights such as “deep work in mornings” and “do not start a heavy task before a lecture”; it does not do calendar arithmetic.

#### Suggested tasks, control and learning

- **[DESIGNED fusion]** Closed templates can suggest post-lecture review, tutorial preparation and exam revision; explicit/user, suggested/inbox and opt-in auto origins are labelled.
- **[DESIGNED fusion]** Usefulness gate, per-event/course/day budgets, dismiss cooldown, deduplication cascade and daily digest; vague tasks are rejected; auto-create requires opt-in and historical acceptance.
- **[DESIGNED fusion]** Recommend, never control: start, complete, snooze, reorder, “this is wrong,” edit, dismiss, undo and Why; 30-day log and 24-hour undo for automatic actions.
- **[DESIGNED fusion]** Personalisation moves from stated preferences to statistical bias/profile and only later pooled learning-to-rank; reward includes followed, completed-before-deadline and importance rather than easy clicks.
- **[DESIGNED fusion]** Log exposures, interactions, task lifecycle, outcomes and feature snapshots from day one; minimise/pseudonymise LLM payloads; model never invents task IDs.
- **[SHIPPED both / DESIGNED fusion]** Local-first JSON/secrets isolation in Schedule+, cloud Supabase/RLS path in Ike; fusion needs an explicit student/university privacy story.

#### Platforms and non-goals

- **[SHIPPED]** Schedule+: Next.js web plus macOS Electron. Ike: Expo/React Native and Google auth; Android APK was attempted.
- **[DESIGNED]** Web-first fusion, then iOS from a shared codebase; calendar sync and AI server-side.
- **[MVP non-goals]** Not chatbot-first; no silent mass task generation; no calendar write-back until later permission; no custom neural net; no mandatory Microsoft Graph/Entra; unsigned desktop build is a packaging limitation, not a feature.

## 4. Competitor landscape

### Landscape table

| Group | Representative products | Capture | “What now?” | “When?” / packing | Academic ontology | AI role | Control model | Price/distribution signal |
|---|---|---|---|---|---|---|---|---|
| Academic planners | MyStudyLife, iStudiez | Classes, homework, exams | Basic priorities; Scout chat in MSL | Calendar views; no public capacity solver | Strongest: terms, A/B weeks, exams, GPA | Chat/planning, not verified solver | Mostly user-managed | Free core; MSL+ £14.99/year listed, current price not fully verified |
| General task managers | Todoist, TickTick, Things, To Do, Reminders, Tasks | Excellent quick capture | Priority/filters; no academic reasoning | Calendar/timeline views; manual blocking | None or generic | Capture/filter assistance | User schedules | Free to low-cost consumer; Todoist Pro $5/mo or $60/year; TickTick Premium $49.99/year |
| Calendars | Google, Outlook, Apple, Fantastical | Calendar events | Meeting availability, not workload ranking | Strong event availability; not task capacity | None | Gemini/assistant event actions | Varies; approval/write actions | Free consumer ecosystems; institutional default |
| True AI/time schedulers | Motion, Reclaim | Tasks plus deadlines/duration | High-quality ranking/priority and capacity | Genuine auto-replan/constraint scheduling | Professional/work ontology | Optimiser plus AI UI | Motion auto-moves; Reclaim rules/defence | Motion $19–29/seat/month annual toggle; Reclaim prices not rendered |
| Assisted time blocking | Morgen, Akiflow, Sunsama, Structured, Timebloc, AMIE | Tasks/calendar | Manual or assisted focus | Blocking/replan varies | Mostly generic; Structured is student-adjacent | Generative/assisted | More user control | Morgen Pro $15/mo annual; 25% student/academic discount; Structured Pro $11.99/year US listing |
| Notes + tasks | Notion, Notion Calendar, Obsidian, Roam | Notes, databases, tasks | Flexible databases, not bounded ranker | Calendar integration; manual planning | Templates, not true ontology | Notion AI/Agent, not Calendar scheduler | User-controlled | Notion Plus free for eligible students in one-member workspace |
| AI chat | ChatGPT, Claude, Gemini, Copilot | Prompt/paste/import | Conversational advice | Can read/create events with permissions; no persistent workload solver found | No student model | General LLM | Approval-based actions | Often free entry; strongest $0 substitute |
| Habit/focus/EF | Forest, Tiimo, Goblin Tools | Brain dump, tasks, timer | Task breakdown or focus initiation | Timeline/focus, not deadline-capacity packing | ADHD/structure rather than academic | Breakdown/estimation in Tiimo/Goblin | User controls | Free/low-cost; prices frequently local or unpublished |
| LMS/SIS | Canvas, Moodle, Blackboard, Panopto, university Outlook | Official assignments and events | Deadline visibility, not personal plan | Course calendar, no personal capacity solver | Course-native | Limited/optional AI | Institution controls source data | B2B; institutional pricing generally not public |
| Non-consumption | Paper, spreadsheet, memory, cramming | Manual | Salience/mental model | Mental/manual blocks | Student-specific by habit | None | Full control, high effort | £0 marginal cost; universal substitute |

### Deep profiles

#### 1. MyStudyLife — academic-planner incumbent

- **[FACT]** Targets school and university students, parents and institutions; supports rotating/A–B/block schedules, homework, exams, revision tasks, grades/GPA, widgets and offline mode.
- **[FACT]** Scout turns natural language into plans and answers due-date questions; the product advertises Google/Apple/Outlook/iCal and Blackboard/Canvas connections.
- **[FACT]** Free core; MSL+ page lists £14.99/year, but the page contains a 2024 promotional code, so current list price is not fully verified.
- **[INFERENCE]** Best academic semantic competitor. Gap: public claims do not show a deterministic capacity model, remaining-effort/slack calculation or conflict-free solver.

#### 2. iStudiez Pro — structured student planner

- **[FACT]** High-school/university target; alternating, rotating and block schedules, instructors, cancelled classes, homework, weighted grades/GPA and Apple Watch.
- **[FACT]** App is free; cloud sync subscription price is storefront-local and unknown on the fetched listing; no AI claim.
- **[INFERENCE]** Proves students value academic structure, but low visible AI/automation differentiation and reported low update cadence create an opening for a modern workflow.

#### 3. Todoist — task-capture benchmark

- **[FACT]** General users/teams; projects, subtasks, priorities, labels, filters, reminders, duration, deadlines, calendar layout and voice/email assistance. Pricing: Free, Pro $5/month or $60/year, Business $8/user/month or $96/year.
- **[FACT]** AI claims focus on task/filter creation and capture; no public claim of automatic task-to-slot packing.
- **[INFERENCE]** Strong substitute for capture and existing habit; not a student timetable product.

#### 4. TickTick — low-cost generalist

- **[FACT]** General productivity product with NLP quick add, duration, calendar/timeline views, habits and Eisenhower matrix. Premium is listed at $49.99/year.
- **[FACT]** AI is listed in plan comparison without a clearly documented scheduling mechanism; calendar sync details were not verified.
- **[INFERENCE]** Sets a low price and broad feature expectation, but does not own academic deadlines or timetable semantics.

#### 5. Google Calendar / Tasks — $0 ecosystem default

- **[FACT]** Consumer Calendar/Tasks are free; Google Workspace pricing page lists Starter $7, Standard $14 and Plus $22 per user/month on annual pricing.
- **[FACT]** Gemini can create/find/edit/cancel events and Gmail can suggest meeting slots; these are calendar-event and availability actions, not a published workload-capacity solver.
- **[INFERENCE]** The product must beat “Google Calendar + a task list + an LLM prompt” on trust and effort, not on generic chat.

#### 6. Motion — genuine constraint scheduler, wrong initial segment

- **[FACT]** Targets professionals, SMBs and teams. Claims include scheduling by deadline, duration, priority and actual capacity; flags over-capacity, reshuffles days/weeks and spots bottlenecks.
- **[FACT]** Pricing page shows Pro AI $19/seat/month and Business AI $29/seat/month with annual billing toggle; monthly rates are unknown. Platforms include iOS, Android and desktop.
- **[INFERENCE]** Closest technical threat. Price, work-oriented UX and lack of modules/terms/exams create a student gap; a student-first solver must not assume this gap is permanent.

#### 7. Reclaim.ai — rule-based calendar defence

- **[FACT]** Targets professionals/teams; supports focus-time quotas, habits, buffers, travel, priorities P1–P4, auto-rescheduling, planner and task integrations. Google and Outlook calendars are supported; Lite is free.
- **[FACT]** Public pricing page did not render seat prices; do not use conflicting third-party prices.
- **[INFERENCE]** Genuine constraint/rule competitor. It optimises work-calendar behaviour, not course workload, academic terms or exam periods.

#### 8. Morgen — control-oriented hybrid

- **[FACT]** Unified calendar/task time blocking across desktop/mobile/browser; Google, Outlook/Microsoft 365, iCloud, CalDAV and others; “Auto + Manual” AI Planner.
- **[FACT]** Pro is $15/month annual or $30 monthly; it advertises 25% lifetime discount for students/academics/non-profits.
- **[INFERENCE]** Its explicit control posture validates “recommend, do not hijack,” but it remains generic and expensive for most students.

#### 9. Structured — visual timeline and executive-function adjacent

- **[FACT]** Timeline planner with calendar import, widgets, focus timer and AI that builds daily schedules or replans missed tasks; Pro listed at $2.99/month or $11.99/year on a US App Store listing.
- **[FACT]** Timetable scanning is student-relevant, but no public claim of course-aware deadline-risk or capacity optimisation.
- **[INFERENCE]** Competes strongly on approachability and ADHD/overwhelm, not on academic feasibility.

#### 10. Notion / Notion Calendar — flexible student workspace

- **[FACT]** Notion Plus is free for eligible students/educators in a one-member workspace; Notion Calendar is free and syncs Google, Outlook and Apple iCloud calendars.
- **[FACT]** Calendar shows Notion database items beside events, but Google Calendar events cannot be imported into a Notion database; no public AI scheduling claim for Calendar.
- **[INFERENCE]** Distribution and template threat. Do not compete on notes or flexibility; win on opinionated, reliable next-action decisions.

#### 11. Forest, Tiimo and Goblin Tools — initiation/focus substitutes

- **[FACT]** Forest provides focus timers/app blocking, not calendar integration or AI. Tiimo offers visual planning, AI task breakdown, estimates and calendar imports; Goblin Tools breaks down tasks and estimates time, with free web tools and local/unknown paid details.
- **[INFERENCE]** These products address the “start the task” bottleneck. Smart Scheduler should borrow effort-aware focus and low-energy recommendations without becoming a habit/timer clone.

#### 12. LMS/SIS and AI chat — system-of-record substitutes

- **[FACT]** Canvas, Moodle and Blackboard are institutional learning systems with assignment/course calendar data; institutional prices are not publicly available in the reviewed pages. Claude can view/create/update/delete Google Calendar events with approval; Gemini can manage calendar events; ChatGPT has connected-app actions including Outlook Calendar, but no persistent task-to-slot solver was verified.
- **[INFERENCE]** LMS ingestion and calendar export matter more than another chat box. The student planner should consume official deadlines and let the user inspect every recommendation.

### Whitespace map

| Need | Academic planners | Motion/Reclaim | Smart Scheduler opportunity |
|---|---|---|---|
| Understand modules, lectures, exams | Strong | Weak/absent | Own the academic ontology |
| Calculate remaining capacity before deadline | Weak/not publicly claimed | Strong | Combine both |
| Natural-language capture | Emerging | Available | Make capture fast but always confirm |
| Energy/effort-aware next action | Partial/adjacent | Generic priority | Use effort as bridge from rank to action |
| Calendar safety | Mostly user-managed | Auto-reschedule varies | Read-only by default; never move existing events |
| Prevent fake AI tasks | Not a common differentiator | Not student-specific | Closed templates, budgets, dedup, digest |
| Privacy/local trust | Some offline/local claims | Cloud/professional default | Local-first or minimised/pseudonymised payloads |
| Student price/distribution | Strong/free | Weak/high price | Free tier + campus pilots |

**Who owns the jobs today?** `[INFERENCE]` MyStudyLife/university timetable/LMS own **“where are my classes and deadlines?”**; Motion/Reclaim own **“how can a professional fit tasks around work calendars?”**; no clear incumbent owns **“given my academic timetable, deadlines, effort and energy, what should I do next and which feasible block should I accept?”**

**Constraint-scheduling conclusion:** `[FACT/INFERENCE]` Based on public claims, Motion and Reclaim are the clearest genuine constraint-based products. MyStudyLife Scout, Tiimo, Structured, Goblin Tools and general chat assistants are generative or heuristic planners; Todoist/TickTick AI is capture/filter-oriented. This is a product-claim assessment, not an inspection of private implementation.

## 5. Differentiation thesis

### Three durable advantages to build

1. **Academic data model + solver feedback loop:** modules, event types, terms, exams, official deadlines, course-specific estimation bias and acceptance/completion outcomes. A generic scheduler can copy a label; it cannot quickly reproduce clean institutional mappings and longitudinal student data.
2. **Trust/control as a product system:** read-only calendar by default, confirm-before-schedule, grounded Why sheet, no silent task flood, undo and visible logs. This creates behavioural trust and lowers the perceived risk of AI planning.
3. **Student distribution and institutional integrations:** campus ambassadors, society workflows, university timetable/LMS onboarding and privacy procurement knowledge. Distribution is more durable than a prompt or UI feature.

### Three advantages competitors can copy within six months

- Natural-language quick add and “what should I do now?” cards.
- A student discount, timetable import or module labels.
- An LLM re-ranker/explanation layer on top of an existing scheduler.

### Three table stakes

- Calendar views, recurring events, mobile/web access and basic reminders.
- Task priority, duration, due dates, filters and manual time blocks.
- Data export, privacy policy, reliable sync, account recovery and clear failure states.

**Positioning recommendation:** “The academic workload planner that proves the work fits.” Avoid “AI that plans your life,” which invites comparison with generic chat and Motion.

## 6. Market sizing

### Source anchors

- **[FACT] UK:** HESA reports **2,863,180 HE student enrolments in 2024/25**; first-degree entrants were 668,170, 51% of entrant enrolments. This is enrolments, not a deduplicated number of people.
- **[FACT] Imperial:** Imperial reports **23,248 students in 2024–25**.
- **[FACT] Russell Group:** The Russell Group says approximately **¾ million students** study at its 24 universities and that this is about 25% of UK students.
- **[FACT] Ireland:** HEA search result reports **260,070 enrolments in 2023/24** across modes, excluding NCI; verify against the downloadable HEA dataset before using in an investor model.
- **[FACT] Global:** UNESCO states around **269 million university students** worldwide.

### Bottom-up beachhead model

**Formula:** `addressable students × paid conversion × annual ARPU = annual student revenue`

| Segment | Addressable headcount | Low paid users | Base paid users | High paid users | Revenue range at £36–£72/year |
|---|---:|---:|---:|---:|---:|
| Imperial design-partner pool | 23,248 [FACT] | 3,487 [ESTIMATE: 15%] | 5,812 [ESTIMATE: 25%] | 8,137 [ESTIMATE: 35%] | £125.5k–£585.9k [ESTIMATE] |
| Russell Group | 750,000 [FACT] | 112,500 [ESTIMATE] | 187,500 [ESTIMATE] | 262,500 [ESTIMATE] | £4.05m–£18.9m [ESTIMATE] |
| UK HE | 2,863,180 [FACT] | 429,477 [ESTIMATE] | 715,795 [ESTIMATE] | 1,002,113 [ESTIMATE] | £15.46m–£72.15m [ESTIMATE] |
| UK + Ireland | 3,123,250 [FACT + caveat] | 468,488 [ESTIMATE] | 780,812 [ESTIMATE] | 1,093,138 [ESTIMATE] | £16.87m–£78.71m [ESTIMATE] |

The 15/25/35% column is **not market penetration evidence**; it is a scenario range for the proportion of students with enough timetable/deadline pain to be addressable and willing to become paid users. It must be replaced with funnel data.

### TAM — global student-first category

**Formula:** `269m global university students × share managing multi-course deadlines/timetable × share likely to use digital planning × annual ARPU`

| Scenario | Need fit | Digital planning fit | Addressable students | £36/year | £54/year | £72/year |
|---|---:|---:|---:|---:|---:|---:|
| Low | 45% [ESTIMATE] | 40% [ESTIMATE] | 48.4m | £1.74bn | £2.61bn | £3.49bn |
| Base | 60% [ESTIMATE] | 55% [ESTIMATE] | 88.8m | £3.20bn | £4.79bn | £6.39bn |
| High | 75% [ESTIMATE] | 70% [ESTIMATE] | 141.2m | £5.08bn | £7.63bn | £10.17bn |

**Interpretation:** This is a category TAM, not a forecast. It excludes university licensing and assumes consumer willingness to pay; it should not be presented as obtainable revenue.

### SAM — reachable in 24 months

**Formula:** `global HE students × serviceable English/reachable market share × exportable-calendar/device fit × multi-course need fit × ARPU`

| Scenario | Reachable English/service markets | ICS/Google/Outlook + device fit | Need fit | Students | Revenue at £36–£72/year |
|---|---:|---:|---:|---:|---:|
| Low | 20% [ESTIMATE] | 60% [ESTIMATE] | 60% [ESTIMATE] | 19.4m | £0.70bn–£1.39bn |
| Base | 30% [ESTIMATE] | 70% [ESTIMATE] | 70% [ESTIMATE] | 39.5m | £1.42bn–£2.85bn |
| High | 40% [ESTIMATE] | 80% [ESTIMATE] | 80% [ESTIMATE] | 68.9m | £2.48bn–£4.96bn |

**Caveat:** This is a transparent proxy because a single comparable official dataset for English-taught universities with exportable calendars was not found. The next sizing step is a country-by-country student-headcount table for the US, Canada, Australia, New Zealand, Ireland, Netherlands and Scandinavia.

### SOM — 24-month launch model

SOM should be capacity-constrained, not a percentage of TAM.

#### Self-serve web/desktop scenarios

**Formula:** `activated students × free-to-paid conversion × paid ARPU`

| Scenario | Activated students [ESTIMATE] | Paid conversion [ESTIMATE] | Paid users | ARPU | Annual B2C revenue |
|---|---:|---:|---:|---:|---:|
| Low | 10,000 | 4% | 400 | £36 | £14,400 |
| Base | 30,000 | 8% | 2,400 | £54 | £129,600 |
| High | 75,000 | 12% | 9,000 | £72 | £648,000 |

#### Campus licence scenarios

**Formula:** `campuses × licensed seats per campus × annual price per seat`

| Scenario | Campuses [ESTIMATE] | Seats/campus [ESTIMATE] | Annual licence/seat | Annual B2B revenue |
|---|---:|---:|---:|---:|
| Pilot | 1 | 3,000 | £12 | £36,000 |
| Base | 3 | 5,000 | £18 | £270,000 |
| Expansion | 8 | 8,000 | £24 | £1.536m |

These are **planning scenarios**, not a claim that universities will pay the stated prices. Site licences need validation with student success, wellbeing, digital education, IT/security and careers-services budget holders. Procurement may be slower than the 24-month product window.

### Retention and seasonality assumptions

- **[INFERENCE]** Academic-year retention matters more than monthly logo count. Measure September activation, week-6 retained usage, exam-season usage, summer reactivation and next-year continuation.
- **[ESTIMATE]** Base planning assumption: 8–9 paid months of meaningful usage per year, with exam-season spikes and summer troughs. Do not annualise a strong January without tracking academic-calendar cohorts.
- **[INFERENCE]** Undergraduates may have higher volume but more term-boundary churn; taught master’s students may have sharper workload pain and a shorter course; PhD students have less fixed timetable and should not be the first design centre.
- **[INFERENCE]** Wedges to test: STEM/high course-load, first-year transition, commuting students, ADHD/executive-function needs and students combining study with work/sport. Do not assume diagnosis is necessary or make medical claims.

### Adjacent expansion

- Sixth-form/IB and bootcamps: similar deadlines and fixed sessions; likely parent/school involvement and different safeguarding/procurement.
- Junior professionals with class-like calendars: later expansion only; this is where Motion/Reclaim already have stronger incumbency.
- Budget holders: students pay low annual B2C price; parents may pay for a student; universities may pay for student success/wellbeing/productivity; careers services are a narrow use case for internship planning. These are hypotheses, not established WTP facts.

## 7. Pricing & packaging hypotheses

| Tier | Hypothesis | Included value | Strategic purpose |
|---|---|---|---|
| Free £0 | Core planning must be free | One calendar/ICS, task capture, basic ranking, manual accept/reject, limited horizon | Overcome free-tool gravity and seed campus distribution |
| Student Plus £3/month or £27 academic year | Low-friction paid conversion | More calendars/modules, feasibility/at-risk, more suggestions, history, cross-device sync | Test individual willingness to pay |
| Student Pro £6/month or £54 academic year | Core monetisation hypothesis | Solver, split sessions, estimation bias, energy-aware recommendations, richer analytics | Price against MSL+/Structured, not Motion |
| Student Max £9/month or £81 academic year | Only if value is proven | Advanced sync, exam planning, priority support, family/mentor sharing only if requested | Do not launch until retention supports it |
| Campus licence | £12–£24/seat/year [ESTIMATE] | SSO/privacy controls, aggregate outcomes, onboarding, support, institution timetable/LMS connectors | Validate as pilot/site licence, not assume procurement |

**Sensitivity:** at 9 paid months, list monthly prices imply £27, £54 and £81 per academic year; an annual prepay discount can preserve cash flow while matching student seasonality. The central test is not “which price feels right”; it is whether calendar ingestion + feasibility materially increases paid conversion versus free capture/ranking. Run a price-cell experiment at £0/£3/£6/£9 and academic-year prepaid, with no feature claims that are not shipped.

**Recommendation:** start with Free + one paid annual Student Plus/Pro tier, not four complex tiers. Test university pricing separately. Students are likely more price-sensitive than universities, but university sales create procurement, privacy and integration burden.

## 8. GTM for students

### Beachhead

1. **Imperial design partner:** one course/programme with dense Outlook/ICS use, multiple modules and a willing student-success or digital-education contact.
2. **Society-led expansion:** STEM, computing, medicine, engineering and postgraduate societies; recruit student ambassadors who can demonstrate “Monday at 08:00” workflows.
3. **Russell Group cluster:** use the same portable ICS onboarding rather than building one bespoke connector per university.
4. **UK + Ireland self-serve:** expand after proving activation and timetable parsing; then English-speaking universities with exportable calendars.

### Channels and motions

- Freshers fairs and first-week timetable setup: “Import your timetable in two minutes; see your first realistic study week.”
- Student ambassadors with referral codes and cohort dashboards.
- Societies, course reps, study-skills sessions, libraries and wellbeing/productivity programmes.
- Discord/WhatsApp/Reddit communities only with student-led demos and privacy clarity; avoid spam.
- Outlook/ICS onboarding guide, with Google Calendar and generic ICS next; do not require OAuth or Microsoft Graph for MVP.
- Campus pilot with a measurable assignment/deadline planning outcome; keep the student product self-serve even if the university pays.
- Do not make Product Hunt the first motion: it reaches general productivity enthusiasts, not the timetable/LMS workflow.

### Activation funnel

`Import timetable → choose modules → add one real deadline → accept one suggested block → complete or edit it → repeat next day`

Measure: import completion, valid event parse rate, first accepted session, recommendation acceptance, task completion before deadline, week-2 retention, exam-season retention, free-to-paid conversion, support burden and privacy objections.

## 9. Risks & kill criteria

| Risk | Signal | Mitigation / kill criterion |
|---|---|---|
| Students already use ChatGPT + Calendar for 80% of the job | Interviews show no willingness to import timetable or enter durations | Kill paid consumer thesis if a majority prefer copy/paste and will not accept a structured workflow after a guided trial |
| Calendar feed fragmentation | High parse failures or each campus needs custom work | Keep generic ICS; pause campus expansion if valid-event parse rate cannot reach a pre-set beta threshold |
| Free-tool gravity | Strong usage but near-zero paid conversion | Keep free tier; pursue campus licence only if measurable student outcomes and admin sponsor exist |
| Recommendations feel wrong | Low acceptance, edits or “this is wrong” rate | Fallback to deterministic ranking; do not auto-create or write back; kill LLM feature if it does not improve accepted/completed sessions |
| Fake AI task flood | High dismissal/dedup complaints | Closed templates, budgets, daily digest, opt-in auto mode; no mass generation |
| Academic-year churn | Usage collapses after exams/summer | Cohort retention and reactivation campaigns; do not count seasonal use as durable retention |
| Privacy/security | Students/universities reject calendar access | Read-only, local/minimised payloads, explicit retention, no titles for personal busy blocks; pause university sales without security evidence |
| Motion/Reclaim move down-market | Student plans/discounts plus academic features appear | Compete on academic ontology, distribution and trust; do not assume a permanent feature moat |
| Desktop distribution dead end | Students need mobile reminders/quick capture | Web-first responsive capture and shared codebase plan; desktop local-first remains trust wedge but not sole channel |
| University procurement drag | Pilot cannot pass IT/legal in one term | Run self-serve in parallel; require a named sponsor and time-boxed pilot before investing in deep B2B connectors |

## 10. What to validate next — 10 interview / experiment questions

1. When a deadline is due in 48 hours, what exact tools and steps do you use before starting work?
2. Can a student import an actual timetable via ICS in under two minutes, and what percentage of events are correctly classified into modules/types?
3. Given one real week and three real deadlines, do students accept a deterministic suggested block more often than they create one manually?
4. Does the “remaining effort vs free time” at-risk explanation change behaviour, or is it ignored?
5. Which input is hardest to provide accurately: duration, deadline, module, energy or preferred time?
6. Does “recommend, never hijack” increase trust and acceptance compared with auto-writing the calendar?
7. Does the LLM bounded re-ranker/explanation improve acceptance and completion before deadline over the deterministic baseline? Set a pre-registered uplift threshold.
8. What is the paid conversion at £3, £6 and £9/month versus academic-year prepaid, after a student has accepted at least three suggestions?
9. Do students return after exams and at the next term/year, and which cohorts retain: undergraduates, taught master’s, commuters, high-load STEM or ADHD/executive-function users?
10. Who will pay for a campus pilot—student, parent, student-success/wellbeing, digital education, IT or careers—and what outcome would justify renewal?

## 11. Source appendix

### Competitor primary sources

- [MyStudyLife](https://mystudylife.com/), [tour](https://mystudylife.com/tour/), [offers](https://mystudylife.com/special-offers/) — accessed 20 Oct 2026.
- [iStudiez Pro App Store listing](https://apps.apple.com/us/app/istudiez-pro-legendary-planner/id310636441) — accessed 20 Oct 2026.
- [Todoist pricing](https://todoist.com/pricing) — accessed 20 Oct 2026.
- [TickTick upgrade/pricing](https://ticktick.com/about/upgrade), [integrations](https://ticktick.com/integrations) — accessed 20 Oct 2026.
- [Google Workspace pricing](https://workspace.google.com/pricing), [Gemini Calendar help](https://support.google.com/gemini/answer/15305236) — accessed 20 Oct 2026.
- [Motion pricing](https://www.usemotion.com/pricing), [AI Calendar](https://www.usemotion.com/features/ai-calendar) — accessed 20 Oct 2026.
- [Reclaim pricing](https://reclaim.ai/pricing) — accessed 20 Oct 2026.
- [Morgen pricing](https://morgen.so/pricing) — accessed 20 Oct 2026.
- [Structured](https://structured.app/), [planning assistance](https://structured.app/planning-assistance), [App Store listing](https://apps.apple.com/pa/app/structured-daily-planner-todo/id1499198946) — accessed 20 Oct 2026.
- [Notion pricing](https://www.notion.com/pricing), [Notion Calendar](https://www.notion.com/product/calendar) — accessed 20 Oct 2026.
- [Forest](https://www.forestapp.cc/), [Tiimo product](https://www.tiimoapp.com/product), [Tiimo FAQ](https://www.tiimoapp.com/faq), [Goblin Tools](https://goblin.tools/), [About Goblin Tools](https://goblin.tools/About) — accessed 20 Oct 2026.
- [Canvas/Instructure](https://www.instructure.com/lms-learning-management-system), [Moodle pricing](https://moodle.com/pricing/), [Blackboard/Anthology](https://www.blackboard.com/why-choose-blackboard) — accessed 20 Oct 2026.
- [OpenAI connected apps help](https://help.openai.com/en/articles/11487775-connectors-in-chatgpt), [Claude Google Workspace connectors](https://support.claude.com/en/articles/10166901-use-google-workspace-connectors), [Google “Help me schedule”](https://blog.google/products-and-platforms/products/workspace/help-me-schedule-gmail-gemini/) — accessed 20 Oct 2026.

### Education and market sources

- [HESA: Higher Education Student Statistics UK 2024/25](https://www.hesa.ac.uk/news/27-01-2026/sb273-higher-education-student-statistics), published 27 Jan 2026.
- [Imperial College London: Our people in numbers 2024–25](https://www.imperial.ac.uk/admin-services/finance/annual-report/imperial-in-202425/our-environment/our-people-in-numbers/), accessed 20 Oct 2026.
- [Russell Group homepage and student facts](https://www.russellgroup.ac.uk/), accessed 20 Oct 2026.
- [HEA Ireland key facts and figures](https://hea.ie/statistics/data-for-download-and-visualisations/key-facts-figures-report/), accessed 20 Oct 2026; the Ireland enrolment figure requires verification in the downloadable dataset before external publication.
- [UNESCO higher education](https://www.unesco.org/en/higher-education), accessed 20 Oct 2026.

## Bottom line

The category is crowded, but the student-specific workload-feasibility wedge is still open. Build the smallest product that proves: **academic calendar in, real deadlines in, one feasible next action out, with the user in control.**

If we only validate three things next week, they are: **(1) students will connect/import a real timetable, (2) a solver-backed suggestion materially improves completed-before-deadline work versus their current workflow, and (3) enough students or one university budget holder will pay for that improvement.**