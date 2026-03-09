import React from 'react';

export default function LeaderPlaceholder({ title }) {
  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-gray-300 mt-3">{title} – Under Development</p>
    </div>
  );
}
