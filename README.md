# ⚔️ Ascension

> *"You have acquired the qualifications to become a Player."*
>
> A Solo Leveling–inspired gym progression tracker. Set your goals, receive a
> daily quest from **the System**, complete your training to earn XP and stats,
> climb the Hunter Ranks (E → S), and don't fail your quests — the Penalty is real.

**🔗 Live demo:** _TODO — add deployment link before submission_
**🎥 Video:** _TODO — add public video link before submission_

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

**2. Rate limiting — Fixed window**
All API endpoints are protected by a fixed-window rate limiter: 30 requests per
minute per client, with a queue of 5. Excess requests receive a `429 Too Many
Requests` response. This prevents brute-force attacks on the login endpoint
(where an attacker might try thousands of password combinations) and protects
the quest engine from abuse (e.g., a script repeatedly hitting
`/api/quests/{id}/complete`). Without rate limiting, both attacks are trivial
against a public API.

**3. JWT authentication + authorisation**
All player-specific endpoints (`/api/quests`, `/api/players`) require a valid
signed JWT token in the `Authorization: Bearer` header. Tokens are signed with
HMAC-SHA256 using a secret stored in `dotnet user-secrets` locally and Render
environment variables in production — never in source code. Tokens expire after
7 days. This ensures players can only access their own data and cannot
manipulate other players' quests or stats.

**4. Input validation and sanitisation**
All incoming data is validated before reaching the database. Identity enforces
password rules (minimum 6 characters, at least one digit). Entity Framework
Core uses parameterised queries for all database operations, making SQL
injection impossible. DTOs (Data Transfer Objects) are used on all endpoints so
raw entity classes are never exposed to or accepted from the outside world —
a player cannot, for example, send a request that sets their own level to 99.

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
- Scalar docs: `http://localhost:5202/scalar`

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

Standard Vite build (`npm run build`, output `dist`) with one environment
variable:
```
VITE_API_URL=https://<backend>.onrender.com
```
This is the backend **origin** — `/api` and `/hubs/notifications` are appended
in [`src/config.ts`](frontend/src/config.ts). See
[`.env.example`](frontend/.env.example).

> On Render's and Neon's free tiers both the service and the database suspend
> after a period of inactivity, so the first request after an idle spell can
> take up to a minute while they wake.

---

## 🧪 Testing
```bash
# Backend (xUnit)
cd ~/Documents/ascension
dotnet test Ascension.slnx

# Frontend
cd frontend && npm run test
```

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