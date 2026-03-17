import React, { useEffect, useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Copy,
  CheckCircle,
  AlertCircle,
  Crown,
  Mail,
  Trash2,
  Loader2,
  Calendar,
  Clock,
  Edit3,
  Target,
  User,
  Flag,
  X,
  Bug,
  AlertTriangle,
  Bell,
  BellRing,
  Activity,
  PieChart as PieChartIcon,
  Paperclip,
  FileText,
  Zap,
  RefreshCcw,
  Check
} from 'lucide-react';
import { sendNotification } from '../services/notificationService';
import { playSound } from '../utils/soundUtils';
import { getTeamActivities } from '../services/activityService';

import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AuthContext } from '../context/AuthContext';
import {
  subscribeToTeamBugs,
  getTeamBugs,
  updateBugStatus,
  deleteBug
} from '../services/bugService';
import { createTask, getTeamTasks, updateTask, deleteTask, addTaskComment, getTaskComments, subscribeToTeamTasks } from '../services/taskService';
import { createTeam, getTeamByDocId, subscribeToTeamMembers, getTeamMembers, updateTeam, deleteTeam, joinTeamAsLeader } from '../services/teamService';
import { getPendingRequestByEmail } from '../services/leadershipService';
import { useNotifications } from '../context/NotificationContext';
import { TasksContext } from '../context/TasksContext';
import { BugsContext } from '../context/BugsContext';
import { useEventReminders } from '../hooks/useEventReminders.jsx';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import CommandPalette from '../components/CommandPalette';
import LoadingSpinner from '../components/LoadingSpinner';
import BugList from '../components/BugList';
import { uploadFile } from '../services/fileService';
import { checkAndAwardBadges } from '../services/badgeService';
import KanbanBoard from '../components/kanban/KanbanBoard';
import CalendarView from '../components/calendar/CalendarView';
import Skeleton from '../components/ui/Skeleton';
import { fileToBase64, downloadAttachment, isLocalAttachment } from '../utils/fileUtils';
import Celebration from '../components/ui/Celebration';

/**
 * Leader Dashboard
 * Main dashboard for team leaders with team creation and task management
 * Features: Welcome section, team creation flow, task creation and assignment
 * Protected route - requires leader authentication
 */
