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

## Decisions made without AI

- Chose to remove multiplayer challenges due to complexity and time constraints,
  replacing with Security Measures as the third advanced feature.
- Chose TDD for the quest engine specifically because the logic is rule-heavy
  and TDD catches edge cases better than after-the-fact testing.
- Chose Neon over Azure Database for PostgreSQL to stay on the free tier.
- Chose the Solo Leveling theme independently — AI helped execute it but the
  concept was my own.