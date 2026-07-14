import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import Sidebar from "./components/Sidebar";

function TopNav() {
  const location = useLocation();
  const tabs = [
    { path: "/dashboard", label: "SYSTEM" },
    { path: "/quests", label: "QUESTS" },
    { path: "/leaderboard", label: "LEADERBOARD" },
    { path: "/market", label: "MARKET" },
  ];

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 z-50 h-16 flex items-center justify-between px-5 md:px-6"
      style={{
        backgroundColor: "rgba(12, 14, 18, 0.92)",
        borderBottom: "1px solid rgba(255,255,255,0.18)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}>
      <div className="flex items-center gap-6 min-w-0">
        <h2 className="font-headline text-sm md:text-base font-bold uppercase tracking-[0.35em] whitespace-nowrap"
          style={{ color: "var(--text-primary)" }}>
          ASCENSION
        </h2>
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {tabs.map(({ path, label }) => {
            const active = location.pathname === path;
            return (
              <a
                key={label}
                href={path}
                className="font-mono-game text-[11px] uppercase tracking-[0.35em] pb-1 transition-colors"
                style={{
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  borderBottom: active ? "1px solid var(--text-primary)" : "1px solid transparent",
                  textShadow: active ? "0 0 10px rgba(255,255,255,0.22)" : "none",
                }}>
                {label}
              </a>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-5">
        <span className="material-symbols-outlined cursor-pointer transition-colors text-[20px]"
          style={{ color: "var(--text-primary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}>
          notifications
        </span>
        <span className="material-symbols-outlined cursor-pointer transition-colors text-[20px]"
          style={{ color: "var(--text-primary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}>
          settings
        </span>
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-mono-game text-xs font-bold overflow-hidden"
          style={{
            border: "1px solid rgba(255,255,255,0.35)",
            background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18), rgba(255,255,255,0.05) 55%, rgba(12,14,18,0.9) 100%)",
            color: "var(--text-primary)",
            boxShadow: "0 0 18px rgba(255,255,255,0.08)",
          }}>
          {useAuthStore.getState().player?.username?.slice(0, 2).toUpperCase() ?? "??"}
        </div>
      </div>
    </header>
  );
}

function App() {
  const token = useAuthStore((state) => state.token);

  return (
    <BrowserRouter>
      <div className="min-h-screen app-shell" style={{ backgroundColor: "#0c0e12" }}>
        {token && <Sidebar />}
        {token && <TopNav />}
        <div className={`${token ? "md:ml-64 pt-16" : ""}`}>
          <Routes>
            <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
            <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <LoginPage />} />
            <Route path="/register" element={token ? <Navigate to="/dashboard" /> : <RegisterPage />} />
            <Route path="/dashboard" element={token ? <DashboardPage section="status" /> : <Navigate to="/login" />} />
            <Route path="/quests" element={token ? <DashboardPage section="quests" /> : <Navigate to="/login" />} />
            <Route path="/attributes" element={token ? <DashboardPage section="attributes" /> : <Navigate to="/login" />} />
            <Route path="/leaderboard" element={token ? <DashboardPage section="leaderboard" /> : <Navigate to="/login" />} />
            <Route path="/market" element={token ? <DashboardPage section="leaderboard" /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;