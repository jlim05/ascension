import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, getMyProfile } from "../api";
import { useAuthStore } from "../store/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError("");
  try {
    const { data } = await login(form);
    
    // Set token FIRST so the interceptor can attach it
    useAuthStore.setState({ token: data.token });
    
    // Now fetch profile — interceptor will attach the token
    const profileRes = await getMyProfile();
    
    // Store everything together
    setAuth(data.token, profileRes.data);
    navigate("/dashboard");
  } catch {
    setError("Invalid username or password");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* System window header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-400 tracking-widest">
            ASCENSION
          </h1>
          <p className="text-gray-500 mt-2 tracking-wider text-sm">
            THE SYSTEM AWAITS
          </p>
        </div>

        <div className="bg-gray-900 border border-blue-900 rounded-lg p-8">
          <h2 className="text-blue-300 text-lg font-semibold mb-6 tracking-wide">
            [ PLAYER LOGIN ]
          </h2>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm block mb-1">
                USERNAME
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">
                PASSWORD
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white font-semibold py-2 rounded transition-colors tracking-wide"
            >
              {loading ? "AUTHENTICATING..." : "ENTER THE SYSTEM"}
            </button>
          </form>

          <p className="text-gray-600 text-sm text-center mt-6">
            New hunter?{" "}
            <Link to="/register" className="text-blue-400 hover:text-blue-300">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}