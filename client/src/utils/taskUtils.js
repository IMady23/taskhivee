/**
 * Shared utility functions for task management
 */

// Priority color mapping
export const priorityColors = {
  low: '#3B82F6',      // blue
  medium: '#F59E0B',   // yellow/orange
  high: '#F97316',     // orange
  urgent: '#EF4444'    // red
};

// Status labels
export const statusLabels = {
  todo: 'To Do',
  inProgress: 'In Progress',
  review: 'Review',
  done: 'Done'
};

// Get priority color
export const getPriorityColor = (priority) => {
  return priorityColors[priority?.toLowerCase()] || priorityColors.medium;
};

// Get status label
export const getStatusLabel = (status) => {
  return statusLabels[status] || status;
};

// Format date for display
export const formatDate = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date.seconds ? date.seconds * 1000 : date);
  if (!d || isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Check if task is overdue
export const isOverdue = (task) => {
  if (!task.dueDate || task.status === 'done') return false;
  const dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate.seconds ? task.dueDate.seconds * 1000 : task.dueDate);
  if (!dueDate || isNaN(dueDate.getTime())) return false;
  return dueDate < new Date();
};

// Filter tasks by criteria
export const filterTasks = (tasks, filters) => {
  if (!tasks) return [];

  let filtered = [...tasks];

  // Search query
  if (filters.search) {
    const query = filters.search.toLowerCase();
    filtered = filtered.filter(task =>
      task.title?.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query)
    );
  }

  // Priority filter
  if (filters.priority && filters.priority.length > 0) {
    filtered = filtered.filter(task =>
      filters.priority.includes(task.priority?.toLowerCase())
    );
  }

  // Assignee filter
  if (filters.assignee && filters.assignee.length > 0) {
    filtered = filtered.filter(task =>
      filters.assignee.includes(task.assignedTo)
    );
  }

  // Status filter
  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter(task =>
      filters.status.includes(task.status)
    );
  }

  return filtered;
};

// Group tasks by status
export const groupTasksByStatus = (tasks) => {
  const grouped = {
    todo: [],
    inProgress: [],
    review: [],
    done: []
  };

  if (!tasks) return grouped;

  tasks.forEach(task => {
    const status = task.status || 'todo';

    // Handle both formats: "To Do" and "todo", "In Progress" and "inProgress", etc.
    const normalizedStatus = status.toLowerCase().replace(/\s+/g, '');

    if (normalizedStatus === 'todo' || status === 'To Do' || status === 'Backlog') {
      grouped.todo.push(task);
    } else if (normalizedStatus === 'inprogress' || status === 'In Progress') {
      grouped.inProgress.push(task);
    } else if (normalizedStatus === 'review' || status === 'Review') {
      grouped.review.push(task);
    } else if (normalizedStatus === 'done' || status === 'Done' || status === 'Completed') {
      grouped.done.push(task);
    } else {
      // Default to todo if status doesn't match
      grouped.todo.push(task);
    }
  });

  return grouped;
};

// Calculate task statistics
export const calculateTaskStats = (tasks) => {
  if (!tasks || tasks.length === 0) {
    return {
      total: 0,
      todo: 0,
      inProgress: 0,
      review: 0,
      done: 0,
      overdue: 0
    };
  }

  return {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'inProgress').length,
    review: tasks.filter(t => t.status === 'review').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => isOverdue(t)).length
  };
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
