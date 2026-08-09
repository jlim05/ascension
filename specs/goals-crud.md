# Spec — Goal CRUD (the Training Directive)

## Why this exists

The assessment brief requires "at minimum, CRUD operations (Create, Read,
Update, Delete)" and treats a missing basic requirement as an instant fail.
Before this change the API had only reads plus two writes (`POST
/api/auth/register`, `POST /api/quests/{id}/complete`) — no update, no delete.

Rather than bolt on a throwaway entity to satisfy the checklist, I picked the
resource that already deserved to be editable. A player's **Goal** — focus,
training days per week, available equipment — is set once at registration and
then drives every quest the engine generates. Being unable to change it was a
genuine product hole: your training changes, so your directive should too.

## Resource shape

A player has exactly one Goal. That makes the URL `/api/goals`, with no `{id}`
segment — the owning player is read from the `NameIdentifier` claim on the JWT.

This is deliberate. With no id in the URL there is no id to tamper with, so
horizontal privilege escalation ("fetch someone else's goal by guessing a GUID")
is not a bug that can be introduced later by a careless query. Every handler
filters on `g.PlayerId == playerId` from the token.

| Verb | Route | Success | Failure |
|---|---|---|---|
| `POST` | `/api/goals` | `201 Created` | `409` if one exists, `400` on invalid focus |
| `GET` | `/api/goals` | `200 OK` | `404` when none set |
| `PUT` | `/api/goals` | `200 OK` | `404` when none set, `400` on invalid focus |
| `DELETE` | `/api/goals` | `204 No Content` | `404` when none set |

## Design decisions

**Create returns 409 rather than upserting.** A silent upsert hides client bugs.
If the client thinks it is creating and the server already holds a directive,
the client's model of the world is wrong and it should be told so.

**Delete is allowed, and degrades rather than breaks.** `QuestService` already
read the goal defensively (`goal?.Focus ?? FocusType.Bulking`), so a player
with no directive still receives quests — they just default to the Bulking
focus. Delete is therefore a real operation with a real, survivable outcome,
not a destructive dead end.

**Focus is validated against an allow-list, not just a length check.** The quest
engine is a `switch` on this string, with a `_ =>` fallback to Bulking. An
unrecognised value would therefore be accepted, stored, and then silently
ignored — the worst kind of bug, since nothing errors and the player just gets
quests that do not match what they asked for. `FocusType.IsValid` rejects it at
the boundary instead.

This also uncovered an existing bug: `AuthController.Register` defaulted
`Focus` to `"strength"`, which is not a `FocusType`. Every player who registered
without explicitly choosing a focus was silently assigned Bulking quests through
that fallback. Fixed to default to `FocusType.Bulking` explicitly.

**Responses are projections, never entities.** `ToResponse` returns
`{ id, focus, daysPerWeek, equipment }`. `PlayerId` and EF navigation
properties never cross the wire, and `GoalDto` has no `PlayerId` field for a
client to set — so a request cannot reassign a goal to a different player.

## UI

`/goals`, "Directive" in the sidebar. Three states:

- **No directive** — the page opens straight into the create form. A `404` from
  `GET` is the expected empty state, not an error to show the player.
- **Directive set** — read view with focus, days/week and equipment, plus
  *Amend* and *Revoke*.
- **Editing** — focus as four selectable cards (each explaining which stat it
  trains, so the choice is informed), days/week as a 1–7 slider that cannot
  produce an out-of-range value, equipment as a free-text field capped at 60
  characters to match the DTO.

Revoke requires a second explicit confirmation, and the confirmation tells the
player what will actually happen: progress is kept, quests fall back to Bulking.
Destructive actions should never be one click, and the warning should describe
the consequence rather than just asking "are you sure?".

## Tests

`backend.tests/GoalsControllerTests.cs` — 10 tests: each verb's happy path, the
409 on duplicate create, 404s on read/update/delete with nothing set, rejection
of an invalid focus, a full create → read → update → delete round trip, and two
ownership tests proving one player's request cannot reach another player's goal.

`frontend/src/test/GoalsPage.test.tsx` — 7 tests: rendering a fetched goal,
falling into the create form on 404, `createGoal` vs `updateGoal` dispatch,
the two-step delete, cancelling the delete, and the save-error state.
