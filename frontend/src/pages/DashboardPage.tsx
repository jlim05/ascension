import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { getTodaysQuest, getWeeklyGate, completeQuest, getMyProfile, getLeaderboard } from "../api";
import type { Quest, LeaderboardEntry } from "../types";

interface Props {
  section: "status" | "quests" | "attributes" | "leaderboard";
}

// Radar chart component for attributes
function RadarChart({ str, agi, vit, intel }: { str: number; agi: number; vit: number; intel: number }) {
  const size = 240;
  const center = size / 2;
  const maxVal = 20;
  const radius = 85;

  const stats = [
    { label: "STR", value: str, angle: -90 },
    { label: "AGI", value: agi, angle: -18 },
    { label: "VIT", value: vit, angle: 54 },
    { label: "INT", value: intel, angle: 126 },
  ];

  const toXY = (angle: number, r: number) => ({
    x: center + r * Math.cos((angle * Math.PI) / 180),
    y: center + r * Math.sin((angle * Math.PI) / 180),
  });

  const gridLevels = [0.25, 0.5, 0.75, 1];

  const dataPoints = stats.map((s) => {
    const r = (Math.min(s.value, maxVal) / maxVal) * radius;
    return toXY(s.angle, r);
  });

  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid */}
      {gridLevels.map((level) => {
        const pts = stats.map((s) => toXY(s.angle, radius * level));
        const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
        return <path key={level} d={path} fill="none" stroke="rgba(116,245,255,0.1)" strokeWidth="1" />;
      })}

      {/* Axes */}
      {stats.map((s) => {
        const end = toXY(s.angle, radius);
        return <line key={s.label} x1={center} y1={center} x2={end.x} y2={end.y} stroke="rgba(116,245,255,0.15)" strokeWidth="1" />;
      })}

      {/* Data shape */}
      <path d={dataPath} fill="rgba(116,245,255,0.15)" stroke="#74f5ff" strokeWidth="1.5"
        style={{ filter: "drop-shadow(0 0 6px rgba(116,245,255,0.5))" }} />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#74f5ff"
          style={{ filter: "drop-shadow(0 0 4px rgba(116,245,255,0.8))" }} />
      ))}

      {/* Labels */}
      {stats.map((s) => {
        const pos = toXY(s.angle, radius + 22);
        return (
          <g key={s.label}>
            <text x={pos.x} y={pos.y - 4} textAnchor="middle"
              fill="#74f5ff" fontSize="9" fontFamily="JetBrains Mono" letterSpacing="2">
              {s.label}
            </text>
            <text x={pos.x} y={pos.y + 8} textAnchor="middle"
              fill="rgba(116,245,255,0.7)" fontSize="9" fontFamily="JetBrains Mono">
              ({s.value})
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const RANK_COLORS: Record<string, string> = {
  S: "#fbbf24", A: "#ef4444", B: "#a855f7",
  C: "#3b82f6", D: "#22c55e", E: "#849495",
};

const PROFILE_PORTRAIT_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 460">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#182231"/>
        <stop offset="60%" stop-color="#0c1017"/>
        <stop offset="100%" stop-color="#05070b"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="28%" r="52%">
        <stop offset="0%" stop-color="#74f5ff" stop-opacity="0.45"/>
        <stop offset="60%" stop-color="#74f5ff" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#74f5ff" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="suit" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#233141"/>
        <stop offset="50%" stop-color="#101621"/>
        <stop offset="100%" stop-color="#040608"/>
      </linearGradient>
    </defs>
    <rect width="360" height="460" fill="url(#bg)"/>
    <rect width="360" height="460" fill="url(#glow)"/>
    <path d="M58 364c22-47 50-73 68-92 18-19 32-32 54-32s36 13 54 32c18 19 46 45 68 92v58H58z" fill="url(#suit)"/>
    <path d="M134 154c0-27 20-54 46-54s46 27 46 54c0 18-7 34-18 45v19h-56v-19c-11-11-18-27-18-45z" fill="#d9ecff" fill-opacity="0.16"/>
    <path d="M132 150c0-25 22-50 48-50s48 25 48 50c0 18-9 34-21 45-7 7-18 11-27 11s-20-4-27-11c-12-11-21-27-21-45z" fill="#101620"/>
    <path d="M124 90c13-22 32-35 56-35 25 0 44 13 57 35-15-8-32-12-57-12-24 0-41 4-56 12z" fill="#0a0d12"/>
    <path d="M126 102c19-7 35-10 54-10 20 0 36 3 54 10-4 19-9 29-18 39-10 11-21 16-36 16s-26-5-36-16c-9-10-14-20-18-39z" fill="#171f2d"/>
    <path d="M118 360c7-31 14-52 29-67 16-15 33-22 33-22s17 7 33 22c15 15 22 36 29 67" fill="none" stroke="#74f5ff" stroke-opacity="0.18" stroke-width="2"/>
    <path d="M92 320c33-16 71-24 88-24s55 8 88 24" fill="none" stroke="#74f5ff" stroke-opacity="0.12" stroke-width="2"/>
    <circle cx="180" cy="188" r="82" fill="none" stroke="#74f5ff" stroke-opacity="0.12" stroke-width="2"/>
    <circle cx="180" cy="188" r="4" fill="#74f5ff" fill-opacity="0.65"/>
  </svg>
`)}`;

export default function DashboardPage({ section }: Props) {
  const { player, updatePlayer } = useAuthStore();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [weeklyGate, setWeeklyGate] = useState<Quest | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [systemLog, setSystemLog] = useState<Array<{ time: string; id: string; message: string }>>([]);
  const [, setLogSequence] = useState(879);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (section === "status" || section === "quests") {
          const [questRes, gateRes] = await Promise.all([
            getTodaysQuest(),
            getWeeklyGate(),
          ]);
          setQuest(questRes.data);
          if (gateRes.data && "id" in gateRes.data) {
            setWeeklyGate(gateRes.data as Quest);
          }
          addLog(`DAILY QUEST SYNCED | ${questRes.data.type.toUpperCase()} | ${questRes.data.status.toUpperCase()}`);
          addLog(`OBJECTIVE: ${questRes.data.description}`);
        }
        if (section === "leaderboard") {
          const res = await getLeaderboard();
          setLeaderboard(res.data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [section]);

  const addLog = (message: string) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    setLogSequence((current) => {
      const nextId = current + 1;
      setSystemLog((prev) => [{ time, id: `LOG_ENTRY_#${nextId}`, message }, ...prev].slice(0, 20));
      return nextId;
    });
  };

  const handleComplete = async (q: Quest) => {
    setCompleting(true);
    try {
      await completeQuest(q.id);
      const [questRes, profileRes] = await Promise.all([getTodaysQuest(), getMyProfile()]);
      setQuest(questRes.data);
      updatePlayer(profileRes.data);
      addLog(`OBJECTIVE CLEARED | +${q.xpReward} XP | +${q.statReward} ${q.type}`);
      if (profileRes.data.level > (player?.level ?? 0)) {
        addLog(`LEVEL UP CONFIRMED | LV.${profileRes.data.level} | RANK ${profileRes.data.rank}`);
      }
    } finally {
      setCompleting(false);
    }
  };

  const xpPercent = (player?.currentXP ?? 0) % 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono-game text-xs tracking-widest animate-pulse-cyan"
          style={{ color: "var(--primary-cyan)" }}>
          &gt; LOADING SYSTEM...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 pt-6 px-5 md:px-10 dashboard-shell">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-end gap-4 mb-1">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-white uppercase tracking-tight">
            System Dashboard
          </h2>
          <div className="mb-2 h-px flex-1 hidden md:block" style={{ background: "var(--border-dim)" }}>
            <div className="h-full w-1/3 animate-pulse-cyan"
              style={{ background: "var(--primary-cyan)", boxShadow: "0 0 10px var(--primary-cyan)" }} />
          </div>
        </div>
        <p className="font-mono-game text-xs uppercase tracking-[0.2em]"
          style={{ color: "var(--text-primary)", opacity: 0.85 }}>
          &gt; PLAYER_STATE: {quest?.status === "Completed" ? "RESTING" : "ACTIVE"}
        </p>
      </div>

      {/* STATUS section */}
      {section === "status" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">

            {/* Profile card */}
            <section className="mana-panel p-6 overflow-hidden">
              <div className="system-id mb-4">OBJ_ID: #{player?.id?.slice(0, 8).toUpperCase()}</div>
              <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8">
                <div className="shrink-0 space-y-3 w-full lg:w-[230px]">
                  <div
                    className="relative w-full lg:w-[230px] aspect-[3/4] border border-white/70 overflow-hidden"
                    style={{
                      backgroundImage: `url("${PROFILE_PORTRAIT_SVG}")`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      boxShadow: "0 0 0 1px rgba(255,255,255,0.12), inset 0 0 40px rgba(116,245,255,0.08)",
                    }}>
                    <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.08), transparent 42%), linear-gradient(160deg, rgba(10,12,16,0) 30%, rgba(0,0,0,0.55) 100%)" }} />
                    <div className="absolute inset-3 border border-white/15" />
                  </div>
                  <p className="text-center font-headline text-sm uppercase tracking-[0.25em] text-white/85">
                    Rank: {player?.rank}
                  </p>
                </div>

                <div className="flex-1 min-w-0 space-y-5 lg:pt-1">
                  <div className="max-w-[680px]">
                    <h3 className="font-headline text-2xl md:text-[2rem] font-bold text-white tracking-wide uppercase">
                      {player?.username?.toUpperCase()}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-w-[420px]">
                    <div className="p-3 border border-[rgba(116,245,255,0.28)] bg-[rgba(116,245,255,0.03)] min-h-[104px] flex flex-col justify-between">
                      <p className="system-id">LEVEL</p>
                      <p className="font-mono-game text-3xl font-bold text-white">{player?.level}</p>
                    </div>
                    <div className="p-3 border border-[rgba(116,245,255,0.28)] bg-[rgba(116,245,255,0.03)] min-h-[104px] flex flex-col justify-between">
                      <p className="system-id">GOAL</p>
                      <p className="font-mono-game text-sm uppercase tracking-widest text-white leading-tight">
                        {player?.goal?.focus ?? "Training"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="flex justify-between font-mono-game text-xs mb-2"
                      style={{ color: "var(--text-secondary)" }}>
                      <span>EXPERIENCE POINTS (EXP)</span>
                      <span>{xpPercent.toFixed(0)}%</span>
                    </div>
                    <div className="h-4 flex gap-0.5 max-w-[560px]">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="flex-1 h-full transition-all duration-300"
                          style={{
                            background: i < Math.floor(xpPercent / 10)
                              ? "var(--primary-cyan)" : "rgba(255,255,255,0.05)",
                            boxShadow: i < Math.floor(xpPercent / 10)
                              ? "0 0 8px var(--primary-cyan)" : "none",
                            clipPath: "polygon(0 0, 90% 0, 100% 100%, 10% 100%)",
                          }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Daily quest preview */}
            {quest && (
              <section className="mana-panel p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-mono-game text-xs tracking-widest uppercase flex items-center gap-2"
                    style={{ color: "var(--text-primary)", opacity: 0.9 }}>
                    <span className="material-symbols-outlined text-base">assignment</span>
                    Daily Quest: Active System Link
                  </h3>
                  <span className="font-mono-game text-xs px-2 py-1 tracking-widest animate-pulse-cyan"
                    style={{
                      color: quest.status === "Completed" ? "#22c55e" : quest.status === "Failed" ? "#ef4444" : "var(--primary-cyan)",
                      border: `1px solid ${quest.status === "Completed" ? "#22c55e" : quest.status === "Failed" ? "#ef4444" : "var(--primary-cyan)"}`,
                    }}>
                    {quest.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-white text-base leading-relaxed mb-4">{quest.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 font-mono-game text-xs">
                    <span className="text-yellow-400">+{quest.xpReward} XP</span>
                    <span style={{ color: "var(--primary-cyan)" }}>+{quest.statReward} {quest.type}</span>
                  </div>
                  {quest.status === "Pending" && (
                    <button onClick={() => handleComplete(quest)} disabled={completing}
                      className="font-mono-game text-xs uppercase tracking-widest px-6 py-2 transition-all disabled:opacity-50"
                      style={{
                        border: "1px solid var(--primary-cyan)",
                        color: "var(--primary-cyan)",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(116,245,255,0.1)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      {completing ? "PROCESSING..." : "COMPLETE ✓"}
                    </button>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Right — Attributes radar + System Log */}
          <div className="lg:col-span-5 space-y-6">
            {player?.stats && (
              <section className="mana-panel p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-mono-game text-xs tracking-widest uppercase flex items-center gap-2"
                    style={{ color: "var(--text-primary)", opacity: 0.9 }}>
                    <span className="material-symbols-outlined text-base">bolt</span>
                    Attributes
                  </h3>
                  <span className="system-id" style={{ color: "var(--text-primary)" }}>VER_1.0.0</span>
                </div>
                <div className="flex justify-center">
                  <RadarChart
                    str={player.stats.str}
                    agi={player.stats.agi}
                    vit={player.stats.vit}
                    intel={player.stats.intel}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {[
                    { label: "STR", value: player.stats.str },
                    { label: "AGI", value: player.stats.agi },
                    { label: "VIT", value: player.stats.vit },
                    { label: "INT", value: player.stats.intel },
                  ].map((s) => (
                    <div key={s.label} className="text-center p-2"
                      style={{ background: "rgba(116,245,255,0.03)", border: "1px solid var(--border-dim)" }}>
                      <p className="system-id">{s.label}</p>
                      <p className="font-mono-game text-lg font-bold mt-1"
                        style={{ color: s.value >= 20 ? "#a855f7" : s.value >= 10 ? "var(--primary-cyan)" : "var(--text-secondary)" }}>
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* System log */}
            <section className="mana-panel flex flex-col overflow-hidden" style={{ maxHeight: "500px" }}>
              <div className="p-4 flex justify-between items-center shrink-0"
                style={{ borderBottom: "1px solid var(--border-dim)" }}>
                <h3 className="font-mono-game text-xs text-white uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-base" style={{ color: "var(--text-primary)" }}>history</span>
                  System Log
                </h3>
                <span className="system-id">REAL-TIME_FEED</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                {quest && (
                  <div className="border border-white/15 bg-[rgba(255,255,255,0.03)] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="system-id mb-2" style={{ color: "var(--text-primary)" }}>ACTIVE QUEST</p>
                        <p className="font-headline text-xl text-white uppercase tracking-wide">{quest.type} Training</p>
                      </div>
                      <span
                        className="font-mono-game text-[10px] px-3 py-1 tracking-widest uppercase"
                        style={{
                          color: quest.status === "Completed" ? "#fff" : "var(--text-primary)",
                          border: "1px solid rgba(255,255,255,0.25)",
                        }}>
                        {quest.status}
                      </span>
                    </div>
                    <p className="text-white text-sm leading-relaxed">{quest.description}</p>
                  </div>
                )}
                <button
                  type="button"
                  className="absolute right-4 top-4 w-11 h-11 flex items-center justify-center text-2xl transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "var(--text-primary)",
                    boxShadow: "0 0 18px rgba(255,255,255,0.08)",
                  }}
                >
                  +
                </button>
                {systemLog.length === 0 ? (
                  <p className="font-mono-game text-xs text-center mt-4" style={{ color: "var(--text-secondary)" }}>
                    &gt; AWAITING EVENTS...
                  </p>
                ) : systemLog.map((entry, i) => (
                  <div key={`${entry.id}-${i}`} className="p-3" style={{ borderLeft: "2px solid rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.03)" }}>
                    <p className="font-mono-game text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>
                      [{entry.time}] {entry.id}
                    </p>
                    <p className="font-mono-game text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                      {entry.message}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* QUESTS section */}
      {section === "quests" && (
        <div className="max-w-3xl space-y-6">
          {quest && (
            <section className="mana-panel p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-headline text-xl font-bold text-white uppercase tracking-wide">
                  Daily Quest: {quest.type} Training
                </h3>
                <span className="font-mono-game text-xs px-3 py-1 tracking-widest"
                  style={{
                    color: quest.status === "Completed" ? "#22c55e" : "var(--primary-cyan)",
                    border: `1px solid ${quest.status === "Completed" ? "#22c55e" : "var(--primary-cyan)"}`,
                  }}>
                  {quest.status === "Pending" ? "ACTIVE SYSTEM LINK" : quest.status.toUpperCase()}
                </span>
              </div>
              <div style={{ borderBottom: "1px solid var(--border-dim)" }} className="mb-6 pb-6">
                <p className="text-white text-base leading-relaxed">{quest.description}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-6 font-mono-game text-sm">
                  <span className="text-yellow-400">+{quest.xpReward} XP</span>
                  <span style={{ color: "var(--primary-cyan)" }}>+{quest.statReward} {quest.type}</span>
                </div>
                {quest.status === "Pending" && (
                  <button onClick={() => handleComplete(quest)} disabled={completing}
                    className="font-mono-game text-xs uppercase tracking-widest px-8 py-3 transition-all disabled:opacity-50"
                    style={{ border: "1px solid var(--primary-cyan)", color: "var(--primary-cyan)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(116,245,255,0.1)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {completing ? "PROCESSING..." : "COMPLETE ✓"}
                  </button>
                )}
              </div>
            </section>
          )}

          {weeklyGate && (
            <section className="mana-panel p-6" style={{ borderColor: "rgba(161,120,20,0.4)" }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-headline text-xl font-bold text-yellow-400 uppercase tracking-wide flex items-center gap-2">
                  <span>⚔</span> Weekly Gate
                </h3>
                <span className="font-mono-game text-xs px-3 py-1 tracking-widest text-yellow-400"
                  style={{ border: "1px solid rgba(161,120,20,0.6)" }}>
                  {weeklyGate.status.toUpperCase()}
                </span>
              </div>
              <p className="text-white text-base leading-relaxed mb-6">{weeklyGate.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-6 font-mono-game text-sm">
                  <span className="text-yellow-400">+{weeklyGate.xpReward} XP</span>
                  <span style={{ color: "var(--primary-cyan)" }}>+{weeklyGate.statReward} {weeklyGate.type}</span>
                  <span className="text-purple-400">+1 Day-Off Token</span>
                </div>
                {weeklyGate.status === "Pending" && (
                  <button onClick={() => handleComplete(weeklyGate)} disabled={completing}
                    className="font-mono-game text-xs uppercase tracking-widest px-8 py-3 transition-all disabled:opacity-50"
                    style={{ border: "1px solid #ca8a04", color: "#ca8a04" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(202,138,4,0.1)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {completing ? "PROCESSING..." : "COMPLETE ✓"}
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ATTRIBUTES section */}
      {section === "attributes" && player?.stats && (
        <div className="max-w-2xl">
          <section className="mana-panel p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-mono-game text-xs tracking-widest uppercase"
                style={{ color: "var(--primary-cyan)", opacity: 0.7 }}>
                [ ATTRIBUTE MATRIX ]
              </h3>
              <span className="system-id">VER_1.0.0</span>
            </div>
            <div className="flex justify-center mb-8">
              <RadarChart
                str={player.stats.str}
                agi={player.stats.agi}
                vit={player.stats.vit}
                intel={player.stats.intel}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "STR", value: player.stats.str, desc: "Strength · Progressive Overload" },
                { label: "AGI", value: player.stats.agi, desc: "Agility · Conditioning" },
                { label: "VIT", value: player.stats.vit, desc: "Vitality · Recovery" },
                { label: "INT", value: player.stats.intel, desc: "Intelligence · Nutrition" },
              ].map((s) => (
                <div key={s.label} className="p-4"
                  style={{ background: "rgba(116,245,255,0.03)", border: "1px solid var(--border-dim)" }}>
                  <div className="flex items-end justify-between mb-1">
                    <p className="font-mono-game text-xs tracking-widest" style={{ color: "var(--text-secondary)" }}>
                      {s.label}
                    </p>
                    <p className="font-mono-game text-3xl font-bold"
                      style={{ color: s.value >= 20 ? "#a855f7" : s.value >= 10 ? "var(--primary-cyan)" : "var(--text-secondary)" }}>
                      {s.value}
                    </p>
                  </div>
                  <p className="font-mono-game text-xs" style={{ color: "var(--text-secondary)", opacity: 0.6 }}>
                    {s.desc}
                  </p>
                  <div className="mt-3 h-1" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="h-full transition-all duration-500"
                      style={{
                        width: `${Math.min((s.value / 50) * 100, 100)}%`,
                        background: "var(--primary-cyan)",
                        boxShadow: "0 0 6px var(--primary-cyan)"
                      }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* LEADERBOARD section */}
      {section === "leaderboard" && (
        <div className="max-w-3xl">
          <div className="space-y-2">
            {leaderboard.map((p, i) => (
              <div key={p.id} className="mana-panel p-4 flex items-center gap-4"
                style={p.id === player?.id ? { borderColor: "var(--primary-cyan)" } : {}}>
                <div className="w-8 text-center font-mono-game text-sm"
                  style={{ color: i === 0 ? "#fbbf24" : i === 1 ? "#9ca3af" : i === 2 ? "#b45309" : "var(--text-secondary)" }}>
                  {i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-headline text-sm font-bold text-white">{p.username}</span>
                    {p.id === player?.id && (
                      <span className="font-mono-game text-xs" style={{ color: "var(--primary-cyan)" }}>(you)</span>
                    )}
                  </div>
                  <div className="flex gap-3 font-mono-game text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                    <span>STR {p.str}</span>
                    <span>AGI {p.agi}</span>
                    <span>VIT {p.vit}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono-game text-xl font-bold"
                    style={{ color: RANK_COLORS[p.rank] ?? "var(--text-secondary)" }}>
                    {p.rank}
                  </p>
                  <p className="font-mono-game text-xs" style={{ color: "var(--text-secondary)" }}>
                    Lv.{p.level}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}