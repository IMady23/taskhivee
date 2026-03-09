import React, { useState, useContext } from 'react';
import BugsContext from '../../context/BugsContext';

export default function BugForm({ onClose, onSuccess, reporter = 'Manaswini' }) {
  const { addBug } = useContext(BugsContext);
  const [form, setForm] = useState({ title: '', description: '', severity: 'Medium' });
  const [success, setSuccess] = useState('');

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const bug = {
      id: String(Date.now()) + Math.random().toString(36).slice(2, 7),
      title: form.title.trim(),
      description: form.description.trim(),
      reportedBy: reporter,
      severity: form.severity,
      filePath: form.filePath?.trim() || null,
      status: 'Open',
      reportedDate: new Date().toISOString().split('T')[0],
    };

    addBug(bug);
    setSuccess('Bug reported successfully');

    setTimeout(() => {
      setSuccess('');
      if (onSuccess) onSuccess(); // Trigger parent refresh
      else onClose(); // Fallback
    }, 900);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-[#1a1f2e] rounded-xl w-full max-w-md p-6 border border-[#2d3748]">
        <h3 className="text-lg font-semibold mb-3 text-white">Report a Bug</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300">Bug Title</label>
            <input 
              name="title" 
              value={form.title} 
              onChange={handleChange} 
              required 
              className="mt-1 w-full px-3 py-2 bg-[#0f1419] border border-[#2d3748] rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Description</label>
            <textarea 
              name="description" 
              value={form.description} 
              onChange={handleChange} 
              className="mt-1 w-full px-3 py-2 bg-[#0f1419] border border-[#2d3748] rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
              rows={3} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">File Path (Optional)</label>
            <input
              name="filePath"
              placeholder="e.g. client/src/App.jsx"
              value={form.filePath || ''}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 bg-[#0f1419] border border-[#2d3748] rounded text-sm font-mono text-gray-300 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <p className="text-xs text-gray-500 mt-1">Allows opening directly in VS Code/Cursor</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Severity</label>
            <select 
              name="severity" 
              value={form.severity} 
              onChange={handleChange} 
              className="mt-1 w-full px-3 py-2 bg-[#0f1419] border border-[#2d3748] rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 mt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 rounded border border-[#2d3748] text-gray-300 hover:bg-[#0f1419] transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Submit
            </button>
          </div>

          {success && <div className="text-sm text-green-400 mt-2">{success}</div>}
        </form>
      </div>
    </div>
  );
}
