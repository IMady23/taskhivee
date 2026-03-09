export function safeParse(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch (e) {
    return [];
  }
}

export function summarizeTasks(tasks, members) {
  const byMember = {};
  members.forEach((m) => {
    byMember[m] = { total: 0, completed: 0, pending: 0 };
  });

  const statusCounts = { 'To Do': 0, 'In Progress': 0, Done: 0 };
  let overdue = 0;
  const today = new Date().toISOString().split('T')[0];

  tasks.forEach((t) => {
    const assignee = t.assignedTo;
    if (members.includes(assignee)) {
      byMember[assignee].total += 1;
      if ((t.status || '').toLowerCase() === 'done') {
        byMember[assignee].completed += 1;
      } else {
        byMember[assignee].pending += 1;
      }
    }

    const s = t.status || 'To Do';
    if (s === 'To Do' || s === 'In Progress' || s === 'Done') statusCounts[s] = (statusCounts[s] || 0) + 1;
    if (t.deadline && t.deadline < today && s !== 'Done') overdue += 1;
  });

  const performance = members.map((m) => {
    const d = byMember[m];
    const percent = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0;
    return { member: m, total: d.total, completed: d.completed, pending: d.pending, percent };
  });

  const totalTasks = tasks.length;

  return { performance, totalTasks, statusCounts, overdue };
}

export function summarizeBugs(bugs, members) {
  const total = bugs.length;
  const status = { Open: 0, 'In Progress': 0, Resolved: 0 };
  const perMember = {};
  members.forEach((m) => (perMember[m] = 0));

  bugs.forEach((b) => {
    const s = b.status || 'Open';
    status[s] = (status[s] || 0) + 1;
    if (members.includes(b.reportedBy)) perMember[b.reportedBy] = (perMember[b.reportedBy] || 0) + 1;
  });

  return { total, status, perMember };
}