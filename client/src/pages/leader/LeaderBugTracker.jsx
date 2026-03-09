import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import {
  AlertTriangle,
  CheckCircle,
  Trash2,
  User,
  Bug
} from 'lucide-react';
import {
  getTeamBugs,
  updateBugStatus,
  deleteBug
} from '../../services/bugService';
import { getTeamMembers, getTeamByDocId } from '../../services/teamService';

export default function LeaderBugTracker() {
  const { user } = useContext(AuthContext);
  const [bugs, setBugs] = useState([]);
  const [members, setMembers] = useState([]);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.teamId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load team info
      const teamData = await getTeamByDocId(user.teamId);
      setTeam(teamData);

      // Load team members
      const membersData = await getTeamMembers(user.teamId);
      setMembers(membersData);

      // Load bugs
      const bugsData = await getTeamBugs(user.teamId);
      setBugs(bugsData);

    } catch (error) {
      console.error('Error loading data:', error);
      showMessage('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleStatusChange = async (bugId, newStatus) => {
    try {
      const updatedBug = await updateBugStatus(bugId, newStatus);
      setBugs(bugs.map(bug =>
        bug.id === bugId ? updatedBug : bug
      ));
      showMessage('success', `Bug status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating bug:', error);
      showMessage('error', 'Failed to update bug');
    }
  };

  const handleDeleteBug = async (bugId) => {
    if (!confirm('Are you sure you want to delete this bug report?')) return;

    try {
      await deleteBug(bugId);
      setBugs(bugs.filter(bug => bug.id !== bugId));
      showMessage('success', 'Bug report deleted successfully');
    } catch (error) {
      console.error('Error deleting bug:', error);
      showMessage('error', 'Failed to delete bug');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-800';
      case 'In Progress': return 'bg-orange-100 text-orange-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4">Loading bugs...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <Bug className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Team Found</h2>
        <p className="text-gray-600">You need to create a team first to track bugs.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Bug Tracker</h1>
        <div className="text-sm text-gray-600">
          Leaders can manage bugs reported by team members
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success'
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Bug Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Bugs</h3>
          <p className="text-2xl font-bold text-gray-900">{bugs.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Open</h3>
          <p className="text-2xl font-bold text-red-600">
            {bugs.filter(b => b.status === 'Open').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
          <p className="text-2xl font-bold text-orange-600">
            {bugs.filter(b => b.status === 'In Progress').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Resolved</h3>
          <p className="text-2xl font-bold text-green-600">
            {bugs.filter(b => b.status === 'Resolved').length}
          </p>
        </div>
      </div>

      {/* Bugs List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">All Bug Reports</h2>

          {bugs.length === 0 ? (
            <div className="text-center py-12">
              <Bug className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bugs reported yet</h3>
              <p className="text-gray-600">Great! No bugs have been reported for this team.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bugs.map((bug) => (
                <div key={bug.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{bug.title}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteBug(bug.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {bug.description && (
                    <p className="text-gray-600 mb-3">{bug.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bug.status)}`}>
                      {bug.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(bug.severity)}`}>
                      {bug.severity} Severity
                    </span>
                    {bug.assignedTo !== 'Unassigned' && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {members.find(m => m.id === bug.assignedTo)?.name || bug.assignedTo}
                      </span>
                    )}
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                      Reported by: {members.find(m => m.id === bug.reportedBy)?.name || 'Unknown'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={bug.status}
                      onChange={(e) => handleStatusChange(bug.id, e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}