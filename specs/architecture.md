# Ascension — Architecture Overview

> Written before deployment as a reference for the system design.

## System diagram

```
[React Frontend]  ──HTTP/REST──►  [.NET 10 API]  ──SQL──►  [PostgreSQL on Neon]
      │                                  │
      └──────WebSocket (SignalR)──────────┘
```

## Frontend (React + TypeScript + Vite)

Runs in the browser. Never touches the database directly — all data goes
through the API.

**Key libraries:**
- **React Router** — client-side routing between pages (dashboard, quests, leaderboard)
- **Zustand** — global state management for auth token, player profile, theme preference, and live notifications. Persisted to localStorage so the player stays logged in across refreshes.
- **Axios** — HTTP client with a request interceptor that automatically attaches the JWT token to every request
- **SignalR client** — maintains a persistent WebSocket connection for real-time notifications
- **Tailwind CSS** — utility-first styling with CSS custom properties for theme switching

**Pages:**
- `/login` — JWT authentication
- `/register` — player onboarding (sets Focus, DaysPerWeek, Equipment)
- `/dashboard` — player profile, XP bar, stats radar chart, daily quest, system log
- `/quests` — daily quest + Weekly Gate with complete actions
- `/attributes` — full attribute matrix with radar chart
- `/leaderboard` — ranked player list

## Backend (.NET 10 Web API)

Runs on Azure App Service. Handles all business logic — the frontend is just a display layer.

**Key components:**
- **Controllers** — `AuthController` (register/login), `QuestsController` (quest CRUD), `PlayersController` (profile, leaderboard)
- **QuestService** — the quest engine: generation, streak tracking, penalty application, Weekly Gate logic, XP/level calculation
- **NotificationHub** — SignalR hub that pushes real-time events to connected players
- **AscensionDbContext** — EF Core database context; all database access goes through here
- **ASP.NET Core Identity** — handles user accounts, password hashing, user management
- **JWT middleware** — validates Bearer tokens on every protected endpoint

**Request flow:**
1. Browser sends HTTP request with `Authorization: Bearer <token>`
2. JWT middleware validates the token and extracts the player ID
3. Controller method runs, calls services/DbContext as needed
4. Response is serialised to JSON and returned
5. For quest completions, `QuestService` also pushes a SignalR event to the player's connection group

## Database (PostgreSQL on Neon)

Hosted on Neon's free tier. Schema managed by EF Core migrations — never hand-written SQL.

**Key tables:** AspNetUsers (Identity), StatBlocks, Goals, Quests, Achievements, PlayerAchievements

## Security layers

1. Passwords hashed by Identity (PBKDF2 + HMAC-SHA256)
2. JWT tokens signed with HMAC-SHA256, expire after 7 days
3. Rate limiting: 30 requests/minute per client
4. EF Core parameterised queries (SQL injection impossible)
5. DTOs on all endpoints (raw entities never exposed)
6. Secrets in `dotnet user-secrets` locally, Azure environment variables in production

## Deployment

- **Frontend** → Azure Static Web Apps (free tier)
- **Backend** → Azure App Service (free F1 tier)
- **Database** → Neon PostgreSQL (free tier, always-on)