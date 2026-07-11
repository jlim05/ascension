import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api";

const FOCUS_OPTIONS = ["Bulking", "Cutting", "Maintain", "MainGain"];
const EQUIPMENT_OPTIONS = ["Full Gym", "Home/Dumbbells", "Bodyweight Only"];

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
            setError("Registration failed. Please check your details.");
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-400 tracking-widest">
            ASCENSION
          </h1>
          <p className="text-gray-500 mt-2 tracking-wider text-sm">
            BEGIN YOUR JOURNEY
          </p>
        </div>

        <div className="bg-gray-900 border border-blue-900 rounded-lg p-8">
          <h2 className="text-blue-300 text-lg font-semibold mb-6 tracking-wide">
            [ CREATE PLAYER ]
          </h2>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm block mb-1">USERNAME</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                placeholder="Choose a hunter name"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">EMAIL</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">PASSWORD</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                placeholder="Min 6 characters"
              />
            </div>

            {/* Goal setup — this drives quest generation */}
            <div className="border-t border-gray-800 pt-4 mt-4">
              <p className="text-blue-300 text-sm tracking-wide mb-3">
                [ SET YOUR GOAL ]
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-sm block mb-1">FOCUS</label>
                  <select
                    value={form.focus}
                    onChange={(e) => setForm({ ...form, focus: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                  >
                    {FOCUS_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">
                    TRAINING DAYS PER WEEK
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={form.daysPerWeek}
                    onChange={(e) => setForm({ ...form, daysPerWeek: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">EQUIPMENT</label>
                  <select
                    value={form.equipment}
                    onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                  >
                    {EQUIPMENT_OPTIONS.map((eq) => (
                      <option key={eq} value={eq}>{eq}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white font-semibold py-2 rounded transition-colors tracking-wide mt-2"
            >
              {loading ? "CREATING PLAYER..." : "ARISE"}
            </button>
          </form>

          <p className="text-gray-600 text-sm text-center mt-6">
            Already a hunter?{" "}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}