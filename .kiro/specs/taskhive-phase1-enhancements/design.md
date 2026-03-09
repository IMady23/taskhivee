# Design Document: TaskHive Phase 1 Enhancements

## Overview

This design implements four major enhancements to TaskHive: a Kanban board with drag-and-drop functionality, a calendar view for deadline management, advanced analytics dashboard, and an enhanced notification center. The design integrates seamlessly with the existing React/Firebase architecture while adding new visualization and interaction capabilities.

The implementation follows a component-based architecture with clear separation between UI components, state management (React Context), and data services (Firebase/Firestore). Each feature is designed as a self-contained module that can be developed and tested independently while sharing common infrastructure.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Kanban     │  │   Calendar   │  │  Analytics   │      │
│  │   Board      │  │     View     │  │  Dashboard   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│  ┌──────┴──────────────────┴──────────────────┴───────┐    │
│  │         Enhanced Notification Center               │    │
│  └────────────────────────┬───────────────────────────┘    │
├───────────────────────────┼────────────────────────────────┤
│  ┌────────────────────────┴───────────────────────────┐    │
│  │          State Management Layer (Context API)      │    │
│  │  - TasksContext                                    │    │
│  │  - NotificationContext                             │    │
│  │  - AnalyticsContext (new)                          │    │
│  └────────────────────────┬───────────────────────────┘    │
├───────────────────────────┼────────────────────────────────┤
│  ┌────────────────────────┴───────────────────────────┐    │
│  │              Service Layer                          │    │
│  │  - taskService.js (existing)                       │    │
│  │  - notificationService.js (enhanced)               │    │
│  │  - analyticsService.js (new)                       │    │
│  └────────────────────────┬───────────────────────────┘    │
├───────────────────────────┼────────────────────────────────┤
│  ┌────────────────────────┴───────────────────────────┐    │
│  │         Firebase/Firestore Backend                  │    │
│  │  - tasks collection                                │    │
│  │  - notifications collection                        │    │
│  │  - users collection                                │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **UI Framework**: React 18+ with functional components and hooks
- **Drag-and-Drop**: react-beautiful-dnd for Kanban board
- **Calendar**: react-big-calendar for calendar views
- **Charts**: recharts for analytics visualizations
- **Animations**: framer-motion for smooth transitions
- **State Management**: React Context API (existing)
- **Backend**: Firebase/Firestore (existing)
- **Styling**: CSS Modules or styled-components (match existing approach)

## Components and Interfaces

### 1. Kanban Board Components

#### KanbanBoard Component
```typescript
interface KanbanBoardProps {
  projectId: string;
  userRole: 'leader' | 'member';
}

interface KanbanColumn {
  id: string;
  title: string;
  taskIds: string[];
}

interface TaskCard {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: {
    id: string;
    name: string;
    avatar: string;
  };
  status: 'todo' | 'inProgress' | 'review' | 'done';
  deadline?: Date;
}
```

**Key Methods**:
- `handleDragEnd(result: DropResult): void` - Handles task card drops
- `updateTaskStatus(taskId: string, newStatus: string): Promise<void>` - Persists status changes
- `filterTasks(query: string, filters: FilterOptions): TaskCard[]` - Applies filters

#### TaskCard Component
```typescript
interface TaskCardProps {
  task: TaskCard;
  index: number;
  isDragging: boolean;
}
```

**Rendering Logic**:
- Display priority badge with color mapping
- Show assignee avatar if present
- Render task title and truncated description
- Apply dragging styles when isDragging is true

### 2. Calendar View Components

#### CalendarView Component
```typescript
interface CalendarViewProps {
  projectId: string;
  userRole: 'leader' | 'member';
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isOverdue: boolean;
  taskId: string;
}

type ViewMode = 'month' | 'week' | 'day';
```

**Key Methods**:
- `handleSelectSlot(slotInfo: { start: Date, end: Date }): void` - Creates task from date click
- `handleSelectEvent(event: CalendarEvent): void` - Shows task details
- `calculateWorkloadHeatmap(tasks: TaskCard[]): Map<string, number>` - Generates heatmap data
- `getOverdueTasks(tasks: TaskCard[]): TaskCard[]` - Identifies overdue tasks

