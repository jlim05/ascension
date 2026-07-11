import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Navbar() {
  const { player, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-gray-900 border-b border-blue-900 px-6 py-3 flex items-center justify-between">
      <Link to="/dashboard" className="text-blue-400 font-bold tracking-widest text-lg">
        ⚔️ ASCENSION
      </Link>

      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="text-gray-400 hover:text-blue-300 text-sm tracking-wide">
          DASHBOARD
        </Link>
        <Link to="/leaderboard" className="text-gray-400 hover:text-blue-300 text-sm tracking-wide">
          RANKINGS
        </Link>

        {player && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-blue-300 text-sm font-semibold">{player.username}</p>
              <p className="text-gray-500 text-xs">
                Rank {player.rank} · Lv.{player.level}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-400 text-xs tracking-wide transition-colors"
            >
              LOGOUT
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}