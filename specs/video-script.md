# Ascension, 6 minute submission video script

**Target runtime: 5:45.** The brief caps this at 6:00 and penalises anything
longer, so this is written short to absorb pauses.

**Pace:** around 150 words a minute. Total narration is about 860 words. Lines
marked `[CUT IF LONG]` are the first things to drop.

**Before you record**

- Wake the backend first (hit `/health` once, Render cold start takes a minute)
- Tabs in this order: VS Code on the specs folder, terminal, live app, Scalar
- Log in beforehand, don't record yourself typing a password
- Start in dark mode, you switch to light on camera in Part 2
- Do one full run with a timer where you can see it

---

## COLD OPEN, 0:00 to 0:26

> **SCREEN:** Live app, dashboard, dark mode, quest on screen.

"So this is Ascension. It's a gym tracker built like an RPG. You get a daily
quest based on your training goals, you go do it, you earn XP and stats, and you
climb from E rank up to S rank. Miss a quest and you take a penalty.

I'll cover two things. How I used AI, and the design decisions behind it."

---

# PART 1, HOW I USED AI (0:26 to 3:00)

## 1.1 The specs folder, 0:26 to 0:48

> **SCREEN:** VS Code, `specs/` expanded. Open `ai-prompts.md` and scroll slowly.
> Don't read it out.

"Everything I'm about to talk about is written up in my specs folder. There's a
prompt log, the data model, the architecture, and the design prompt.

I used AI in three pretty different ways, and I want to separate them out,
because each one needed a different amount of trust from me."

## 1.2 Planning, 0:48 to 1:14

> **SCREEN:** `specs/data-model.md`, scroll to the entity table.

"First one is planning. Before I wrote any code I used Claude to poke holes in
the idea, and to argue through the data model.

This table is what came out of it, and it's what I built the C# models from.
This is where I trusted AI the most, because a bad idea at this stage is cheap.
It costs you a conversation. It doesn't cost you a migration."

## 1.3 Pair programming, 1:14 to 1:56

> **SCREEN:** Split view, `QuestServiceTests.cs` left, `QuestService.cs` right.
> Then run `dotnet test` and let the green result land.

"Second one is pair programming, on the quest engine. That's the part with all
the rules in it, so I did it test first.

I'd write the failing test, explain the rule, then get the AI to talk me through
the approach before I wrote anything. Explaining it, not handing me a finished
method to paste in.

That made a difference. Writing the test first meant I had to say exactly what
the rule was, and it caught three edge cases I'd have missed. The streak
resetting, the stat deduction when you fail, and the Weekly Gate only showing up
on a Monday.

Here they are passing."

## 1.4 Auditing my own work, 1:56 to 3:00

> **SCREEN:** `Program.cs`, rate limiter block visible. This is the most important
> minute in the video. Slow down.

"The third one is the most useful. I got AI to audit my own work against the
brief before submitting.

It found something I want to be upfront about. I'd written a rate limiter. It
was registered, the app compiled, and I'd written a whole paragraph in my README
about how it stopped brute force attacks on the login endpoint.

It wasn't doing anything at all.

I'd set it up as a named policy. And in ASP.NET Core a named policy only kicks in
on endpoints that opt into it with an attribute. None of mine did. So the
middleware ran on every request and let everything straight through.

The fix is a global limiter, split by client IP. That's this bit here.

But the real lesson was that I wrote that README section by reading my own code
and assuming it worked. I never tested it. If you haven't watched a security
control actually block something, you don't know that it does."

---

# PART 2, DESIGN DECISIONS (3:00 to 5:30)

## 2.1 The penalty, 3:00 to 3:50

> **SCREEN:** Dashboard. Point at the streak counter, then the Day Off Token in
> the sidebar.

"Right, design decisions. Starting with the one I went back and forth on most.

The source material this is based on is harsh. Miss your quest, you get punished.
And loss aversion genuinely works, people will train just to protect a streak.

The problem is what happens when the streak breaks. If losing a month of progress
feels like a disaster, people don't come back. They just stop using the app.