#### WorkloadHeatmap Component
```typescript
interface WorkloadHeatmapProps {
  tasks: TaskCard[];
  dateRange: { start: Date, end: Date };
}

interface HeatmapCell {
  date: Date;
  taskCount: number;
  intensity: number; // 0-1 scale
}
```

### 3. Analytics Dashboard Components

#### AnalyticsDashboard Component
```typescript
interface AnalyticsDashboardProps {
  projectId: string;
  userRole: 'leader' | 'member';
  userId?: string; // For member personal metrics
}

interface ProductivityMetrics {
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  tasksCompletedThisMonth: number;
  averageCompletionTime: number; // in hours
  taskVelocity: number; // tasks per week
  onTimeDeliveryPercentage: number;
}

interface TrendData {
  date: Date;
  tasksCompleted: number;
}

interface BottleneckTask {
  taskId: string;
  title: string;
  status: string;
  daysInStatus: number;
}
```

**Key Methods**:
- `calculateProductivityMetrics(tasks: TaskCard[]): ProductivityMetrics`
- `generateTrendData(tasks: TaskCard[], period: 'week' | 'month'): TrendData[]`
- `identifyBottlenecks(tasks: TaskCard[], threshold: number): BottleneckTask[]`
- `calculateVelocity(tasks: TaskCard[], sprintDuration: number): number`

#### BurndownChart Component
```typescript
interface BurndownChartProps {
  sprintId: string;
  sprintStart: Date;
  sprintEnd: Date;
  tasks: TaskCard[];
}

interface BurndownData {
  date: Date;
  remainingTasks: number;
  idealRemaining: number;
}
```

#### LeaderboardComponent
```typescript
interface LeaderboardProps {
  projectId: string;
  timeRange: 'week' | 'month' | 'all';
}

interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatar: string;
  tasksCompleted: number;
  rank: number;
}
```

### 4. Enhanced Notification Center Components

#### NotificationCenter Component
```typescript
interface NotificationCenterProps {
  userId: string;
}

interface Notification {
  id: string;
  category: 'tasks' | 'bugs' | 'mentions' | 'system';
  priority: 'urgent' | 'normal';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
}

interface NotificationPreferences {
  tasks: { enabled: boolean, sound: boolean, push: boolean };
  bugs: { enabled: boolean, sound: boolean, push: boolean };
  mentions: { enabled: boolean, sound: boolean, push: boolean };
  system: { enabled: boolean, sound: boolean, push: boolean };
}
```

**Key Methods**:
- `fetchNotifications(page: number, pageSize: number): Promise<Notification[]>`
- `markAsRead(notificationIds: string[]): Promise<void>`
- `searchNotifications(query: string, category?: string): Notification[]`
- `sendBrowserNotification(notification: Notification): void`
- `updatePreferences(preferences: NotificationPreferences): Promise<void>`

#### NotificationPreferences Component
```typescript
interface NotificationPreferencesProps {
  userId: string;
  currentPreferences: NotificationPreferences;
  onSave: (preferences: NotificationPreferences) => Promise<void>;
}
```

## Data Models

### Extended Task Model
```typescript
interface Task {
  // Existing fields
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'inProgress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
  projectId: string;
  
  // New optional fields for analytics
  completedAt?: Date;
  statusHistory?: StatusChange[];
  estimatedHours?: number;
  actualHours?: number;
}

interface StatusChange {
  status: string;
  timestamp: Date;
  userId: string;
}
```

### Notification Model
```typescript
interface Notification {
  id: string;
  userId: string;
  category: 'tasks' | 'bugs' | 'mentions' | 'system';
  priority: 'urgent' | 'normal';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}
```

### Analytics Snapshot Model
```typescript
interface AnalyticsSnapshot {
  id: string;
  projectId: string;
  userId?: string; // null for team-wide metrics
  date: Date;
  metrics: {
    tasksCompleted: number;
    tasksCreated: number;
    averageCompletionTime: number;
    onTimeDeliveryRate: number;
  };
}
```

### User Preferences Model
```typescript
interface UserPreferences {
  userId: string;
  notifications: NotificationPreferences;
  defaultCalendarView: 'month' | 'week' | 'day';
  kanbanFilters?: {
    priority?: string[];
    assignee?: string[];
  };
}
```

## Services

