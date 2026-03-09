import React, { useState, useContext } from 'react';
import TasksContext from '../../context/TasksContext';
import TeamContext from '../../context/TeamContext';

export default function TaskForm({ onClose }) {
  const { addTask } = useContext(TasksContext);
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'Medium',
    deadline: '',
  });

  const { members } = useContext(TeamContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const member = members.find(m => m.id === form.assignedTo);
    const task = {
      id: String(Date.now()) + Math.random().toString(36).slice(2, 7),
      title: form.title.trim(),
      description: form.description.trim(),
      assignedTo: form.assignedTo, // This is now ID
      assignedToName: member ? member.name : 'Unknown', // Explicitly save name
      priority: form.priority,
      status: 'To Do',
      dueDate: form.deadline || '', // Standardizing on dueDate
    };

    addTask(task);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#151921] border border-[#1e293b] rounded-xl w-full max-w-lg p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-6">Create New Task</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Task Title</label>
            <input name="title" value={form.title} onChange={handleChange} required className="w-full px-4 py-2 bg-[#0B0F14] border border-[#1e293b] rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="Enter task title" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="w-full px-4 py-2 bg-[#0B0F14] border border-[#1e293b] rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors" rows={3} placeholder="Task details..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Assign To</label>
              <select name="assignedTo" value={form.assignedTo} onChange={handleChange} className="w-full px-4 py-2 bg-[#0B0F14] border border-[#1e293b] rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors">
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="w-full px-4 py-2 bg-[#0B0F14] border border-[#1e293b] rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Deadline</label>
            <input name="deadline" value={form.deadline} onChange={handleChange} type="datetime-local" className="w-full px-4 py-2 bg-[#0B0F14] border border-[#1e293b] rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors" />
          </div>

          <div className="flex items-center justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">Create Task</button>
          </div>
        </form>
      </div>
    </div>
  );
}
