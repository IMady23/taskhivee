import React from 'react';

export default function MemberPlaceholder({ title }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-gray-600 mt-3">{title} – Under Development</p>
    </div>
  );
}