### AnalyticsService
```typescript
class AnalyticsService {
  // Calculate metrics from task data
  calculateMetrics(tasks: Task[], userId?: string): ProductivityMetrics;
  
  // Generate trend data for charts
  generateTrendData(tasks: Task[], startDate: Date, endDate: Date): TrendData[];
  
  // Identify bottleneck tasks
  identifyBottlenecks(tasks: Task[], thresholdDays: number): BottleneckTask[];
  
  // Calculate team velocity
  calculateVelocity(tasks: Task[], sprintDuration: number): number;
  
  // Generate burndown chart data
  generateBurndownData(sprintId: string, tasks: Task[]): BurndownData[];
  
  // Cache analytics snapshots for performance
  cacheSnapshot(snapshot: AnalyticsSnapshot): Promise<void>;
  
  // Retrieve cached snapshots
  getCachedSnapshots(projectId: string, dateRange: DateRange): Promise<AnalyticsSnapshot[]>;
}
```

### Enhanced NotificationService
```typescript
class NotificationService {
  // Existing methods
  createNotification(notification: Omit<Notification, 'id'>): Promise<string>;
  getNotifications(userId: string): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;
  
  // New methods
  getNotificationsPaginated(userId: string, page: number, pageSize: number): Promise<{
    notifications: Notification[];
    totalCount: number;
    hasMore: boolean;
  }>;
  
  bulkMarkAsRead(notificationIds: string[]): Promise<void>;
  
  searchNotifications(userId: string, query: string, category?: string): Promise<Notification[]>;
  
  sendBrowserPushNotification(notification: Notification): Promise<void>;
  
  getUserPreferences(userId: string): Promise<NotificationPreferences>;
  
  updateUserPreferences(userId: string, preferences: NotificationPreferences): Promise<void>;
  
  checkNotificationPermission(): Promise<NotificationPermission>;
  
  requestNotificationPermission(): Promise<NotificationPermission>;
}
```

