// client/src/pages/Signup.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../config";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [role, setRole] = useState("team");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setErr("");

    if (!name || !email || !password) return setErr("Please complete all fields.");
    if (role === 'team' && !teamCode) return setErr("Team Code is required for members.");

    setLoading(true);
    try {
      // 1) create account
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, teamCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");

      // 2) login immediately so frontend has a valid token (auto-login)
      const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error(loginData.message || "Auto-login failed after signup");

      // Save auth info to localStorage so frontend uses token for subsequent calls
      localStorage.removeItem("devsync_auth");
      localStorage.setItem("devsync_auth", JSON.stringify(loginData));

      // Redirect based on backend role
      const backendRole = loginData.user?.role?.toLowerCase();
      if (backendRole === "owner" || backendRole === "admin") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/workspace", { replace: true });
      }
    } catch (err) {
      console.error("Signup error:", err);
      setErr(err.message || "Signup failed");
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
          <h1 className="text-2xl font-semibold mb-4">Create Account</h1>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="label-small">Full Name</label>
              <input
                className="w-full input mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label-small">Email</label>
              <input
                className="w-full input mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </div>

            <div>
              <label className="label-small">Password</label>
              <input
                className="w-full input mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </div>

            <div>
              <label className="label-small">I am a</label>
              <select
                className="w-full input mt-1"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="team">Team Member</option>
                <option value="owner">Owner / Admin</option>
              </select>
            </div>

            {role === 'team' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden"
              >
                <label className="label-small">Team Code</label>
                <input
                  className="w-full input mt-1 bg-[hsl(var(--muted))] border-[hsl(var(--border))]"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Get this code from your team leader</p>
              </motion.div>
            )}

            {err && <div className="text-[hsl(var(--destructive))] text-sm">{err}</div>}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </button>

            <div className="text-sm mt-2">
              <Link to="/login" className="link-muted">
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
