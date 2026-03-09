import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import Sidebar from "../layout/Sidebar";
import Topbar from "../layout/Topbar";
import ParticleBackground from "../components/ParticleBackground";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Workspace() {
  const navigate = useNavigate();
  const [auth] = useState(JSON.parse(localStorage.getItem("devsync_auth") || "null"));
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const verifyUser = async () => {
      if (!auth?.token) {
        navigate("/signin");
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        if (!res.ok) throw new Error("Session expired. Please login again.");

        const data = await res.json();
        setProfile(data.user);
      } catch (err) {
        console.error(err.message);
        localStorage.removeItem("devsync_auth");
        navigate("/signin");
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, [auth, navigate]);

  const workData = [
    { day: "Mon", tasks: 4 },
    { day: "Tue", tasks: 3 },
    { day: "Wed", tasks: 6 },
    { day: "Thu", tasks: 5 },
    { day: "Fri", tasks: 7 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-1)] text-gray-300">
        Loading your workspace...
      </div>
    );
  }

  return (
    <div className="flex bg-[var(--bg-1)] text-white min-h-screen relative">
      <ParticleBackground />
      <Sidebar />
      <div className="flex-1">
        {/* ✅ Topbar handles logout globally */}
        <Topbar user={profile} title="Team Workspace" />
        <div className="p-8 max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
            <div>
              <h2 className="text-3xl font-semibold text-gradient">Team Workspace</h2>
              {profile && (
                <p className="text-sm text-gray-300">
                  {profile.role.toUpperCase()} • {auth?.user?.email}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-[var(--panel)] rounded-lg shadow-lg border border-gray-700 hover:shadow-xl transition">
              <h3 className="text-lg font-medium mb-3 text-blue-300">Task Progress</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={workData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tasks" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-6 bg-[var(--panel)] rounded-lg shadow-lg border border-gray-700 hover:shadow-xl transition">
              <h3 className="text-lg font-medium mb-3 text-green-300">Team Activity</h3>
              <p className="text-gray-400 text-sm">
                Real-time updates of your teammates’ commits, discussions, and work reports will appear here.
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-[var(--panel)] rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium mb-3 text-yellow-300">Upcoming Meetings</h3>
            <p className="text-gray-400 text-sm">
              Integration with calendar and meeting scheduler will appear here soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
