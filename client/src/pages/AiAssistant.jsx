import React, { useState, useRef, useEffect, useContext } from 'react';
import { Send, Bot, User, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
// import ReactMarkdown from 'react-markdown';
import { AuthContext } from '../context/AuthContext';
import TasksContext from '../context/TasksContext';
import BugsContext from '../context/BugsContext';
import TeamContext from '../context/TeamContext';
import { askAI } from '../services/aiService';
import { getTeamEvents } from '../services/eventService';
import { getTeamMembers } from '../services/teamService';
import { createBug } from '../services/bugService';

export default function AiAssistant() {
    const { user } = useContext(AuthContext);
    const { tasks, addTask } = useContext(TasksContext);
    const { bugs, addBug } = useContext(BugsContext);

    const location = useLocation();
    const [messages, setMessages] = useState([]);
    const [events, setEvents] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);

    const [usedModel, setUsedModel] = useState(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    // Action confirmation state
    const [pendingAction, setPendingAction] = useState(null);
    const [showActionConfirm, setShowActionConfirm] = useState(false);

    // Load events and team members
    useEffect(() => {
        const loadProjectData = async () => {
            if (user?.teamId) {
                try {
                    const [teamEvents, teamMembersList] = await Promise.all([
                        getTeamEvents(user.teamId),
                        getTeamMembers(user.teamId)
                    ]);
                    setEvents(teamEvents || []);
                    setTeamMembers(teamMembersList || []);
                } catch (error) {
                    console.warn('Could not load project data for AI:', error);
                }
            }
        };
        loadProjectData();
    }, [user?.teamId]);

    // Load Buffer & Initial Greeting
    useEffect(() => {
        const saved = localStorage.getItem(`ai_chat_${user?.uid}`);
        if (saved) {
            setMessages(JSON.parse(saved));
        } else {
            const role = user?.role?.toLowerCase() || 'member';
            const name = user?.name?.split(' ')[0] || 'there';
            let greeting = `Hello ${name}. I am the TaskHive AI Assistant. How can I help you with your tasks or bugs today?`;

            if (role === 'leader') {
                greeting = `Greetings, Leader ${name}. I am here to assist with team strategy, task guidelines, and ethical collaboration. What is on your mind?`;
            }

            setMessages([{ id: 'welcome', role: 'assistant', content: greeting }]);
        }
    }, [user]);

    // Persistence & Auto-Scroll
    useEffect(() => {
        if (messages.length > 0 && user?.uid) {
            localStorage.setItem(`ai_chat_${user.uid}`, JSON.stringify(messages));
        }
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, user]);

    const detectAction = (message) => {
        const lowerMsg = message.toLowerCase();

        // Task creation patterns (Leader only)
        if ((lowerMsg.includes('create') || lowerMsg.includes('add')) && lowerMsg.includes('task')) {
            if (user?.role === 'leader') {
                return { type: 'create_task', message };
            }
        }

        // Bug reporting patterns (Member only)
        if ((lowerMsg.includes('report') || lowerMsg.includes('create')) && lowerMsg.includes('bug')) {
            if (user?.role === 'member') {
                return { type: 'create_bug', message };
            }
        }

        return null;
    };

    const handleSend = async (e, overrideInput) => {
        if (e) e.preventDefault();
        const textToSend = overrideInput || input;

        if (!textToSend.trim() || loading) return;

        // Detect if this is an action request
        const detectedAction = detectAction(textToSend);

        if (detectedAction) {
            // Show confirmation dialog
            setPendingAction({
                type: detectedAction.type,
                message: textToSend,
                originalInput: textToSend
            });
            setShowActionConfirm(true);
            setInput(''); // Clear input
            return;
        }

        const userMsg = { id: Date.now(), role: 'user', content: textToSend };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // ===== COMPREHENSIVE PROJECT CONTEXT =====

            // Task Analysis
            const totalTasks = tasks?.length || 0;
            const tasksByStatus = {
                todo: tasks?.filter(t => t.status === 'To Do').length || 0,
                inProgress: tasks?.filter(t => t.status === 'In Progress').length || 0,
                done: tasks?.filter(t => t.status === 'Done').length || 0
            };
            const tasksByPriority = {
                high: tasks?.filter(t => t.priority === 'High' || t.priority === 'Urgent').length || 0,
                medium: tasks?.filter(t => t.priority === 'Medium').length || 0,
                low: tasks?.filter(t => t.priority === 'Low').length || 0
            };

            // Overdue tasks
            const now = new Date();
            const overdueTasks = tasks?.filter(t => {
                if (!t.dueDate) return false;
                const dueDate = t.dueDate.seconds ? new Date(t.dueDate.seconds * 1000) : new Date(t.dueDate);
                return dueDate < now && t.status !== 'Done';
            }) || [];

            // Recent tasks with details
            const recentTasks = tasks?.slice(0, 10).map(t => {
                const dateVal = t.dueDate;
                const due = dateVal ? new Date(dateVal.seconds ? dateVal.seconds * 1000 : dateVal).toLocaleDateString() : 'No Date';
                return {
                    title: t.title,
                    status: t.status,
                    priority: t.priority,
                    dueDate: due,
                    assignedTo: t.assignedToName || 'Unassigned'
                };
            }) || [];

            // Bug Analysis
            const totalBugs = bugs?.length || 0;
            const bugsByStatus = {
                open: bugs?.filter(b => b.status === 'Open').length || 0,
                inProgress: bugs?.filter(b => b.status === 'In Progress').length || 0,
                resolved: bugs?.filter(b => b.status === 'Resolved' || b.status === 'Fixed').length || 0
            };
            const bugsBySeverity = {
                critical: bugs?.filter(b => b.severity === 'Critical').length || 0,
                high: bugs?.filter(b => b.severity === 'High').length || 0,
                medium: bugs?.filter(b => b.severity === 'Medium').length || 0,
                low: bugs?.filter(b => b.severity === 'Low').length || 0
            };

            // Recent bugs with details
            const recentBugs = bugs?.slice(0, 5).map(b => ({
                title: b.title,
                severity: b.severity,
                status: b.status,
                reportedBy: b.reportedByName || 'Unknown'
            })) || [];

            // Team Member Analysis
            const totalMembers = teamMembers?.length || 0;
            const memberWorkload = teamMembers?.map(m => {
                const assignedTasks = tasks?.filter(t => t.assignedTo === m.id).length || 0;
                const completedTasks = tasks?.filter(t => t.assignedTo === m.id && t.status === 'Done').length || 0;
                return {
                    name: m.name,
                    email: m.email,
                    role: m.role,
                    assignedTasks,
                    completedTasks,
                    completionRate: assignedTasks > 0 ? Math.round((completedTasks / assignedTasks) * 100) : 0
                };
            }) || [];

            // Calendar Events Analysis
            const totalEvents = events?.length || 0;
            const upcomingEvents = events?.filter(e => {
                const eventDate = new Date(e.date);
                return eventDate > now;
            }).slice(0, 5).map(e => ({
                title: e.title,
                type: e.type,
                date: new Date(e.date).toLocaleDateString(),
                time: new Date(e.date).toLocaleTimeString()
            })) || [];

            // Project Health Metrics
            const completionRate = totalTasks > 0 ? Math.round((tasksByStatus.done / totalTasks) * 100) : 0;
            const bugResolutionRate = totalBugs > 0 ? Math.round((bugsByStatus.resolved / totalBugs) * 100) : 0;

            // Build comprehensive context
            const context = {
                user: {
                    name: user?.name || 'User',
                    email: user?.email || '',
                    role: user?.role || 'Member',
                    teamId: user?.teamId || ''
                },
                currentPage: location.pathname,
                project: {
                    tasks: {
                        total: totalTasks,
                        byStatus: tasksByStatus,
                        byPriority: tasksByPriority,
                        overdue: overdueTasks.length,
                        completionRate: `${completionRate}%`,
                        recent: recentTasks
                    },
                    bugs: {
                        total: totalBugs,
                        byStatus: bugsByStatus,
                        bySeverity: bugsBySeverity,
                        resolutionRate: `${bugResolutionRate}%`,
                        recent: recentBugs
                    },
                    team: {
                        totalMembers,
                        members: memberWorkload
                    },
                    calendar: {
                        totalEvents,
                        upcoming: upcomingEvents
                    }
                }
            };

            const response = await askAI(textToSend, context, []);
            setUsedModel(response.usedModel);
            const botMsg = { id: Date.now() + 1, role: 'assistant', content: response.answer, model: response.usedModel };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            const errorMsg = {
                id: Date.now() + 1,
                role: 'system',
                content: error.message || "Failed to get response. Please check your API key."
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const suggestions = user?.role?.toLowerCase() === 'leader' ? [
        "Analyze my team's workload distribution",
        "What are our critical bugs?",
        "Show me overdue tasks and suggest priorities",
        "How is our project health?",
        "Which team member needs support?"
    ] : [
        "What are my pending tasks?",
        "Show me high-priority items",
        "When are my upcoming deadlines?",
        "Help me prioritize my work",
        "What bugs are assigned to me?"
    ];

    // Handle action confirmation
    const handleConfirmAction = async () => {
        if (!pendingAction) return;

        setShowActionConfirm(false);
        setLoading(true);

        const userMsg = { id: Date.now(), role: 'user', content: pendingAction.message };
        setMessages(prev => [...prev, userMsg]);

        try {
            // Execute the action based on type
            if (pendingAction.type === 'create_task') {
                if (user.role !== 'leader') {
                    throw new Error('Sorry, you cannot create tasks. Only team leaders have permission to assign tasks.');
                }

                // Enhanced parsing for task details
                const message = pendingAction.message.toLowerCase();

                // Extract title - improved logic to handle "create a task to [name] to [title]"
                let title = pendingAction.message
                    .replace(/^(create|add)\s+(a\s+)?task\s+(to\s+)?/gi, '') // Remove command prefix
                    .replace(/\s+(assign(?:ed)?\s+to|priority|due|deadline|on|complexity)\s+.*/gi, '') // Remove metadata
                    .replace(/\s+and\s*$/i, '') // Remove trailing "and"
                    .trim();

                // Extract assignee using "to [name]" or "assign to [name]"
                let assignedTo = 'Unassigned';
                let assignedToName = 'Unassigned';

                // Try searching for members in the prompt
                const memberInPrompt = teamMembers.find(m =>
                    message.includes(m.name.toLowerCase()) ||
                    message.includes((m.name.split(' ')[0] || '').toLowerCase())
                );

                if (memberInPrompt) {
                    assignedTo = memberInPrompt.id;
                    assignedToName = memberInPrompt.name;

                    // Clean up title if it contains the name (e.g., "to nandhini to complete...")
                    const nameRegex = new RegExp(`to\\s+${memberInPrompt.name.split(' ')[0]}\\s+to\\s+(.+)`, 'i');
                    const titleMatch = title.match(nameRegex);
                    if (titleMatch) {
                        title = titleMatch[1].trim();
                    }
                }

                // Extract priority
                let priority = 'Medium';
                if (message.includes('high') || message.includes('urgent') || message.includes('critical')) priority = 'High';
                else if (message.includes('low')) priority = 'Low';

                // Extract deadline - enhanced to handle "is", "at", and years
                let dueDate = null;
                const dateMatch = message.match(/(?:due|deadline|on|by|complete\s+on)\s+(?:is\s+)?(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(\w+)(?:\s+(\d{4}))?/i);
                if (dateMatch) {
                    const day = parseInt(dateMatch[1]);
                    const month = dateMatch[2].toLowerCase();
                    const yearStr = dateMatch[3];
                    const monthMap = {
                        'jan': 0, 'january': 0, 'feb': 1, 'february': 1, 'mar': 2, 'march': 2,
                        'apr': 3, 'april': 3, 'may': 4, 'jun': 5, 'june': 5,
                        'jul': 6, 'july': 6, 'aug': 7, 'august': 7, 'sep': 8, 'september': 8,
                        'oct': 9, 'october': 9, 'nov': 10, 'november': 10, 'dec': 11, 'december': 11
                    };

                    const monthNum = monthMap[month.substring(0, 3)];
                    if (monthNum !== undefined && day >= 1 && day <= 31) {
                        const now = new Date();
                        let year = now.getFullYear();

                        if (yearStr && yearStr.length === 4) {
                            year = parseInt(yearStr);
                        }

                        dueDate = new Date(year, monthNum, day);
                        if (!yearStr && dueDate < now) dueDate.setFullYear(year + 1);
                    }
                }

                const taskData = {
                    title: title || 'Untitled Task',
                    description: `Created via AI Assistant by ${user.name}`,
                    assignedTo: assignedTo,
                    assignedToName: assignedToName,
                    priority: priority,
                    status: 'To Do',
                    dueDate: dueDate
                };

                // Use TasksContext.addTask for real-time reflection and notifications
                await addTask(taskData);

                const dueDateStr = dueDate ? dueDate.toLocaleDateString() : 'Not set';

                const successMsg = {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: `✅ Task created successfully!\n\n📋 **${taskData.title}**\n👤 Assigned to: ${assignedToName}\n⚡ Priority: ${priority}\n📅 Due: ${dueDateStr}\n\nThe task has been added and ${assignedToName !== 'Unassigned' ? 'notifications have been sent.' : 'is currently unassigned.'}`
                };
                setMessages(prev => [...prev, successMsg]);

            } else if (pendingAction.type === 'create_bug') {
                if (user.role !== 'member') {
                    throw new Error('Only team members can report bugs. Leaders should manage tasks.');
                }
                // ... rest of bug logic ...
                const message = pendingAction.message.toLowerCase();

                let title = pendingAction.message
                    .replace(/^(report|create)\s+(a\s+)?bug\s*:?\s*/gi, '')
                    .replace(/\s+(severity|priority)\s+.*/gi, '')
                    .trim();

                let severity = 'Medium';
                if (message.includes('critical')) severity = 'Critical';
                else if (message.includes('high')) severity = 'High';
                else if (message.includes('low')) severity = 'Low';

                const bugData = {
                    title: title || 'Untitled Bug',
                    description: `Reported via AI Assistant by ${user.name}`,
                    severity: severity,
                    status: 'Open',
                    reportedBy: user.uid,
                    reportedByName: user.name,
                    teamId: user.teamId
                };

                // Use BugsContext.addBug for real-time reflection and notifications if available, 
                // otherwise fallback to the service
                if (addBug) {
                    await addBug(bugData);
                } else {
                    await createBug(bugData);
                }

                const successMsg = {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: `✅ Bug reported successfully!\n\n🐛 **${bugData.title}**\n⚠️ Severity: ${severity}\n📊 Status: Open\n\nYour team leader has been notified.`
                };
                setMessages(prev => [...prev, successMsg]);

            } else {
                throw new Error('Action not supported.');
            }

        } catch (error) {
            const errorMsg = {
                id: Date.now() + 1,
                role: 'system',
                content: `❌ Failed to execute action: ${error.message}`
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
            setPendingAction(null);
        }
    };

    const handleCancelAction = () => {
        setShowActionConfirm(false);
        setPendingAction(null);
        setInput(pendingAction?.originalInput || ''); // Restore input
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] max-w-4xl mx-auto w-full bg-[#151921] rounded-2xl shadow-sm border border-[#1e293b] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[#1e293b] bg-[#151921] flex items-center gap-3">
                <div className="bg-[#1e293b] p-2 rounded-full shadow-sm">
                    <Bot size={24} className="text-purple-400" />
                </div>
                <div>
                    <h1 className="font-bold text-white text-lg">TaskHive AI Assistant</h1>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                        {usedModel ? `Active: ${usedModel}` : "Productivity & Ethics Guidance"}
                    </p>
                </div>
                <div className="ml-auto">
                    <button
                        onClick={() => {
                            setMessages([]);
                            localStorage.removeItem(`ai_chat_${user?.uid}`);
                            setUsedModel(null);
                        }}
                        className="text-xs text-gray-400 hover:text-red-500 bg-[#0B0F14] px-3 py-1.5 rounded-lg border border-[#1e293b] transition-colors"
                    >
                        Clear Chat
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0B0F14]">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 
                            ${msg.role === 'user' ? 'bg-blue-900/30 text-blue-400' :
                                msg.role === 'system' ? 'bg-red-900/30 text-red-400' : 'bg-purple-900/30 text-purple-400'}`}>
                            {msg.role === 'user' ? <User size={16} /> :
                                msg.role === 'system' ? <AlertCircle size={16} /> : <Bot size={16} />}
                        </div>

                        <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm 
                            ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : msg.role === 'system'
                                    ? 'bg-red-900/20 text-red-300 border border-red-900/50'
                                    : 'bg-[#1e293b] text-gray-200 border border-[#334155] rounded-tl-none'}`}>

                            {msg.role === 'assistant' ? (
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                    {/* Fallback to text until react-markdown is fixed */}
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-purple-900/30 text-purple-400 flex items-center justify-center">
                            <Bot size={16} />
                        </div>
                        <div className="bg-[#1e293b] p-4 rounded-2xl rounded-tl-none border border-[#334155] shadow-sm flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin text-purple-400" />
                            <span className="text-sm text-gray-400">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Quick Suggestions */}
            <div className="px-4 py-2 bg-[#151921] flex gap-2 overflow-x-auto border-t border-[#1e293b]">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => handleSend(null, s)}
                        disabled={loading}
                        className="whitespace-nowrap px-3 py-1.5 bg-[#1e293b] text-gray-400 text-xs rounded-full border border-[#334155] hover:bg-purple-900/30 hover:text-purple-300 hover:border-purple-500/50 transition-colors"
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-[#151921] border-t border-[#1e293b]">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about tasks, bugs, or team performance..."
                        className="w-full bg-[#0B0F14] border border-[#1e293b] text-white text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-4 pr-12 shadow-inner transition-all placeholder-gray-500"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="absolute right-2 p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">
                    AI can make mistakes. Please verify important suggestions.
                </p>
            </form>

            {/* Action Confirmation Dialog */}
            {showActionConfirm && pendingAction && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--card-bg)] rounded-2xl p-6 max-w-md w-full border border-[var(--border-color)] shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <CheckCircle size={24} className="text-blue-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Confirm Action</h3>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-300 mb-2">
                                {pendingAction.type === 'create_task'
                                    ? '🎯 Create a new task?'
                                    : '🐛 Report a new bug?'}
                            </p>
                            <div className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-color)]">
                                <p className="text-sm text-gray-400 italic">"{pendingAction.message}"</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                {pendingAction.type === 'create_task'
                                    ? 'This will create a new task in your team.'
                                    : 'This will report a bug to your team leader.'}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelAction}
                                className="flex-1 px-4 py-2 bg-[var(--bg-secondary)] text-white rounded-lg hover:bg-[var(--bg-primary)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
