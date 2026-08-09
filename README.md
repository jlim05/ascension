# ⚔️ Ascension

> *"You have acquired the qualifications to become a Player."*
>
> A Solo Leveling–inspired gym progression tracker. Set your goals, receive a
> daily quest from **the System**, complete your training to earn XP and stats,
> climb the Hunter Ranks (E → S), and don't fail your quests — the Penalty is real.

## 🔗 Deployment

| What | Link |
|------|------|
| **Live app (frontend)** | https://ascension-blush.vercel.app |
| **API (backend)** | https://ascension-api.onrender.com |
| **Scalar API docs** | https://ascension-api.onrender.com/scalar/v1 |
| **Health check** | https://ascension-api.onrender.com/health |


> Hosted on free tiers — the API and database sleep when idle, so the very first
> request may take up to a minute. Everything is instant once it wakes.

---

## 📖 Introduction

Ascension turns gym training into an RPG. Every user is a **Player** who receives a
**Daily Quest** generated from their personal goals (focus, training days, equipment).
Completing quests grants **XP** and grows four stats — **STR**, **AGI**, **VIT**, and **INT** —
which raise your **Level** and **Hunter Rank**. Miss a quest and the **Penalty** docks your
stats and resets your streak; clear the **Weekly Gate** and you earn a **Day-Off Token**
to protect a streak you can't keep.

It's built as a full-stack app: a **.NET 10 / EF Core / PostgreSQL** API and a
**React + TypeScript** front end with a custom "System window" interface.

---

## 🎯 How it relates to the theme (Gamification)

Ascension is built around the gamification loop from *Solo Leveling*, applying HCI
principles to keep training motivating:

- **Points & progression** — XP, Levels, and the E→D→C→B→A→S Hunter Rank ladder.
- **Quests** — goal-driven **Daily Quests** plus a harder **Weekly Gate**.
- **Streaks** — a 5-day streak unlocks an **XP boost** multiplier.
- **Stats** — STR / AGI / VIT / INT grow from the type of training you log.
- **Leaderboard** — Players are ranked by Level/XP against each other.
- **Compassionate penalty design** — failing a quest applies a *recoverable* penalty
  (small stat decay + streak reset) with a follow-up **Penalty Quest** to recover,
  and the **Day-Off Token** as a streak-freeze. This deliberately counters
  loss-aversion so the game motivates rather than punishes.

---

## ✨ What makes Ascension unique

- A genuine **System-window aesthetic** (glowing cyan UI, scanline overlay, mana panels)
  that gives the app a distinct visual identity inspired by *Solo Leveling*.
- A **deterministic, goal-driven quest engine** that personalises each day's training
  based on the player's focus (Bulking, Cutting, Maintain, MainGain).
- **Live notifications** — quest completions and level-ups arrive in real time via WebSockets.
- **Dual theme system** — dark System mode and light Solar Ascension mode with fully
  distinct design languages, not just a colour inversion.
- **Editable directive** — the player's training goal is a first-class, editable
  resource, so the quest engine adapts the moment your training does.

The UI is responsive: a fixed sidebar on desktop collapses to a bottom tab bar
on mobile, panels reflow from two columns to one, and the layout was checked at
375px, 768px and 1440px.

---

## 🚀 Advanced features

> Only three features are marked. These are my chosen three.

### ⚡ WebSockets
Real-time notifications via SignalR. When a player completes a quest or levels up,
a notification is pushed instantly from the server to the browser without any
page refresh or polling. The frontend maintains a persistent WebSocket connection
through SignalR's `HubConnection`, authenticated with the player's JWT token.
The server pushes `QuestCompleted` events to a player-specific group so
notifications are private and targeted. The connection reconnects automatically
if dropped.

### 🌓 Theme switching
Full light/dark mode toggle with persistent preference via Zustand + localStorage.
Dark mode uses the **System** aesthetic (electric cyan on near-black, scanline
overlay, glassmorphic mana panels). Light mode uses the **Solar Ascension**
palette (Electric Indigo on pure white, frosted glass panels, blueprint grid
overlay). The toggle lives in the top navbar and applies instantly across all
pages via CSS custom properties on the `html` element — no page reload required.

### 🔐 Security measures
Minimum two measures implemented, each justified below.

