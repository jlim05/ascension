import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";

export default function Sidebar() {
  const { player, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useThemeStore();

  const isLight = theme === "light";
  const sidebarSurface = isLight ? "rgba(255, 255, 255, 0.88)" : "rgba(17, 19, 24, 0.96)";
  const sidebarBorder = isLight ? "rgba(46, 49, 255, 0.12)" : "rgba(255,255,255,0.18)";
  const sidebarText = isLight ? "#131b2e" : "var(--text-primary)";
  const sidebarMuted = isLight ? "#454557" : "var(--text-secondary)";

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
            ? "border-l-2"
            : "border-l-2 border-transparent"
          }`}
        style={{
          color: active ? sidebarText : sidebarMuted,
          borderColor: active ? (isLight ? "#2e31ff" : "#ffffff") : "transparent",
          background: active ? (isLight ? "rgba(46, 49, 255, 0.06)" : "rgba(255,255,255,0.06)") : "transparent",
          boxShadow: active
            ? (isLight ? "inset 0 0 0 1px rgba(46, 49, 255, 0.08)" : "inset 0 0 0 1px rgba(255,255,255,0.08)")
            : "none",
        }}
      >
        <span className="material-symbols-outlined text-xl" style={{ color: active ? sidebarText : sidebarMuted }}>{icon}</span>
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
          backgroundColor: sidebarSurface,
          borderRight: `1px solid ${sidebarBorder}`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}>

        {/* Logo */}
        <div className="px-6 py-6" style={{ borderBottom: `1px solid ${sidebarBorder}` }}>
          <h1 className="font-headline text-lg font-bold tracking-[0.35em]"
            style={{ color: sidebarText, textShadow: isLight ? "none" : "0 0 8px rgba(255,255,255,0.18)" }}>
            ASCENSION
          </h1>
        </div>

        {/* Player identity */}
        <div className="px-6 py-5" style={{ borderBottom: `1px solid ${sidebarBorder}` }}>
          <p className="system-id mb-1">USER IDENTIFIER</p>
          <h2 className="font-headline text-lg font-bold tracking-tight truncate"
            style={{ color: sidebarText }}>
            {player?.username?.toUpperCase()}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="rank-badge font-mono-game font-bold text-xs px-3 py-0.5 tracking-widest"
              style={{
                backgroundColor: isLight ? "rgba(46,49,255,0.06)" : "rgba(255,255,255,0.05)",
                color: sidebarText,
                border: `1px solid ${isLight ? "rgba(46,49,255,0.18)" : "rgba(255,255,255,0.2)"}`
              }}>
              {player?.rank}-RANK
            </span>
            <span className="font-mono-game text-xs" style={{ color: sidebarText }}>
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
        <div className="px-6 py-4" style={{ borderTop: `1px solid ${sidebarBorder}` }}>
          <button
            type="button"
            className="w-full mb-4 py-3 font-mono-game text-xs uppercase tracking-[0.35em] transition-all"
            style={{
              border: `1px solid ${isLight ? "rgba(46,49,255,0.28)" : "rgba(255,255,255,0.55)"}`,
              color: sidebarText,
              background: isLight ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.02)",
              boxShadow: isLight ? "inset 0 0 0 1px rgba(46,49,255,0.04)" : "inset 0 0 0 1px rgba(255,255,255,0.05)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = isLight ? "rgba(46,49,255,0.06)" : "rgba(255,255,255,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = isLight ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.02)")}
          >
            Open System Store
          </button>
          {(player?.dayOffTokens ?? 0) > 0 && (
            <div className="flex items-center gap-2 text-xs font-mono-game mb-3" style={{ color: sidebarMuted }}>
              <span>🛡</span>
              <span>{player?.dayOffTokens} DAY-OFF TOKEN{(player?.dayOffTokens ?? 0) > 1 ? "S" : ""}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 transition-colors text-xs font-mono-game uppercase tracking-widest py-2"
            style={{ color: sidebarText }}
            onMouseEnter={e => (e.currentTarget.style.color = isLight ? "#2e31ff" : "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = sidebarText)}
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            LOGOUT
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 px-6 py-3 flex justify-around items-center"
        style={{ backgroundColor: isLight ? "rgba(250,248,255,0.96)" : "rgba(17,19,24,0.95)", borderTop: `1px solid ${sidebarBorder}`, backdropFilter: "blur(12px)" }}>
        {[
          { path: "/dashboard", icon: "person", label: "Status" },
          { path: "/quests", icon: "assignment", label: "Quests" },
          { path: "/attributes", icon: "bolt", label: "Stats" },
          { path: "/leaderboard", icon: "military_tech", label: "Ranks" },
        ].map(({ path, icon, label }) => (
          <Link key={label} to={path}
            className="flex flex-col items-center gap-1 transition-colors"
            style={{ color: location.pathname === path ? sidebarText : sidebarMuted }}>
            <span className="material-symbols-outlined text-xl">{icon}</span>
            <span className="text-xs font-mono-game uppercase">{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}