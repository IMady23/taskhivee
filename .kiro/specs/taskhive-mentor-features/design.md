# Design Document: TaskHive Mentor-Impressing Features

## Overview

This design document outlines the implementation approach for 10 high-impact features that enhance TaskHive's team management capabilities. The features are organized into four phases and focus on intelligent task management, team analytics, AI integration, and UX polish. The design prioritizes additive changes, minimal schema modifications, and high visual impact with reasonable implementation cost.

The implementation leverages TaskHive's existing technology stack (React, Node.js, MongoDB, Socket.io, Firebase) and builds upon established patterns in the codebase. Each feature is designed to be independently deployable while maintaining system stability.

## Architecture

### System Context

TaskHive follows a three-tier architecture:
- **Presentation Layer**: React frontend with Tailwind CSS for styling
- **Application Layer**: Node.js/Express REST API with Socket.io for real-time updates
- **Data Layer**: MongoDB for persistence, Firebase for authentication

### New Components

The design introduces these new architectural components:

1. **Dependency Resolution Engine**: Server-side service that validates task completion based on dependency graph
2. **Workload Calculator**: Real-time service that computes member workload metrics
3. **Risk Assessment Service**: Background job that evaluates deadline risk for active tasks
4. **Health Score Calculator**: Scheduled service that computes team performance metrics
5. **Activity Event Logger**: Middleware that captures and stores system events
6. **AI Summary Service**: Integration layer with existing AI service for natural language generation
7. **Skill Matching Engine**: Algorithm that ranks members by skill compatibility
8. **Focus Mode State Manager**: Client-side service that manages UI state transitions

### Data Flow

```
User Action → API Endpoint → Business Logic → Database Update → Socket.io Event → UI Update
                                    ↓
                            Activity Logger (async)
                                    ↓
                            Activity Timeline Storage
```

For real-time features (Heat Indicator, Risk Prediction):
```
Database Change → Change Stream → Calculator Service → Socket.io Broadcast → UI Update
```

## Components and Interfaces

### 1. Smart Task Dependency

**Database Schema Extension**:
```javascript
// Task collection addition
{
  dependsOn: [ObjectId],  // Array of task IDs that must be completed first
  blockedBy: [ObjectId],  // Computed: tasks blocking this one (for quick lookup)
  dependencyStatus: String  // "ready" | "blocked" | "completed"
}
```

**API Endpoints**:
- `PUT /api/tasks/:id/dependencies` - Update task dependencies
- `GET /api/tasks/:id/dependency-tree` - Get full dependency graph for a task
- `POST /api/tasks/:id/complete` - Modified to check dependencies before allowing completion

**Dependency Resolution Engine**:
```javascript
class DependencyResolver {
  // Check if task can be completed
  canComplete(taskId): Promise<{allowed: boolean, blockedBy: Task[]}>
  
  // Get all tasks blocked by this task
  getBlockedTasks(taskId): Promise<Task[]>
  
  // Validate dependency graph for cycles
  validateNoCycles(taskId, newDependencies): boolean
  
  // Update dependency status for affected tasks
  updateDependencyStatuses(completedTaskId): Promise<void>
}
```

**UI Components**:
- `DependencySelector`: Multi-select dropdown for choosing dependent tasks
- `DependencyLockBadge`: Lock icon (🔒) with tooltip showing blocking tasks
- `DependencyBlockModal`: Modal explaining which tasks must be completed first

### 2. Workload Heat Indicator

**Workload Calculator Service**:
```javascript
class WorkloadCalculator {
  // Calculate workload for a member
  calculateWorkload(memberId): Promise<{
    taskCount: number,
    heatLevel: 'green' | 'yellow' | 'red',
    tasks: Task[]
  }>
  
  // Calculate workload for all team members
  calculateTeamWorkload(teamId): Promise<Map<memberId, WorkloadData>>
  
  // Subscribe to real-time workload updates
  subscribeToWorkloadChanges(teamId, callback): Subscription
}
```

**API Endpoints**:
- `GET /api/teams/:id/workload` - Get workload data for all team members
- WebSocket event: `workload:updated` - Real-time workload changes

