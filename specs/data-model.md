# Ascension — Data Model Design

> Designed collaboratively with Claude (chat) before implementation in EF Core.
> This document is the source of truth for the database schema.

## Entities

### Player
The core user/identity. Identity fields (username, password hash, email) are
managed by ASP.NET Core Identity; this table extends that with the RPG layer.

| Field | Type | Notes |
|---|---|---|
| Id | Guid (PK) | |
| Level | int | starts at 1 |
| CurrentXP | int | XP toward next level |
| Rank | string | E, D, C, B, A, S |
| CurrentStreak | int | consecutive days of completed quests |
| DayOffTokens | int | earned by clearing Weekly Gates |

Relationships: 1–1 StatBlock, 1–1 Goal, 1–many Quest,
many–many Achievement (via PlayerAchievement).

### StatBlock
1–1 with Player. The four RPG stats that grow from training.

| Field | Type | Notes |
|---|---|---|
| Id | Guid (PK) | |
| PlayerId | Guid (FK) | |
| STR | int | strength / progressive overload |
| AGI | int | conditioning / cardio |
| VIT | int | consistency / recovery |
| INT | int | nutrition / sleep |

### Goal
1–1 with Player. Captured at onboarding, drives quest generation.

| Field | Type | Notes |
|---|---|---|
| Id | Guid (PK) | |
| PlayerId | Guid (FK) | |
| Focus | string | Bulking / Cutting / Maintain / MainGain |
| DaysPerWeek | int | 1–7 |
| Equipment | string | Full Gym / Home/Dumbbells / Bodyweight Only |

### Quest
Many per Player. Daily quests + the special Weekly Gate.

| Field | Type | Notes |
|---|---|---|
| Id | Guid (PK) | |
| PlayerId | Guid (FK) | |
| Type | string | which stat it trains (STR/AGI/VIT/INT) |
| Description | string | generated text |
| XPReward | int | |
| StatReward | int | |
| Status | string | Pending / Completed / Failed |
| AssignedDate | DateTime | |
| DueDate | DateTime | |
| IsWeeklyGate | bool | true for the harder weekly special quest |

### Achievement / PlayerAchievement
Catalog of badges + a join table for who's unlocked what.

**Achievement**
| Field | Type |
|---|---|
| Id | Guid (PK) |
| Name | string |
| Description | string |
| IconKey | string |

**PlayerAchievement** (join table)
| Field | Type |
|---|---|
| PlayerId | Guid (FK) |
| AchievementId | Guid (FK) |
| UnlockedAt | DateTime |

## Quest engine rules

### Focus types and stat mapping
| Focus | Primary stat | XP reward | Notes |
|---|---|---|---|
| Bulking | STR | 110–150 | Heavy compound lifts |
| Cutting | AGI / VIT | 100–130 | Cardio + resistance |
| Maintain | VIT | 80–100 | Balanced consistency |
| MainGain | STR / AGI | 165–185 | Hardest mode, highest XP |

### Streak logic
- Completing a quest increments `CurrentStreak` by 1
- Failing or missing a quest resets `CurrentStreak` to 0
- At 5 consecutive completions, the next XP reward gets a ×1.5 boost

### Penalty on missed quest
- Yesterday's `Pending` quest is marked `Failed` when today's quest is requested
- STR −2, AGI −1, VIT −1 (never below 1)
- `CurrentStreak` resets to 0

### Weekly Gate
- Generated every Monday alongside the daily quest
- `IsWeeklyGate = true`, `DueDate = AssignedDate + 7 days`
- Higher XP reward (250–350 depending on focus)
- Completion awards +1 `DayOffToken`

### Level and rank thresholds
- Every 100 XP = 1 level
- Rank gates: E (<10), D (<20), C (<30), B (<40), A (<50), S (50+)

## Build order
1. Player (extends Identity), StatBlock, Goal — core onboarding flow
2. Quest — daily quest engine, streak logic, Weekly Gate
3. Achievement / PlayerAchievement