/**
 * Property-Based Testing Arbitraries
 * Test data generators for tasks, notifications, and users
 * Feature: taskhive-phase1-enhancements
 */

import fc from 'fast-check';

/**
 * Generate a random task ID
 */
export const taskIdArbitrary = fc.string({ minLength: 10, maxLength: 20 });

/**
 * Generate a random user ID
 */
export const userIdArbitrary = fc.string({ minLength: 10, maxLength: 20 });

/**
 * Generate a random team ID
 */
export const teamIdArbitrary = fc.string({ minLength: 10, maxLength: 20 });

/**
 * Generate a task priority
 */
export const priorityArbitrary = fc.constantFrom('low', 'medium', 'high', 'urgent');

/**
 * Generate a task status
 */
export const statusArbitrary = fc.constantFrom('To Do', 'In Progress', 'Review', 'Done');

/**
 * Generate a normalized task status
 */
export const normalizedStatusArbitrary = fc.constantFrom('todo', 'inProgress', 'review', 'done');

/**
 * Generate a user role
 */
export const roleArbitrary = fc.constantFrom('leader', 'member');

/**
 * Generate a notification category
 */
export const notificationCategoryArbitrary = fc.constantFrom('tasks', 'bugs', 'mentions', 'system');

/**
 * Generate a notification priority
 */
export const notificationPriorityArbitrary = fc.constantFrom('urgent', 'normal');

/**
 * Generate a date in the past
 */
export const pastDateArbitrary = fc.date({ max: new Date() });

/**
 * Generate a date in the future
 */
export const futureDateArbitrary = fc.date({ min: new Date() });

/**
 * Generate a date (past or future)
 */
export const dateArbitrary = fc.date();

/**
 * Generate a user object
 */
export const userArbitrary = fc.record({
  id: userIdArbitrary,
  uid: userIdArbitrary,
  name: fc.string({ minLength: 3, maxLength: 30 }),
  email: fc.emailAddress(),
  role: roleArbitrary,
  teamId: teamIdArbitrary,
  photoURL: fc.option(fc.webUrl(), { nil: null }),
  createdAt: pastDateArbitrary,
});

/**
 * Generate a task object
 */
export const taskArbitrary = fc.record({
  id: taskIdArbitrary,
  title: fc.string({ minLength: 5, maxLength: 100 }),
  description: fc.string({ minLength: 10, maxLength: 500 }),
  priority: priorityArbitrary,
  status: statusArbitrary,
  assignedTo: fc.option(userIdArbitrary, { nil: null }),
  assignedToUserId: fc.option(userIdArbitrary, { nil: null }),
  assignedToName: fc.option(fc.string({ minLength: 3, maxLength: 30 }), { nil: null }),
  assignedToEmail: fc.option(fc.emailAddress(), { nil: null }),
  assignedToPhotoURL: fc.option(fc.webUrl(), { nil: null }),
  teamId: teamIdArbitrary,
  createdBy: userIdArbitrary,
  createdAt: pastDateArbitrary,
  updatedAt: pastDateArbitrary,
  dueDate: fc.option(dateArbitrary, { nil: null }),
  completedAt: fc.option(pastDateArbitrary, { nil: null }),
  isActive: fc.boolean(),
});

/**
 * Generate a completed task (status = Done, has completedAt)
 */
export const completedTaskArbitrary = taskArbitrary.map(task => ({
  ...task,
  status: 'Done',
  completedAt: task.completedAt || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
}));

/**
 * Generate an overdue task (dueDate in past, status not Done)
 */
export const overdueTaskArbitrary = fc.record({
  id: taskIdArbitrary,
  title: fc.string({ minLength: 5, maxLength: 100 }),
  description: fc.string({ minLength: 10, maxLength: 500 }),
  priority: priorityArbitrary,
  status: fc.constantFrom('To Do', 'In Progress', 'Review'),
  assignedTo: fc.option(userIdArbitrary, { nil: null }),
  assignedToName: fc.option(fc.string({ minLength: 3, maxLength: 30 }), { nil: null }),
  teamId: teamIdArbitrary,
  createdBy: userIdArbitrary,
  createdAt: pastDateArbitrary,
  updatedAt: pastDateArbitrary,
  dueDate: pastDateArbitrary,
  isActive: fc.constant(true),
});

/**
 * Generate a task with deadline
 */
export const taskWithDeadlineArbitrary = taskArbitrary.map(task => ({
  ...task,
  dueDate: task.dueDate || new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
}));

/**
 * Generate a notification object
 */
export const notificationArbitrary = fc.record({
  id: fc.string({ minLength: 10, maxLength: 20 }),
  userId: userIdArbitrary,
  teamId: teamIdArbitrary,
  category: notificationCategoryArbitrary,
  priority: notificationPriorityArbitrary,
  title: fc.string({ minLength: 5, maxLength: 100 }),
  message: fc.string({ minLength: 10, maxLength: 500 }),
  timestamp: pastDateArbitrary,
  isRead: fc.boolean(),
  actionUrl: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: null }),
  metadata: fc.option(fc.object(), { nil: null }),
});