**UI Components**:
- `WorkloadHeatBar`: Colored bar component with member name and task count
- `WorkloadDashboard`: Grid layout showing all team members' heat indicators

### 3. Deadline Risk Prediction

**Risk Assessment Service**:
```javascript
class RiskAssessmentService {
  // Assess risk for a single task
  assessTaskRisk(task): {
    isAtRisk: boolean,
    timeRemaining: number,
    estimatedTime: number,
    riskLevel: 'none' | 'warning' | 'critical'
  }
  
  // Run risk assessment for all active tasks (scheduled job)
  assessAllTasks(teamId): Promise<void>
  
  // Get all at-risk tasks for a team
  getAtRiskTasks(teamId): Promise<Task[]>
}
```

**Database Schema Extension**:
```javascript
// Task collection addition
{
  estimatedHours: Number,  // Estimated time to complete
  riskStatus: String,      // "none" | "at-risk" | "critical"
  riskCalculatedAt: Date   // Last risk calculation timestamp
}
```

**API Endpoints**:
- `GET /api/tasks/:id/risk-assessment` - Get risk status for a task
- `GET /api/teams/:id/at-risk-tasks` - Get all at-risk tasks for team

**UI Components**:
- `RiskBadge`: Warning indicator (⚠) with "At Risk" text
- `RiskTooltip`: Hover tooltip showing time remaining vs estimated time

### 4. Team Health Score

**Health Score Calculator**:
```javascript
class HealthScoreCalculator {
  // Calculate overall health score
  calculateHealthScore(teamId, dateRange): Promise<{
    score: number,  // 0-100
    onTimeCompletionRate: number,
    reassignmentRate: number,
    bugResolutionRate: number,
    trend: 'improving' | 'stable' | 'declining'
  }>
  
  // Calculate individual metrics
  calculateOnTimeRate(teamId, dateRange): Promise<number>
  calculateReassignmentRate(teamId, dateRange): Promise<number>
  calculateBugResolutionRate(teamId, dateRange): Promise<number>
  
  // Store historical scores
  storeHealthScore(teamId, score): Promise<void>
}
```

**Database Schema**:
```javascript
// New collection: team_health_scores
{
  teamId: ObjectId,
  score: Number,
  onTimeCompletionRate: Number,
  reassignmentRate: Number,
  bugResolutionRate: Number,
  calculatedAt: Date,
  tasksSampled: Number
}
```

**API Endpoints**:
- `GET /api/teams/:id/health-score` - Get current health score
- `GET /api/teams/:id/health-history` - Get historical health scores

**UI Components**:
- `HealthScoreCircle`: Color-coded circle with percentage
- `HealthScoreBreakdown`: Detailed view showing individual metrics
- `HealthScoreTrend`: Line chart showing score over time

### 5. Activity Timeline Visualization

**Activity Event Logger**:
```javascript
class ActivityLogger {
  // Log an activity event
  logEvent(event: {
    teamId: ObjectId,
    userId: ObjectId,
    eventType: string,
    entityType: string,
    entityId: ObjectId,
    metadata: object,
    timestamp: Date
  }): Promise<void>
  
  // Get events with pagination
  getEvents(teamId, filters, pagination): Promise<{
    events: Event[],
    hasMore: boolean,
    nextCursor: string
  }>
}
```

**Database Schema**:
```javascript
// New collection: activity_events
{
  teamId: ObjectId,
  userId: ObjectId,
  userName: String,  // Denormalized for performance
  eventType: String,  // "task_assigned" | "task_updated" | "bug_created" etc.
  entityType: String,  // "task" | "bug" | "member"
  entityId: ObjectId,
  entityName: String,  // Denormalized
  metadata: Object,  // Event-specific data
  timestamp: Date
}

// Indexes
{teamId: 1, timestamp: -1}
{teamId: 1, eventType: 1, timestamp: -1}
{teamId: 1, userId: 1, timestamp: -1}
```

