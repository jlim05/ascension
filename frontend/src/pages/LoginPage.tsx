import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, getMyProfile } from "../api";
import { useAuthStore } from "../store/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const particleContainerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = particleContainerRef.current;
    if (!container) return;
    const particles: HTMLDivElement[] = [];
    for (let i = 0; i < 40; i++) {
      const particle = document.createElement("div");
      const size = Math.random() * 3 + 1;
      const startX = Math.random() * 100;
      const duration = Math.random() * 10 + 10;
      const delay = Math.random() * 10;
      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: #00dbe7;
        border-radius: 50%;
        pointer-events: none;
        filter: blur(1px);
        left: ${startX}%;
        bottom: -10px;
        animation: floatParticle ${duration}s ${-delay}s infinite linear;
      `;
      container.appendChild(particle);
      particles.push(particle);
    }
    return () => particles.forEach((p) => p.remove());
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const card = cardRef.current;
      if (!card) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 10;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      card.style.transform = `perspective(1000px) rotateX(${-y}deg) rotateY(${x}deg)`;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await login(form);
      useAuthStore.setState({ token: data.token });
      const profileRes = await getMyProfile();
      setAuth(data.token, profileRes.data);
      navigate("/dashboard");
    } catch {
      setError("AUTHENTICATION FAILED — INVALID CREDENTIALS");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: "#0c0e12" }}>

      {/* Particles */}
      <div ref={particleContainerRef}
        className="fixed inset-0 z-0 overflow-hidden pointer-events-none" />

      {/* Noise texture */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')",
          opacity: 0.03
        }} />

      {/* Top-left HUD */}
      <div className="fixed top-8 left-8 z-20 pointer-events-none">
        <p className="font-mono-game text-xs tracking-widest uppercase"
          style={{ color: "rgba(0,219,231,0.6)" }}>
          [ SYSTEM_VERSION: 1.0.0 ]
        </p>
        <p className="font-mono-game text-xs tracking-widest uppercase animate-pulse-cyan mt-1"
          style={{ color: "rgba(0,219,231,0.6)" }}>
          SCANNING_BIOMETRICS...
        </p>
      </div>

      {/* Bottom-right HUD */}
      <div className="fixed bottom-8 right-8 z-20 pointer-events-none text-right">
        <p className="font-mono-game text-xs tracking-widest uppercase"
          style={{ color: "rgba(58,73,75,0.8)" }}>
          LATENCY: 4MS
        </p>
        <p className="font-mono-game text-xs tracking-widest uppercase mt-1"
          style={{ color: "rgba(58,73,75,0.8)" }}>
          SEC_LEVEL: S-RANK_ENCRYPTION
        </p>
      </div>

      {/* Main */}
      <main className="relative z-10 w-full max-w-md px-5 mx-auto">

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-headline font-black text-5xl uppercase italic tracking-tight mb-2"
            style={{
              color: "#00dbe7",
              textShadow: "0 0 15px rgba(0,219,231,0.6), 2px 0 #00dbe7, -2px 0 #0266ff",
              animation: "glitch 3s infinite"
            }}>
            ASCENSION
          </h1>
          <p className="font-mono-game text-xs tracking-[0.2em] uppercase"
            style={{ color: "#b9cacb" }}>
            SYSTEM ACCESS INTERFACE
          </p>
        </div>

        {/* Glass panel */}
        <div ref={cardRef}
          className="relative overflow-hidden p-8 transition-transform duration-100"
          style={{
            background: "rgba(26,28,32,0.7)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(0,219,231,0.2)",
            boxShadow: "0 0 40px rgba(0,0,0,0.5)"
          }}>

          {/* Border glow sweep */}
          <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, #00dbe7, transparent)",
              animation: "borderGlow 4s infinite linear"
            }} />

          {/* Card header */}
          <div className="flex justify-between items-start mb-10">
            <div>
              <p className="font-mono-game text-xs uppercase tracking-widest mb-1"
                style={{ color: "rgba(0,219,231,0.7)" }}>
                Security Protocol
              </p>
              <p className="font-mono-game text-sm font-bold uppercase"
                style={{ color: "#e2e2e8" }}>
                AUTH_GATE_01
              </p>
            </div>
            <div className="w-10 h-10 flex items-center justify-center"
              style={{ border: "1px solid rgba(0,219,231,0.3)" }}>
              <span className="material-symbols-outlined text-xl"
                style={{
                  color: "#00dbe7",
                  fontVariationSettings: "'FILL' 1"
                }}>
                shield
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 font-mono-game text-xs"
              style={{
                background: "rgba(147,0,10,0.2)",
                border: "1px solid #93000a",
                color: "#ffb4ab"
              }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Username */}
            <div className="space-y-2">
              <label className="font-mono-game text-xs uppercase tracking-wider flex items-center gap-2"
                style={{ color: "#849495" }}>
                <span className="material-symbols-outlined text-sm">person</span>
                User Identifier
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="> ENTER_CODENAME"
                className="font-mono-game text-sm w-full bg-transparent outline-none transition-all duration-300"
                style={{
                  border: "none",
                  borderBottom: "1px solid #3a494b",
                  color: "#e2e2e8",
                  padding: "8px 0",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderBottomColor = "#00dbe7";
                  e.currentTarget.style.boxShadow = "0 4px 10px -5px rgba(0,219,231,0.5)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderBottomColor = "#3a494b";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="font-mono-game text-xs uppercase tracking-wider flex items-center gap-2"
                style={{ color: "#849495" }}>
                <span className="material-symbols-outlined text-sm">key</span>
                Access Key
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="> ************"
                className="font-mono-game text-sm w-full bg-transparent outline-none transition-all duration-300"
                style={{
                  border: "none",
                  borderBottom: "1px solid #3a494b",
                  color: "#e2e2e8",
                  padding: "8px 0",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderBottomColor = "#00dbe7";
                  e.currentTarget.style.boxShadow = "0 4px 10px -5px rgba(0,219,231,0.5)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderBottomColor = "#3a494b";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full overflow-hidden py-5 transition-all duration-300 group disabled:opacity-50"
              style={{
                backgroundColor: "#00dbe7",
                boxShadow: "0 0 20px rgba(0,219,231,0.3)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow = "0 0 30px rgba(0,219,231,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(0,219,231,0.3)";
              }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "linear-gradient(90deg, #0266ff, #00f2ff)" }} />
              <div className="relative flex items-center justify-center gap-3">
                <span className="font-mono-game text-xs font-black uppercase tracking-widest"
                  style={{ color: "#002022" }}>
                  {loading ? "UPLOADING DATA..." : "INITIALIZE AUTHENTICATION"}
                </span>
                <span className="material-symbols-outlined text-lg"
                  style={{ color: "#002022" }}>
                  {loading ? "refresh" : "bolt"}
                </span>
              </div>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 text-center">
            <p className="font-mono-game text-xs uppercase tracking-tight"
              style={{ color: "#b9cacb" }}>
              New User?{" "}
              <Link to="/register"
                className="transition-colors"
                style={{
                  color: "#00dbe7",
                  borderBottom: "1px solid rgba(0,219,231,0.3)",
                  paddingBottom: "2px"
                }}>
                Register Here
              </Link>
            </p>
          </div>
        </div>

        {/* Warning */}
        <p className="text-center font-mono-game mt-8 leading-relaxed mx-auto max-w-xs"
          style={{ color: "rgba(58,73,75,0.6)", fontSize: "10px" }}>
          WARNING: UNAUTHORIZED ACCESS TO THE SYSTEM WILL RESULT IN IMMEDIATE PENALTY QUEST ASSIGNMENT.
        </p>
      </main>

      <style>{`
        @keyframes floatParticle {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes borderGlow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes glitch {
          0% { text-shadow: 2px 0 #00dbe7, -2px 0 #0266ff; }
          2% { text-shadow: -2px 0 #00dbe7, 2px 0 #0266ff; }
          4% { text-shadow: 0 0 transparent; }
          100% { text-shadow: 0 0 transparent; }
        }
      `}</style>
    </div>
  );
}