### TaskService Extensions
```typescript
// Extensions to existing taskService.js
interface TaskServiceExtensions {
  // Update task status with history tracking
  updateTaskStatus(taskId: string, newStatus: string, userId: string): Promise<void>;
  
  // Get tasks by date range for calendar
  getTasksByDateRange(projectId: string, startDate: Date, endDate: Date): Promise<Task[]>;
  
  // Get overdue tasks
  getOverdueTasks(projectId: string): Promise<Task[]>;
  
  // Batch update for drag-and-drop optimization
  batchUpdateTaskStatus(updates: Array<{ taskId: string, status: string }>): Promise<void>;
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Kanban Board Properties

**Property 1: Kanban board renders all tasks correctly organized by status**
*For any* set of tasks with various statuses, the rendered Kanban board should display all tasks organized into their respective columns (To Do, In Progress, Review, Done), with each task showing the correct priority badge color (Low: blue, Medium: yellow, High: orange, Urgent: red), assignee avatar when present, and accurate task counts in column headers.
**Validates: Requirements 1.1, 1.3, 1.4, 1.5**

**Property 2: Task status updates persist correctly**
*For any* task and any valid status transition, updating the task status should persist the change to the database and the task should reflect the new status when retrieved.
**Validates: Requirements 1.2**

**Property 3: Task filtering returns only matching tasks**
*For any* filter criteria (search query, priority, assignee) and task set, the filtered results should include all and only tasks that match the criteria.
**Validates: Requirements 1.6**

**Property 4: Drag operation provides visual feedback**
*For any* drag operation in progress, valid drop zones should have appropriate visual indicators (CSS classes or attributes) applied.
**Validates: Requirements 1.8**

**Property 5: Failed status updates revert correctly**
*For any* task status update that fails, the task should remain in its original status and an error state should be set.
**Validates: Requirements 1.9**

### Calendar View Properties

**Property 6: Calendar displays task markers on correct dates**
*For any* task with a deadline, the calendar view should display a task marker on the corresponding date with color coding matching the task's priority level.
**Validates: Requirements 2.2, 2.3**

**Property 7: Overdue tasks are highlighted in red**
*For any* incomplete task with a deadline in the past, the task marker should be highlighted in red.
**Validates: Requirements 2.4**

**Property 8: Date selection triggers task creation with correct deadline**
*For any* calendar date clicked, the task creation handler should be invoked with that date as the deadline parameter.
**Validates: Requirements 2.5**

**Property 9: Workload heatmap accurately represents task density**
*For any* set of tasks with deadlines, the workload heatmap should show task counts per date that match the actual number of tasks due on each date.
**Validates: Requirements 2.6**

**Property 10: Task marker clicks display correct task details**
*For any* task marker clicked, the detail display handler should be invoked with the correct task ID.
**Validates: Requirements 2.7**

**Property 11: Deadline reminders are generated for approaching tasks**
*For any* task with a deadline within the reminder threshold (e.g., 24 hours), a reminder notification should be generated.
**Validates: Requirements 2.8**

**Property 12: Multiple tasks on same date are all displayed**
*For any* set of tasks sharing the same deadline, all task markers should be present in the rendered calendar output.
**Validates: Requirements 2.10**

### Analytics Dashboard Properties

**Property 13: Task completion counts are accurate for time periods**
*For any* set of completed tasks, the counts for tasks completed today, this week, and this month should match the actual number of tasks completed in each respective time period.
**Validates: Requirements 3.1**

**Property 14: Trend data correctly aggregates completions by date**
*For any* set of completed tasks over a time range, the trend data should show the correct count of tasks completed on each date.
**Validates: Requirements 3.2**

**Property 15: Average completion time is calculated correctly**
*For any* set of completed tasks with completion times, the calculated average should equal the sum of completion times divided by the number of tasks.
**Validates: Requirements 3.3**

**Property 16: Task velocity calculation is accurate**
*For any* set of completed tasks and time period, the velocity (tasks per week or sprint) should equal the number of completed tasks divided by the number of time periods.
**Validates: Requirements 3.4**

**Property 17: Burndown chart shows correct remaining work over time**
*For any* sprint with tasks, the burndown data should show the correct number of remaining tasks at each point in time, with the ideal line decreasing linearly from total tasks to zero.
**Validates: Requirements 3.5**

**Property 18: Leaderboard ranks users correctly by task completion**
*For any* set of users and their completed tasks, the leaderboard should rank users in descending order by number of tasks completed, with correct task counts for each user.
**Validates: Requirements 3.6**

**Property 19: Bottleneck identification finds stale tasks**
*For any* set of tasks and threshold duration, all tasks that have been in the same status for longer than the threshold should be identified as bottlenecks.
**Validates: Requirements 3.7**

**Property 20: On-time delivery percentage is calculated correctly**
*For any* set of completed tasks with deadlines, the on-time delivery percentage should equal (tasks completed by deadline / total completed tasks with deadlines) × 100.
**Validates: Requirements 3.8**

**Property 21: Member users see only personal metrics**
*For any* member user, the analytics dashboard should include only tasks assigned to that user in all metric calculations.
**Validates: Requirements 3.9**

**Property 22: Loading states display loading indicators**
*For any* component in loading state, loading indicators should be rendered in the output.
**Validates: Requirements 3.10, 7.2**

**Property 23: Analytics errors trigger fallback to cached data**
*For any* analytics calculation that fails, an error state should be set and cached data should be used if available.
**Validates: Requirements 3.11**

### Notification Center Properties

**Property 24: Notifications are correctly categorized and styled**
*For any* set of notifications, they should be grouped by category (Tasks, Bugs, Mentions, System) and urgent notifications should have different styling attributes than normal priority notifications.
**Validates: Requirements 4.1, 4.2**

**Property 25: Browser push notifications are sent when permission granted**
*For any* notification created when browser notification permission is granted, the browser notification API should be invoked.
**Validates: Requirements 4.3**

**Property 26: Notification pagination displays correct subset**
*For any* set of notifications and page number, the displayed notifications should be the correct subset (page × pageSize to (page + 1) × pageSize) of the total notifications.
**Validates: Requirements 4.5**

**Property 27: Bulk mark as read updates all selected notifications**
*For any* set of selected notification IDs, the bulk mark as read operation should update the isRead status to true for all of them.
**Validates: Requirements 4.6**

**Property 28: Notification search returns only matching results**
*For any* search query and optional category filter, the returned notifications should include all and only notifications whose content matches the query and category.
**Validates: Requirements 4.7**

**Property 29: Notification sound preference is persisted and applied**
*For any* user, toggling the sound preference should persist the change and subsequent notifications should respect the preference.
**Validates: Requirements 4.8**

**Property 30: Notification clicks mark as read and navigate**
*For any* notification clicked, the notification should be marked as read and navigation should occur to the actionUrl if present.
**Validates: Requirements 4.9**

**Property 31: Unread count matches actual unread notifications**
*For any* user, the displayed unread notification count should equal the actual number of notifications with isRead = false.
**Validates: Requirements 4.10**

**Property 32: Notification load errors display error state and retry**
*For any* notification loading failure, an error state should be set and a retry mechanism should be available.
**Validates: Requirements 4.11**

### Role-Based Access Control Properties

**Property 33: Role-based access is enforced correctly**
*For any* user with a specific role (Leader or Member), access to features should match the role's permissions: Leaders have full access to all features; Members have view-only access to team analytics and full access to personal Kanban and Calendar features; Members attempting restricted access should see error messages and be prevented from accessing the data.
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

**Property 34: Protected operations verify user role**
*For any* protected operation, the user's role should be verified before allowing the operation to proceed.
**Validates: Requirements 5.5**

### Data Integration Properties

**Property 35: Task modifications persist to Firestore correctly**
*For any* task modification through new features, the change should be persisted to Firestore and retrievable with the updated values.
**Validates: Requirements 6.4**

**Property 36: Backward compatibility with existing data**
*For any* existing task or bug data, the new features should be able to read and process the data without errors.
**Validates: Requirements 6.5**

**Property 37: New optional fields don't break existing data**
*For any* existing task data without new optional fields, the system should process the data successfully, treating missing fields as undefined/null.
**Validates: Requirements 6.6**

### User Experience Properties

**Property 38: Error states display user-friendly messages**
*For any* error condition, the system should display an error message in the UI.
**Validates: Requirements 7.6**

### Browser Notification Properties

**Property 39: Permission request on load when not granted**
*For any* application load where browser notification permission is not granted, the permission request function should be invoked.
**Validates: Requirements 8.1**

**Property 40: High-priority notifications trigger browser push**
*For any* high-priority notification created when permission is granted, a browser push notification should be sent.
**Validates: Requirements 8.2**

**Property 41: Browser notification clicks focus and navigate**
*For any* browser push notification clicked, the application window should be focused and navigation should occur to the relevant content.
**Validates: Requirements 8.3**

**Property 42: Denied permission falls back to in-app notifications**
*For any* notification created when browser permission is denied, no browser push notification should be sent but the in-app notification should be displayed.
**Validates: Requirements 8.4**

**Property 43: Browser notifications respect sound preference**
*For any* browser push notification, the notification should include or exclude sound based on the user's sound preference setting.
**Validates: Requirements 8.5**

## Error Handling

### Kanban Board Error Handling

1. **Drag-and-Drop Failures**
   - Catch errors during status update operations
   - Revert task card to original position using optimistic UI rollback
   - Display toast notification with error message
   - Log error details for debugging

2. **Filter/Search Errors**
   - Catch errors during filter operations
   - Display error message in filter UI
   - Fall back to unfiltered view
   - Maintain user's filter input for retry

3. **Network Failures**
   - Implement retry logic with exponential backoff
   - Queue failed operations for retry when connection restored
   - Display offline indicator
   - Cache board state locally

### Calendar View Error Handling

1. **Task Loading Failures**
   - Display error message in calendar view
   - Provide retry button
   - Fall back to cached calendar data if available
   - Log error for monitoring

2. **Task Creation Failures**
   - Display error message in task creation modal
   - Preserve user input for retry
   - Validate input before submission
   - Provide clear error messages for validation failures

3. **Date Range Errors**
   - Validate date ranges before queries
   - Handle invalid date inputs gracefully
   - Default to current month on error
   - Display user-friendly error messages

### Analytics Dashboard Error Handling

1. **Calculation Errors**
   - Catch errors during metric calculations
   - Display error message in affected metric card
   - Fall back to cached analytics data
   - Provide refresh button to retry
   - Log calculation errors with context

2. **Chart Rendering Errors**
   - Catch errors during chart rendering
   - Display error message in chart container
   - Provide fallback to table view of data
   - Handle empty datasets gracefully

3. **Data Fetching Errors**
   - Implement retry logic with exponential backoff
   - Display loading skeleton during retries
   - Show error state after max retries
   - Cache successful responses

### Notification Center Error Handling

1. **Notification Loading Failures**
   - Display error message in notification center
   - Provide retry button
   - Fall back to cached notifications
   - Implement pagination error recovery

2. **Browser Notification Errors**
   - Handle permission denial gracefully
   - Fall back to in-app notifications
   - Display permission request UI when appropriate
   - Handle browser API unavailability

3. **Preference Update Failures**
   - Display error message in preferences UI
   - Revert UI to previous preference state
   - Preserve user changes for retry
   - Validate preferences before submission

### General Error Handling Patterns

1. **Network Error Recovery**
   - Detect online/offline status
   - Queue operations when offline
   - Sync queued operations when online
   - Display connection status indicator

2. **Authentication Errors**
   - Catch authentication failures
   - Redirect to login when session expires
   - Preserve user's current location for post-login redirect
   - Display session timeout warnings

3. **Validation Errors**
   - Validate all user inputs before submission
   - Display field-level validation errors
   - Prevent submission of invalid data
   - Provide clear guidance for correction

4. **Firestore Errors**
   - Handle permission denied errors
   - Handle quota exceeded errors
   - Implement retry logic for transient errors
   - Log errors with context for debugging

## Testing Strategy

### Dual Testing Approach

This feature will use both unit testing and property-based testing to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, error conditions, and integration points between components
- **Property tests**: Verify universal properties across all inputs through randomized testing

Both approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Library Selection**: Use `@fast-check/jest` for JavaScript/React property-based testing

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `// Feature: taskhive-phase1-enhancements, Property {number}: {property_text}`