**API Endpoints**:
- `GET /api/teams/:id/activity-timeline` - Get paginated activity events
- `GET /api/teams/:id/activity-timeline/filters` - Get available filter options

**UI Components**:
- `ActivityTimelinePage`: Full page component with vertical timeline
- `ActivityEventCard`: Individual event display with icon, time, and description
- `ActivityFilters`: Filter controls for date range, event type, and member
- `InfiniteScrollContainer`: Pagination handler for loading more events

### 6. AI-Powered Weekly Summary Generator

**AI Summary Service**:
```javascript
class AISummaryService {
  // Collect weekly metrics
  collectWeeklyMetrics(teamId): Promise<{
    tasksCompleted: number,
    tasksLate: number,
    reassignments: number,
    bugsResolved: number,
    bugsCreated: number,
    topPerformers: Member[],
    atRiskTasks: Task[]
  }>
  
  // Generate summary using AI
  generateSummary(metrics): Promise<{
    summary: string,
    generatedAt: Date,
    tokensUsed: number
  }>
  
  // Store generated summary
  storeSummary(teamId, summary): Promise<void>
}
```

**Database Schema**:
```javascript
// New collection: weekly_summaries
{
  teamId: ObjectId,
  weekStartDate: Date,
  weekEndDate: Date,
  summary: String,
  metrics: Object,  // Raw metrics used
  generatedAt: Date,
  generatedBy: ObjectId
}
```

**API Endpoints**:
- `POST /api/teams/:id/generate-summary` - Generate new weekly summary
- `GET /api/teams/:id/summaries` - Get historical summaries

**UI Components**:
- `SummaryGeneratorButton`: Button to trigger summary generation
- `SummaryDisplay`: Formatted display with copy-to-clipboard
- `SummaryHistory`: List of past summaries

### 7. Member Skill Tags and Smart Suggestions

**Skill Matching Engine**:
```javascript
class SkillMatchingEngine {
  // Suggest members for task based on skills
  suggestMembers(taskId, requiredSkills): Promise<{
    memberId: ObjectId,
    memberName: String,
    matchingSkills: String[],
    matchPercentage: number,
    currentWorkload: number
  }[]>
  
  // Calculate skill match score
  calculateMatchScore(memberSkills, requiredSkills): number
  
  // Rank members by combined skill match and workload
  rankMembers(candidates): Member[]
}
```

**Database Schema Extension**:
```javascript
// Member collection addition
{
  skills: [String],  // Array of skill tags
  skillsUpdatedAt: Date
}

// Task collection addition
{
  requiredSkills: [String]  // Optional: skills needed for task
}
```

**API Endpoints**:
- `PUT /api/members/:id/skills` - Update member skills
- `GET /api/tasks/:id/suggested-assignees` - Get ranked member suggestions

**UI Components**:
- `SkillTagSelector`: Multi-select component for choosing skills
- `SkillBadge`: Visual tag for displaying skills
- `MemberSuggestionList`: Ranked list with match percentage and workload
- `SkillMatchIndicator`: Visual indicator of skill compatibility

### 8. Focus Mode for Members

**Focus Mode State Manager**:
```javascript
class FocusModeManager {
  // Enter focus mode
  enterFocusMode(taskId): void
  
  // Exit focus mode
  exitFocusMode(): void
  
  // Get focus mode state
  getFocusModeState(): {
    isActive: boolean,
    currentTask: Task,
    startTime: Date,
    elapsedTime: number
  }
  
  // Save focus mode preference
  saveFocusModePreference(enabled): void
}
```

**UI Components**:
- `FocusModeButton`: Toggle button with 🎯 icon
- `FocusModeView`: Minimal UI showing only current task
- `FocusModeTimer`: Countdown or elapsed time display
- `FocusModeExit`: Exit button to return to normal view

**Local Storage Schema**:
```javascript
{
  focusModeEnabled: boolean,
  lastFocusedTask: ObjectId,
  focusSessionStart: Date
}
```

### 9. Soft Accountability Indicator

**UI Components**:
- `AccountabilityBadge`: Warning indicator (⚠) with gentle messaging
- `OverdueTaskCard`: Task card with soft accountability styling

