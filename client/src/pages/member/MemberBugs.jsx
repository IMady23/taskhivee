import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import BugForm from '../../components/bugs/BugForm';
import BugList from '../../components/bugs/BugList';
import ActivityLog from '../../components/bugs/ActivityLog';

export default function MemberBugs() {
  const { user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleBugReported = () => {
    setRefreshTrigger(prev => prev + 1);
    setOpen(false);
  };

  if (!user) return <div className="p-4">Loading user profile...</div>;

  // Derive display name securely
  const reporterName = user.name || user.displayName || user.email?.split('@')[0] || 'Member';

  return (
    <div className="space-y-8 p-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase">Security Terminal</h2>
          <p className="text-gray-400 mt-1">Report system anomalies for immediate triage</p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-xl shadow-red-900/20 active:scale-95 flex items-center gap-2 whitespace-nowrap"
        >
          REPORT BUG
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-[#151921]/40 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-[#1e293b]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">Active Incidents</h3>
            <div className="h-1 w-24 bg-gradient-to-r from-red-600 to-transparent rounded-full" />
          </div>

          <BugList
            teamId={user.teamId || user.details?.teamId}
            role="member"
            refreshTrigger={refreshTrigger}
            filterByReporter={reporterName}
          />
        </div>

        <div className="lg:col-span-1">
          <ActivityLog />
        </div>
      </div>

      {open && (
        <BugForm
          reporter={reporterName}
          onClose={() => setOpen(false)}
          onSuccess={handleBugReported}
        />
      )}
    </div>
  );
}