**Example Property Test Structure**:
```javascript
// Feature: taskhive-phase1-enhancements, Property 1: Kanban board renders all tasks correctly organized by status
test('Kanban board renders all tasks correctly organized by status', () => {
  fc.assert(
    fc.property(
      fc.array(taskArbitrary), // Generate random task arrays
      (tasks) => {
        const { container } = render(<KanbanBoard tasks={tasks} />);
        
        // Verify all tasks are rendered
        tasks.forEach(task => {
          expect(container).toHaveTextContent(task.title);
        });
        
        // Verify tasks are in correct columns
        const todoColumn = container.querySelector('[data-status="todo"]');
        const todoTasks = tasks.filter(t => t.status === 'todo');
        expect(todoColumn.children).toHaveLength(todoTasks.length);
        
        // Verify priority colors
        tasks.forEach(task => {
          const card = container.querySelector(`[data-task-id="${task.id}"]`);
          const expectedColor = priorityColorMap[task.priority];
          expect(card).toHaveStyle({ borderColor: expectedColor });
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Strategy

**Focus Areas**:
1. **Component Integration**: Test how components interact with Context providers
2. **Edge Cases**: Empty states, single items, maximum items
3. **Error Conditions**: Network failures, invalid data, permission errors
4. **User Interactions**: Click handlers, form submissions, drag events
5. **Specific Examples**: Known scenarios that should work correctly

**Example Unit Test**:
```javascript
describe('KanbanBoard', () => {
  test('displays empty state when no tasks', () => {
    const { container } = render(<KanbanBoard tasks={[]} />);
    expect(container).toHaveTextContent('No tasks yet');
  });
  
  test('handles drag-and-drop failure gracefully', async () => {
    const mockUpdateTask = jest.fn().mockRejectedValue(new Error('Network error'));
    const { container } = render(
      <KanbanBoard tasks={mockTasks} onUpdateTask={mockUpdateTask} />
    );
    
    // Simulate drag and drop
    const taskCard = container.querySelector('[data-task-id="task-1"]');
    fireEvent.dragStart(taskCard);
    fireEvent.drop(container.querySelector('[data-status="done"]'));
    
    await waitFor(() => {
      expect(container).toHaveTextContent('Failed to update task');
      expect(taskCard.closest('[data-status]')).toHaveAttribute('data-status', 'todo');
    });
  });
});
```

### Test Coverage Requirements

1. **Kanban Board**
   - Property tests: 5 properties (1-5)
   - Unit tests: Component rendering, drag-and-drop interactions, filtering, error handling
   - Integration tests: Context integration, service layer integration

2. **Calendar View**
   - Property tests: 7 properties (6-12)
   - Unit tests: View mode switching, date selection, task creation, edge cases
   - Integration tests: Task service integration, notification integration

3. **Analytics Dashboard**
   - Property tests: 11 properties (13-23)
   - Unit tests: Metric calculations, chart rendering, role-based filtering, error states
   - Integration tests: Data fetching, caching, real-time updates

4. **Notification Center**
   - Property tests: 9 properties (24-32)
   - Unit tests: Categorization, pagination, search, preferences, browser notifications
   - Integration tests: Context integration, service layer, browser API

5. **Role-Based Access Control**
   - Property tests: 2 properties (33-34)
   - Unit tests: Permission checks, access denial, role verification

6. **Data Integration**
   - Property tests: 3 properties (35-37)
   - Unit tests: Firestore operations, schema compatibility, data migration

7. **Browser Notifications**
   - Property tests: 5 properties (39-43)
   - Unit tests: Permission handling, notification creation, click handling

### Testing Tools and Libraries

- **Test Runner**: Jest
- **React Testing**: @testing-library/react
- **Property-Based Testing**: @fast-check/jest
- **Mocking**: jest.mock for Firebase/Firestore
- **User Interactions**: @testing-library/user-event
- **Drag-and-Drop Testing**: @testing-library/react with custom drag event simulation

### Continuous Integration

- Run all tests on every pull request
- Require 80% code coverage minimum
- Run property tests with 100 iterations in CI
- Run extended property tests (1000 iterations) nightly
- Monitor test execution time and optimize slow tests

## Implementation Notes

### Performance Considerations

1. **Kanban Board**
   - Use React.memo for TaskCard components to prevent unnecessary re-renders
   - Implement virtual scrolling for columns with many tasks (>50)
   - Debounce filter/search input to reduce re-renders
   - Use optimistic UI updates for drag-and-drop

2. **Calendar View**
   - Lazy load tasks for date ranges outside current view
   - Cache calendar data by month
   - Debounce workload heatmap calculations
   - Use React.memo for calendar event components

3. **Analytics Dashboard**
   - Cache calculated metrics with TTL (5 minutes)
   - Calculate metrics in web worker for large datasets
   - Implement progressive loading for charts
   - Use chart data sampling for datasets >1000 points

4. **Notification Center**
   - Implement virtual scrolling for notification list
   - Paginate notification history (20 per page)
   - Cache notification preferences locally
   - Debounce search input

### Accessibility Considerations

1. **Keyboard Navigation**
   - Implement keyboard shortcuts for drag-and-drop (Space to grab, Arrow keys to move)
   - Ensure all interactive elements are keyboard accessible
   - Provide skip links for navigation

2. **Screen Reader Support**
   - Add ARIA labels to all interactive elements
   - Announce drag-and-drop operations
   - Provide text alternatives for charts
   - Use semantic HTML elements

3. **Visual Accessibility**
   - Ensure color contrast meets WCAG AA standards
   - Don't rely solely on color for information (use icons + color)
   - Support high contrast mode
   - Provide text size controls

### Mobile Responsiveness

1. **Kanban Board**
   - Stack columns vertically on mobile
   - Use touch events for drag-and-drop
   - Implement swipe gestures for column navigation
   - Optimize card size for touch targets (min 44x44px)

2. **Calendar View**
   - Default to week view on mobile
   - Use touch gestures for date navigation
   - Optimize event markers for touch
   - Implement bottom sheet for task details

3. **Analytics Dashboard**
   - Stack metric cards vertically on mobile
   - Use horizontal scrolling for charts
   - Simplify charts for small screens
   - Implement collapsible sections

4. **Notification Center**
   - Use full-screen modal on mobile
   - Implement swipe-to-dismiss for notifications
   - Optimize touch targets for actions
   - Use bottom sheet for preferences

### Security Considerations

1. **Role-Based Access**
   - Verify user role on server-side for all protected operations
   - Don't rely solely on client-side role checks
   - Implement Firestore security rules for data access
   - Log access attempts for audit trail

2. **Data Validation**
   - Validate all user inputs on client and server
   - Sanitize user-generated content
   - Implement rate limiting for API calls
   - Prevent injection attacks

3. **Browser Notifications**
   - Request permission only when needed
   - Don't include sensitive data in push notifications
   - Implement notification expiration
   - Respect user's notification preferences
