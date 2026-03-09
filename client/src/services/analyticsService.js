/**
 * Analytics Service
 * Client-side calculations for performance metrics
 */

// Helper: Format duration human-readably (e.g., 1d 3h 20m)
const formatDuration = (seconds) => {
    if (!seconds || seconds < 0) return '0m';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);

    return parts.length > 0 ? parts.join(' ') : '0m';
};

export const calculateTeamStats = (tasks = [], bugs = [], members = []) => {
    // 1. Total Tasks Completed
    const completedTasks = tasks.filter(t => t.status === 'Done');

    // 2. Open vs Closed Tasks
    const openTasks = tasks.filter(t => t.status !== 'Done');

    // 3. Member Detailed Stats
    const memberTaskStats = members.map(member => {
        // Filter tasks for this member - matches LeaderDashboard logic
        const memberTasks = tasks.filter(t =>
            t.assignedTo === member.id ||
            t.assignedToUserId === member.id
        );
        const memberCompleted = memberTasks.filter(t => t.status === 'Done');

        console.log(`📊 Analytics for ${member.name}:`, {
            memberId: member.id,
            memberUid: member.uid,
            totalTasks: memberTasks.length,
            completed: memberCompleted.length,
            sampleTask: memberTasks[0] ? {
                title: memberTasks[0].title,
                assignedTo: memberTasks[0].assignedTo,
                assignedToUserId: memberTasks[0].assignedToUserId
            } : null
        });

        let totalCompletionTime = 0;
        let onTimeCount = 0;
        let reassignedCount = 0;
        let tasksWithCompletionTime = 0;

        memberCompleted.forEach(t => {
            // Time to Completion
            const created = t.createdAt?.seconds ? t.createdAt.seconds : new Date(t.createdAt).getTime() / 1000;
            const completed = t.completedAt ? (t.completedAt.seconds ? t.completedAt.seconds : new Date(t.completedAt).getTime() / 1000) : null;

            if (completed && created) {
                totalCompletionTime += (completed - created);
                tasksWithCompletionTime++;
            }

            // On-Time Check - if task has completedAt and dueDate
            const due = t.dueDate?.seconds ? t.dueDate.seconds : (t.dueDate ? new Date(t.dueDate).getTime() / 1000 : null);
            if (completed && due && completed <= due) {
                onTimeCount++;
            }
        });

        // Reassignment count
        reassignedCount = memberTasks.filter(t => t.reassignedAt || t.reassignedFrom).length;

        const avgSeconds = tasksWithCompletionTime > 0 ? totalCompletionTime / tasksWithCompletionTime : 0;

        console.log(`📊 Cycle time for ${member.name}:`, {
            tasksWithCompletionTime,
            totalCompletionTime,
            avgSeconds,
            avgFormatted: formatDuration(avgSeconds)
        });

        // Calculate simple efficiency (matches LeaderDashboard)
        const efficiency = memberTasks.length > 0 ? Math.round((memberCompleted.length / memberTasks.length) * 100) : 0;

        // Calculate on-time rate (only for tasks with BOTH due dates AND completedAt timestamps)
        const completedTasksWithDueDate = memberCompleted.filter(t => t.dueDate && t.completedAt);
        const onTimeRate = completedTasksWithDueDate.length > 0
            ? Math.round((onTimeCount / completedTasksWithDueDate.length) * 100)
            : efficiency; // Fallback to efficiency if tasks don't have completedAt timestamps yet

        console.log(`📊 Final stats for ${member.name}:`, {
            efficiency,
            onTimeRate,
            completedWithDueDate: completedTasksWithDueDate.length,
            onTimeCount,
            reassignedCount,
            avgCompletionTime: formatDuration(avgSeconds)
        });

        return {
            id: member.id || member.uid,
            name: member.name || member.email,
            total: memberTasks.length,
            completed: memberCompleted.length,
            onTime: onTimeCount,
            late: memberCompleted.length - onTimeCount,
            reassigned: reassignedCount,
            avgCompletionTime: formatDuration(avgSeconds),
            avgSeconds,
            completionRate: memberTasks.length ? Math.round((memberCompleted.length / memberTasks.length) * 100) : 0,
            onTimeRate: onTimeRate,
            efficiency: efficiency
        };
    }).sort((a, b) => b.completed - a.completed);

    // 4. Bug Stats (Simplified)
    const memberBugStats = members.map(member => {
        const memberBugs = bugs.filter(b => b.reportedBy === member.id || b.reportedBy === member.uid || b.userId === member.uid);
        const memberResolved = memberBugs.filter(b => b.status === 'Resolved');
        return {
            id: member.id || member.uid,
            name: member.name || member.email,
            totalReported: memberBugs.length,
            resolved: memberResolved.length
        };
    }).sort((a, b) => b.resolved - a.resolved);

    // Team Totals
    const teamOnTime = memberTaskStats.reduce((acc, m) => acc + m.onTime, 0);
    const teamLate = memberTaskStats.reduce((acc, m) => acc + m.late, 0);
    const teamReassigned = memberTaskStats.reduce((acc, m) => acc + m.reassigned, 0);

    return {
        overview: {
            totalTasks: tasks.length,
            completedTasks: completedTasks.length,
            completionRate: tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
            onTimeCount: teamOnTime,
            lateCount: teamLate,
            reassignedCount: teamReassigned,
            totalBugs: bugs.length,
            resolvedBugs: bugs.filter(b => b.status === 'Resolved').length
        },
        memberTaskStats,
        memberBugStats
    };
};

