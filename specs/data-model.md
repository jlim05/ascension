# Ascension — Data Model Design

> Designed collaboratively with Claude (chat) before implementation in EF Core.
> This document is the source of truth for the database schema. Update it if the
> schema changes during development.

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

Relationships: 1–1 StatBlock, 1–1 Goal, 1–many Quest, 1–many InventoryItem,
many–many Achievement (via PlayerAchievement), many Challenge (as Challenger
or Opponent — two separate FK relationships to the same table).

### StatBlock
1–1 with Player. The four RPG stats that grow from training.

| Field | Type | Notes |
|---|---|---|
| Id | Guid (PK) | |
| PlayerId | Guid (FK) | |
| STR | int | strength / progressive overload |
| AGI | int | conditioning / cardio |
| VIT | int | consistency / recovery |
| INT | int | nutrition / sleep (optional life stat) |

### Goal
1–1 with Player. Captured at onboarding, drives quest generation.

| Field | Type | Notes |
|---|---|---|
| Id | Guid (PK) | |
| PlayerId | Guid (FK) | |
| Focus | string | strength / hypertrophy / endurance / fat-loss |
| DaysPerWeek | int | |
| Equipment | string | free text or enum, e.g. "full gym", "home/dumbbells" |

### Quest
Many per Player. Daily quests + the special Weekly Gate.

| Field | Type | Notes |
|---|---|---|
| Id | Guid (PK) | |
| PlayerId | Guid (FK) | |
| Type | string | links to which stat it trains (STR/AGI/VIT/INT) |
| Description | string | generated text, e.g. "Complete a push session" |
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

**PlayerAchievement** (join table)
| Field | Type |
|---|---|
| PlayerId | Guid (FK) |
| AchievementId | Guid (FK) |
| UnlockedAt | DateTime |

### InventoryItem
Many per Player. Virtual items earned from quests; what gets staked in Challenges.

| Field | Type | Notes |
|---|---|---|
| Id | Guid (PK) | |
| PlayerId | Guid (FK) | current owner |
| Name | string | |
| Rarity | string | common / rare / epic, etc. |

### Challenge
A PvP duel. Two FKs to Player (Challenger, Opponent) — EF Core needs explicit
configuration since both point to the same table.

| Field | Type | Notes |
|---|---|---|
| Id | Guid (PK) | |
| ChallengerId | Guid (FK → Player) | |
| OpponentId | Guid (FK → Player) | |
| QuestDescription | string | what they're racing to complete |
| Status | string | Pending / Active / Completed / Cancelled |
| WinnerId | Guid? (nullable FK → Player) | null until resolved |
| CreatedAt | DateTime | |
| ResolvesBy | DateTime | deadline |

**Design rule:** the server decides the winner, never the client. Resolution
requires mutual confirmation or a time-limit fallback (TBD when we build this
feature — see open questions below).

### ChallengeStake (join table)
Records which items each side wagered. One challenge can have multiple staked
items per player.

| Field | Type |
|---|---|
| Id | Guid (PK) |
| ChallengeId | Guid (FK) |
| PlayerId | Guid (FK) | which side staked this item |
| InventoryItemId | Guid (FK) | |

## Open questions (resolve before building Multiplayer feature)
- How is a Challenge confirmed complete — mutual confirm, or first-to-report
  with a dispute window?
- What happens to staked items if a Challenge expires unresolved (return to
  owners vs. forfeit)?
- Rate limit on challenges to prevent spam?

## Build order
1. Player (extends Identity), StatBlock, Goal — core onboarding flow
2. Quest — daily quest engine, streak logic, Weekly Gate
3. Achievement / PlayerAchievement
4. InventoryItem
5. Challenge / ChallengeStake — multiplayer (last, depends on InventoryItem)
