import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import GoalsPage from "./pages/GoalsPage";
import Sidebar from "./components/Sidebar";
import { useThemeStore } from "./store/themeStore";
import NotificationToast from "./components/NotificationToast";

function TopNav() {
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  // Subscribing to the store (rather than reading getState() once) means the
  // avatar initials re-render when the player logs in or changes.
  const player = useAuthStore((state) => state.player);
  const isLight = theme === "light";
  const tabs = [
    { path: "/dashboard", label: "SYSTEM" },
    { path: "/quests", label: "QUESTS" },
    { path: "/goals", label: "GOALS" },
    { path: "/leaderboard", label: "LEADERBOARD" },
  ];

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 z-50 h-16 flex items-center justify-between px-5 md:px-6"
      style={{
        backgroundColor: isLight ? "rgba(250, 248, 255, 0.96)" : "rgba(12, 14, 18, 0.92)",
        borderBottom: isLight ? "1px solid rgba(46, 49, 255, 0.12)" : "1px solid rgba(255,255,255,0.18)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}>
      <div className="flex items-center gap-6 min-w-0">
        <h2 className="font-headline text-sm md:text-base font-bold uppercase tracking-[0.35em] whitespace-nowrap"
          style={{ color: isLight ? "#131b2e" : "var(--text-primary)" }}>
          ASCENSION
        </h2>
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {tabs.map(({ path, label }) => {
            const active = location.pathname === path;
            return (
              // Link, not <a href> — a raw anchor triggers a full document
              // reload, which throws away the Zustand store and the live
              // SignalR connection on every tab click.
              <Link
                key={label}
                to={path}
                className="font-mono-game text-[11px] uppercase tracking-[0.35em] pb-1 transition-colors"
                style={{
                  color: active
                    ? (isLight ? "#131b2e" : "var(--text-primary)")
                    : (isLight ? "rgba(19,27,46,0.62)" : "var(--text-secondary)"),
                  borderBottom: active
                    ? `1px solid ${isLight ? "#2e31ff" : "var(--text-primary)"}`
                    : "1px solid transparent",
                  textShadow: active && !isLight ? "0 0 10px rgba(255,255,255,0.22)" : "none",
                }}>
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-5">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="material-symbols-outlined cursor-pointer transition-colors text-[20px]"
          style={{ color: isLight ? "#131b2e" : "var(--text-primary)", background: "none", border: "none" }}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onMouseEnter={(e) => (e.currentTarget.style.color = isLight ? "#2e31ff" : "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = isLight ? "#131b2e" : "var(--text-primary)") }>
          {theme === "dark" ? "light_mode" : "dark_mode"}
        </button>

        <span className="material-symbols-outlined cursor-pointer transition-colors text-[20px]"
          style={{ color: isLight ? "#131b2e" : "var(--text-primary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = isLight ? "#2e31ff" : "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = isLight ? "#131b2e" : "var(--text-secondary)") }>
          notifications
        </span>
        <span className="material-symbols-outlined cursor-pointer transition-colors text-[20px]"
          style={{ color: isLight ? "#131b2e" : "var(--text-primary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = isLight ? "#2e31ff" : "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = isLight ? "#131b2e" : "var(--text-secondary)") }>
          settings
        </span>
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-mono-game text-xs font-bold overflow-hidden"
          style={{
            border: isLight ? "1px solid rgba(46,49,255,0.22)" : "1px solid rgba(255,255,255,0.35)",
            background: isLight
              ? "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.92), rgba(238,241,255,0.75) 55%, rgba(224,229,255,0.95) 100%)"
              : "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18), rgba(255,255,255,0.05) 55%, rgba(12,14,18,0.9) 100%)",
            color: isLight ? "#131b2e" : "var(--text-primary)",
            boxShadow: isLight ? "0 0 18px rgba(46,49,255,0.08)" : "0 0 18px rgba(255,255,255,0.08)",
          }}>
          {player?.username?.slice(0, 2).toUpperCase() ?? "??"}
        </div>
      </div>
    </header>
  );
}

function App() {
  const token = useAuthStore((state) => state.token);

  return (
    <BrowserRouter>
      <div className="min-h-screen app-shell" style={{ backgroundColor: "var(--bg-base)" }}>
        {token && <Sidebar />}
        {token && <TopNav />}
        <NotificationToast />
        <div className={`${token ? "md:ml-64 pt-16" : ""}`}>
          <Routes>
            <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
            <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <LoginPage />} />
            <Route path="/register" element={token ? <Navigate to="/dashboard" /> : <RegisterPage />} />
            <Route path="/dashboard" element={token ? <DashboardPage section="status" /> : <Navigate to="/login" />} />
            <Route path="/quests" element={token ? <DashboardPage section="quests" /> : <Navigate to="/login" />} />
            <Route path="/attributes" element={token ? <DashboardPage section="attributes" /> : <Navigate to="/login" />} />
            <Route path="/goals" element={token ? <GoalsPage /> : <Navigate to="/login" />} />
            <Route path="/leaderboard" element={token ? <DashboardPage section="leaderboard" /> : <Navigate to="/login" />} />
            {/* Anything unrecognised goes home rather than rendering a blank shell. */}
            <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;