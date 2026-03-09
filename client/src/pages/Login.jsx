// client/src/pages/Login.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMsg(location.state.message);
      // Clear state so message doesn't persist on refresh (optional but good UI)
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr("");
    setSuccessMsg("");

    if (!email || !password) return setErr("Please fill all fields.");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      // ✅ Clear old token and save new
      localStorage.removeItem("devsync_auth");
      localStorage.setItem("devsync_auth", JSON.stringify(data));

      const backendRole = data.user?.role?.toLowerCase();

      // ✅ Redirect based on backend role
      if (backendRole === "owner" || backendRole === "admin") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/workspace", { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      setErr(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gradient-bg min-h-screen">
      <div className="app-center">
        <motion.div
          className="auth-card"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <h1 className="text-2xl font-semibold mb-4">TaskHive Login</h1>

          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label-small">Email</label>
              <input
                className="w-full input mt-1"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label-small">Password</label>
              <input
                className="w-full input mt-1"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {err && <div className="text-red-400 text-sm">{err}</div>}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <div className="flex justify-between text-sm mt-2">
              <Link to="/signup" className="link-muted">
                Create account
              </Link>
              <a
                className="link-muted cursor-pointer"
                onClick={() => {
                  setEmail("owner@devsync.com");
                  setPassword("password123");
                }}
              >
                Fill demo
              </a>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
