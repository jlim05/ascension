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
g
- **Points & progression** — XP, Levels, and the E→D→C→B→A→S Hunter Rank ladder.
- **Quests** — goal-driven **Daily Quests** plus a harder **Weekly Gate**.
- **Streaks** — a 5-day streak unlocks an **XP boost** multiplier.
- **Stats** — STR / AGI / VIT / INT grow from the type of training you log.
- **Achievements / badges** — first PR, 7-day streak, first Gate cleared, etc.
- **Leaderboard** — Players are ranked by Level/XP.
- **Compassionate penalty design** — failing a quest applies a *recoverable* penalty
  (small stat decay + streak reset) with a follow-up **Penalty Quest** to recover,
  and the **Day-Off Token** as a streak-freeze. This deliberately counters
  loss-aversion so the game motivates rather than punishes.

---

## ✨ What makes Ascension unique

- A genuine **System-window aesthetic** (glowing blue UI, level-up notifications)
  that gives the app a distinct visual identity rather than a generic dashboard.
- A **deterministic, goal-driven quest engine** that personalises each day's training.
- **Live notifications** — quest completions and level-ups arrive in real time.
- **PvP challenges** — duel another Player on a quest and wager in-app items.
- _TODO — add any extra standout features you build._

---

## 🚀 Advanced features checklist

> **Note:** Only the top 3 listed here are marked. These are my chosen three.

- [ ] **WebSockets** — real-time notifications: quest completions, level-ups, and
      live challenge updates pushed to the browser.
- [ ] **Theme switching** — light / dark mode toggle (the System window theming).
- [ ] **Multiplayer challenges** — players challenge each other to a quest and stake
      in-app virtual items; the server validates the result and the winner takes the pot.

_Bonus (not one of the marked three): user accounts with **password hashing** via
ASP.NET Core Identity, required to support multiplayer._

---

## 🛠️ Tech stack

| Layer    | Tech |
|----------|------|
| Frontend | React, TypeScript, Vite, React Router, Zustand, Tailwind, Vitest |
| Backend  | .NET 10 Web API, EF Core, ASP.NET Core Identity + JWT, Scalar, xUnit |
| Database | PostgreSQL |
| Deploy   | _TODO (e.g. Vercel + Render + Neon)_ |

---

## 🧑‍💻 Running locally

### Backend
Requires the [.NET 10 SDK](https://dotnet.microsoft.com/download).
```bash
cd backend
dotnet run
```
- API: `http://localhost:5000`
- Scalar docs: `http://localhost:5000/scalar`

### Frontend
Requires [Node.js v20+](https://nodejs.org).
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`. Start the backend first.

---

## 🧪 Testing
```bash
# Backend
cd backend && dotnet test
# Frontend
cd frontend && npm run test
```

---

## 📁 Repository structure
```
ascension/
├── backend/    # .NET 10 Web API, EF Core, PostgreSQL
├── frontend/   # React + TypeScript (Vite)
├── specs/      # Planning, design docs, and AI prompt logs (.md)
└── README.md
```

---

## 🔄 Self-reflection

_TODO — fill in before submission: if you did this again, what would you change?_

---

## 🤖 AI usage

AI assistance and the prompts used throughout development are documented in the
[`/specs`](./specs) folder.