So the penalty here is something you can recover from. You drop a couple of stat
points and your streak resets, but you get a Penalty Quest to win it back. And
clearing the Weekly Gate gets you a Day Off Token, so you can freeze your streak
on a day you genuinely can't train.

I wanted it to push you, not punish you."

## 2.2 Making the goal editable, 3:50 to 4:52

> **SCREEN:** Go to `/goals`. Change focus from Bulking to Cutting, save. Then go
> to Quests and show the quest matching the new focus.

"Next is the training directive.

Originally you set your goal when you registered and then you were stuck with it.
Which was wrong, because that goal is the input to every quest the engine makes.
Your training changes, so this should too. So now it's fully editable. Create,
read, update, delete.

Two things in there worth pointing out.

The URL is api slash goals, with no ID in it. The player comes from the JWT
instead. So there's no ID in the URL for anyone to tamper with, which means
pulling up someone else's goal isn't a bug I can accidentally introduce later.

And the focus gets checked against a list of allowed values, not just a length
check. The quest engine is a switch with a default case, so a bad value would get
saved and then quietly ignored, and you'd get quests that didn't match what you
asked for."

> **SCREEN:** Click *Revoke Directive* to show the confirmation, then cancel.

"Deleting asks you twice, and it tells you what'll actually happen instead of
just saying are you sure."

## 2.3 Two themes, 4:52 to 5:29

> **SCREEN:** Toggle dark to light in the navbar. Let it sit a beat. Then drag the
> window narrow to show the mobile tab bar.

"Third one is theming.

If you just invert a dark palette you get something washed out. A dark UI leans
on glow to show you what matters, and glow doesn't survive a white background.

So these are two separate designs. Dark is the System. Cyan on near black,
scanlines, glassy panels. Light is Solar Ascension. Indigo on white, frosted
glass, a blueprint grid. Both run off CSS variables on the root element, so
switching is instant with no reload.

And it's responsive. The sidebar becomes a bottom tab bar on mobile."

## 2.4 Close, 5:29 to 5:48

> **SCREEN:** Back to the dashboard, dark mode.

"So that's the three advanced features. WebSockets for the live notifications,
theme switching, and security.

If I did it again I'd deploy on day one instead of leaving it to the end. Most of
the problems I hit late were environment differences I couldn't see locally.

Thanks for watching."

---

## Timing

| Section | Runs | Cumulative |
|---|---|---|
| Cold open | 0:26 | 0:26 |
| 1.1 Specs folder | 0:22 | 0:48 |
| 1.2 Planning | 0:26 | 1:14 |
| 1.3 Pair programming | 0:42 | 1:56 |
| 1.4 Auditing my own work | 1:04 | 3:00 |
| 2.1 The penalty | 0:50 | 3:50 |
| 2.2 Goal editing | 1:02 | 4:52 |
| 2.3 Theming | 0:37 | 5:29 |
| 2.4 Close | 0:19 | 5:48 |

12 seconds of headroom. If your practice run comes in over 5:50, cut these in
order:

1. `[CUT IF LONG]` In 1.2, drop "It costs you a conversation. It doesn't cost you a migration."
2. `[CUT IF LONG]` In 2.1, drop "And loss aversion genuinely works, people will train just to protect a streak."
3. `[CUT IF LONG]` In 2.3, drop the colour details and just say "two separate designs, not one inverted."

---

## Delivery notes

- **The rate limiter bit is your best minute.** Two of the five marking criteria
  are presentation quality and how well you used AI, and owning a real mistake
  you found and understood shows both better than a clean demo does. Don't
  apologise for it and don't rush it.
- **Don't read anything off the screen out loud.** Scroll it while you talk over
  the top.
- **One idea per screen change.** Don't click around while you're mid point.
- **Record Part 1 and Part 2 separately** and join them. Re-recording three
  minutes because you fluffed a line at 5:20 is miserable.
- **Watch it back once on mute.** If you can still follow what's going on from
  the screen alone, the pacing is right.
