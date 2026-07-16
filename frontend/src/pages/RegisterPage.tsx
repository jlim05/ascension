import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    focus: "Bulking",
    daysPerWeek: 3,
    equipment: "Full Gym",
  });
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
      const x = (e.clientX / window.innerWidth - 0.5) * 8;
      const y = (e.clientY / window.innerHeight - 0.5) * 8;
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
      await register(form);
      navigate("/login");
    } catch (err: any) {
      const errors = err.response?.data;
      if (Array.isArray(errors) && errors.length > 0) {
        setError(errors.map((e: any) => e.description).join(" "));
      } else {
        setError("REGISTRATION FAILED — PLEASE CHECK YOUR DETAILS");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    border: "none",
    borderBottom: "1px solid #3a494b",
    color: "#e2e2e8",
    padding: "8px 0",
    backgroundColor: "transparent",
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
          INITIALIZING_NEW_PLAYER...
        </p>
      </div>

      {/* Bottom-right HUD */}
      <div className="fixed bottom-8 right-8 z-20 pointer-events-none text-right">
        <p className="font-mono-game text-xs tracking-widest uppercase"
          style={{ color: "rgba(58,73,75,0.8)" }}>
          PROTOCOL: AWAKENING
        </p>
        <p className="font-mono-game text-xs tracking-widest uppercase mt-1"
          style={{ color: "rgba(58,73,75,0.8)" }}>
          STATUS: AWAITING_INPUT
        </p>
      </div>

      {/* Main */}
      <main className="relative z-10 w-full max-w-md px-5 mx-auto py-8">

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
            PLAYER AWAKENING PROTOCOL
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
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="font-mono-game text-xs uppercase tracking-widest mb-1"
                style={{ color: "rgba(0,219,231,0.7)" }}>
                Registration Protocol
              </p>
              <p className="font-mono-game text-sm font-bold uppercase"
                style={{ color: "#e2e2e8" }}>
                NEW_PLAYER_INIT
              </p>
            </div>
            <div className="w-10 h-10 flex items-center justify-center"
              style={{ border: "1px solid rgba(0,219,231,0.3)" }}>
              <span className="material-symbols-outlined text-xl"
                style={{ color: "#00dbe7", fontVariationSettings: "'FILL' 1" }}>
                person_add
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

          <form onSubmit={handleSubmit} className="space-y-6">

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
                style={inputStyle}
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

            {/* Email */}
            <div className="space-y-2">
              <label className="font-mono-game text-xs uppercase tracking-wider flex items-center gap-2"
                style={{ color: "#849495" }}>
                <span className="material-symbols-outlined text-sm">mail</span>
                Contact Node
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="> ENTER_EMAIL"
                className="font-mono-game text-sm w-full bg-transparent outline-none transition-all duration-300"
                style={inputStyle}
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
                placeholder="> MIN 6 CHARACTERS + DIGIT"
                className="font-mono-game text-sm w-full bg-transparent outline-none transition-all duration-300"
                style={inputStyle}
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

            {/* Goal section divider */}
            <div className="flex items-center gap-4 pt-2">
              <div className="h-px flex-1" style={{ background: "rgba(0,219,231,0.2)" }} />
              <p className="font-mono-game text-xs uppercase tracking-widest"
                style={{ color: "rgba(0,219,231,0.6)" }}>
                [ SET OBJECTIVE ]
              </p>
              <div className="h-px flex-1" style={{ background: "rgba(0,219,231,0.2)" }} />
            </div>

            {/* Focus */}
            <div className="space-y-3">
              <label className="font-mono-game text-xs uppercase tracking-wider flex items-center gap-2"
                style={{ color: "#849495" }}>
                <span className="material-symbols-outlined text-sm">target</span>
                Primary Focus
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "Bulking", label: "BULKING", desc: "Max muscle gain. Heavy lifts, high volume, caloric surplus." },
                  { value: "Cutting", label: "CUTTING", desc: "Burn fat, preserve muscle. Cardio + resistance training." },
                  { value: "Maintain", label: "MAINTAIN", desc: "Stay consistent. Balanced training, sustainable habits." },
                  { value: "MainGain", label: "MAINGAIN", desc: "Hardest mode. Build muscle and lose fat simultaneously." },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm({ ...form, focus: option.value })}
                    className="p-3 text-left transition-all"
                    style={{
                      border: form.focus === option.value
                        ? "1px solid #00dbe7"
                        : "1px solid #3a494b",
                      background: form.focus === option.value
                        ? "rgba(0,219,231,0.08)"
                        : "rgba(255,255,255,0.02)",
                      boxShadow: form.focus === option.value
                        ? "0 0 12px rgba(0,219,231,0.2)"
                        : "none",
                    }}>
                    <p className="font-mono-game text-xs font-bold mb-1"
                      style={{ color: form.focus === option.value ? "#00dbe7" : "#e2e2e8" }}>
                      {option.label}
                    </p>
                    <p className="font-mono-game leading-relaxed"
                      style={{ color: "#849495", fontSize: "10px" }}>
                      {option.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Days per week */}
            <div className="space-y-2">
              <label className="font-mono-game text-xs uppercase tracking-wider flex items-center gap-2"
                style={{ color: "#849495" }}>
                <span className="material-symbols-outlined text-sm">calendar_month</span>
                Training Frequency
              </label>
              <div className="flex gap-2 pt-1">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setForm({ ...form, daysPerWeek: day })}
                    className="flex-1 py-2 font-mono-game text-xs transition-all"
                    style={{
                      border: form.daysPerWeek === day
                        ? "1px solid #00dbe7"
                        : "1px solid #3a494b",
                      color: form.daysPerWeek === day ? "#00dbe7" : "#849495",
                      background: form.daysPerWeek === day
                        ? "rgba(0,219,231,0.1)"
                        : "transparent",
                      boxShadow: form.daysPerWeek === day
                        ? "0 0 8px rgba(0,219,231,0.3)"
                        : "none",
                    }}>
                    {day}
                  </button>
                ))}
              </div>
              <p className="font-mono-game text-xs mt-1"
                style={{ color: "rgba(132,148,149,0.5)" }}>
                DAYS / WEEK
              </p>
            </div>

            {/* Equipment */}
            <div className="space-y-3">
              <label className="font-mono-game text-xs uppercase tracking-wider flex items-center gap-2"
                style={{ color: "#849495" }}>
                <span className="material-symbols-outlined text-sm">fitness_center</span>
                Equipment Access
              </label>
              <div className="flex flex-col gap-2">
                {[
                  { value: "Full Gym", label: "FULL GYM", desc: "Barbells, cables, machines. Full access to all equipment." },
                  { value: "Home/Dumbbells", label: "HOME / DUMBBELLS", desc: "Dumbbells and basic home setup. Adaptable programming." },
                  { value: "Bodyweight Only", label: "BODYWEIGHT ONLY", desc: "No equipment needed. Calisthenics and movement-based training." },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm({ ...form, equipment: option.value })}
                    className="p-3 text-left transition-all flex items-start gap-3"
                    style={{
                      border: form.equipment === option.value
                        ? "1px solid #00dbe7"
                        : "1px solid #3a494b",
                      background: form.equipment === option.value
                        ? "rgba(0,219,231,0.08)"
                        : "rgba(255,255,255,0.02)",
                      boxShadow: form.equipment === option.value
                        ? "0 0 12px rgba(0,219,231,0.2)"
                        : "none",
                    }}>
                    {/* Selection indicator */}
                    <div className="mt-0.5 w-3 h-3 shrink-0 flex items-center justify-center"
                      style={{
                        border: form.equipment === option.value
                          ? "1px solid #00dbe7"
                          : "1px solid #3a494b",
                        background: form.equipment === option.value
                          ? "#00dbe7"
                          : "transparent"
                      }}>
                      {form.equipment === option.value && (
                        <div className="w-1.5 h-1.5" style={{ background: "#002022" }} />
                      )}
                    </div>
                    <div>
                      <p className="font-mono-game text-xs font-bold mb-1"
                        style={{ color: form.equipment === option.value ? "#00dbe7" : "#e2e2e8" }}>
                        {option.label}
                      </p>
                      <p className="font-mono-game leading-relaxed"
                        style={{ color: "#849495", fontSize: "10px" }}>
                        {option.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full overflow-hidden py-5 transition-all duration-300 group disabled:opacity-50 mt-2"
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
                  {loading ? "INITIALIZING PLAYER..." : "ARISE"}
                </span>
                <span className="material-symbols-outlined text-lg"
                  style={{ color: "#002022" }}>
                  {loading ? "refresh" : "bolt"}
                </span>
              </div>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="font-mono-game text-xs uppercase tracking-tight"
              style={{ color: "#b9cacb" }}>
              Already a Player?{" "}
              <Link to="/login"
                className="transition-colors"
                style={{
                  color: "#00dbe7",
                  borderBottom: "1px solid rgba(0,219,231,0.3)",
                  paddingBottom: "2px"
                }}>
                Login Here
              </Link>
            </p>
          </div>
        </div>

        {/* Warning */}
        <p className="text-center font-mono-game mt-8 leading-relaxed mx-auto max-w-xs"
          style={{ color: "rgba(58,73,75,0.6)", fontSize: "10px" }}>
          WARNING: FALSE DATA ENTRY WILL RESULT IN SUBOPTIMAL QUEST GENERATION AND STAT PENALTIES.
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