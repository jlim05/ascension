import { useEffect, useState } from "react";
import { getGoal, createGoal, updateGoal, deleteGoal } from "../api";
import { useThemeStore } from "../store/themeStore";
import { FOCUS_TYPES } from "../types";
import type { Goal, GoalInput, Focus } from "../types";

// Player-facing copy for each focus. The engine keys off the raw value, so the
// labels live here rather than being derived from the string.
const FOCUS_COPY: Record<Focus, { label: string; blurb: string; icon: string }> = {
  Bulking: {
    label: "Bulking",
    blurb: "Heavy compound strength work. Quests train STR.",
    icon: "fitness_center",
  },
  Cutting: {
    label: "Cutting",
    blurb: "Conditioning and short rests. Quests train AGI and VIT.",
    icon: "directions_run",
  },
  Maintain: {
    label: "Maintain",
    blurb: "Moderate volume, no limit-pushing. Quests train VIT.",
    icon: "self_improvement",
  },
  MainGain: {
    label: "MainGain",
    blurb: "Strength and conditioning together. Hardest quests, most XP.",
    icon: "bolt",
  },
};

const EMPTY_GOAL: GoalInput = {
  focus: "Bulking",
  daysPerWeek: 4,
  equipment: "full gym",
};

export default function GoalsPage() {
  const { theme } = useThemeStore();
  const isLight = theme === "light";

  const [goal, setGoal] = useState<Goal | null>(null);
  const [form, setForm] = useState<GoalInput>(EMPTY_GOAL);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // ── Read ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await getGoal();
        if (cancelled) return;
        setGoal(data);
        setForm({
          focus: data.focus,
          daysPerWeek: data.daysPerWeek,
          equipment: data.equipment,
        });
      } catch {
        // A 404 is the expected "no directive set yet" state, not a failure.
        if (!cancelled) {
          setGoal(null);
          setEditing(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Create / Update ─────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const { data } = goal ? await updateGoal(form) : await createGoal(form);
      setGoal(data);
      setEditing(false);
      setNotice(goal ? "DIRECTIVE UPDATED" : "DIRECTIVE REGISTERED");
    } catch {
      setError("THE SYSTEM REJECTED THIS DIRECTIVE. CHECK YOUR VALUES AND RETRY.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────
  const handleDelete = async () => {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      await deleteGoal();
      setGoal(null);
      setForm(EMPTY_GOAL);
      setConfirmingDelete(false);
      setEditing(true);
      setNotice("DIRECTIVE REVOKED — QUESTS WILL DEFAULT TO BULKING");
    } catch {
      setError("COULD NOT REVOKE DIRECTIVE.");
    } finally {
      setSaving(false);
    }
  };

  // ── Theme-aware tokens ──────────────────────────────────
  const text = isLight ? "#131b2e" : "var(--text-primary)";
  const muted = isLight ? "rgba(19,27,46,0.62)" : "var(--text-secondary)";
  const accent = isLight ? "#2e31ff" : "#00dbe7";
  const border = isLight ? "rgba(46,49,255,0.16)" : "rgba(255,255,255,0.16)";
  const panel = isLight ? "rgba(255,255,255,0.78)" : "rgba(26,28,32,0.7)";

  if (loading) {
    return (
      <div className="p-6 md:p-10">
        <p className="font-mono-game text-xs uppercase tracking-[0.35em] animate-pulse-cyan"
          style={{ color: muted }}>
          LOADING DIRECTIVE...
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-10 pb-28 md:pb-10 max-w-3xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <p className="system-id mb-1" style={{ color: muted }}>
          SYSTEM DIRECTIVE
        </p>
        <h1 className="font-headline text-2xl md:text-3xl font-bold uppercase tracking-tight"
          style={{ color: text }}>
          Training Goal
        </h1>
        <p className="font-mono-game text-xs mt-3 leading-relaxed max-w-xl"
          style={{ color: muted }}>
          Your directive decides which quests the System issues you each day.
          Change it whenever your training changes — the next quest will follow it.
        </p>
      </header>

      {/* Feedback */}
      {error && (
        <div className="mb-6 p-3 font-mono-game text-xs"
          style={{ background: "rgba(147,0,10,0.18)", border: "1px solid #93000a", color: "#ffb4ab" }}>
          ⚠ {error}
        </div>
      )}
      {notice && !error && (
        <div className="mb-6 p-3 font-mono-game text-xs"
          style={{ background: isLight ? "rgba(46,49,255,0.06)" : "rgba(0,219,231,0.1)", border: `1px solid ${accent}`, color: accent }}>
          ✓ {notice}
        </div>
      )}

      {/* ── Read view ──────────────────────────────────── */}
      {goal && !editing && (
        <section className="p-6 md:p-8" style={{ background: panel, border: `1px solid ${border}`, backdropFilter: "blur(16px)" }}>
          <div className="flex items-start justify-between gap-4 mb-8">
            <div className="min-w-0">
              <p className="font-mono-game text-xs uppercase tracking-widest mb-2" style={{ color: muted }}>
                Current Focus
              </p>
              <h2 className="font-headline text-xl md:text-2xl font-bold uppercase" style={{ color: text }}>
                {FOCUS_COPY[goal.focus]?.label ?? goal.focus}
              </h2>
              <p className="font-mono-game text-xs mt-2 leading-relaxed" style={{ color: muted }}>
                {FOCUS_COPY[goal.focus]?.blurb}
              </p>
            </div>
            <div className="w-12 h-12 shrink-0 flex items-center justify-center" style={{ border: `1px solid ${border}` }}>
              <span className="material-symbols-outlined text-2xl" style={{ color: accent }}>
                {FOCUS_COPY[goal.focus]?.icon ?? "flag"}
              </span>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div>
              <dt className="font-mono-game text-xs uppercase tracking-widest mb-1" style={{ color: muted }}>
                Training Days / Week
              </dt>
              <dd className="font-headline text-2xl font-bold" style={{ color: text }}>
                {goal.daysPerWeek}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="font-mono-game text-xs uppercase tracking-widest mb-1" style={{ color: muted }}>
                Equipment
              </dt>
              <dd className="font-headline text-2xl font-bold break-words" style={{ color: text }}>
                {goal.equipment}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => { setEditing(true); setNotice(""); }}
              className="btn-primary flex-1 py-4 font-mono-game text-xs font-bold uppercase tracking-widest">
              Amend Directive
            </button>
            <button
              onClick={() => setConfirmingDelete(true)}
              className="flex-1 py-4 font-mono-game text-xs font-bold uppercase tracking-widest transition-colors"
              style={{ border: "1px solid rgba(147,0,10,0.6)", color: "#ffb4ab", background: "transparent" }}>
              Revoke Directive
            </button>
          </div>
        </section>
      )}

      {/* ── Delete confirmation ────────────────────────── */}
      {confirmingDelete && (
        <div className="mt-6 p-6" style={{ border: "1px solid #93000a", background: "rgba(147,0,10,0.12)" }}>
          <p className="font-mono-game text-xs uppercase tracking-widest mb-2" style={{ color: "#ffb4ab" }}>
            Confirm Revocation
          </p>
          <p className="font-mono-game text-xs leading-relaxed mb-5" style={{ color: muted }}>
            Deleting your directive does not delete your progress. Daily quests will
            fall back to the Bulking focus until you set a new one.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex-1 py-3 font-mono-game text-xs font-bold uppercase tracking-widest disabled:opacity-50"
              style={{ background: "#93000a", color: "#fff", border: "none" }}>
              {saving ? "REVOKING..." : "Yes, revoke it"}
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="flex-1 py-3 font-mono-game text-xs font-bold uppercase tracking-widest"
              style={{ border: `1px solid ${border}`, color: text, background: "transparent" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Create / Edit form ─────────────────────────── */}
      {editing && (
        <form onSubmit={handleSubmit}
          className="p-6 md:p-8 space-y-8"
          style={{ background: panel, border: `1px solid ${border}`, backdropFilter: "blur(16px)" }}>

          <p className="font-mono-game text-xs uppercase tracking-widest" style={{ color: accent }}>
            {goal ? "Amending Directive" : "Register New Directive"}
          </p>

          {/* Focus */}
          <fieldset className="space-y-3" style={{ border: "none", padding: 0, margin: 0 }}>
            <legend className="font-mono-game text-xs uppercase tracking-wider mb-2" style={{ color: muted }}>
              Focus
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FOCUS_TYPES.map((focus) => {
                const selected = form.focus === focus;
                return (
                  <button
                    key={focus}
                    type="button"
                    onClick={() => setForm({ ...form, focus })}
                    aria-pressed={selected}
                    className="text-left p-4 transition-all"
                    style={{
                      border: `1px solid ${selected ? accent : border}`,
                      background: selected
                        ? (isLight ? "rgba(46,49,255,0.06)" : "rgba(0,219,231,0.08)")
                        : "transparent",
                      boxShadow: selected ? `0 0 16px ${isLight ? "rgba(46,49,255,0.12)" : "rgba(0,219,231,0.18)"}` : "none",
                    }}>
                    <span className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-lg" style={{ color: selected ? accent : muted }}>
                        {FOCUS_COPY[focus].icon}
                      </span>
                      <span className="font-mono-game text-xs font-bold uppercase tracking-widest"
                        style={{ color: selected ? text : muted }}>
                        {FOCUS_COPY[focus].label}
                      </span>
                    </span>
                    <span className="font-mono-game block leading-relaxed" style={{ color: muted, fontSize: "11px" }}>
                      {FOCUS_COPY[focus].blurb}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Days per week */}
          <div className="space-y-2">
            <label htmlFor="daysPerWeek" className="font-mono-game text-xs uppercase tracking-wider block" style={{ color: muted }}>
              Training Days Per Week — {form.daysPerWeek}
            </label>
            <input
              id="daysPerWeek"
              type="range"
              min={1}
              max={7}
              value={form.daysPerWeek}
              onChange={(e) => setForm({ ...form, daysPerWeek: Number(e.target.value) })}
              className="w-full"
              style={{ accentColor: accent }}
            />
            <div className="flex justify-between font-mono-game" style={{ color: muted, fontSize: "10px" }}>
              <span>1</span><span>7</span>
            </div>
          </div>

          {/* Equipment */}
          <div className="space-y-2">
            <label htmlFor="equipment" className="font-mono-game text-xs uppercase tracking-wider block" style={{ color: muted }}>
              Available Equipment
            </label>
            <input
              id="equipment"
              type="text"
              value={form.equipment}
              onChange={(e) => setForm({ ...form, equipment: e.target.value })}
              placeholder="> e.g. full gym, dumbbells only, bodyweight"
              maxLength={60}
              required
              className="font-mono-game text-sm w-full bg-transparent outline-none transition-all duration-300"
              style={{ border: "none", borderBottom: `1px solid ${border}`, color: text, padding: "8px 0" }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = accent)}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = border)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 py-4 font-mono-game text-xs font-bold uppercase tracking-widest disabled:opacity-50">
              {saving ? "TRANSMITTING..." : goal ? "Save Directive" : "Register Directive"}
            </button>
            {goal && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setError("");
                  setForm({ focus: goal.focus, daysPerWeek: goal.daysPerWeek, equipment: goal.equipment });
                }}
                className="flex-1 py-4 font-mono-game text-xs font-bold uppercase tracking-widest"
                style={{ border: `1px solid ${border}`, color: text, background: "transparent" }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
