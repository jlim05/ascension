import { useEffect, useState } from "react";
import { getLeaderboard } from "../api";
import type { LeaderboardEntry } from "../types";
import { useAuthStore } from "../store/authStore";

const RANK_COLORS: Record<string, string> = {
  S: "text-yellow-400",
  A: "text-red-400",
  B: "text-purple-400",
  C: "text-blue-400",
  D: "text-green-400",
  E: "text-gray-400",
};

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const currentPlayer = useAuthStore((state) => state.player);

  useEffect(() => {
    getLeaderboard()
      .then((res) => setPlayers(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-blue-400 tracking-widest animate-pulse">
          LOADING RANKINGS...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-blue-300 text-sm tracking-widest mb-6">
          [ HUNTER RANKINGS ]
        </h2>

        <div className="space-y-3">
          {players.map((p, index) => (
            <div
              key={p.id}
              className={`bg-gray-900 border rounded-lg p-4 flex items-center gap-4 transition-colors ${
                p.id === currentPlayer?.id
                  ? "border-blue-500"
                  : "border-gray-800 hover:border-gray-700"
              }`}
            >
              {/* Rank position */}
              <div className="w-8 text-center">
                {index === 0 && <span className="text-yellow-400 text-lg">👑</span>}
                {index === 1 && <span className="text-gray-400 text-lg">🥈</span>}
                {index === 2 && <span className="text-orange-600 text-lg">🥉</span>}
                {index > 2 && (
                  <span className="text-gray-600 text-sm font-mono">
                    #{index + 1}
                  </span>
                )}
              </div>

              {/* Player info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{p.username}</span>
                  {p.id === currentPlayer?.id && (
                    <span className="text-blue-400 text-xs">(you)</span>
                  )}
                </div>
                <div className="flex gap-3 text-xs text-gray-500 mt-1">
                  <span>STR {p.str}</span>
                  <span>AGI {p.agi}</span>
                  <span>VIT {p.vit}</span>
                </div>
              </div>

              {/* Level and rank */}
              <div className="text-right">
                <p className={`font-bold text-lg ${RANK_COLORS[p.rank] ?? "text-gray-400"}`}>
                  {p.rank}
                </p>
                <p className="text-gray-500 text-xs">Lv.{p.level}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}