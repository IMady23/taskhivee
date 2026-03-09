import React, { useContext, useEffect, useState } from 'react';
import TeamContext from '../../context/TeamContext';
import TasksContext from '../../context/TasksContext';
import ConfirmModal from '../../components/ConfirmModal';

function MemberRow({ m, counts, onDelete }) {
  return (
    <tr className="border-t border-gray-700" key={m.id}>
      <td className="px-3 py-3 align-top"><div className="font-medium text-white">{m.name}</div></td>
      <td className="px-3 py-3 align-top text-gray-300">Member</td>
      <td className="px-3 py-3 align-top text-gray-300">{counts.assigned}</td>
      <td className="px-3 py-3 align-top text-gray-300">{counts.completed}</td>
      <td className="px-3 py-3 align-top">
        <button onClick={() => onDelete(m.name)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Remove</button>
      </td>
    </tr>
  );
}

export default function LeaderTeam() {
  const { members, addMember, removeMember } = useContext(TeamContext);
  const { tasks } = useContext(TasksContext);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [err, setErr] = useState('');
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {}, [members, tasks]);

  const countsFor = (name) => {
    const assigned = tasks.filter((t) => t.assignedTo === name).length;
    const completed = tasks.filter((t) => t.assignedTo === name && (t.status || '') === 'Done').length;
    return { assigned, completed };
  };

  const handleAdd = (e) => {
    e.preventDefault();
    setErr('');
    const n = form.name.trim();
    if (!n) return setErr('Name is required');
    if (members.length >= 5) return setErr('Maximum of 5 members reached');
    if (members.some((m) => m.name === n)) return setErr('Member with this name already exists');

    const m = { id: 'm-' + String(Date.now()), name: n, email: form.email.trim() };
    addMember(m);
    setForm({ name: '', email: '' });
    setOpen(false);
  };

  const doDelete = (name) => {
    setConfirm({ name });
  };

  const confirmDelete = () => {
    if (confirm) {
      removeMember(confirm.name);
      setConfirm(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Management</h2>
          <p className="text-sm text-gray-300">Manage your team members (max 5)</p>
        </div>
        <div>
          <button onClick={() => setOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded">Add Member</button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 shadow-sm mb-6">
        <h3 className="text-lg text-white font-semibold mb-3">Members</h3>
        <div className="overflow-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr>
                <th className="px-3 py-3 text-sm text-gray-300">Name</th>
                <th className="px-3 py-3 text-sm text-gray-300">Role</th>
                <th className="px-3 py-3 text-sm text-gray-300">Assigned</th>
                <th className="px-3 py-3 text-sm text-gray-300">Completed</th>
                <th className="px-3 py-3 text-sm text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <MemberRow key={m.id} m={m} counts={countsFor(m.name)} onDelete={doDelete} />
              ))}
              {members.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-gray-400">No team members found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-md w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Add Team Member</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input name="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required className="mt-1 w-full px-3 py-2 border rounded" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email (optional)</label>
                <input name="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="mt-1 w-full px-3 py-2 border rounded" />
              </div>

              {err && <div className="text-sm text-red-600">{err}</div>}

              <div className="flex items-center justify-end gap-3 mt-4">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded border">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmModal
          title="Remove member"
          message={`Remove ${confirm.name}? Existing tasks will be marked as Unassigned.`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}