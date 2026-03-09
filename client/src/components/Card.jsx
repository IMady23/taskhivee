import React from 'react';

export default function Card({ title, value, children, className = '' }) {
  return (
    <div className={`bg-[#151921] text-white rounded-lg p-4 shadow-sm border border-[#1e293b] ${className}`}>
      {title && <div className="text-sm text-gray-400">{title}</div>}
      {value !== undefined && (
        <div className="text-2xl font-semibold mt-2">{value}</div>
      )}
      {children}
    </div>
  );
}