**Business Logic**:
```javascript
class AccountabilityService {
  // Check if task is overdue
  isOverdue(task): boolean
  
  // Get overdue message
  getAccountabilityMessage(task): string  // Returns "This task needs attention"
  
  // Get overdue tasks for member
  getOverdueTasks(memberId): Promise<Task[]>
}
```

### 10. Conflict Resolution Indicator

**Database Schema Extension**:
```javascript
// Task collection addition
{
  reassignmentCount: Number,
  reassignmentHistory: [{
    fromMember: ObjectId,
    toMember: ObjectId,
    reassignedAt: Date,
    reason: String
  }],
  isFrictionTask: Boolean  // Computed: reassignmentCount > 2
}
```

**API Endpoints**:
- `GET /api/teams/:id/friction-tasks` - Get all high-friction tasks
- `GET /api/tasks/:id/reassignment-history` - Get reassignment details

**UI Components**:
- `FrictionBadge`: Warning indicator (⚠) with "High Friction Task" text
- `ReassignmentHistoryModal`: Modal showing reassignment timeline
- `FrictionTaskDashboard`: Leader view of all friction tasks

## Data Models

### Extended Task Model

```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  status: String,  // "To Do" | "In Progress" | "Done"
  assignedTo: ObjectId,
  createdBy: ObjectId,
  teamId: ObjectId,
  deadline: Date,
  createdAt: Date,
  updatedAt: Date,
  
  // NEW: Dependency fields
  dependsOn: [ObjectId],
  blockedBy: [ObjectId],
  dependencyStatus: String,
  
  // NEW: Risk assessment fields
  estimatedHours: Number,
  riskStatus: String,
  riskCalculatedAt: Date,
  
  // NEW: Skill matching fields
  requiredSkills: [String],
  
  // NEW: Friction tracking fields
  reassignmentCount: Number,
  reassignmentHistory: [{
    fromMember: ObjectId,
    toMember: ObjectId,
    reassignedAt: Date,
    reason: String
  }],
  isFrictionTask: Boolean
}
```

