import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Users, Plus, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { createTeam, getTeamByDocId, getTeamMembers } from '../../services/teamService';

export default function LeaderTeamSimple() {
  const { user } = useContext(AuthContext);
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
    maxMembers: 10,
    memberEmails: [''] // Array to store member emails
  });

  const addEmailField = () => {
    setTeamForm({
      ...teamForm,
      memberEmails: [...teamForm.memberEmails, '']
    });
  };

  const removeEmailField = (index) => {
    const newEmails = teamForm.memberEmails.filter((_, i) => i !== index);
    setTeamForm({
      ...teamForm,
      memberEmails: newEmails.length > 0 ? newEmails : ['']
    });
  };

  const updateEmailField = (index, value) => {
    const newEmails = [...teamForm.memberEmails];
    newEmails[index] = value;
    setTeamForm({
      ...teamForm,
      memberEmails: newEmails
    });
  };

  useEffect(() => {
    loadTeamData();
  }, [user]);

  const loadTeamData = async () => {
    if (!user?.teamId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const teamData = await getTeamByDocId(user.teamId);
      if (teamData) {
        setTeam(teamData);
        const membersData = await getTeamMembers(user.teamId);
        setMembers(membersData);
      }
    } catch (error) {
      console.error('Error loading team:', error);
      showMessage('error', 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    
    if (!teamForm.name.trim()) {
      showMessage('error', 'Team name is required');
      return;
    }

    // Validate emails
    const validEmails = teamForm.memberEmails.filter(email => 
      email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    );

    try {
      setLoading(true);
      const newTeam = await createTeam(teamForm, user.uid, teamForm.maxMembers);
      
      // Send email invitations to team members
      if (validEmails.length > 0) {
        await sendTeamInvitations(newTeam, validEmails, user.name);
        showMessage('success', `Team "${newTeam.name}" created and invitations sent to ${validEmails.length} members!`);
      } else {
        showMessage('success', `Team "${newTeam.name}" created successfully!`);
      }
      
      setTeam(newTeam);
      setMembers([{
        id: user.uid,
        name: user.name,
        email: user.email,
        role: user.role
      }]);
      setShowCreateForm(false);
      setTeamForm({ name: '', description: '', maxMembers: 10, memberEmails: [''] });
    } catch (error) {
      console.error('Error creating team:', error);
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to send email invitations (placeholder - you can integrate with email service)
  const sendTeamInvitations = async (team, emails, leaderName) => {
    // This is a placeholder - in a real app, you'd integrate with an email service
    console.log('Sending invitations to:', emails);
    console.log('Team details:', team);
    console.log('Leader:', leaderName);
    
    // You can integrate with services like:
    // - EmailJS for client-side email sending
    // - Firebase Functions with SendGrid/Mailgun
    // - Your own backend email service
    
    // For now, we'll just log the invitation details
    emails.forEach(email => {
      console.log(`
        Invitation Email for: ${email}
        Subject: You're invited to join team "${team.name}"
        
        Hi there!
        
        ${leaderName} has invited you to join the team "${team.name}" on TaskHive.
        
        Team Code: ${team.teamId}
        
        To join the team:
        1. Visit: ${window.location.origin}
        2. Sign up as a Member
        3. Use team code: ${team.teamId}
        
        Best regards,
        TaskHive Team
      `);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4">Loading team data...</p>
      </div>
    );
  }

  // No team exists - show create team form
  if (!team) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Team Management</h1>
        
        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        {/* Create Team Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="text-center">
            <Users className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Create Your Team</h2>
            <p className="text-gray-600 mb-6">
              As a team leader, create a team to manage members and assign tasks.
            </p>
            
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Create Team
            </button>
          </div>
        </div>

        {/* Create Team Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold mb-4">Create New Team</h3>
              
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({...teamForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter team name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={teamForm.description}
                    onChange={(e) => setTeamForm({...teamForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Team description (optional)"
                    rows="3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Members
                  </label>
                  <select
                    value={teamForm.maxMembers}
                    onChange={(e) => setTeamForm({...teamForm, maxMembers: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5 members</option>
                    <option value={10}>10 members</option>
                    <option value={15}>15 members</option>
                    <option value={20}>20 members</option>
                  </select>
                </div>
                
                {/* Member Email Invitations */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invite Team Members (Email Addresses)
                  </label>
                  {teamForm.memberEmails.map((email, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => updateEmailField(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="member@example.com"
                      />
                      {teamForm.memberEmails.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEmailField(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addEmailField}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add another email
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    Members will receive an email invitation with the team code and login instructions.
                  </p>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Team'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Team exists - show team management
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Team Management</h1>
      
      {/* Message */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Team Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold mb-2">{team.name}</h2>
        <p className="text-gray-600 mb-4">{team.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{members.length}</p>
            <p className="text-sm text-blue-600">Current Members</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{team.maxSize}</p>
            <p className="text-sm text-green-600">Max Capacity</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-purple-600">{team.teamId}</p>
            <p className="text-sm text-purple-600">Team Code</p>
          </div>
        </div>
      </div>

      {/* Team Code */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Team Code</h3>
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Share this code with team members</p>
            <p className="text-2xl font-mono font-bold text-blue-600">{team.teamId}</p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(team.teamId);
              showMessage('success', 'Team code copied!');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy Code
          </button>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Team Members ({members.length})</h3>
        
        {members.length > 0 ? (
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {member.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{member.name}</h4>
                  <p className="text-sm text-gray-500">{member.email}</p>
                  <p className="text-xs text-gray-400 capitalize">{member.role}</p>
                </div>
                {member.id === team.leaderId && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Team Leader
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No team members yet</p>
        )}
      </div>
    </div>
  );
}