/**
 * Generate an unread notification
 */
export const unreadNotificationArbitrary = notificationArbitrary.map(notif => ({
  ...notif,
  isRead: false,
}));

/**
 * Generate a read notification
 */
export const readNotificationArbitrary = notificationArbitrary.map(notif => ({
  ...notif,
  isRead: true,
}));

/**
 * Generate notification preferences
 */
export const notificationPreferencesArbitrary = fc.record({
  tasks: fc.record({
    enabled: fc.boolean(),
    sound: fc.boolean(),
    push: fc.boolean(),
  }),
  bugs: fc.record({
    enabled: fc.boolean(),
    sound: fc.boolean(),
    push: fc.boolean(),
  }),
  mentions: fc.record({
    enabled: fc.boolean(),
    sound: fc.boolean(),
    push: fc.boolean(),
  }),
  system: fc.record({
    enabled: fc.boolean(),
    sound: fc.boolean(),
    push: fc.boolean(),
  }),
});

/**
 * Generate a status change history entry
 */
export const statusChangeArbitrary = fc.record({
  status: statusArbitrary,
  timestamp: pastDateArbitrary,
  userId: userIdArbitrary,
});

/**
 * Generate a task with status history
 */
export const taskWithHistoryArbitrary = taskArbitrary.chain(task =>
  fc.array(statusChangeArbitrary, { minLength: 1, maxLength: 10 }).map(history => ({
    ...task,
    statusHistory: history.sort((a, b) => a.timestamp - b.timestamp),
  }))
);

/**
 * Generate analytics snapshot
 */
export const analyticsSnapshotArbitrary = fc.record({
  id: fc.string({ minLength: 10, maxLength: 20 }),
  projectId: teamIdArbitrary,
  userId: fc.option(userIdArbitrary, { nil: null }),
  date: pastDateArbitrary,
  metrics: fc.record({
    tasksCompleted: fc.nat({ max: 100 }),
    tasksCreated: fc.nat({ max: 100 }),
    averageCompletionTime: fc.float({ min: 0, max: 1000 }),
    onTimeDeliveryRate: fc.float({ min: 0, max: 1 }),
  }),
});

/**
 * Generate a calendar event
 */
export const calendarEventArbitrary = fc.record({
  id: taskIdArbitrary,
  title: fc.string({ minLength: 5, maxLength: 100 }),
  start: dateArbitrary,
  end: dateArbitrary,
  priority: priorityArbitrary,
  isOverdue: fc.boolean(),
  taskId: taskIdArbitrary,
});

/**
 * Generate filter options
 */
export const filterOptionsArbitrary = fc.record({
  priority: fc.option(fc.array(priorityArbitrary, { minLength: 0, maxLength: 4 }), { nil: null }),
  assignee: fc.option(fc.array(userIdArbitrary, { minLength: 0, maxLength: 5 }), { nil: null }),
  status: fc.option(fc.array(statusArbitrary, { minLength: 0, maxLength: 4 }), { nil: null }),
});

/**
 * Generate a search query
 */
export const searchQueryArbitrary = fc.oneof(
  fc.constant(''),
  fc.string({ minLength: 1, maxLength: 50 })
);

/**
 * Generate productivity metrics
 */
export const productivityMetricsArbitrary = fc.record({
  tasksCompletedToday: fc.nat({ max: 50 }),
  tasksCompletedThisWeek: fc.nat({ max: 200 }),
  tasksCompletedThisMonth: fc.nat({ max: 500 }),
  averageCompletionTime: fc.float({ min: 0, max: 1000 }),
  taskVelocity: fc.float({ min: 0, max: 50 }),
  onTimeDeliveryPercentage: fc.float({ min: 0, max: 100 }),
});

/**
 * Generate trend data point
 */
export const trendDataPointArbitrary = fc.record({
  date: pastDateArbitrary,
  tasksCompleted: fc.nat({ max: 50 }),
});

/**
 * Generate bottleneck task
 */
export const bottleneckTaskArbitrary = fc.record({
  taskId: taskIdArbitrary,
  title: fc.string({ minLength: 5, maxLength: 100 }),
  status: statusArbitrary,
  daysInStatus: fc.nat({ min: 7, max: 365 }),
});

/**
 * Generate leaderboard entry
 */
export const leaderboardEntryArbitrary = fc.record({
  userId: userIdArbitrary,
  userName: fc.string({ minLength: 3, maxLength: 30 }),
  avatar: fc.option(fc.webUrl(), { nil: null }),
  tasksCompleted: fc.nat({ max: 1000 }),
  rank: fc.nat({ min: 1, max: 100 }),
});

/**
 * Generate burndown data point
 */
export const burndownDataPointArbitrary = fc.record({
  date: dateArbitrary,
  remainingTasks: fc.nat({ max: 100 }),
  idealRemaining: fc.nat({ max: 100 }),
});