### Extended Member Model

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  role: String,  // "Leader" | "Member"
  teamId: ObjectId,
  firebaseUid: String,
  createdAt: Date,
  
  // NEW: Skill fields
  skills: [String],
  skillsUpdatedAt: Date,
  
  // NEW: Focus mode preference
  focusModeEnabled: Boolean
}
```

### New: Activity Event Model

```javascript
{
  _id: ObjectId,
  teamId: ObjectId,
  userId: ObjectId,
  userName: String,
  eventType: String,
  entityType: String,
  entityId: ObjectId,
  entityName: String,
  metadata: Object,
  timestamp: Date
}
```

### New: Team Health Score Model

```javascript
{
  _id: ObjectId,
  teamId: ObjectId,
  score: Number,
  onTimeCompletionRate: Number,
  reassignmentRate: Number,
  bugResolutionRate: Number,
  calculatedAt: Date,
  tasksSampled: Number
}
```

### New: Weekly Summary Model

```javascript
{
  _id: ObjectId,
  teamId: ObjectId,
  weekStartDate: Date,
  weekEndDate: Date,
  summary: String,
  metrics: {
    tasksCompleted: Number,
    tasksLate: Number,
    reassignments: Number,
    bugsResolved: Number,
    bugsCreated: Number
  },
  generatedAt: Date,
  generatedBy: ObjectId
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Dependency Management Properties

**Property 1: Dependency blocking prevents completion**
*For any* task with incomplete dependencies, attempting to mark it as "Done" should be rejected and the task status should remain unchanged.
**Validates: Requirements 1.3**

**Property 2: Dependency completion error messages identify blockers**
*For any* task with incomplete dependencies, attempting completion should return an error message that includes the names or IDs of all blocking tasks.
**Validates: Requirements 1.4**

**Property 3: Dependency completion enables dependent tasks**
*For any* task with dependencies, when all dependency tasks are marked as "Done", the dependent task should become completable (no longer blocked).
**Validates: Requirements 1.5**

**Property 4: Dependency storage structure**
*For any* task with dependencies set, the task document should contain a `dependsOn` field that is an array of valid task ObjectIds.
**Validates: Requirements 1.6**

**Property 5: Dependency lock icon display**
*For any* task that has incomplete dependencies, the task display should include a lock icon (🔒).
**Validates: Requirements 1.2**

### Workload Management Properties

**Property 6: Workload heat indicator color calculation**
*For any* team member, the heat indicator color should be: green for 1-3 active tasks, yellow for 4-6 active tasks, and red for 7+ active tasks.
**Validates: Requirements 2.2, 2.3, 2.4**

**Property 7: Workload calculation filters by status**
*For any* team member, the workload count should include only tasks with status "In Progress" or "To Do", excluding "Done" and other statuses.
**Validates: Requirements 2.5**

### Risk Assessment Properties

**Property 8: Risk calculation based on time comparison**
*For any* task with both a deadline and estimated hours, if (deadline - currentTime) < estimatedHours, then the task should be marked with riskStatus "at-risk".
**Validates: Requirements 3.2**

**Property 9: Risk indicator display**
*For any* task with riskStatus "at-risk", the task display should show a warning indicator (⚠) with the text "At Risk".
**Validates: Requirements 3.3**

**Property 10: Task completion clears risk status**
*For any* task that is marked as "Done", the riskStatus should be set to "none" regardless of its previous risk state.
**Validates: Requirements 3.5**

### Health Score Properties

**Property 11: Health score calculation uses all three metrics**
*For any* team, the health score calculation should incorporate on-time completion rate, reassignment rate, and bug resolution rate, with each metric contributing to the final score.
**Validates: Requirements 4.1**

**Property 12: Health score color coding**
*For any* health score value, the display color should be: green for scores >= 80%, yellow for scores 60-79%, and red for scores < 60%.
**Validates: Requirements 4.3, 4.4, 4.5**

**Property 13: Health score persistence**
*For any* calculated health score, the system should store it in the database with the teamId, score value, component metrics, and calculation timestamp.
**Validates: Requirements 4.7**

### Activity Timeline Properties

**Property 14: Activity events chronological ordering**
*For any* collection of activity events for a team, when displayed on the timeline, they should be sorted by timestamp in descending order (most recent first).
**Validates: Requirements 5.1**

**Property 15: Activity event data completeness**
*For any* logged activity event, the stored document should contain all required fields: timestamp, eventType, userId, userName, entityType, entityId, and teamId.
**Validates: Requirements 5.2**

**Property 16: Activity event display format**
*For any* activity event, the display string should match the format "HH:MM – [Event Description]" where HH:MM is the time in 24-hour format.
**Validates: Requirements 5.3**

**Property 17: Activity timeline filtering**
*For any* filter combination (date range, event type, team member), the returned events should match all specified filter criteria.
**Validates: Requirements 5.5**

### AI Summary Properties

**Property 18: Weekly summary date range**
*For any* weekly summary generation request, the system should collect data from exactly the past 7 days (168 hours) from the request timestamp.
**Validates: Requirements 6.1**

**Property 19: Weekly summary metrics completeness**
*For any* generated weekly summary, the collected metrics should include all five required fields: tasksCompleted, tasksLate, reassignments, bugsResolved, and bugsCreated.
**Validates: Requirements 6.2**

**Property 20: Summary persistence with timestamp**
*For any* generated summary, the system should store it in the database with the summary text, metrics object, teamId, date range, and generation timestamp.
**Validates: Requirements 6.5**

### Skill Matching Properties

**Property 21: Skill tags storage structure**
*For any* member with skills added, the member document should contain a `skills` field that is an array of strings.
**Validates: Requirements 7.2**

**Property 22: Skill-based member suggestions**
*For any* task with required skills, the reassignment suggestions should include all members whose skill arrays contain at least one matching skill.
**Validates: Requirements 7.3**

**Property 23: Skill match ranking**
*For any* list of suggested members for a task, members should be ordered by skill match percentage in descending order (highest match first).
**Validates: Requirements 7.4**

**Property 24: Skill match highlighting in display**
*For any* suggested member in the reassignment interface, the display should highlight (visually distinguish) the skills that match the task requirements.
**Validates: Requirements 7.5**

### Focus Mode Properties

**Property 25: Focus mode UI composition**
*For any* member in focus mode, the UI should display only the current task details, countdown timer, task notes, and exit button, while hiding navigation menu, notifications, other tasks, and team activity.
**Validates: Requirements 8.2, 8.3**

**Property 26: Focus mode preference persistence**
*For any* member who enables focus mode, the preference should persist across browser sessions (stored in localStorage or user profile).
**Validates: Requirements 8.6**

### Accountability Properties

**Property 27: Overdue task detection**
*For any* task where the deadline has passed and status is not "Done", the system should mark the task as overdue.
**Validates: Requirements 9.1**

**Property 28: Overdue task indicator display**
*For any* overdue task, the task display should show a warning indicator (⚠) with the text "This task needs attention".
**Validates: Requirements 9.2**

**Property 29: Completion clears overdue indicator**
*For any* overdue task that is marked as "Done", the overdue indicator should be removed immediately.
**Validates: Requirements 9.5**

### Friction Detection Properties

**Property 30: Reassignment count tracking**
*For any* task that is reassigned, the reassignmentCount field should increment by 1 and a new entry should be added to reassignmentHistory.
**Validates: Requirements 10.1**

**Property 31: Friction task classification**
*For any* task where reassignmentCount > 2, the isFrictionTask field should be set to true.
**Validates: Requirements 10.2**

**Property 32: Friction task indicator display**
*For any* task where isFrictionTask is true, the task display should show a warning indicator (⚠) with the text "High Friction Task".
**Validates: Requirements 10.3**

**Property 33: Task completion clears friction status**
*For any* friction task that is marked as "Done", the isFrictionTask field should be set to false.
**Validates: Requirements 10.6**

## Error Handling

### Dependency Validation Errors

**Circular Dependency Detection**:
- Before adding dependencies, validate that the new dependency relationship doesn't create a cycle
- Use depth-first search to detect cycles in the dependency graph
- Return error: "Cannot add dependency: would create circular dependency"

**Invalid Task Reference**:
- Validate that all task IDs in dependsOn array exist and belong to the same team
- Return error: "Invalid dependency: task not found or not in same team"

**Self-Dependency Prevention**:
- Prevent a task from depending on itself
- Return error: "Cannot add dependency: task cannot depend on itself"

### Workload Calculation Errors

**Member Not Found**:
- If member ID is invalid during workload calculation
- Return default workload: {taskCount: 0, heatLevel: 'green', tasks: []}

**Database Query Failure**:
- If task query fails during workload calculation
- Log error and return cached workload data if available
- Otherwise return error state to UI

### Risk Assessment Errors

**Missing Required Fields**:
- If task lacks deadline or estimatedHours
- Skip risk calculation and set riskStatus to "none"
- Do not show risk indicator

**Invalid Date Values**:
- If deadline is in the past or estimatedHours is negative
- Set riskStatus to "none" and log warning

### Health Score Calculation Errors

**Insufficient Data**:
- If team has fewer than 5 completed tasks
- Display message: "Insufficient data for health score (minimum 5 completed tasks required)"
- Do not display score circle

**Calculation Failure**:
- If any metric calculation fails
- Use default value of 0 for failed metric
- Display health score with warning indicator

### Activity Timeline Errors

**Event Logging Failure**:
- If activity event fails to save to database
- Log error but do not block the primary operation
- Activity logging is non-critical and should fail silently

**Timeline Query Failure**:
- If timeline query fails
- Display error message: "Unable to load activity timeline"
- Provide retry button

### AI Summary Errors

**AI Service Unavailable**:
- If AI service returns error or times out
- Display fallback: formatted list of raw metrics
- Show message: "AI summary unavailable, showing raw metrics"

**Insufficient Data**:
- If no activity in the past 7 days
- Display message: "No activity in the past week to summarize"

**Rate Limit Exceeded**:
- If AI service rate limit is hit
- Display message: "Summary generation limit reached, please try again later"
- Show last generated summary if available

### Skill Matching Errors

**No Matching Members**:
- If no members have matching skills
- Display all team members sorted by current workload
- Show message: "No skill matches found, showing all available members"

**Invalid Skill Tags**:
- If member attempts to add skill not in predefined list
- Reject the skill and show error: "Invalid skill tag"
- Display list of valid skill options

### Focus Mode Errors

**Task Not Found**:
- If focused task is deleted while in focus mode
- Exit focus mode automatically
- Show message: "Task no longer exists, exiting focus mode"

**localStorage Unavailable**:
- If browser blocks localStorage access
- Focus mode still works but preference won't persist
- Log warning in console

### Friction Detection Errors

**Reassignment History Corruption**:
- If reassignmentHistory array is malformed
- Recalculate from scratch using task update logs
- If logs unavailable, reset reassignmentCount to 0

## Testing Strategy

### Dual Testing Approach

This feature set requires both unit testing and property-based testing for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Specific dependency graph scenarios (linear, branching, complex)
- Boundary values for workload thresholds (exactly 3, 4, 6, 7 tasks)
- Edge cases like empty teams, tasks with no deadline, members with no skills
- Error conditions and fallback behaviors
- Integration between components (e.g., task completion triggering multiple updates)

**Property Tests**: Verify universal properties across all inputs
- All 33 correctness properties defined above
- Each property test should run minimum 100 iterations
- Use property-based testing library (fast-check for JavaScript/TypeScript)
- Tag each test with: **Feature: taskhive-mentor-features, Property {number}: {property_text}**

### Property-Based Testing Configuration

**Library Selection**: fast-check (JavaScript/TypeScript)
- Mature library with good TypeScript support
- Excellent generator composition for complex data structures
- Built-in shrinking for minimal failing examples

**Test Configuration**:
```javascript
fc.assert(
  fc.property(
    // generators here
    (inputs) => {
      // property assertion
    }
  ),
  { numRuns: 100 } // minimum 100 iterations
);
```

**Custom Generators Needed**:
- Task generator with configurable fields (status, deadline, dependencies, etc.)
- Member generator with skills and workload
- Team generator with members and tasks
- Activity event generator
- Date range generator for timeline testing

### Testing Priorities

**Phase 1 - Core Intelligence (Highest Priority)**:
1. Dependency management (Properties 1-5)
2. Workload heat indicator (Properties 6-7)
3. Risk prediction (Properties 8-10)

**Phase 2 - Team Analytics**:
4. Health score (Properties 11-13)
5. Activity timeline (Properties 14-17)

**Phase 3 - AI & Smart Features**:
6. AI summaries (Properties 18-20)
7. Skill matching (Properties 21-24)

**Phase 4 - UX Polish**:
8. Focus mode (Properties 25-26)
9. Soft accountability (Properties 27-29)
10. Friction detection (Properties 30-33)

### Integration Testing

Beyond unit and property tests, integration tests should verify:
- Real-time updates via Socket.io for workload and risk indicators
- Database transactions for complex operations (task completion with dependencies)
- AI service integration with proper error handling
- End-to-end flows: task creation → assignment → completion with all features active

### Performance Testing

Key performance metrics to validate:
- Workload calculation for 100 members: < 500ms
- Health score calculation: < 1 second
- Activity timeline initial load (50 events): < 2 seconds
- Risk assessment for 1000 tasks: < 5 seconds
- Dependency validation (checking for cycles): < 100ms for graphs up to 100 nodes

### Test Data Management

**Seed Data Requirements**:
- Teams with varying sizes (1, 10, 50, 100 members)
- Tasks with various dependency patterns (none, linear, branching, complex)
- Historical data for health score calculation (30 days of activity)
- Activity events spanning multiple weeks
- Members with diverse skill combinations

**Test Database**:
- Use separate test database instance
- Reset database state between test suites
- Use transactions for test isolation where possible
