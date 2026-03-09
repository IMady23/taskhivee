# Requirements Document

## Introduction

This specification addresses a critical bug in the Team Management page where task counts display incorrectly as "0 ASSIGNED | 0 DONE" for all team members. The root cause is a mismatch between how tasks are filtered (by member name) versus how they are stored in Firestore (by user UID). This fix will ensure accurate, real-time task statistics for team leaders monitoring their team's progress.

## Glossary

- **Team_Management_Page**: The leader-facing interface displaying team member statistics and task counts
- **Task_Count_System**: The subsystem responsible for calculating and displaying assigned and completed task counts per member
- **Member_Stats**: The aggregated statistics for a team member including assigned tasks, completed tasks, and efficiency percentage
- **TasksContext**: The React context providing real-time task data via Firestore listeners
- **UID**: User Identifier - the unique Firestore authentication ID for each user
- **Firestore**: The backend database storing task and user data

## Requirements

### Requirement 1: Correct Task Count Calculation

**User Story:** As a team leader, I want to see accurate task counts for each team member, so that I can monitor workload distribution and team progress effectively.

#### Acceptance Criteria

1. WHEN the Task_Count_System calculates member statistics, THE System SHALL filter tasks by matching the member's UID against the task's assignedTo field
2. WHEN a team member has assigned tasks, THE Team_Management_Page SHALL display the correct count of assigned tasks
3. WHEN a team member has completed tasks, THE Team_Management_Page SHALL display the correct count of completed tasks
4. WHEN calculating efficiency percentage, THE System SHALL compute it as (completed / assigned) * 100 for members with assigned tasks
5. WHEN a member has zero assigned tasks, THE System SHALL display 0% efficiency without errors

### Requirement 2: Real-Time Updates

**User Story:** As a team leader, I want task counts to update immediately when tasks are assigned or completed, so that I have current information without manual refresh.

#### Acceptance Criteria

1. WHEN a task is assigned to a team member, THE Team_Management_Page SHALL update the assigned count within 2 seconds
2. WHEN a task status changes to Done, THE Team_Management_Page SHALL update the completed count within 2 seconds
3. WHEN a task is reassigned from one member to another, THE System SHALL update both members' counts within 2 seconds
4. WHEN the TasksContext receives updates from Firestore, THE Task_Count_System SHALL recalculate statistics automatically

### Requirement 3: Data Persistence

**User Story:** As a team leader, I want task counts to persist correctly after page refresh, so that I can rely on consistent data across sessions.

#### Acceptance Criteria

1. WHEN the Team_Management_Page loads, THE System SHALL fetch current task data from Firestore
2. WHEN the page is refreshed, THE System SHALL display the same accurate counts as before refresh
3. WHEN Firestore data is loaded, THE Task_Count_System SHALL use the member UID for filtering tasks

### Requirement 4: Performance and Compatibility

**User Story:** As a team leader, I want the fix to maintain system performance, so that the page remains responsive with large teams.

#### Acceptance Criteria

1. WHEN calculating member statistics, THE System SHALL complete calculations within 100ms for teams up to 50 members
2. WHEN the fix is deployed, THE System SHALL maintain existing real-time listener functionality
3. WHEN filtering tasks by UID, THE System SHALL produce identical results to name-based filtering for correctly stored data
4. THE System SHALL work correctly for all team members including the team leader

### Requirement 5: Backward Compatibility

**User Story:** As a system administrator, I want the fix to handle edge cases gracefully, so that the system remains stable during the transition.

#### Acceptance Criteria

1. WHEN a member object lacks an id field, THE System SHALL handle the error gracefully and display 0 counts
2. WHEN a task lacks an assignedTo field, THE System SHALL exclude it from all member counts
3. WHEN the tasks array is empty, THE System SHALL display 0 counts for all members without errors
4. WHEN the members array is empty, THE System SHALL render the page without errors
5. THE member object SHALL contain a unique identifier field (id) that matches the assignedTo field in tasks

### Requirement 6: Cross-Page Consistency

**User Story:** As a team leader or member, I want consistent task counts across all pages, so that I can trust the statistics regardless of where I view them.

#### Acceptance Criteria

1. WHEN the fix is applied to the Team_Management_Page, THE System SHALL identify all other pages displaying per-member task counts
2. WHEN other pages calculate member statistics, THE System SHALL use UID-based filtering consistently
3. WHEN viewing task counts on Leader Dashboard, Member Dashboard, or Task Board, THE displayed counts SHALL match the Team_Management_Page counts
4. THE System SHALL use a single team-level Firestore listener for task data to minimize database reads
5. THE solution SHALL NOT add more than 2 Firestore reads per member per page load

## Verification Matrix

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| TC1 – Correct assignment count | Assign 3 tasks to member A | Team Management Page shows "3 ASSIGNED" |
| TC2 – Correct completion count | Mark 2 of those tasks as Done | Shows "2 DONE" |
| TC3 – Real-time update | Assign a new task via another browser | Count updates within 2 seconds |
| TC4 – Refresh persistence | Refresh page | Counts remain correct |
| TC5 – Empty team | View page with 0 members | Page renders, no errors |
| TC6 – Missing assignedTo | Create task with no assignee | Excluded from all counts |
| TC7 – Zero efficiency | View member with 0 assigned tasks | Shows "0%" efficiency |
| TC8 – Cross-page consistency | Compare counts on Team Management vs Leader Dashboard | Counts match exactly |