export default function LeaderDashboard() {
  const { user, isAuthenticated, isInitializing } = useContext(AuthContext);
  const navigate = useNavigate();

  // Enable event reminders
  useEventReminders();

  const [team, setTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const { tasks } = useContext(TasksContext);
  const { bugs } = useContext(BugsContext);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'kanban', 'calendar', 'tasks', or 'bugs'
  const [pendingLeadershipRequest, setPendingLeadershipRequest] = useState(null);
  const [joiningTeam, setJoiningTeam] = useState(false);
  const [inputTeamCode, setInputTeamCode] = useState('');

  // Notification state from Context
  const {
    notifications,
    unreadCount,
    markAsRead: markNotificationAsRead,
    markAllAsRead: handleMarkAllAsRead,
    loading: notificationLoading
  } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);

  // Task management state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    assignedToName: '',
    assignedToEmail: '',
    assignmentType: 'existing', // 'existing' or 'new'
    priority: 'Medium',
    dueDate: '',
    attachments: []
  });
  const [taskLoading, setTaskLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Reassignment state
  const { reassignTask, updateTask: contextUpdateTask } = useContext(TasksContext);
  const [reassigningTask, setReassigningTask] = useState(null);
  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignForm, setReassignForm] = useState({
    memberId: '',
    memberName: '',
    dueDate: ''
  });

  const handleReassignClick = async (task, keepMember = false) => {
    if (keepMember) {
      if (window.confirm(`Keep ${task.assignedToName || 'the member'} on this task and clear the reassignment request?`)) {
        await contextUpdateTask(task.id, {
          status: 'In Progress',
          reassignmentRequested: false
        });
        toast.success("Member kept. Task set to In Progress.");
      }
      return;
    }
    setReassigningTask(task);
    setReassignForm({
      memberId: task.assignedTo || '',
      memberName: task.assignedToName || '',
      dueDate: task.dueDate ? (task.dueDate.seconds ? new Date(task.dueDate.seconds * 1000) : new Date(task.dueDate)).toISOString().slice(0, 16) : ''
    });
  };

  const handleConfirmReassign = async () => {
    if (!reassignForm.memberId || !reassignForm.dueDate) {
      toast.error("Please select a member and a new deadline.");
      return;
    }
    setReassignLoading(true);
    await reassignTask(
      reassigningTask.id,
      reassignForm.memberId,
      reassignForm.memberName,
      reassignForm.dueDate
    );
    setReassignLoading(false);
    setReassigningTask(null);
    toast.success("Task reassigned successfully!");
  };

  // Bug management state
  const [bugFilters, setBugFilters] = useState({
    status: 'all',
    severity: 'all',
    search: ''
  });
  const [updatingBug, setUpdatingBug] = useState(null);

  // Team creation form state
  const [teamForm, setTeamForm] = useState({
    name: '',
    maxSize: 10,
    members: [{ name: '', email: '' }]
  });

  // Team management state
  const [showTeamManagement, setShowTeamManagement] = useState(false);
  const [editingTeam, setEditingTeam] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(false);

  // Comment state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Analytics Data
  const taskStatusData = [
    { name: 'To Do', value: tasks?.filter(t => t.status === 'To Do').length || 0, color: '#9CA3AF' },
    { name: 'In Progress', value: tasks?.filter(t => t.status === 'In Progress').length || 0, color: '#3B82F6' },
    { name: 'Done', value: tasks?.filter(t => t.status === 'Done').length || 0, color: '#10B981' }
  ];

  // Prep Data for Charts
  const tasksPerMemberData = teamMembers.map(m => {
    console.log('📊 Chart - Member:', m.name, 'ID:', m.id);
    const memberTasksForChart = tasks.filter(t => 
      t.assignedTo === m.id || 
      t.assignedToUserId === m.id
    );
    console.log('📊 Chart - Tasks for', m.name, ':', memberTasksForChart.length);
    
    return {
      name: m.name.split(' ')[0],
      Tasks: memberTasksForChart.length,
      Completed: memberTasksForChart.filter(t => t.status === 'Done').length
    };
  });
  
  console.log('📊 Total tasks in context:', tasks?.length || 0);
  if (tasks && tasks.length > 0) {
    console.log('📊 First 3 tasks:', tasks.slice(0, 3).map(t => ({
      title: t.title,
      assignedTo: t.assignedTo
    })));
  }

  const bugStatusData = [
    { name: 'Open', value: bugs?.filter(b => b.status === 'Open').length || 0, color: '#EF4444' },
    { name: 'In Progress', value: bugs?.filter(b => b.status === 'In Progress').length || 0, color: '#F59E0B' },
    { name: 'Resolved', value: bugs?.filter(b => b.status === 'Resolved' || b.status === 'Fixed').length || 0, color: '#10B981' }
  ].filter(d => d.value > 0);

  // Activities State
  const [activities, setActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);
  
  // Celebration State
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState("");

  // Redirect if not authenticated or not a leader
  useEffect(() => {
    if (!isInitializing && (!isAuthenticated || !user)) {
      navigate('/auth?mode=login');
      return;
    }

    if (!isInitializing && user && user.role !== 'leader') {
      navigate('/member/dashboard');
      return;
    }

    // Step onboarding check
    if (!isInitializing && user && user.role === 'leader') {
      const completed = localStorage.getItem('taskhive_onboarding_completed');
      if (!completed) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated, user, isInitializing, navigate]);



  // Load team data and tasks if user has a team
  // Load team data (Tasks now real-time)
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // If user has a team, load team data
        if (user.teamId) {
          const teamData = await getTeamByDocId(user.teamId);
          if (teamData) {
            setTeam(teamData);


            // Independent Subscriptions handled in separate effects
            // Removed manual fetches for members and bugs to avoid duplicate/stale data

            // ... activities loaded ...

            // ... activities loaded ...

          } else {
            console.warn('Team not found for teamId:', user.teamId);
            setError('Team not found. You may need to create a new team.');
          }
        } else {
          console.log('User has no team yet. Checking for pending leadership requests...');
          const pendingRequest = await getPendingRequestByEmail(user.email);
          if (pendingRequest) {
            console.log('Found pending leadership request:', pendingRequest);
            setPendingLeadershipRequest(pendingRequest);
            // Auto-fill code if available
            const teamData = await getTeamByDocId(pendingRequest.teamId);
            if (teamData) {
              setPendingLeadershipRequest(prev => ({ ...prev, teamName: teamData.name, teamCode: teamData.teamCode }));
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError(`Failed to load team data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (user && !isInitializing) {
      loadData();
    }
  }, [user, isInitializing]);

  // Real-time Member Subscription
  useEffect(() => {
    if (user?.teamId) {
      const unsubscribe = subscribeToTeamMembers(user.teamId, (updatedMembers) => {
        setTeamMembers(updatedMembers);
      });
      return () => unsubscribe();
    }
  }, [user?.teamId]);

  // Removed redundant Real-time Task/Bug Subscriptions (now handled by Context)

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Handle team creation form changes
  const handleTeamFormChange = (field, value) => {
    setTeamForm(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  // Handle member form changes
  const handleMemberChange = (index, field, value) => {
    const updatedMembers = [...teamForm.members];
    updatedMembers[index][field] = value;
    setTeamForm(prev => ({
      ...prev,
      members: updatedMembers
    }));
    setError('');
  };

  // Add new member row
  const addMemberRow = () => {
    if (teamForm.members.length < teamForm.maxSize - 1) { // -1 for leader
      setTeamForm(prev => ({
        ...prev,
        members: [...prev.members, { name: '', email: '' }]
      }));
    }
  };

  // Remove member row
  const removeMemberRow = (index) => {
    if (teamForm.members.length > 1) {
      const updatedMembers = teamForm.members.filter((_, i) => i !== index);
      setTeamForm(prev => ({
        ...prev,
        members: updatedMembers
      }));
    }
  };

  // Validate team creation form
  const validateTeamForm = () => {
    if (!teamForm.name.trim()) {
      setError('Team name is required');
      return false;
    }

    // Check for valid member emails (only if provided)
    const validMembers = teamForm.members.filter(member =>
      member.email.trim() && member.name.trim()
    );

    for (const member of validMembers) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
        setError(`Invalid email format: ${member.email}`);
        return false;
      }
    }

    return true;
  };

  // Handle team creation
  const handleCreateTeam = async () => {
    if (!validateTeamForm()) return;

    setCreating(true);
    setError('');

    try {
      const teamData = {
        name: teamForm.name.trim(),
        invitedMembers: teamForm.members
          .filter(member => member.email.trim() && member.name.trim())
          .map(member => ({
            name: member.name.trim(),
            email: member.email.trim(),
            status: 'invited'
          }))
      };

      const newTeam = await createTeam(teamData, user.uid, teamForm.maxSize);
      setTeam(newTeam);
      setSuccess('Team created successfully! Share the team code with your members.');

      // Reset form
      setTeamForm({
        name: '',
        maxSize: 10,
        members: [{ name: '', email: '' }]
      });

      // Reload team members
      const members = await getTeamMembers(newTeam.id);
      setTeamMembers(members);

    } catch (error) {
      console.error('Error creating team:', error);
      setError(error.message || 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  // Handle team editing
  const handleEditTeam = () => {
    if (team) {
      setTeamForm({
        name: team.name,
        maxSize: team.maxSize,
        members: team.invitedMembers?.map(m => ({ name: m.name, email: m.email })) || [{ name: '', email: '' }]
      });
      setEditingTeam(true);
    }
  };

  // Handle team update
  const handleUpdateTeam = async () => {
    if (!validateTeamForm()) return;

    setCreating(true);
    setError('');

    try {
      const { updateTeam } = await import('../services/teamService');

      const updates = {
        name: teamForm.name.trim(),
        maxSize: teamForm.maxSize,
        invitedMembers: teamForm.members
          .filter(member => member.email.trim() && member.name.trim())
          .map(member => ({
            name: member.name.trim(),
            email: member.email.trim(),
            status: 'invited'
          }))
      };

      // 1. Identify NEW members to send emails BEFORE updating state (to compare with current)
      // Existing members in current team state
      const currentEmails = new Set(team.invitedMembers?.map(m => m.email.toLowerCase()) || []);

      // New members in form
      const newMembers = updates.invitedMembers.filter(m => !currentEmails.has(m.email.toLowerCase()));

      // 2. Update Team in Firestore
      const updatedTeam = await updateTeam(team.id, updates);

      // 3. Send invitations ONLY to new members
      if (newMembers.length > 0) {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

        // Send in parallel
        await Promise.all(newMembers.map(member =>
          fetch(`${API_URL}/email/team-invitation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: member.email,
              name: member.name,
              teamName: team.name, // Use current team name or updated name
              leaderName: user.name || user.email,
              teamCode: team.teamCode || team.teamId
            })
          }).catch(e => console.warn(`Failed to invite ${member.email}`, e))
        ));

        toast.success(`Sent invitations to ${newMembers.length} new members`);
      }

      setTeam(updatedTeam);
      setSuccess('Team updated successfully!');
      setEditingTeam(false);

      // Reset form
      setTeamForm({
        name: '',
        maxSize: 10,
        members: [{ name: '', email: '' }]
      });

    } catch (error) {
      console.error('Error updating team:', error);
      setError(error.message || 'Failed to update team');
    } finally {
      setCreating(false);
    }
  };

  // Handle team deletion
  const handleCancelInvite = async (email) => {
    if (!window.confirm(`Are you sure you want to cancel the invitation for ${email}?`)) {
      return;
    }

    try {
      const { removeInvitedMember } = await import('../services/teamService');
      const updatedTeam = await removeInvitedMember(team.id, email);
      setTeam(updatedTeam);
      setSuccess(`Invitation for ${email} cancelled`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to cancel invite:', err);
      setError('Failed to cancel invitation');
    }
  };

  const handleDeleteTeam = async () => {
    if (!team) return;

    setDeletingTeam(true);
    setError('');

    try {
      const { deleteTeam } = await import('../services/teamService');
      await deleteTeam(team.id);

      // Clear team data
      setTeam(null);
      setTeamMembers([]);
      // Note: tasks and bugs are from Context, they will auto-update when team is deleted
      setSuccess('Team deleted successfully!');
      setDeletingTeam(false);

    } catch (error) {
      console.error('Error deleting team:', error);
      setError(error.message || 'Failed to delete team');
      setDeletingTeam(false);
    }
  };

  // Handle creating new team (when one already exists)
  const handleCreateNewTeam = async () => {
    if (team) {
      setError('You already lead a team. Multiple teams are not supported yet.');
      return;
    }
  };

  // Copy team code to clipboard
  const copyTeamCode = async () => {
    if (team?.teamId) {
      try {
        await navigator.clipboard.writeText(team.teamId);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } catch (error) {
        console.error('Failed to copy team code:', error);
      }
    }
  };

  // Task form handlers
  const handleTaskFormChange = (field, value) => {
    setTaskForm(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      assignedTo: '',
      assignedToName: '',
      assignedToEmail: '',
      assignmentType: 'existing',
      priority: 'Medium',
      dueDate: ''
    });
    setEditingTask(null);
    setShowTaskForm(false);
  };

  const validateTaskForm = () => {
    if (!taskForm.title.trim()) {
      setError('Task title is required');
      return false;
    }

    if (taskForm.assignmentType === 'existing') {
      if (!taskForm.assignedTo) {
        setError('Please assign the task to a team member');
        return false;
      }
    } else if (taskForm.assignmentType === 'new') {
      if (!taskForm.assignedToName.trim()) {
        setError('Please enter the assignee name');
        return false;
      }
      if (!taskForm.assignedToEmail.trim()) {
        setError('Please enter the assignee email');
        return false;
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(taskForm.assignedToEmail)) {
        setError('Please enter a valid email address');
        return false;
      }
    } else {
      setError('Please select an assignment method');
      return false;
    }

    return true;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be < 5MB");
      return;
    }

    const toastId = toast.loading("Uploading attachment...");
    try {
      const base64Data = await fileToBase64(file);
      const url = `local_file_${Date.now()}_${file.name}`;
      
      // Store in localStorage instead of Firebase
      try {
        localStorage.setItem(url, base64Data);
        setTaskForm(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), { name: file.name, url }]
        }));
        toast.success("Attached!", { id: toastId });
      } catch (storageError) {
        console.error("Local storage error:", storageError);
        toast.error("File too large for local storage or storage full.", { id: toastId });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed", { id: toastId });
    }
  };

  // Handle task creation/editing
  const handleTaskSubmit = async () => {
    if (!validateTaskForm()) return;

    setTaskLoading(true);
    setError('');

    try {
      const taskData = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        assignedTo: taskForm.assignmentType === 'existing' ? taskForm.assignedTo : 'external',
        priority: taskForm.priority,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate) : null,
        attachments: taskForm.attachments || []
      };

      let assigneeInfo = null;
      let shouldSendEmail = false;

      // Smart Assignment: Check if "new" assignment email matches an existing member
      if (taskData.assignedTo === 'external' && taskForm.assignedToEmail) {
        const existingMember = teamMembers.find(m => m.email.toLowerCase() === taskForm.assignedToEmail.toLowerCase());
        if (existingMember) {
          // Switch to existing member assignment
          taskData.assignedTo = existingMember.id;
          assigneeInfo = {
            id: existingMember.id,
            name: existingMember.name,
            email: existingMember.email
          };
          shouldSendEmail = true;
        } else {
          assigneeInfo = {
            name: taskForm.assignedToName.trim(),
            email: taskForm.assignedToEmail.trim()
          };
          shouldSendEmail = true;
        }
      } else if (taskForm.assignmentType === 'existing' && taskForm.assignedTo) {
        // Find team member info
        const member = teamMembers.find(m => m.id === taskForm.assignedTo);
        if (member) {
          assigneeInfo = {
            id: member.id, // Ensure ID is included
            name: member.name,
            email: member.email
          };
          // Update the task data to use ID
          taskData.assignedTo = member.id;
          taskData.assignedToName = member.name; // Add name for display
          shouldSendEmail = true;
        }
      }

      if (editingTask) {
        // Update existing task
        const updatedTask = await updateTask(editingTask.id, taskData);
        setSuccess('Task updated successfully!');
      } else {
        // Create new task
        const newTask = await createTask(
          taskData,
          user.teamId,
          user.uid,
          shouldSendEmail ? assigneeInfo : null,
          user.name || user.email,
          team.name,
          user.photoURL
        );
        setSuccess('Task created successfully!');

        // Send email notification if needed
        if (shouldSendEmail && assigneeInfo) {
          try {
            const response = await fetch('http://localhost:5000/api/email/task-assignment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                assigneeEmail: assigneeInfo.email,
                assigneeName: assigneeInfo.name,
                taskData: {
                  title: taskData.title,
                  description: taskData.description,
                  priority: taskData.priority,
                  dueDate: taskData.dueDate
                },
                leaderName: user.name || user.email
              })
            });

            if (response.ok) {
              setSuccess('Task created and email notification sent successfully!');
            } else {
              setSuccess('Task created successfully! (Email notification failed)');
            }
          } catch (emailError) {
            console.error('Error sending email notification:', emailError);
            setSuccess('Task created successfully! (Email notification failed)');
          }
        }
      }

      resetTaskForm();
    } catch (error) {
      console.error('Error saving task:', error);
      setError(error.message || 'Failed to save task');
    } finally {
      setTaskLoading(false);
    }
  };

  // Handle task editing
  const handleEditTask = async (task) => {
    setTaskForm({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo,
      assignedToName: task.assignedToName || '',
      assignedToEmail: task.assignedToEmail || '',
      assignmentType: task.assignedTo === 'external' ? 'new' : 'existing',
      priority: task.priority,
      dueDate: task.dueDate ? (task.dueDate.seconds ? new Date(task.dueDate.seconds * 1000) : new Date(task.dueDate)).toISOString().slice(0, 16) : '',
      attachments: task.attachments || []
    });
    setEditingTask(task);
    setShowTaskForm(true);
    setActiveTab('tasks');

    // Load comments for this task
    try {
      const taskComments = await getTaskComments(task.id);
      setComments(taskComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  // Handle sending deadline reminder
  const handleSendReminder = async (task) => {
    try {
      setLoading(true);

      // Determine assignee email/name
      let email = '';
      let name = '';

      if (task.assignedTo === 'external') {
        email = task.assignedToEmail;
        name = task.assignedToName;
      } else {
        const member = teamMembers.find(m => m.id === task.assignedTo);
        if (member) {
          email = member.email;
          name = member.name;
        }
      }

      if (!email) {
        setError('Cannot send reminder: Assignee email not found');
        return;
      }

      const response = await fetch('http://localhost:5000/api/email/deadline-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          taskData: {
            title: task.title,
            dueDate: task.dueDate ? new Date(task.dueDate.seconds * 1000).toISOString() : null,
            priority: task.priority
          },
          leaderName: user.name || user.email,
          teamName: team.name
        })
      });

      if (response.ok) {
        setSuccess(`Reminder sent to ${name}`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Failed to send reminder');
      }

    } catch (error) {
      console.error('Error sending reminder:', error);
      setError('Failed to send reminder email');
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting a bug
  const handleDeleteBug = async (bugId) => {
    if (!window.confirm('Are you sure you want to delete this bug report?')) return;

    try {
      setLoading(true);
      await deleteBug(bugId);

      // Update local state
      setSuccess('Bug report deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting bug:', error);
      setError('Failed to delete bug report');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !editingTask) return;

    setCommentLoading(true);
    try {
      const commentData = {
        text: newComment.trim(),
        userId: user.uid,
        userName: user.name || user.email,
        userRole: user.role,
        userPhotoURL: user.photoURL
      };

      const addedComment = await addTaskComment(editingTask.id, commentData);
      setComments(prev => [...prev, addedComment]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      setSuccess('Task deleted successfully!');
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      setError(error.message || 'Failed to delete task');
    }
  };

  // Get member name by ID or external assignment
  const getMemberName = (task) => {
    if (task.assignedTo === 'external' && task.assignedToName) {
      return `${task.assignedToName} (External)`;
    }
    const member = teamMembers.find(m => m.id === task.assignedTo);
    return member ? member.name : 'Unknown Member';
  };

  // Get member name by ID (for bugs and other references)
  const getMemberNameById = (memberId) => {
    const member = teamMembers.find(m => m.id === memberId);
    return member ? member.name : 'Unknown Member';
  };

  // Handle bug status update
  const handleBugStatusUpdate = async (bugId, newStatus) => {
    setUpdatingBug(bugId);
    setError('');

    try {
      const updatedBug = await updateBug(bugId, { status: newStatus }, { id: user.uid, name: user.name || user.email, photoURL: user.photoURL });
      setSuccess(`Bug status updated to "${newStatus}"`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating bug status:', error);
      setError('Failed to update bug status. Please try again.');
    } finally {
      setUpdatingBug(null);
    }
  };

  // Filter bugs based on current filters
  const getFilteredBugs = () => {
    return bugs.filter(bug => {
      const matchesStatus = bugFilters.status === 'all' || bug.status === bugFilters.status;
      const matchesSeverity = bugFilters.severity === 'all' || bug.severity === bugFilters.severity;
      const matchesSearch = !bugFilters.search ||
        bug.title.toLowerCase().includes(bugFilters.search.toLowerCase()) ||
        bug.description.toLowerCase().includes(bugFilters.search.toLowerCase());

      return matchesStatus && matchesSeverity && matchesSearch;
    });
  };

  // Get bug severity color
  const getBugSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return 'text-red-600 bg-red-100 border-red-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'Low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  // Get bug status color
  const getBugStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'text-red-600 bg-red-100 border-red-200';
      case 'In Progress': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'Resolved': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read && !notification.isRead) {
        await markNotificationAsRead(notification.id);
      }

      // Navigate to bug tracker if it's a bug notification
      if (notification.type === 'bug_reported' || notification.type === 'BUG_REPORTED') {
        setActiveTab('bugs');
        setShowNotifications(false);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  // Format notification time
  const formatNotificationTime = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'To Do': return 'text-gray-600 bg-gray-100';
      case 'In Progress': return 'text-blue-600 bg-blue-100';
      case 'Done': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Show loading spinner while initializing
  if (isInitializing || loading) {
    return (
      <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden">
        {/* Sidebar Skeleton */}
        <div className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2 pt-8">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>

        <div className="flex-1 p-8 space-y-8 overflow-hidden">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-10 w-24 rounded-lg" />
            </div>
          </div>

          {/* Snapshot Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>

          {/* Stats Bar Skeleton */}
          <div className="flex gap-6 border-b border-[var(--border-color)] pb-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-8 w-32" />
            ))}
          </div>

          {/* Main Content Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>

          {/* Large Card Skeleton */}
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Show error if user is not authenticated
  if (!isAuthenticated || !user) {
    return <LoadingSpinner fullScreen message="Redirecting to login..." />;
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative transition-colors duration-300 overflow-hidden">
      <Sidebar role="leader" />

      <div className="flex-1 flex flex-col relative z-10 ml-64">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto"
          >
            {/* Welcome Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <Link to="/profile" className="flex items-center gap-3 group hover:bg-[var(--bg-secondary)] p-2 rounded-xl transition-all">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Crown className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[var(--bg-primary)] overflow-hidden">
                        {user.photoURL ? (
                          <img src={user.photoURL} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                            <User size={10} className="text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">
                      Welcome, {user.name || user.email}
                    </h1>
                  </div>
                </Link>

                <div className="flex items-center gap-4">
                  {/* Notification Bell */}
                  {team && (
                    <div className="relative notification-dropdown">
                      <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition"
                      >
                        {unreadCount > 0 ? (
                          <BellRing className="w-6 h-6 text-blue-500 animate-bounce" />
                        ) : (
                          <Bell className="w-6 h-6" />
                        )}
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-in zoom-in">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </button>

                      {/* Notification Dropdown */}
                      {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-[var(--card-bg)] rounded-xl shadow-2xl border border-[var(--border-color)] overflow-hidden z-50 origin-top-right ring-1 ring-white/5 backdrop-blur-xl">
                          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notifications</h3>
                              {unreadCount > 0 && (
                                <button
                                  onClick={handleMarkAllAsRead}
                                  disabled={notificationLoading}
                                  className="text-xs text-blue-400 hover:text-blue-300 font-medium disabled:opacity-50"
                                >
                                  {notificationLoading ? 'Marking...' : 'Mark all read'}
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                              <div className="p-8 text-center text-[var(--text-secondary)]">
                                <Bell size={24} className="mx-auto mb-2 opacity-20" />
                                <p className="text-xs">No notifications yet</p>
                              </div>
                            ) : (
                              <div className="divide-y divide-[var(--border-color)]">
                                {notifications.slice(0, 10).map((notification) => (
                                  <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`p-4 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors relative group ${!notification.isRead ? 'bg-blue-500/5' : ''
                                      }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="flex-shrink-0">
                                        {notification.type === 'bug_reported' && (
                                          <div className="w-8 h-8 bg-red-900/20 rounded-full flex items-center justify-center border border-red-500/20">
                                            <Bug className="w-4 h-4 text-red-500" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold truncate ${!notification.isRead ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                                          {notification.title || 'Notification'}
                                        </p>
                                        <p className={`text-xs mt-1 line-clamp-2 text-[var(--text-secondary)]`}>
                                          {notification.message}
                                        </p>
                                        <p className="text-[10px] text-[var(--text-secondary)] mt-2 uppercase tracking-wider font-semibold">
                                          {formatNotificationTime(notification.createdAt)}
                                        </p>
                                      </div>
                                      {!notification.isRead && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {notifications.length > 10 && (
                            <div className="p-3 border-t border-[var(--border-color)] text-center bg-[var(--bg-primary)]/30">
                              <button className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                                View all notifications
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[var(--text-secondary)] text-lg">
                Here's a snapshot of your project
              </p>

              {/* Feature Status Overview */}
              {team && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-900/10 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-green-400" />
                      <h3 className="font-semibold text-green-400">Team Management</h3>
                    </div>
                    <p className="text-sm text-green-300/70">
                      ✅ Team created • {teamMembers.length} members • Code: {team.teamId}
                    </p>
                  </div>

                  <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-blue-400" />
                      <h3 className="font-semibold text-blue-400">Task Management</h3>
                    </div>
                    <p className="text-sm text-blue-300/70">
                      ✅ Ready to create • {tasks?.length || 0} tasks • Assignment enabled
                    </p>
                  </div>

                  <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Bug className="w-5 h-5 text-red-400" />
                      <h3 className="font-semibold text-red-400">Bug Tracking</h3>
                    </div>
                    <p className="text-sm text-red-300/70">
                      ✅ Management ready • {bugs?.length || 0} bugs • Status updates enabled
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Tab Navigation (only show if team exists) */}
            {team && (
              <div className="mb-6">
                <div className="border-b border-[var(--border-color)]">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'
                        }`}
                    >
                      <Users className="w-4 h-4 inline mr-2" />
                      Team Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('kanban')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'kanban'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'
                        }`}
                    >
                      <Target className="w-4 h-4 inline mr-2" />
                      Kanban Board
                    </button>
                    <button
                      onClick={() => setActiveTab('calendar')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'calendar'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'
                        }`}
                    >
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Calendar & Events
                    </button>
                    <button
                      onClick={() => setActiveTab('tasks')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'tasks'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'
                        }`}
                    >
                      <Target className="w-4 h-4 inline mr-2" />
                      Task Management ({tasks.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('bugs')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'bugs'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'
                        }`}
                    >
                      <Bug className="w-4 h-4 inline mr-2" />
                      Bug Tracker ({bugs.length})
                    </button>
                  </nav>
                </div>

                {/* Feature indicators */}
                <div className="mt-4 flex gap-4 text-xs text-[var(--text-secondary)]">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    <span>Team Management Active</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                    <span>Task Creation Available</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                    <span>Bug Tracking Ready</span>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Glow - Progressive Color Transition (P9) */}
            <motion.div
              animate={{
                background: activeTab === 'overview' ? 'radial-gradient(circle at top right, rgba(37,99,235,0.08), transparent)' :
                  activeTab === 'tasks' ? 'radial-gradient(circle at top right, rgba(147,51,234,0.08), transparent)' :
                    activeTab === 'bugs' ? 'radial-gradient(circle at top right, rgba(220,38,38,0.08), transparent)' :
                      'radial-gradient(circle at top right, rgba(16,185,129,0.08), transparent)'
              }}
              className="fixed inset-0 pointer-events-none -z-10"
            />

            <CommandPalette isOpen={showCommandPalette} onClose={setShowCommandPalette} />

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-2 items-start"
              >
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-green-700">{success}</p>
                <button
                  onClick={() => setSuccess('')}
                  className="ml-auto text-green-500 hover:text-green-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg mb-6 flex items-start gap-3 ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
              >
                {error ? <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" /> : <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <p>{error}</p>
                  {error && user?.teamId && !team && (
                    <button
                      onClick={handleDeleteTeam}
                      className="mt-2 text-sm underline font-semibold hover:text-red-800"
                    >
                      Force Delete/Reset Team Profile
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setError('')}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* Leadership Transition Welcome View (Special Onboarding) */}
            {pendingLeadershipRequest && !team && !editingTeam && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[var(--card-bg)] rounded-3xl p-10 mb-8 border border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.15)] relative overflow-hidden backdrop-blur-xl"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Crown size={120} className="text-blue-500" />
                </div>

                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
                    <Zap size={12} />
                    New Leader Action Required
                  </div>

                  <h2 className="text-4xl font-black text-[var(--text-primary)] italic uppercase tracking-tighter mb-4">
                    🎉 Welcome, {user.name || user.email}
                  </h2>

                  <p className="text-xl text-blue-400/70 font-light leading-relaxed mb-8">
                    You have been proposed as the new <span className="text-[var(--text-primary)] font-bold italic">Team Leader</span> for
                    <span className="text-blue-400 font-bold ml-1">"{pendingLeadershipRequest.teamName || 'TaskHive Team'}"</span>.
                  </p>

                  <div className="bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-2xl p-6 mb-8">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-xl">
                        <Mail className="text-blue-500" size={24} />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-widest mb-1">Rationale Prompt</p>
                        <p className="text-[var(--text-primary)] italic">"{pendingLeadershipRequest.reason}"</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm text-[var(--text-secondary)] font-medium">To join this team as a co-leader, enter the team code from your email:</p>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={inputTeamCode}
                        onChange={(e) => setInputTeamCode(e.target.value)}
                        placeholder="ENTER TEAM CODE"
                        className="flex-1 px-6 py-4 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] focus:border-blue-500 rounded-xl text-[var(--text-primary)] font-mono text-xl tracking-widest uppercase transition-all"
                      />
                      <button
                        onClick={async () => {
                          if (!inputTeamCode) {
                            toast.error("Please enter the team code");
                            return;
                          }
                          setJoiningTeam(true);
                          try {
                            const { joinTeamAsLeader } = await import('../services/teamService');
                            const { updateLeadershipRequest } = await import('../services/leadershipService');

                            const joinedTeam = await joinTeamAsLeader(user.uid, inputTeamCode);
                            await updateLeadershipRequest(pendingLeadershipRequest.id, { status: 'accepted' });

                            // Send notifications
                            const { sendNotification } = await import('../services/notificationService');
                            const { getTeamMembers } = await import('../services/teamService');

                            const members = await getTeamMembers(joinedTeam.id);
                            const newLeaderName = user.name || user.email || 'A New Leader';

                            // 1. Notify Members
                            await Promise.all(members.filter(m => m.id !== user.uid).map(member =>
                              sendNotification(
                                member.id,
                                joinedTeam.id,
                                'team_success',
                                'New Team Leader',
                                `${newLeaderName} has joined the team as a Team Leader.`
                              ).catch(e => console.warn('Member notification failed', e))
                            ));

                            // 2. Notify Original Leader (if exists and is not current user)
                            if (joinedTeam.leaderId && joinedTeam.leaderId !== user.uid) {
                              await sendNotification(
                                joinedTeam.leaderId,
                                joinedTeam.id,
                                'crown',
                                'Co-Leader Joined',
                                `${newLeaderName} has joined as a co-leader.`,
                                { type: 'leadership_transition' }
                              ).catch(e => console.warn('Leader notification failed', e));
                            }

                            toast.success(`Successfully joined ${joinedTeam.name}!`);

                            // Re-fetch user to get new teamId
                            setTimeout(() => window.location.reload(), 1500);
                          } catch (err) {
                            setError(err.message);
                            toast.error(err.message);
                          } finally {
                            setJoiningTeam(false);
                          }
                        }}
                        disabled={joiningTeam}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest transition-all transform hover:-translate-y-1 active:translate-y-0 shadow-lg shadow-blue-900/40 border border-blue-400/20 flex items-center gap-2"
                      >
                        {joiningTeam ? <Loader2 size={24} className="animate-spin" /> : <Plus size={24} />}
                        Join Team
                      </button>
                    </div>
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest mt-4">
                      No existing leader will be removed. You will lead together.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Team Creation/Editing Section */}
            {(!team || editingTeam) && !pendingLeadershipRequest && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[var(--card-bg)] rounded-xl shadow-lg p-8 mb-8 border border-[var(--border-color)]"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Users className="w-6 h-6 text-blue-500" />
                  <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
                    {editingTeam ? 'Edit Your Team' : 'Create Your Team'}
                  </h2>
                  {editingTeam && (
                    <button
                      onClick={() => {
                        setEditingTeam(false);
                        setTeamForm({
                          name: '',
                          maxSize: 10,
                          members: [{ name: '', email: '' }]
                        });
                      }}
                      className="ml-auto px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-secondary)]/80 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Team Name */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      value={teamForm.name}
                      onChange={(e) => handleTeamFormChange('name', e.target.value)}
                      placeholder="Enter your team name"
                      className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-[var(--text-secondary)]"
                      disabled={creating}
                    />
                  </div>

                  {/* Max Team Size */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Maximum Team Size
                    </label>
                    <select
                      value={teamForm.maxSize}
                      onChange={(e) => handleTeamFormChange('maxSize', parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={creating}
                    >
                      <option value={5}>5 members</option>
                      <option value={10}>10 members</option>
                      <option value={15}>15 members</option>
                      <option value={20}>20 members</option>
                    </select>
                  </div>

                  {/* Team Members */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Team Members (Optional)
                    </label>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                      Add team members now or invite them later using the team code
                    </p>

                    <div className="space-y-3">
                      {teamForm.members.map((member, index) => (
                        <div key={index} className="flex gap-3 items-center">
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                            placeholder="Member name"
                            className="flex-1 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-[var(--text-secondary)]"
                            disabled={creating}
                          />
                          <input
                            type="email"
                            value={member.email}
                            onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                            placeholder="member@example.com"
                            className="flex-1 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-[var(--text-secondary)]"
                            disabled={creating}
                          />
                          {teamForm.members.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMemberRow(index)}
                              disabled={creating}
                              className="p-2 text-red-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {teamForm.members.length < teamForm.maxSize - 1 && (
                      <button
                        type="button"
                        onClick={addMemberRow}
                        disabled={creating}
                        className="mt-3 flex items-center gap-2 text-blue-400 hover:text-blue-300 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                        Add Member
                      </button>
                    )}
                  </div>

                  {/* Create/Update Team Button */}
                  <button
                    onClick={editingTeam ? handleUpdateTeam : handleCreateTeam}
                    disabled={creating || !teamForm.name.trim()}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                  >
                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                    {creating ? (editingTeam ? 'Updating Team...' : 'Creating Team...') : (editingTeam ? 'Update Team' : 'Create Team')}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Team Overview Section */}
            {team && activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-8"
              >
                {/* Analytics Section */}
                {/* Analytics Section - Phase 5 */}
                <div className="space-y-8">
                  {/* 1. Project Summary Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div
                      whileHover={{ y: -5, scale: 1.02 }}
                      className="bg-[var(--card-bg)] p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group transition-all duration-500"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em]">Total Tasks</p>
                          <h3 className="text-3xl font-black text-[var(--text-primary)] mt-1 italic">{tasks.length}</h3>
                        </div>
                        <Target className="w-8 h-8 text-blue-100 bg-blue-600 rounded-lg p-1.5 shadow-[0_0_15px_rgba(37,99,235,0.4)] group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="mt-4 flex gap-2 text-[10px] font-bold uppercase tracking-wider relative z-10">
                        <span className="text-blue-400">{tasks.filter(t => t.status === 'Done').length} Done</span>
                        <span className="text-[var(--text-secondary)]">|</span>
                        <span className="text-[var(--text-secondary)]">{tasks.filter(t => t.status !== 'Done').length} Pending</span>
                      </div>
                      <div className="h-10 mt-4 opacity-20 group-hover:opacity-50 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                          <LineChart data={[10, 15, 12, 18, 14, 22, tasks.length].map(v => ({ v }))}>
                            <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -5, scale: 1.02 }}
                      className="bg-[var(--card-bg)] p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group transition-all duration-500"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em]">Overdue Tasks</p>
                          <h3 className="text-3xl font-black text-red-500 mt-1 italic">
                            {tasks.filter(t => {
                              if (!t.dueDate || t.status === 'Done') return false;
                              const due = t.dueDate?.seconds ? new Date(t.dueDate.seconds * 1000) : (t.dueDate ? new Date(t.dueDate) : null);
                              return due && due < new Date();
                            }).length}
                          </h3>
                        </div>
                        <div className="relative">
                          <AlertTriangle className="w-8 h-8 text-red-100 bg-red-600 rounded-lg p-1.5 shadow-[0_0_15px_rgba(220,38,38,0.4)] group-hover:scale-110 transition-transform" />
                          <div className="absolute -inset-1 bg-red-500/20 rounded-lg animate-ping opacity-30" />
                        </div>
                      </div>
                      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-red-400 relative z-10">Attention Needed</p>
                      <div className="h-10 mt-4 opacity-20 group-hover:opacity-50 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                          <LineChart data={[2, 4, 3, 5, 4, 6, 4].map(v => ({ v }))}>
                            <Line type="monotone" dataKey="v" stroke="#ef4444" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -5, scale: 1.02 }}
                      className="bg-[var(--card-bg)] p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group transition-all duration-500"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em]">Total Bugs</p>
                          <h3 className="text-3xl font-black text-[var(--text-primary)] mt-1 italic">{bugs.length}</h3>
                        </div>
                        <Bug className="w-8 h-8 text-purple-100 bg-purple-600 rounded-lg p-1.5 shadow-[0_0_15px_rgba(147,51,234,0.4)] group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="mt-4 flex gap-2 text-[10px] font-bold uppercase tracking-wider relative z-10">
                        <span className="text-red-400">{bugs.filter(b => b.status === 'Open').length} Open</span>
                        <span className="text-[var(--text-secondary)]">|</span>
                        <span className="text-emerald-400">{bugs.filter(b => b.status === 'Resolved').length} Resolved</span>
                      </div>
                      <div className="h-10 mt-4 opacity-20 group-hover:opacity-50 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                          <LineChart data={[8, 12, 10, 14, 11, 15, bugs.length].map(v => ({ v }))}>
                            <Line type="monotone" dataKey="v" stroke="#a855f7" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -5, scale: 1.02 }}
                      className="bg-[var(--card-bg)] p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group transition-all duration-500"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em]">Team Size</p>
                          <h3 className="text-3xl font-black text-[var(--text-primary)] mt-1 italic">{teamMembers.length}</h3>
                        </div>
                        <Users className="w-8 h-8 text-green-100 bg-green-600 rounded-lg p-1.5 shadow-[0_0_15px_rgba(34,197,94,0.4)] group-hover:scale-110 transition-transform" />
                      </div>
                      {/* Avatar Group Overlap */}
                      <div className="flex -space-x-3 mt-4 relative z-10">
                        {teamMembers.slice(0, 5).map((m, i) => (
                          <motion.div
                            key={m.id}
                            whileHover={{ y: -5, zIndex: 50, scale: 1.1 }}
                            className="w-8 h-8 rounded-full border-2 border-[var(--card-bg)] bg-[var(--bg-secondary)] overflow-hidden shadow-lg transition-all"
                            title={m.name}
                          >
                            {m.photoURL ? (
                              <img src={m.photoURL} alt={m.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[var(--text-secondary)] uppercase bg-blue-500/10">
                                {m.name.charAt(0)}
                              </div>
                            )}
                          </motion.div>
                        ))}
                        {teamMembers.length > 5 && (
                          <div className="w-8 h-8 rounded-full border-2 border-[var(--card-bg)] bg-[var(--bg-secondary)] flex items-center justify-center shadow-lg text-[10px] font-black text-blue-400">
                            +{teamMembers.length - 5}
                          </div>
                        )}
                      </div>
                      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] relative z-10">
                        {team.invitedMembers?.length || 0} Invites Pending
                      </p>
                      <div className="h-10 mt-4 opacity-20 group-hover:opacity-50 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                          <LineChart data={[1, 3, 2, 4, 3, 5, teamMembers.length].map(v => ({ v }))}>
                            <Line type="monotone" dataKey="v" stroke="#22c55e" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>
                  </div>

                  {/* 2. Global Task Completion Progress */}
                  <div className="bg-[var(--card-bg)] rounded-xl shadow-lg p-8 border border-[var(--border-color)]">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Project Progress</h3>
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-400 bg-blue-900/30">
                            Task Completion
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-blue-400">
                            {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'Done').length / tasks.length) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
                        <div
                          style={{ width: `${tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'Done').length / tasks.length) * 100) : 0}%` }}
                          className="shadow-[0_0_10px_rgba(59,130,246,0.5)] flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-500"
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Performance Analytics Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Tasks Per Member Chart */}
                    <div className="bg-[var(--card-bg)] rounded-xl shadow-lg p-6 border border-[var(--border-color)]">
                      <div className="flex items-center gap-3 mb-6">
                        <Target className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Tasks per Member</h3>
                      </div>
                      <div className="h-64 w-full" style={{ minHeight: '256px' }}>
                        <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                          <BarChart data={tasksPerMemberData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px', fontWeight: 450 }} />
                            <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px', fontWeight: 450 }} />
                            <Tooltip
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '0.75rem',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                                fontSize: '13px',
                                fontWeight: 500
                              }}
                              cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                            />
                            <Bar 
                              dataKey="Tasks" 
                              fill="hsl(var(--primary))" 
                              radius={[8, 8, 0, 0]}
                              className="bar-hover-scale"
                            />
                            <Bar 
                              dataKey="Completed" 
                              fill="#10B981" 
                              radius={[8, 8, 0, 0]}
                              className="bar-hover-scale"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Bug Status Chart */}
                    <div className="bg-[var(--card-bg)] rounded-xl shadow-lg p-6 border border-[var(--border-color)]">
                      <div className="flex items-center gap-3 mb-6">
                        <Bug className="w-5 h-5 text-red-400" />
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Bug Status Distribution</h3>
                      </div>
                      <div className="h-64 w-full flex items-center justify-center" style={{ minHeight: '256px' }}>
                        {bugStatusData.length > 0 && activeTab === 'overview' ? (
                          <div style={{ width: '100%', height: '100%', minHeight: '256px' }}>
                            <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                              <PieChart>
                                <Pie
                                  data={bugStatusData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                  stroke="none"
                                >
                                  {bugStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: 'var(--text-secondary)' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <p className="text-[var(--text-secondary)] text-sm">No bugs reported yet</p>
                        )}
                      </div>
                    </div>
                  </div>


                  {/* Recent Activities Section */}
                  <div className="bg-[var(--card-bg)] rounded-xl shadow-lg p-6 mt-8 border border-[var(--border-color)]">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <Activity className="w-6 h-6 text-indigo-400" />
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Recent Activities</h3>
                      </div>
                      {activities.length > 4 && (
                        <button
                          onClick={() => setShowAllActivities(true)}
                          className="text-sm text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          View All Activities
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {activities.length === 0 ? (
                        <div className="text-center py-8 text-[var(--text-secondary)]">
                          <Activity className="w-12 h-12 opacity-20 mx-auto mb-3" />
                          <p>No recent activities</p>
                        </div>
                      ) : (
                        activities.slice(0, 4).map((activity) => (
                          <div key={activity.id} className="flex items-start gap-4 p-3 hover:bg-[var(--bg-primary)] rounded-lg transition border border-transparent hover:border-[var(--border-color)]">
                            <div className="mt-1 flex-shrink-0">
                              {activity.performedByPhotoURL ? (
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-[var(--border-color)] bg-[var(--bg-secondary)]">
                                  <img src={activity.performedByPhotoURL} alt={activity.performedByName} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="p-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                                  {activity.type?.includes('BUG') ? (
                                    <Bug className="w-5 h-5 text-red-500" />
                                  ) : activity.type?.includes('TASK') ? (
                                    <CheckCircle className="w-5 h-5 text-blue-500" />
                                  ) : (
                                    <Users className="w-5 h-5 text-green-500" />
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-[var(--text-primary)] text-sm font-medium">{activity.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-[var(--text-secondary)]">
                                  {formatNotificationTime(activity.createdAt)}
                                </span>
                                <span className="text-xs text-[var(--text-secondary)]">•</span>
                                <span className="text-xs text-[var(--text-secondary)]">
                                  by {activity.performedByName || 'Unknown'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 4. Detailed Member Table */}
                  <div className="bg-[var(--card-bg)] rounded-xl shadow-lg p-8 border border-[var(--border-color)]">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Member Workload Details</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Member</th>
                            <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Assigned</th>
                            <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Completed</th>
                            <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Bugs</th>
                            <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Efficiency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teamMembers.map((member, index) => {
                            // Filter tasks for this member - check all possible field combinations
                            const memberTasks = (tasks || []).filter(t => 
                              t.assignedTo === member.id || 
                              t.assignedToUserId === member.id
                            );
                            const completedTasks = memberTasks.filter(t => t.status === 'Done');
                            const reportedBugs = (bugs || []).filter(b => b.reportedBy === member.id);
                            const efficiency = memberTasks.length > 0 ? Math.round((completedTasks.length / memberTasks.length) * 100) : 0;

                            return (
                              <tr 
                                key={member.id} 
                                className={`border-b border-white/5 hover:bg-[hsl(var(--muted)/0.5)] transition-colors ${index % 2 === 0 ? 'bg-[hsl(var(--muted)/0.3)]' : ''}`}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="relative group/avatar mr-4">
                                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 bg-[var(--bg-secondary)] flex items-center justify-center shadow-2xl transition-all duration-300 group-hover/avatar:scale-110 group-hover/avatar:rotate-3">
                                        {member.photoURL ? (
                                          <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover" />
                                        ) : (
                                          <span className="text-sm font-bold text-[var(--text-secondary)] uppercase">{member.name.charAt(0)}</span>
                                        )}
                                      </div>
                                      {/* Presence Indicator */}
                                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[var(--bg-primary)] shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                                        <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-40" />
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                                        {member.name}
                                        {member.role === 'leader' && (
                                          <Crown size={12} className="text-blue-400" />
                                        )}
                                      </div>
                                      <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-black leading-none">
                                        {member.role === 'leader' ? 'Administrator' : 'Contributor'}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-lg text-[var(--text-primary)]">{memberTasks.length}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-lg text-green-400">{completedTasks.length}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-lg text-[var(--text-primary)]">{reportedBugs.length}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span className={`font-bold text-lg ${
                                    efficiency > 70 ? 'text-green-400' : 
                                    efficiency >= 30 ? 'text-amber-400' : 
                                    'text-red-400'
                                  }`}>
                                    {efficiency}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>


                <div className="bg-[#151921] rounded-xl shadow-lg p-8 border border-gray-800">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-green-400" />
                      <h2 className="text-2xl font-semibold text-white">Your Team</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleEditTeam}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition flex items-center gap-2 shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Team
                      </button>
                      <button
                        onClick={handleCreateNewTeam}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition flex items-center gap-2 shadow-[0_0_10px_rgba(22,163,74,0.3)]"
                      >
                        <Plus className="w-4 h-4" />
                        New Team
                      </button>
                      <button
                        onClick={() => setDeletingTeam(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition flex items-center gap-2 shadow-[0_0_10px_rgba(220,38,38,0.3)]"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Team
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Team Details */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Team Details</h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">
                            Team Name
                          </label>
                          <p className="text-lg font-medium text-white">{team.name}</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">
                            Team Code
                          </label>
                          <div className="flex items-center gap-2">
                            <code className="bg-[#0B0F14] border border-gray-700 px-3 py-2 rounded-lg font-mono text-lg font-bold text-blue-400">
                              {team.teamId}
                            </code>
                            <button
                              onClick={copyTeamCode}
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                              title="Copy team code"
                            >
                              {copiedCode ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Share this code with team members to join
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">
                            Team Size
                          </label>
                          <p className="text-lg text-white">
                            {teamMembers.length + (team.invitedMembers?.length || 0)} / {team.maxSize} members
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">
                            Active Tasks
                          </label>
                          <p className="text-lg text-white">
                            {tasks.length} tasks
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Team Members */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Team Members</h3>

                      <div className="space-y-3">
                        {teamMembers.map((member) => (
                          <div key={member.id} className="flex items-center gap-3 p-3 bg-[#1e293b] rounded-lg border border-gray-700">
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-700 bg-gray-800 flex items-center justify-center flex-shrink-0 transition-transform hover:scale-110">
                              {member.photoURL ? (
                                <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-gray-400">
                                  {member.role === 'leader' ? <Crown className="w-5 h-5" /> : <User size={20} />}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-white">
                                {member.name}
                                {member.role === 'leader' && (
                                  <span className="ml-2 text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full border border-blue-500/30">
                                    Leader
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {member.email}
                              </p>
                            </div>
                          </div>
                        ))}

                        {/* Show invited members if any */}
                        {team.invitedMembers && team.invitedMembers.length > 0 && (
                          <>
                            <div className="border-t border-gray-700 pt-3 mt-3">
                              <p className="text-sm font-medium text-gray-400 mb-2">Invited Members</p>
                            </div>
                            {team.invitedMembers.map((member, index) => (
                              <div key={`invited-${index}`} className="flex items-center gap-3 p-3 bg-yellow-900/10 rounded-lg border border-yellow-700/30">
                                <div className="w-8 h-8 bg-yellow-900/20 rounded-full flex items-center justify-center border border-yellow-500/20">
                                  <Mail className="w-4 h-4 text-yellow-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-white">{member.name}</p>
                                  <p className="text-sm text-gray-400 flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {member.email}
                                    <span className="ml-2 text-xs bg-yellow-900/40 text-yellow-300 px-2 py-1 rounded-full border border-yellow-500/30">
                                      Invited
                                    </span>
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleCancelInvite(member.email)}
                                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition"
                                  title="Cancel Invitation"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Kanban Board Section */}
            {team && activeTab === 'kanban' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
              >
                <div className="bg-[var(--card-bg)]/50 backdrop-blur-sm rounded-xl p-6 border border-[var(--border-color)]">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Target className="w-6 h-6 text-blue-500" />
                        Kanban Board
                      </h2>
                      <p className="text-[var(--text-secondary)] mt-1">
                        Drag and drop tasks to update their status
                      </p>
                    </div>
                  </div>

                  <KanbanBoard projectId={user.teamId} userRole="leader" userId={user.uid} />
                </div>
              </motion.div>
            )}

            {/* Calendar & Events Section */}
            {team && activeTab === 'calendar' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="bg-[var(--card-bg)]/50 backdrop-blur-sm rounded-xl p-6 border border-[var(--border-color)] h-[800px]">
                  <CalendarView userRole="leader" userId={user.uid} />
                </div>
              </motion.div>
            )}

            {/* Task Management Section */}
            {team && activeTab === 'tasks' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
              >
                {/* Task Creation Header */}
                <div className="bg-[#151921] rounded-xl shadow-lg p-6 border border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Target className="w-6 h-6 text-blue-500" />
                      <h2 className="text-2xl font-semibold text-white">Task Management</h2>
                    </div>
                    <button
                      onClick={() => setShowTaskForm(!showTaskForm)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition flex items-center gap-2 shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                    >
                      <Plus className="w-4 h-4" />
                      Create Task
                    </button>
                  </div>

                  {/* Task Creation Form */}
                  {showTaskForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-800 pt-6 mt-6"
                    >
                      <h3 className="text-lg font-semibold text-white mb-4">
                        {editingTask ? 'Edit Task' : 'Create New Task'}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Task Title */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Task Title *
                          </label>
                          <input
                            type="text"
                            value={taskForm.title}
                            onChange={(e) => handleTaskFormChange('title', e.target.value)}
                            placeholder="Enter task title"
                            className="w-full px-4 py-2 bg-[#0B0F14] border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600"
                            disabled={taskLoading}
                          />
                        </div>

                        {/* Task Description */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Task Description
                          </label>
                          <textarea
                            value={taskForm.description}
                            onChange={(e) => handleTaskFormChange('description', e.target.value)}
                            placeholder="Enter task description"
                            rows={3}
                            className="w-full px-4 py-2 bg-[#0B0F14] border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600"
                            disabled={taskLoading}
                          />
                        </div>

                        {/* Assignment Method Selection */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-400 mb-3">
                            Assignment Method *
                          </label>
                          <div className="flex gap-4 mb-4">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="assignmentType"
                                value="existing"
                                checked={taskForm.assignmentType === 'existing'}
                                onChange={(e) => handleTaskFormChange('assignmentType', e.target.value)}
                                className="mr-2 accent-blue-500"
                                disabled={taskLoading}
                              />
                              <span className="text-sm text-gray-300">Assign to existing team member</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="assignmentType"
                                value="new"
                                checked={taskForm.assignmentType === 'new'}
                                onChange={(e) => handleTaskFormChange('assignmentType', e.target.value)}
                                className="mr-2 accent-blue-500"
                                disabled={taskLoading}
                              />
                              <span className="text-sm text-gray-300">Assign to new person (by email)</span>
                            </label>
                          </div>
                        </div>

                        {/* Existing Team Member Assignment */}
                        {taskForm.assignmentType === 'existing' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                              Select Team Member *
                            </label>
                            <select
                              value={taskForm.assignedTo}
                              onChange={(e) => handleTaskFormChange('assignedTo', e.target.value)}
                              className="w-full px-4 py-2 bg-[#0B0F14] border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              disabled={taskLoading}
                            >
                              <option value="">
                                {teamMembers.length === 0 ? 'No team members available' : 'Select team member'}
                              </option>
                              {teamMembers.map((member) => (
                                <option key={member.id} value={member.id}>
                                  {member.name} {member.role === 'leader' ? '(Leader)' : '(Member)'}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* New Person Assignment */}
                        {taskForm.assignmentType === 'new' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-2">
                                Assignee Name *
                              </label>
                              <input
                                type="text"
                                value={taskForm.assignedToName}
                                onChange={(e) => handleTaskFormChange('assignedToName', e.target.value)}
                                placeholder="Enter full name"
                                className="w-full px-4 py-2 bg-[#0B0F14] border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600"
                                disabled={taskLoading}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-2">
                                Assignee Email *
                              </label>
                              <input
                                type="email"
                                value={taskForm.assignedToEmail}
                                onChange={(e) => handleTaskFormChange('assignedToEmail', e.target.value)}
                                placeholder="Enter email address"
                                className="w-full px-4 py-2 bg-[#0B0F14] border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600"
                                disabled={taskLoading}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                📧 They will receive an email notification about this task
                              </p>
                            </div>
                          </>
                        )}

                        {/* Priority */}
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Priority
                          </label>
                          <select
                            value={taskForm.priority}
                            onChange={(e) => handleTaskFormChange('priority', e.target.value)}
                            className="w-full px-4 py-2 bg-[#0B0F14] border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={taskLoading}
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        </div>

                        {/* Due Date */}
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Due Date
                          </label>
                          <input
                            type="datetime-local"
                            value={taskForm.dueDate}
                            onChange={(e) => handleTaskFormChange('dueDate', e.target.value)}
                            className="w-full px-4 py-2 bg-[#0B0F14] border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={taskLoading}
                          />
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="md:col-span-2 mt-4">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Attachments
                        </label>
                        <div className="flex items-center gap-4">
                          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-[#1e293b] hover:bg-[#2e3b4e] border border-gray-700 rounded-lg text-gray-300 transition">
                            <span className="text-sm font-medium">Attach File</span>
                            <input type="file" onChange={handleFileUpload} className="hidden" />
                          </label>
                          <span className="text-xs text-gray-500">Max 5MB</span>
                        </div>
                        {taskForm.attachments && taskForm.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {taskForm.attachments.map((file, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm bg-blue-900/20 px-3 py-1.5 rounded-lg w-fit border border-blue-500/20">
                                <a 
                                  href={isLocalAttachment(file.url) ? "#" : file.url} 
                                  onClick={(e) => downloadAttachment(e, file.url, file.name)}
                                  target={isLocalAttachment(file.url) ? undefined : "_blank"} 
                                  rel={isLocalAttachment(file.url) ? undefined : "noreferrer"} 
                                  className="text-blue-400 underline truncate max-w-[200px]"
                                >
                                  {file.name}
                                </a>
                                <button
                                  onClick={() => setTaskForm(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== idx) }))}
                                  className="ml-2 text-red-500 hover:text-red-400"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={handleTaskSubmit}
                          disabled={taskLoading || !taskForm.title.trim() ||
                            (taskForm.assignmentType === 'existing' && !taskForm.assignedTo) ||
                            (taskForm.assignmentType === 'new' && (!taskForm.assignedToName.trim() || !taskForm.assignedToEmail.trim()))}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                        >
                          {taskLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                          {editingTask ? 'Update Task' : 'Create Task'}
                          {taskForm.assignmentType === 'new' && !editingTask && (
                            <span className="text-xs bg-blue-500 px-2 py-1 rounded-full ml-1">
                              📧 + Email
                            </span>
                          )}
                        </button>
                        <button
                          onClick={resetTaskForm}
                          disabled={taskLoading}
                          className="bg-gray-700 text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* Comments Section (Only when editing) */}
                      {editingTask && (
                        <div className="mt-8 border-t border-gray-800 pt-6">
                          <h4 className="text-lg font-semibold text-white mb-4">Comments</h4>

                          {/* Comment List */}
                          <div className="space-y-4 mb-6 max-h-60 overflow-y-auto bg-[#0B0F14] p-4 rounded-lg border border-gray-800">
                            {comments.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center">No comments yet.</p>
                            ) : (
                              comments.map((comment) => (
                                <div key={comment.id} className="bg-[#151921] p-3 rounded shadow-sm border border-gray-700">
                                  <div className="flex justify-between items-start">
                                    <span className="font-semibold text-sm text-gray-300">{comment.userName}</span>
                                    <span className="text-xs text-gray-500">
                                      {comment.createdAt?.seconds ? new Date(comment.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-400 mt-1">{comment.text}</p>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Add Comment */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Add a comment..."
                              className="flex-1 px-4 py-2 bg-[#1e293b] border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                              disabled={commentLoading}
                            />
                            <button
                              onClick={handleAddComment}
                              disabled={commentLoading || !newComment.trim()}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition disabled:opacity-50"
                            >
                              {commentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Tasks List */}
                <div className="bg-[#151921] rounded-xl shadow-lg p-6 border border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    All Tasks ({tasks.length})
                  </h3>

                  {tasks.length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No tasks created yet</p>
                      <p className="text-sm text-gray-500">Create your first task to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tasks.map((task) => {
                        const reassignmentRequested = task.status === 'Reassignment Requested';
                        return (
                          <div key={task.id} className={`bg-[#1e293b] border ${reassignmentRequested ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'border-gray-700'} rounded-lg p-4 hover:shadow-lg transition`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-lg font-semibold text-white">{task.title}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                    <Flag className="w-3 h-3 inline mr-1" />
                                    {task.priority}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)} ${reassignmentRequested ? 'animate-pulse' : ''}`}>
                                    {task.status}
                                  </span>
                                  {reassignmentRequested && (
                                    <span className="flex items-center gap-1 text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-900/20 px-3 py-1 rounded-full border border-purple-500/30">
                                      <RefreshCcw size={10} className="animate-spin-slow" />
                                      Reassignment Requested
                                    </span>
                                  )}
                                </div>

                                {task.description && (
                                  <p className="text-gray-400 mb-3">{task.description}</p>
                                )}

                                {/* Attachments Display */}
                                {task.attachments && task.attachments.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {task.attachments.map((file, idx) => (
                                      <a
                                        key={idx}
                                        href={isLocalAttachment(file.url) ? "#" : file.url}
                                        onClick={(e) => downloadAttachment(e, file.url, file.name)}
                                        target={isLocalAttachment(file.url) ? undefined : "_blank"}
                                        rel={isLocalAttachment(file.url) ? undefined : "noreferrer"}
                                        className="flex items-center gap-1 text-xs bg-gray-800 px-2 py-1 rounded hover:bg-gray-700 text-blue-400 transition border border-gray-700"
                                      >
                                        <Paperclip className="w-3 h-3" />
                                        <span className="truncate max-w-[150px]">{file.name}</span>
                                      </a>
                                    ))}
                                  </div>
                                )}

                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-700 bg-gray-800 flex items-center justify-center flex-shrink-0">
                                      {(() => {
                                        const member = teamMembers.find(m => m.id === task.assignedTo);
                                        if (member?.photoURL) {
                                          return <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover" />;
                                        }
                                        return <User className="w-3 h-3 text-gray-500" />;
                                      })()}
                                    </div>
                                    <span>Assigned to: {getMemberName(task)}</span>
                                  </div>
                                  {(() => {
                                    if (!task.dueDate) return null;

                                    // Handle Firestore Timestamp or Date String/Object
                                    const due = task.dueDate?.seconds
                                      ? new Date(task.dueDate.seconds * 1000)
                                      : (task.dueDate ? new Date(task.dueDate) : null);

                                    if (!due || isNaN(due.getTime())) return null;

                                    return (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>Due: {due.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                        {(() => {
                                          const now = new Date();
                                          const diffTime = due - now;
                                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                          if (diffDays < 0) return <span className="text-xs bg-red-900/40 text-red-400 px-2 py-0.5 rounded-full ml-1 font-medium border border-red-500/20">Overdue</span>;
                                          if (diffDays === 0) return <span className="text-xs bg-orange-900/40 text-orange-400 px-2 py-0.5 rounded-full ml-1 font-medium border border-orange-500/20">Due Today</span>;
                                          if (diffDays <= 3) return <span className="text-xs bg-yellow-900/40 text-yellow-400 px-2 py-0.5 rounded-full ml-1 font-medium border border-yellow-500/20">{diffDays} days left</span>;
                                          return <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full ml-1 border border-green-500/20">{diffDays} days left</span>;
                                        })()}
                                      </div>
                                    );
                                  })()}
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      Created: {task.createdAt?.seconds
                                        ? new Date(task.createdAt.seconds * 1000).toLocaleDateString()
                                        : (task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Unknown')}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 ml-4">
                                {(reassignmentRequested || task.status === 'Backlog' || task.status === 'To Do' || (task.dueDate && new Date(task.dueDate.seconds ? task.dueDate.seconds * 1000 : task.dueDate) < new Date())) && (
                                  <>
                                    <button
                                      onClick={() => handleReassignClick(task)}
                                      className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 rounded-lg transition"
                                      title="Reassign Task"
                                    >
                                      <RefreshCcw className="w-4 h-4" />
                                    </button>
                                    {reassignmentRequested && (
                                      <button
                                        onClick={() => handleReassignClick(task, true)}
                                        className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded-lg transition"
                                        title="Keep Same Member"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                    )}
                                  </>
                                )}
                                <button
                                  onClick={() => handleUpdateTaskStatus(task.id, 'Done')}
                                  className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20 rounded-lg transition"
                                  title="Mark as Done"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition"
                                  title="Edit task"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(task.id)}
                                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition"
                                  title="Delete task"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Bug Tracker Section */}
            {team && activeTab === 'bugs' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >

                {/* Bug List */}
                <div className="bg-[#151921] rounded-xl shadow-lg p-6 border border-gray-800">
                  <BugList
                    teamId={team.id}
                    role="leader"
                  />
                </div>
              </motion.div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#151921] rounded-lg p-6 max-w-md w-full mx-4 border border-gray-800 shadow-2xl"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">Delete Task</h3>
                  <p className="text-gray-400 mb-6">
                    Are you sure you want to delete this task? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDeleteTask(deleteConfirm)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition shadow-[0_0_10px_rgba(220,38,38,0.3)]"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* All Activities Modal */}
            {showAllActivities && (
              <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#151921] rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col border border-gray-800 shadow-2xl"
                >
                  <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">Project Activity Log</h3>
                    <button
                      onClick={() => setShowAllActivities(false)}
                      className="text-gray-400 hover:text-white transition"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto">
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-4 p-4 bg-[#1e293b] rounded-lg border border-gray-700">
                          <div className="mt-1">
                            {activity.type?.includes('BUG') ? (
                              <Bug className="w-5 h-5 text-red-500" />
                            ) : activity.type?.includes('TASK') ? (
                              <CheckCircle className="w-5 h-5 text-blue-500" />
                            ) : (
                              <Users className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-300 font-medium">{activity.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {activity.createdAt?.seconds ? new Date(activity.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {activity.performedByName || 'Unknown User'}
                              </span>
                            </div>
                            {activity.metadata && (
                              <div className="mt-2 text-xs text-gray-500 font-mono">
                                ID: {activity.metadata.targetId || 'N/A'} • Type: {activity.type}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border-t border-gray-800 bg-[#0B0F14] rounded-b-lg text-right">
                    <button
                      onClick={() => setShowAllActivities(false)}
                      className="px-4 py-2 bg-[#1e293b] border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 transition"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Delete Team Confirmation Modal */}
            {deletingTeam && (
              <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#151921] rounded-lg p-6 max-w-md w-full mx-4 border border-gray-800 shadow-2xl"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">Delete Team</h3>
                  <p className="text-gray-400 mb-6">
                    Are you sure you want to delete your team "{team?.name}"? This will remove all team members and cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteTeam}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition shadow-[0_0_10px_rgba(220,38,38,0.3)]"
                    >
                      Delete Team
                    </button>
                    <button
                      onClick={() => setDeletingTeam(false)}
                      className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </main>

        {/* Floating Action Button (FAB) - Elite Interaction */}
        <motion.button
          initial={{ scale: 0, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setActiveTab('tasks');
            setShowTaskForm(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-[0_20px_50px_rgba(37,99,235,0.4)] flex items-center justify-center z-[90] border border-blue-400/30 group"
          title="Create New Task"
        >
          <Plus size={32} className="group-hover:scale-110 transition-transform" />
          <div className="absolute -inset-2 bg-blue-500/20 rounded-2xl animate-pulse -z-10 group-hover:bg-blue-500/30 transition-colors" />
        </motion.button>
      </div>

      {/* Reassignment Modal */}
      <AnimatePresence>
        {reassigningTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#151921] border border-gray-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl overflow-hidden relative"
            >
              {/* Decorative background glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32"></div>

              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Adapt & Reassign</h2>
                  <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                    Keep Context. Change Responsibility.
                  </p>
                </div>
                <button onClick={() => setReassigningTask(null)} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Current Task</p>
                  <p className="text-white font-bold">{reassigningTask.title}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
                      New Assignee
                    </label>
                    <div className="relative">
                      <select
                        value={reassignForm.memberId}
                        onChange={(e) => {
                          const m = teamMembers.find(m => (m.id || m.uid) === e.target.value);
                          setReassignForm({ ...reassignForm, memberId: e.target.value, memberName: m ? (m.name || m.email) : '' });
                        }}
                        className="w-full bg-[#0B0F14] border border-gray-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500/50 appearance-none transition-all"
                      >
                        <option value="">Select Team Member</option>
                        {teamMembers.map(m => (
                          <option key={m.id || m.uid} value={m.id || m.uid}>
                            {m.name || m.email} {m.role === 'leader' ? '(Leader)' : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
                      New Deadline
                    </label>
                    <input
                      type="datetime-local"
                      value={reassignForm.dueDate}
                      onChange={(e) => setReassignForm({ ...reassignForm, dueDate: e.target.value })}
                      className="w-full bg-[#0B0F14] border border-gray-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    onClick={handleConfirmReassign}
                    disabled={reassignLoading || !reassignForm.memberId || !reassignForm.dueDate}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-purple-600/40 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                  >
                    {reassignLoading ? <Loader2 size={18} className="animate-spin" /> : (
                      <>
                        <RefreshCcw size={16} />
                        Reassign Task
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setReassigningTask(null)}
                    className="px-8 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all border border-white/5 uppercase tracking-widest text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
