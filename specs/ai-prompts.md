# Ascension — AI Usage & Prompt Log

> This file documents significant AI interactions during the development of Ascension.
> Tools used: Claude (claude.ai chat), GitHub Copilot (VS Code), AI design tool (UI generation).

---

## Planning phase

### Project concept and feature design
**Tool:** Claude chat
**Prompt summary:** Described the Solo Leveling anime concept and asked for help
mapping it to a gamified gym app. Discussed the quest engine rules (streaks,
penalties, Weekly Gate, XP boost), data model design, and which advanced features
to prioritise.
**Output:** Full game design document, ERD, feature priority list, and build roadmap.
**My decision:** Chose Security Measures, WebSockets, and Theme Switching as the
three marked advanced features. Chose Bulking/Cutting/Maintain/MainGain as focus
types instead of the generic strength/cardio split.

### Data model design
**Tool:** Claude chat
**Prompt summary:** Walked through each entity (Player, StatBlock, Goal, Quest,
Achievement) and discussed relationships, foreign key types, and the EF Core
configuration needed for self-referential relationships.
**Output:** `specs/data-model.md` — the entity table used to build the C# models.
**My decision:** Used a separate `StatBlock` table rather than columns on `Player`
to keep concerns separated.

---

## Backend development

### Quest engine TDD
**Tool:** Claude chat (pair programming)
**Approach:** Test-Driven Development — wrote failing tests first, then implemented
`QuestService` to make them pass. Claude acted as navigator explaining each concept
before I typed the code.
**Key tests written:**
- `GenerateQuestForToday_WhenNoQuestExists_CreatesQuest`
- `GetOrGenerateTodaysQuest_WhenQuestAlreadyExists_ReturnsSameQuest`
- `GenerateQuest_ForMainGain_GivesHigherXPThanBulking`
- `GenerateQuest_ForCutting_TypeIsAGIOrVIT`
- `CompleteQuest_IncreasesStreakAndAwardsXP`
- `FailedQuest_ResetsStreakAndDeductsStats`
- `GenerateWeeklyGate_OnMonday_CreatesGateQuest`

### SignalR WebSocket setup
**Tool:** Claude chat
**Prompt summary:** Asked how to add real-time notifications so quest completions
push to the browser. Claude explained SignalR hubs, player groups, and the JWT
token handshake for WebSocket connections.
**Key learning:** SignalR sends the JWT as a query parameter (`access_token`) for
WebSocket connections, not a header — the backend needs `OnMessageReceived` events
to handle this.

---

## Frontend development

### UI design generation
**Tool:** AI design tool (separate from Claude chat)
**Prompt used:** Full prompt in `specs/design-prompt.md` — described the Solo
Leveling "System window" aesthetic, colour palette, typography (Syne, JetBrains
Mono, Geist), and all pages required.
**Output:** HTML/CSS design reference and `DESIGN.md` design system token file.
**My decision:** Adapted the generated design into React components rather than
using the raw HTML, wiring real data from the API.

### Theme switching implementation
**Tool:** Claude chat
**Prompt summary:** Asked how to implement persistent light/dark theme switching
using CSS custom properties and Zustand.
**Key learning:** `data-theme` is set on the `html` element itself, so CSS selectors
must be `html[data-theme="light"]` not `[data-theme="light"] html`.

### GitHub Copilot usage
**Tool:** GitHub Copilot (VS Code)
Used for autocomplete on repetitive patterns (entity classes, Tailwind class
strings, TypeScript interfaces) and small refactors. All Copilot suggestions were
reviewed and manually accepted or rejected.

---

## Pre-submission compliance review

### Auditing the repo against the assessment brief
**Tool:** Claude (agent mode, with the repo and the assessment PDF as context)
**Prompt used:**
> "Check the current folder on the requirements from the pdf. Change what is
> needed and also generate me a script for the video part of the pdf"

**Approach:** Rather than asking "does this look finished?", I gave the agent the
brief and the codebase together and had it check each stated requirement against
the actual source — not the README's claims about the source. That distinction
mattered: two of the four findings were places where the README described
behaviour the code did not have.

**What it found, and what I did about each:**

| Finding | Severity | Resolution |
|---|---|---|
| No `PUT`/`DELETE` anywhere — CRUD incomplete | Instant fail per the brief | Built `GoalsController` with all four verbs + a `/goals` page (see `goals-crud.md`) |
| `MapScalarApiReference()` sat inside `if (IsDevelopment())` | High — the deployed API had no docs | Mapped Scalar unconditionally |
| Rate limiter defined as a *named* policy no endpoint referenced | High — the README claimed protection that did not exist | Rewrote as a `GlobalLimiter`, partitioned by client IP |
| Nav used `<a href>` instead of `<Link>` | Medium | Swapped to `Link`; full reloads were dropping the SignalR connection |

**Where I overrode the AI:** it proposed a `Goals` *collection* with an
"active goal" flag, which is a more conventional REST shape. I rejected it —
that needs a schema migration and an extra `IsActive` concept the quest engine
would then have to reason about, for no user-facing benefit. A player has one
directive. `/api/goals` addressing a single resource keyed off the JWT is
simpler and removes an entire class of authorisation bug, since there is no id
in the URL to tamper with.

**The lesson I actually took from this:** the rate-limiting bug is the one worth
remembering. The code compiled, the middleware was registered, the README
paragraph was confident and specific — and it protected nothing, because
`AddFixedWindowLimiter("fixed", …)` creates a policy that only applies to
endpoints decorated with `[EnableRateLimiting("fixed")]`. Nothing in the app
was. I had written that README section myself from the API surface rather than
from a test. A security control you have not *observed* failing closed is a
security control you have not verified.

---

## Decisions made without AI

- Chose to remove multiplayer challenges due to complexity and time constraints,
  replacing with Security Measures as the third advanced feature.
- Chose TDD for the quest engine specifically because the logic is rule-heavy
  and TDD catches edge cases better than after-the-fact testing.
- Chose Neon over Azure Database for PostgreSQL to stay on the free tier.
- Chose the Solo Leveling theme independently — AI helped execute it but the
  concept was my own.