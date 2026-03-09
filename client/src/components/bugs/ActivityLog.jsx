import React, { useContext } from 'react';
import BugsContext from '../../context/BugsContext';

export default function ActivityLog({ limit = 10 }) {
  const { activity } = useContext(BugsContext);
  const items = activity?.slice(0, limit) || [];

  if (!items.length) return (
    <div className="p-8 bg-[#151921]/40 backdrop-blur-md rounded-2xl border border-[#1e293b] text-center">
      <p className="text-gray-500 text-sm italic uppercase tracking-widest">Digital Silence</p>
    </div>
  );

  return (
    <div className="bg-[#151921]/40 backdrop-blur-md rounded-2xl border border-[#1e293b] overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-[#1e293b] bg-[#0B0F14]/50">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">Activity Pulse</h4>
      </div>
      <ul className="p-4 space-y-4 custom-scrollbar max-h-[400px] overflow-y-auto">
        {items.map((a) => (
          <li key={a.id} className="pb-4 border-b border-[#1e293b]/50 last:border-0 last:pb-0">
            <div className="text-gray-300 text-sm leading-relaxed">{a.text}</div>
            <div className="text-[10px] text-gray-500 mt-2 font-mono uppercase tracking-wider">
              {(a.date?.toDate ? a.date.toDate() : new Date(a.date)).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
