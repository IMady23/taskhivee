import express from 'express';
import fetch from 'node-fetch';
// TaskHive AI Assistant routing (Mistral/Llama supported)
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Debug route
router.get('/test', (req, res) => res.json({
    status: 'AI Service Online',
    provider: 'Groq',
    keyPresent: !!process.env.GROQ_API_KEY
}));

router.post('/ask', async (req, res) => {
    try {
        const { prompt, context = {}, attachments = [] } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: "Groq API Key is missing in server .env" });
        }

        // --- TASKHIVE AI ASSISTANT PERSONA ---
        const systemRole = `
SYSTEM ROLE:
You are TaskHive AI Assistant, an intelligent project management companion with FULL visibility into the user's project.

PRIMARY PURPOSE:
Provide intelligent insights, analysis, and guidance on:
- Task management and prioritization
- Bug tracking and resolution strategies
- Team workload and performance analysis
- Calendar events and deadline management
- Project health and progress metrics
- Best practices and recommendations

YOU HAVE ACCESS TO:
✓ All tasks (titles, status, priority, due dates, assignees)
✓ All bugs (severity, status, descriptions)
✓ Team members (names, roles, workload, completion rates)
✓ Calendar events (upcoming meetings, deadlines, milestones)
✓ Project metrics (completion rates, overdue items, team performance)

CURRENT PROJECT STATE:
User: ${context.user?.name || 'User'} (${context.user?.role || 'Member'})
Email: ${context.user?.email || 'N/A'}
Current Page: ${context.currentPage || 'Dashboard'}

TASKS OVERVIEW:
- Total: ${context.project?.tasks?.total || 0}
- To Do: ${context.project?.tasks?.byStatus?.todo || 0}
- In Progress: ${context.project?.tasks?.byStatus?.inProgress || 0}
- Done: ${context.project?.tasks?.byStatus?.done || 0}
- Overdue: ${context.project?.tasks?.overdue || 0}
- Completion Rate: ${context.project?.tasks?.completionRate || '0%'}
- High Priority: ${context.project?.tasks?.byPriority?.high || 0}

BUGS OVERVIEW:
- Total: ${context.project?.bugs?.total || 0}
- Open: ${context.project?.bugs?.byStatus?.open || 0}
- In Progress: ${context.project?.bugs?.byStatus?.inProgress || 0}
- Resolved: ${context.project?.bugs?.byStatus?.resolved || 0}
- Critical: ${context.project?.bugs?.bySeverity?.critical || 0}
- Resolution Rate: ${context.project?.bugs?.resolutionRate || '0%'}

TEAM OVERVIEW:
- Total Members: ${context.project?.team?.totalMembers || 0}
${context.project?.team?.members?.slice(0, 5).map(m =>
            `- ${m.name} (${m.role}): ${m.assignedTasks} tasks, ${m.completionRate}% completion`
        ).join('\n') || '- No team data'}

CALENDAR OVERVIEW:
- Total Events: ${context.project?.calendar?.totalEvents || 0}
- Upcoming Events: ${context.project?.calendar?.upcoming?.length || 0}
${context.project?.calendar?.upcoming?.slice(0, 3).map(e =>
            `- ${e.title} (${e.type}) on ${e.date}`
        ).join('\n') || '- No upcoming events'}

RECENT TASKS:
${context.project?.tasks?.recent?.slice(0, 5).map(t =>
            `- "${t.title}" [${t.status}] [${t.priority}] Due: ${t.dueDate} (Assigned: ${t.assignedTo})`
        ).join('\n') || '- No recent tasks'}

RECENT BUGS:
${context.project?.bugs?.recent?.slice(0, 3).map(b =>
            `- "${b.title}" [${b.severity}] [${b.status}] Reported by: ${b.reportedBy}`
        ).join('\n') || '- No recent bugs'}

CAPABILITIES:
✓ Analyze project health and provide insights
✓ Identify bottlenecks and overdue items
✓ Suggest task prioritization strategies
✓ Recommend team workload balancing
✓ Provide bug resolution guidance
✓ Answer questions about specific tasks, bugs, or team members
✓ Offer productivity tips and best practices

STRICT RULES:
1. You can READ and ANALYZE all project data
2. You CANNOT create, update, delete, or modify any data
3. You can only SUGGEST, GUIDE, EXPLAIN, and RECOMMEND
4. Never hallucinate data - only use the information provided
5. Be specific and reference actual project data when answering
6. Keep responses clear, actionable, and professional

RESPONSE STYLE:
- Be conversational but professional
- Use bullet points for clarity
- Reference specific tasks/bugs/members when relevant
- Provide actionable insights
- Be supportive and constructive
`;

        let answer = null;
        let usedModel = null;
        const failures = [];

        // --- GEMINI 1.5 FLASH (Multimodal Support) ---
        if (process.env.GEMINI_API_KEY && (attachments.length > 0 || !prompt.includes('analyze'))) {
            try {
                console.log(`Attempting Gemini 1.5 Flash...`);

                // Construct parts for Gemini
                const parts = [{ text: systemRole + "\n\nUser Question: " + prompt }];

                for (const file of attachments) {
                    const [meta, data] = file.base64.split(',');
                    const mimeType = meta.split(':')[1].split(';')[0];
                    parts.push({
                        inlineData: {
                            mimeType: mimeType,
                            data: data
                        }
                    });
                }

                const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts }]
                    })
                });

                const geminiData = await geminiResponse.json();
                if (geminiResponse.ok && geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
                    answer = geminiData.candidates[0].content.parts[0].text;
                    usedModel = "Gemini 1.5 Flash (Multimodal)";
                } else {
                    const err = geminiData.error?.message || "Gemini unknown error";
                    console.warn("Gemini failed, falling back to Groq:", err);
                    failures.push(`Gemini: ${err}`);
                }
            } catch (e) {
                console.warn("Gemini fetch error:", e.message);
                failures.push(`Gemini Network: ${e.message}`);
            }
        }

        // --- GROQ MODELS (Llama 3.3 / 3.1) ---
        // Fallback for text-only or if Gemini fails
        if (!answer) {
            const modelsToTry = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

            for (const mModel of modelsToTry) {
                try {
                    console.log(`Attempting Model (${mModel})...`);
                    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
                        },
                        body: JSON.stringify({
                            model: mModel,
                            messages: [
                                { role: "system", content: systemRole },
                                { role: "user", content: prompt }
                            ],
                            temperature: 0.7,
                            max_tokens: 1024
                        })
                    });

                    const groqData = await groqResponse.json();
                    if (groqResponse.ok && groqData.choices?.[0]?.message?.content) {
                        answer = groqData.choices[0].message.content;
                        usedModel = `Groq (${mModel})`;
                        break;
                    } else {
                        const err = groqData.error?.message || groqData.error || "Groq unknown error";
                        console.warn(`Model ${mModel} failed:`, err);
                        failures.push(`${mModel}: ${err}`);
                    }
                } catch (e) {
                    console.warn(`Fetch error (${mModel}):`, e.message);
                    failures.push(`${mModel} Network: ${e.message}`);
                }
            }
        }

        if (!answer) {
            console.error("AI models failed. Failures:", failures);
            throw new Error(`All models failed. Details: ${failures.join(' | ')}`);
        }

        res.json({ answer, usedModel });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Failed to fetch AI response", details: error.message });
    }
});

