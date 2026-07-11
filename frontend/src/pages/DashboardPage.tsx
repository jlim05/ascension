import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { getTodaysQuest, getWeeklyGate, completeQuest, getMyProfile } from "../api";
import type { Quest } from "../types";

export default function DashboardPage() {
  const { player, updatePlayer } = useAuthStore();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [weeklyGate, setWeeklyGate] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [questRes, gateRes] = await Promise.all([
          getTodaysQuest(),
          getWeeklyGate(),
        ]);
        setQuest(questRes.data);
        if (gateRes.data && typeof gateRes.data === "object" && "id" in gateRes.data) {
          setWeeklyGate(gateRes.data as Quest);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleComplete = async (q: Quest) => {
    setCompleting(true);
    try {
      await completeQuest(q.id);
      // Refresh quest and player profile
      const [questRes, profileRes] = await Promise.all([
        getTodaysQuest(),
        getMyProfile(),
      ]);
      setQuest(questRes.data);
      updatePlayer(profileRes.data);
    } finally {
      setCompleting(false);
    }
  };

  const statColor = (val: number) => {
    if (val >= 20) return "text-purple-400";
    if (val >= 10) return "text-blue-400";
    return "text-gray-400";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-blue-400 tracking-widest animate-pulse">
          LOADING SYSTEM...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Player header */}
        <div className="bg-gray-900 border border-blue-900 rounded-lg p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-blue-300 tracking-wide">
              {player?.username}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Rank <span className="text-blue-400 font-bold">{player?.rank}</span>
              {" · "}Level <span className="text-blue-400 font-bold">{player?.level}</span>
              {" · "}Focus <span className="text-blue-400">{player?.goal?.focus}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs tracking-wide">STREAK</p>
            <p className="text-3xl font-bold text-orange-400">
              {player?.currentStreak}🔥
            </p>
            {(player?.currentStreak ?? 0) >= 5 && (
              <p className="text-yellow-400 text-xs mt-1">⚡ XP BOOST ACTIVE</p>
            )}
          </div>
        </div>

        {/* XP bar */}
        <div className="bg-gray-900 border border-blue-900 rounded-lg p-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>EXPERIENCE</span>
            <span>{player?.currentXP} XP</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${((player?.currentXP ?? 0) % 100)}%` }}
            />
          </div>
          <p className="text-gray-600 text-xs mt-1 text-right">
            {100 - ((player?.currentXP ?? 0) % 100)} XP to next level
          </p>
        </div>

        {/* Stats */}
        {player?.stats && (
          <div className="bg-gray-900 border border-blue-900 rounded-lg p-6">
            <h3 className="text-blue-300 text-sm tracking-widest mb-4">
              [ STATS ]
            </h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              {[
                { label: "STR", value: player.stats.str },
                { label: "AGI", value: player.stats.agi },
                { label: "VIT", value: player.stats.vit },
                { label: "INT", value: player.stats.intel },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-800 rounded p-3">
                  <p className="text-gray-500 text-xs tracking-widest">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${statColor(stat.value)}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Quest */}
        {quest && (
          <div className="bg-gray-900 border border-blue-900 rounded-lg p-6">
            <h3 className="text-blue-300 text-sm tracking-widest mb-4">
              [ DAILY QUEST ]
            </h3>
            <p className="text-white text-lg mb-4">{quest.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-sm">
                <span className="text-yellow-400">+{quest.xpReward} XP</span>
                <span className="text-blue-400">+{quest.statReward} {quest.type}</span>
                <span className={`font-semibold ${
                  quest.status === "Completed" ? "text-green-400" :
                  quest.status === "Failed" ? "text-red-400" : "text-gray-400"
                }`}>
                  {quest.status.toUpperCase()}
                </span>
              </div>
              {quest.status === "Pending" && (
                <button
                  onClick={() => handleComplete(quest)}
                  disabled={completing}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white px-6 py-2 rounded font-semibold tracking-wide transition-colors text-sm"
                >
                  {completing ? "COMPLETING..." : "COMPLETE ✓"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Weekly Gate */}
        {weeklyGate && (
          <div className="bg-gray-900 border border-yellow-700 rounded-lg p-6">
            <h3 className="text-yellow-400 text-sm tracking-widest mb-4">
              [ WEEKLY GATE ] 🗡️
            </h3>
            <p className="text-white mb-4">{weeklyGate.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-sm">
                <span className="text-yellow-400">+{weeklyGate.xpReward} XP</span>
                <span className="text-blue-400">+{weeklyGate.statReward} {weeklyGate.type}</span>
                <span className="text-purple-400">+1 Day-Off Token</span>
              </div>
              {weeklyGate.status === "Pending" && (
                <button
                  onClick={() => handleComplete(weeklyGate)}
                  disabled={completing}
                  className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-yellow-900 text-white px-6 py-2 rounded font-semibold tracking-wide transition-colors text-sm"
                >
                  {completing ? "COMPLETING..." : "COMPLETE ✓"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Day-Off Tokens */}
        {(player?.dayOffTokens ?? 0) > 0 && (
          <div className="bg-gray-900 border border-purple-800 rounded-lg p-4 flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <p className="text-purple-300 font-semibold">
                {player?.dayOffTokens} Day-Off Token{(player?.dayOffTokens ?? 0) > 1 ? "s" : ""} available
              </p>
              <p className="text-gray-500 text-sm">
                Your streak is protected for {player?.dayOffTokens} day{(player?.dayOffTokens ?? 0) > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}