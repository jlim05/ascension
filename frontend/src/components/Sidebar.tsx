import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Sidebar() {
  const { player, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItem = (path: string, icon: string, label: string) => {
    const active = location.pathname === path;
    return (
      <Link
        to={path}
        className={`flex items-center gap-3 py-3 px-5 md:px-6 transition-all group
          ${active
            ? "text-white border-l-2 border-white"
            : "text-white/70 hover:text-white border-l-2 border-transparent"
          }`}
        style={active ? { background: "rgba(255,255,255,0.06)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" } : {}}
      >
        <span className="material-symbols-outlined text-xl" style={{ color: active ? "#fff" : "rgba(255,255,255,0.72)" }}>{icon}</span>
        <span className="font-mono-game text-xs uppercase tracking-[0.35em]
          group-hover:translate-x-1 transition-transform">
          {label}
        </span>
      </Link>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 z-40 hidden md:flex flex-col"
        style={{
          backgroundColor: "rgba(17, 19, 24, 0.96)",
          borderRight: "1px solid rgba(255,255,255,0.18)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}>

        {/* Logo */}
        <div className="px-6 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.18)" }}>
          <h1 className="font-headline text-lg font-bold tracking-[0.35em]"
            style={{ color: "var(--text-primary)", textShadow: "0 0 8px rgba(255,255,255,0.18)" }}>
            ASCENSION
          </h1>
        </div>

        {/* Player identity */}
        <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.18)" }}>
          <p className="system-id mb-1">USER IDENTIFIER</p>
          <h2 className="font-headline text-lg font-bold tracking-tight truncate"
            style={{ color: "var(--text-primary)" }}>
            {player?.username?.toUpperCase()}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="rank-badge font-mono-game font-bold text-xs px-3 py-0.5 tracking-widest"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "var(--text-primary)",
                border: "1px solid rgba(255,255,255,0.2)"
              }}>
              {player?.rank}-RANK
            </span>
            <span className="font-mono-game text-xs" style={{ color: "var(--text-primary)" }}>
              LVL.{player?.level}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1">
          {navItem("/dashboard", "person", "Status")}
          {navItem("/quests", "assignment", "Quest Log")}
          {navItem("/attributes", "bolt", "Attributes")}
          {navItem("/leaderboard", "military_tech", "Leaderboard")}
        </nav>

        {/* Bottom */}
        <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.18)" }}>
          <button
            type="button"
            className="w-full mb-4 py-3 font-mono-game text-xs uppercase tracking-[0.35em] transition-all"
            style={{
              border: "1px solid rgba(255,255,255,0.55)",
              color: "var(--text-primary)",
              background: "rgba(255,255,255,0.02)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
          >
            Open System Store
          </button>
          {(player?.dayOffTokens ?? 0) > 0 && (
            <div className="flex items-center gap-2 text-white/80 text-xs font-mono-game mb-3">
              <span>🛡</span>
              <span>{player?.dayOffTokens} DAY-OFF TOKEN{(player?.dayOffTokens ?? 0) > 1 ? "S" : ""}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 transition-colors text-xs font-mono-game uppercase tracking-widest py-2"
            style={{ color: "var(--text-primary)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-primary)")}
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            LOGOUT
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 px-6 py-3 flex justify-around items-center"
        style={{ backgroundColor: "rgba(17,19,24,0.95)", borderTop: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(12px)" }}>
        {[
          { path: "/dashboard", icon: "person", label: "Status" },
          { path: "/quests", icon: "assignment", label: "Quests" },
          { path: "/attributes", icon: "bolt", label: "Stats" },
          { path: "/leaderboard", icon: "military_tech", label: "Ranks" },
        ].map(({ path, icon, label }) => (
          <Link key={label} to={path}
            className="flex flex-col items-center gap-1 transition-colors"
            style={{ color: location.pathname === path ? "var(--text-primary)" : "var(--text-secondary)" }}>
            <span className="material-symbols-outlined text-xl">{icon}</span>
            <span className="text-xs font-mono-game uppercase">{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}