export default router;


// AI Action Handler - Executes actions based on AI suggestions
router.post('/action', async (req, res) => {
    try {
        const { action, params, userRole, userId, teamId } = req.body;

        if (!action) {
            return res.status(400).json({ error: "Action is required" });
        }

        // Role-based permission check
        const hasPermission = (requiredRole) => {
            if (requiredRole === 'leader') return userRole === 'leader';
            return true; // Members can do member actions
        };

        let result = {};

        switch (action) {
            case 'create_task':
                // Only leaders can create tasks
                if (!hasPermission('leader')) {
                    return res.status(403).json({ error: "Only leaders can create tasks" });
                }
                result = {
                    success: true,
                    message: "Task creation request received",
                    data: params
                };
                break;

            case 'create_bug':
                // Only members can create bugs
                if (userRole !== 'member') {
                    return res.status(403).json({ error: "Only members can report bugs" });
                }
                result = {
                    success: true,
                    message: "Bug report received",
                    data: params
                };
                break;

            case 'update_task_status':
                // Members can update their own tasks, leaders can update any
                result = {
                    success: true,
                    message: "Task status update request received",
                    data: params
                };
                break;

            case 'update_bug_status':
                // Members can update their own bugs
                result = {
                    success: true,
                    message: "Bug status update request received",
                    data: params
                };
                break;

            case 'delete_bug':
                // Only leaders can delete bugs
                if (!hasPermission('leader')) {
                    return res.status(403).json({ error: "Only leaders can delete bugs" });
                }
                result = {
                    success: true,
                    message: "Bug deletion request received",
                    data: params
                };
                break;

            case 'request_bug_deletion':
                // Members can request bug deletion
                result = {
                    success: true,
                    message: "Bug deletion request sent to leader",
                    data: params
                };
                break;

            default:
                return res.status(400).json({ error: "Unknown action" });
        }

        res.json(result);

    } catch (error) {
        console.error("AI Action Error:", error);
        res.status(500).json({ error: "Failed to execute action", details: error.message });
    }
});