export const calculateMemberStats = (userId, tasks = [], bugs = []) => {
    // Filter tasks for this member - check both assignedTo and assignedToUserId
    const myTasks = tasks.filter(t =>
        t.assignedTo === userId ||
        t.assignedToUserId === userId
    );
    const myCompleted = myTasks.filter(t => t.status === 'Done');

    console.log(`📊 Member Analytics for ${userId}:`, {
        totalTasks: myTasks.length,
        completed: myCompleted.length,
        sampleTask: myTasks[0] ? {
            title: myTasks[0].title,
            assignedTo: myTasks[0].assignedTo,
            assignedToUserId: myTasks[0].assignedToUserId
        } : null
    });

    // Bug stats for member
    const myBugs = bugs.filter(b => b.reportedBy === userId || b.userId === userId);
    const myResolved = myBugs.filter(b => b.status === 'Resolved');

    let totalCompletionTime = 0;
    let onTimeCount = 0;
    let tasksWithCompletionTime = 0;

    myCompleted.forEach(t => {
        const created = t.createdAt?.seconds ? t.createdAt.seconds : new Date(t.createdAt).getTime() / 1000;
        const completed = t.completedAt ? (t.completedAt.seconds ? t.completedAt.seconds : new Date(t.completedAt).getTime() / 1000) : null;

        if (completed && created) {
            totalCompletionTime += (completed - created);
            tasksWithCompletionTime++;
        }

        const due = t.dueDate?.seconds ? t.dueDate.seconds : (t.dueDate ? new Date(t.dueDate).getTime() / 1000 : null);
        if (completed && due && completed <= due) onTimeCount++;
    });

    const avgSeconds = tasksWithCompletionTime > 0 ? totalCompletionTime / tasksWithCompletionTime : 0;

    // Activity Summary (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTasks = myCompleted.filter(t => {
        const date = t.completedAt?.toDate ? t.completedAt.toDate() : (t.completedAt?.seconds ? new Date(t.completedAt.seconds * 1000) : new Date(t.completedAt));
        return date && date >= thirtyDaysAgo;
    });

    const completionRate = myTasks.length ? Math.round((myCompleted.length / myTasks.length) * 100) : 0;
    const onTimeRate = myCompleted.length ? Math.round((onTimeCount / myCompleted.length) * 100) : 0;

    console.log(`📊 Final member stats:`, {
        totalTasks: myTasks.length,
        completedTasks: myCompleted.length,
        onTimeCount,
        onTimeRate,
        completionRate,
        avgCompletionTime: formatDuration(avgSeconds)
    });

    return {
        myOverview: {
            totalTasks: myTasks.length,
            completedTasks: myCompleted.length,
            onTimeCount,
            lateCount: myCompleted.length - onTimeCount,
            avgCompletionTime: formatDuration(avgSeconds),
            onTimeRate,
            completionRate,
            bugsReported: myBugs.length,
            bugsResolved: myResolved.length
        },
        activity: {
            tasksLast30Days: recentTasks.length
        }
    };
};