**1. Password hashing — ASP.NET Core Identity**
User passwords are never stored in plain text. ASP.NET Core Identity
automatically hashes every password using PBKDF2 with HMAC-SHA256, a random
salt, and 100,000 iterations before storing it in the database. This means that
even if the Neon PostgreSQL database were breached, an attacker would be unable
to recover user passwords. This is critical for Ascension because players may
reuse passwords across other services — protecting them here protects them
everywhere.

**2. Rate limiting — global, IP-partitioned fixed window**
Every request passes through a *global* rate limiter: 30 requests per minute per
client IP, queue of 5, excess requests get `429 Too Many Requests` with a
`Retry-After` header. This prevents brute-force attacks on `/api/auth/login`
(where an attacker might try thousands of password combinations) and protects
the quest engine from abuse — a script repeatedly hitting
`/api/quests/{id}/complete` would otherwise farm unlimited XP.

Two details matter here. It is registered as `GlobalLimiter` rather than a
*named* policy, because a named policy only applies to endpoints that opt in
with `[EnableRateLimiting]` — a policy nobody references silently protects
nothing. And it is partitioned by client IP (read from `X-Forwarded-For`, which
`UseForwardedHeaders` populates behind Render's proxy) so one abusive client
cannot exhaust the budget for every other player. SignalR is exempt, since a
reconnect storm on a long-lived WebSocket would otherwise burn the window.

**3. JWT authentication + authorisation**
All player-specific endpoints (`/api/quests`, `/api/players`) require a valid
signed JWT token in the `Authorization: Bearer` header. Tokens are signed with
HMAC-SHA256 using a secret stored in `dotnet user-secrets` locally and Render
environment variables in production — never in source code. Tokens expire after
7 days. This ensures players can only access their own data and cannot
manipulate other players' quests or stats.

**4. Input validation and sanitisation**
All incoming data is validated before reaching the database. Identity enforces
password rules (minimum 6 characters, at least one digit). `GoalDto` carries
`[Required]`, `[StringLength]` and `[Range(1, 7)]` attributes, and `Focus` is
checked against the `FocusType` allow-list — an unrecognised focus is rejected
at the boundary rather than silently falling through to a default in the quest
engine. Entity Framework Core uses parameterised queries for all database
operations, making SQL injection impossible. DTOs are used on every endpoint so
raw entity classes are never exposed to or accepted from the outside world — a
player cannot, for example, send a request that sets their own level to 99, or
set `PlayerId` on a goal to reassign someone else's record to themselves.

---

## 🔁 API and CRUD

Full CRUD is implemented on the **Goal** resource — the training directive that
drives quest generation. The owning player is read from the JWT rather than the
URL, so a player structurally cannot read or mutate another player's goal.

| Verb | Route | Operation |
|------|-------|-----------|
| `POST` | `/api/goals` | **Create** — 409 if a directive already exists |
| `GET` | `/api/goals` | **Read** — 404 when none is set |
| `PUT` | `/api/goals` | **Update** |
| `DELETE` | `/api/goals` | **Delete** — quests fall back to the Bulking focus |

Exercised in the UI at `/goals` ("Directive" in the sidebar), and covered by
`backend.tests/GoalsControllerTests.cs` and `frontend/src/test/GoalsPage.test.tsx`.

Other endpoints:

| Verb | Route | Purpose |
|------|-------|---------|
| `POST` | `/api/auth/register` | Create a Player, StatBlock and starting Goal |
| `POST` | `/api/auth/login` | Exchange credentials for a JWT |
| `GET` | `/api/players/me` | Profile, stats, goal, achievements |
| `GET` | `/api/players/leaderboard` | Top 50 players by level then XP |
| `GET` | `/api/quests/today` | Today's quest, generating it if needed |
| `GET` | `/api/quests/weekly-gate` | This week's Gate quest |
| `POST` | `/api/quests/{id}/complete` | Complete a quest, award XP and stats |
| `WS` | `/hubs/notifications` | SignalR hub for live notifications |

**Scalar** (not Swagger) serves the interactive documentation at `/scalar/v1`.
It is mapped in *every* environment, not just Development — the deployed Render
instance runs as Production, so a Development-only mapping would leave the live
API undocumented.

---

## 🛠️ Tech stack

| Layer    | Tech |
|----------|------|
| Frontend | React, TypeScript, Vite, React Router, Zustand, Tailwind CSS |
| Backend  | .NET 10 Web API, EF Core, ASP.NET Core Identity + JWT, SignalR, Scalar, xUnit |
| Database | PostgreSQL (Neon) |
| Deploy   | Render (backend, Docker), Vercel (frontend), Neon PostgreSQL |

---

## 🧑‍💻 Running locally

### Backend
Requires the [.NET 10 SDK](https://dotnet.microsoft.com/download).
```bash
cd backend
dotnet run
```
- API: `http://localhost:5202`
- Scalar docs: `http://localhost:5202/scalar/v1`

You will need to configure the following user secrets:
```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "your-neon-connection-string"
dotnet user-secrets set "JwtSettings:Secret" "your-jwt-secret"
dotnet user-secrets set "JwtSettings:Issuer" "Ascension"
dotnet user-secrets set "JwtSettings:Audience" "AscensionUsers"
```

### Frontend
Requires [Node.js v20+](https://nodejs.org).
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`. Start the backend first.

Vite proxies `/api` and `/hubs` to port 5202, so no backend URL is hardcoded in
the frontend and `VITE_API_URL` stays unset for local development.

---

## ☁️ Deployment

### Backend — Render (Docker)

Render's native runtimes cover Node, Python, Ruby, Go, Rust and Elixir, but not
.NET, so the API is deployed as a **Docker** web service built from the
[`Dockerfile`](Dockerfile) at the repo root (multi-stage: `sdk:10.0` to publish,
`aspnet:10.0` to run as a non-root user).

| Setting | Value |
|---------|-------|
| Runtime | Docker |
| Dockerfile path | `./Dockerfile` |
| Docker build context | `.` |
| Health check path | `/health` |

Environment variables:
```
ConnectionStrings__DefaultConnection   # Neon connection string
JwtSettings__Secret                    # signing secret
JwtSettings__Issuer                    # Ascension
JwtSettings__Audience                  # AscensionUsers
Cors__AllowedOrigins__0                # https://<frontend>.vercel.app
```
`PORT` is injected by Render (default `10000`); `Program.cs` reads it and binds
`0.0.0.0`. Allowed CORS origins are read from configuration rather than
hardcoded, so pointing the API at a new frontend URL is an environment variable
change, not a code change.

### Frontend — Vercel

Root directory `frontend`, standard Vite build (`npm run build`, output `dist`),
with one environment variable:
```
VITE_API_URL=https://ascension-api.onrender.com
```
This is the backend **origin** — `/api` and `/hubs/notifications` are appended
in [`src/config.ts`](frontend/src/config.ts). See
[`.env.example`](frontend/.env.example).

[`vercel.json`](frontend/vercel.json) rewrites all paths to `index.html`.
The app uses `BrowserRouter`, so without it a refresh or direct visit to a route
like `/dashboard` would 404 — those paths exist only in the client-side router,
not on disk.

> On Render's and Neon's free tiers both the service and the database suspend
> after a period of inactivity, so the first request after an idle spell can
> take up to a minute while they wake.

---

## 🧪 Testing

```bash
# Backend (xUnit) — quest engine + Goals CRUD
dotnet test Ascension.slnx

# Frontend (Vitest + Testing Library)
cd frontend && npm run test:run
```

**Backend** — `QuestServiceTests` covers the quest engine: generation per focus,
idempotency (asking twice on the same day returns the same quest), the streak
and XP award, the missed-quest penalty, and Weekly Gate timing.
`GoalsControllerTests` covers all four CRUD verbs plus the ownership boundary —
that one player's request cannot read, update or delete another player's goal.

**Frontend** — 20 tests across the auth store, theme store, login page, and the
Goals page (each CRUD verb, the two-step delete confirmation, and error states).

---

## 📁 Repository structure
```
ascension/
├── backend/        # .NET 10 Web API, EF Core, PostgreSQL, SignalR
├── backend.tests/  # xUnit test project
├── frontend/       # React + TypeScript (Vite)
├── specs/          # Planning, data model, and AI prompt logs (.md)
└── README.md
```

---

## 🔄 Self-reflection

If I did this again, I would design the data model with all features in mind from
the start rather than iterating on it mid-build. I would also set up deployment
earlier in the process rather than at the end, as environment differences between
local and production caused unexpected issues. I found TDD genuinely useful for the
quest engine — writing tests first caught edge cases I wouldn't have considered
otherwise (the streak reset, the penalty deduction, the Weekly Gate timing), and
I would apply that approach to more of the codebase next time. The Solo Leveling
theme also proved to be a strong design constraint — having a clear aesthetic
reference made every UI decision faster and more consistent.

---

## 🤖 AI usage

AI assistance and the prompts used throughout development are documented in the
[`/specs`](./specs) folder.