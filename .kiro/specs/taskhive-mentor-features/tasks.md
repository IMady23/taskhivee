# Implementation Plan: TaskHive Mentor-Impressing Features

## Overview

This implementation plan breaks down the 10 high-impact features into discrete, incremental coding tasks. The plan follows a phased approach that prioritizes core intelligence features first, then analytics, AI integration, and finally UX polish. Each task builds on previous work and includes testing sub-tasks to validate correctness early.

The implementation uses TypeScript for both frontend (React) and backend (Node.js/Express) components, leveraging TaskHive's existing architecture and patterns.

## Tasks

### Phase 1: Core Intelligence Features

- [x] 1. Set up database schema extensions and migrations
  - Add new fields to Task model: dependsOn, blockedBy, dependencyStatus, estimatedHours, riskStatus, riskCalculatedAt, requiredSkills, reassignmentCount, reassignmentHistory, isFrictionTask
  - Add new fields to Member model: skills, skillsUpdatedAt, focusModeEnabled
  - Create new collections: activity_events, team_health_scores, weekly_summaries
  - Create database indexes for performance: (teamId, timestamp) on activity_events, (teamId, calculatedAt) on team_health_scores
  - Write migration script to add new fields to existing documents with default values
  - _Requirements: 1.6, 3.2, 7.2, 10.1_

- [x] 2. Implement Smart Task Dependency Management
  - [x] 2.1 Create DependencyResolver service class
    - Implement canComplete() method to check if task dependencies are satisfied
    - Implement getBlockedTasks() method to find tasks blocked by a given task
    - Implement validateNoCycles() method using depth-first search to detect circular dependencies
    - Implement updateDependencyStatuses() method to update status when tasks complete
    - _Requirements: 1.3, 1.4, 1.5_
  
  - [ ]* 2.2 Write property test for dependency blocking
    - **Property 1: Dependency blocking prevents completion**
    - **Validates: Requirements 1.3**
  
  - [ ]* 2.3 Write property test for dependency error messages
    - **Property 2: Dependency completion error messages identify blockers**
    - **Validates: Requirements 1.4**
  
  - [ ]* 2.4 Write property test for dependency completion enabling
    - **Property 3: Dependency completion enables dependent tasks**
    - **Validates: Requirements 1.5**
  
  - [x] 2.5 Create API endpoints for dependency management
    - Implement PUT /api/tasks/:id/dependencies endpoint with cycle validation
    - Implement GET /api/tasks/:id/dependency-tree endpoint
    - Modify POST /api/tasks/:id/complete endpoint to check dependencies before allowing completion
    - Add error handling for circular dependencies, invalid task references, and self-dependencies
    - _Requirements: 1.1, 1.3, 1.4_
  
  - [x] 2.6 Create frontend dependency UI components
    - Build DependencySelector component with multi-select dropdown for choosing dependent tasks
    - Build DependencyLockBadge component showing lock icon (🔒) with tooltip
    - Build DependencyBlockModal component explaining which tasks must be completed first
    - Integrate components into task editor and task display views
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ]* 2.7 Write property test for dependency storage structure
    - **Property 4: Dependency storage structure**
    - **Validates: Requirements 1.6**
  
  - [ ]* 2.8 Write property test for lock icon display
    - **Property 5: Dependency lock icon display**
    - **Validates: Requirements 1.2**

- [x] 3. Implement Workload Heat Indicator
  - [x] 3.1 Create WorkloadCalculator service class
    - Implement calculateWorkload() method to count active tasks per member
    - Implement calculateTeamWorkload() method for all team members
    - Implement subscribeToWorkloadChanges() method using MongoDB change streams
    - Add logic to filter tasks by status ("In Progress" or "To Do" only)
    - Add logic to determine heat level: green (1-3), yellow (4-6), red (7+)
    - _Requirements: 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 3.2 Write property test for heat indicator color calculation
    - **Property 6: Workload heat indicator color calculation**
    - **Validates: Requirements 2.2, 2.3, 2.4**
  
  - [ ]* 3.3 Write property test for workload status filtering
    - **Property 7: Workload calculation filters by status**
    - **Validates: Requirements 2.5**
  
  - [x] 3.4 Create API endpoints for workload data
    - Implement GET /api/teams/:id/workload endpoint
    - Set up Socket.io event handler for workload:updated broadcasts
    - Add real-time workload updates when tasks are assigned or completed
    - _Requirements: 2.1, 2.6_
  
  - [x] 3.5 Create frontend workload UI components
    - Build WorkloadHeatBar component with colored bar and member info
    - Build WorkloadDashboard component with grid layout for all members
    - Integrate Socket.io listener for real-time workload updates
    - Add workload display to leader dashboard
    - _Requirements: 2.1, 2.6_

- [x] 4. Implement Deadline Risk Prediction
  - [x] 4.1 Create RiskAssessmentService class
    - Implement assessTaskRisk() method comparing time remaining vs estimated time
    - Implement assessAllTasks() method for batch risk calculation
    - Implement getAtRiskTasks() method to query at-risk tasks
    - Add scheduled job to run risk assessment daily
    - _Requirements: 3.1, 3.2_
  
  - [ ]* 4.2 Write property test for risk calculation
    - **Property 8: Risk calculation based on time comparison**
    - **Validates: Requirements 3.2**
  
  - [ ]* 4.3 Write property test for risk indicator display
    - **Property 9: Risk indicator display**
    - **Validates: Requirements 3.3**
  
  - [ ]* 4.4 Write property test for completion clearing risk
    - **Property 10: Task completion clears risk status**
    - **Validates: Requirements 3.5**
  
  - [x] 4.5 Create API endpoints for risk assessment
    - Implement GET /api/tasks/:id/risk-assessment endpoint
    - Implement GET /api/teams/:id/at-risk-tasks endpoint
    - Add risk calculation trigger on task deadline or estimate updates
    - _Requirements: 3.1, 3.2, 3.4_
  
  - [x] 4.6 Create frontend risk indicator UI components
    - Build RiskBadge component with warning indicator (⚠) and "At Risk" text
    - Build RiskTooltip component showing time remaining vs estimated time
    - Integrate risk indicators into task cards and task detail views
    - _Requirements: 3.3_

- [x] 5. Checkpoint - Phase 1 Core Features Complete
  - Ensure all Phase 1 tests pass
  - Verify dependency management works with complex task graphs
  - Verify workload indicators update in real-time
  - Verify risk predictions calculate correctly
  - Ask the user if questions arise

### Phase 2: Team Analytics Features

- [x] 6. Implement Team Health Score
  - [x] 6.1 Create HealthScoreCalculator service class
    - Implement calculateOnTimeRate() method using completed tasks and deadlines
    - Implement calculateReassignmentRate() method using reassignment history
    - Implement calculateBugResolutionRate() method using bug data
    - Implement calculateHealthScore() method combining all three metrics
    - Implement storeHealthScore() method to persist historical scores
    - Add scheduled job to calculate health score daily at midnight
    - _Requirements: 4.1, 4.6_
  
  - [ ]* 6.2 Write property test for health score calculation
    - **Property 11: Health score calculation uses all three metrics**
    - **Validates: Requirements 4.1**
  
  - [ ]* 6.3 Write property test for health score color coding
    - **Property 12: Health score color coding**
    - **Validates: Requirements 4.3, 4.4, 4.5**
  
  - [ ]* 6.4 Write property test for health score persistence
    - **Property 13: Health score persistence**
    - **Validates: Requirements 4.7**
  
  - [x] 6.5 Create API endpoints for health score
    - Implement GET /api/teams/:id/health-score endpoint
    - Implement GET /api/teams/:id/health-history endpoint for historical data
    - Add error handling for insufficient data scenarios
    - _Requirements: 4.2, 4.7_
  
  - [x] 6.6 Create frontend health score UI components
    - Build HealthScoreCircle component with color-coded circle and percentage
    - Build HealthScoreBreakdown component showing individual metrics
    - Build HealthScoreTrend component with line chart for historical data
    - Integrate health score display into leader dashboard
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [x] 7. Implement Activity Timeline Visualization
  - [x] 7.1 Create ActivityLogger middleware and service
    - Implement logEvent() method to capture activity events
    - Implement getEvents() method with pagination and filtering
    - Add middleware to intercept task, bug, and member operations
    - Store events with denormalized data (userName, entityName) for performance
    - _Requirements: 5.2_
  
  - [ ]* 7.2 Write property test for chronological ordering
    - **Property 14: Activity events chronological ordering**
    - **Validates: Requirements 5.1**
  
  - [ ]* 7.3 Write property test for event data completeness
    - **Property 15: Activity event data completeness**
    - **Validates: Requirements 5.2**
  
  - [ ]* 7.4 Write property test for event display format
    - **Property 16: Activity event display format**
    - **Validates: Requirements 5.3**
  
  - [ ]* 7.5 Write property test for timeline filtering
    - **Property 17: Activity timeline filtering**
    - **Validates: Requirements 5.5**
  
  - [x] 7.6 Create API endpoints for activity timeline
    - Implement GET /api/teams/:id/activity-timeline endpoint with pagination
    - Implement GET /api/teams/:id/activity-timeline/filters endpoint
    - Add support for filtering by date range, event type, and team member
    - Implement cursor-based pagination for efficient scrolling
    - _Requirements: 5.1, 5.5, 5.6_
  
  - [x] 7.7 Create frontend activity timeline UI components
    - Build ActivityTimelinePage component with vertical timeline layout
    - Build ActivityEventCard component with icon, time, and description
    - Build ActivityFilters component for date range, event type, and member filters
    - Build InfiniteScrollContainer component for loading more events
    - Add route and navigation for activity timeline page
    - _Requirements: 5.1, 5.3, 5.4, 5.6_

- [x] 8. Checkpoint - Phase 2 Analytics Complete
  - Ensure all Phase 2 tests pass
  - Verify health score calculates correctly with real data
  - Verify activity timeline displays events in correct order
  - Verify filtering and pagination work smoothly
  - Ask the user if questions arise

### Phase 3: AI & Smart Features

- [x] 9. Implement AI-Powered Weekly Summary Generator
  - [x] 9.1 Create AISummaryService class
    - Implement collectWeeklyMetrics() method to gather 7-day data
    - Implement generateSummary() method to call existing AI service
    - Implement storeSummary() method to persist generated summaries
    - Add error handling for AI service failures with fallback to raw metrics
    - Add rate limiting logic to prevent excessive AI calls
    - _Requirements: 6.1, 6.2, 6.3, 6.6_
  
  - [ ]* 9.2 Write property test for weekly date range
    - **Property 18: Weekly summary date range**
    - **Validates: Requirements 6.1**
  
  - [ ]* 9.3 Write property test for metrics completeness
    - **Property 19: Weekly summary metrics completeness**
    - **Validates: Requirements 6.2**
  
  - [ ]* 9.4 Write property test for summary persistence
    - **Property 20: Summary persistence with timestamp**
    - **Validates: Requirements 6.5**
  
  - [x] 9.5 Create API endpoints for summary generation
    - Implement POST /api/teams/:id/generate-summary endpoint
    - Implement GET /api/teams/:id/summaries endpoint for historical summaries
    - Add authentication check to ensure only leaders can generate summaries
    - _Requirements: 6.1, 6.4, 6.5_
  
  - [x] 9.6 Create frontend summary UI components
    - Build SummaryGeneratorButton component with loading state
    - Build SummaryDisplay component with formatted text and copy-to-clipboard
    - Build SummaryHistory component showing past summaries
    - Add summary section to leader dashboard
    - _Requirements: 6.4, 6.5_

- [x] 10. Implement Member Skill Tags and Smart Suggestions
  - [x] 10.1 Create SkillMatchingEngine service class
    - Implement suggestMembers() method to rank members by skill match
    - Implement calculateMatchScore() method for skill compatibility
    - Implement rankMembers() method combining skill match and workload
    - Define predefined skill list: Frontend, Backend, UI, Testing, DevOps, Database, API, Mobile
    - _Requirements: 7.3, 7.4_
  
  - [ ]* 10.2 Write property test for skill storage structure
    - **Property 21: Skill tags storage structure**
    - **Validates: Requirements 7.2**
  
  - [ ]* 10.3 Write property test for skill-based suggestions
    - **Property 22: Skill-based member suggestions**
    - **Validates: Requirements 7.3**
  
  - [ ]* 10.4 Write property test for skill match ranking
    - **Property 23: Skill match ranking**
    - **Validates: Requirements 7.4**
  
  - [ ]* 10.5 Write property test for skill highlighting
    - **Property 24: Skill match highlighting in display**
    - **Validates: Requirements 7.5**
  
  - [x] 10.6 Create API endpoints for skill management
    - Implement PUT /api/members/:id/skills endpoint with validation
    - Implement GET /api/tasks/:id/suggested-assignees endpoint
    - Add validation to ensure skills are from predefined list
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 10.7 Create frontend skill management UI components
    - Build SkillTagSelector component with multi-select for predefined skills
    - Build SkillBadge component for displaying skill tags
    - Build MemberSuggestionList component with match percentage and workload
    - Build SkillMatchIndicator component showing compatibility
    - Integrate skill selector into member profile editor
    - Integrate skill suggestions into task reassignment interface
    - _Requirements: 7.1, 7.3, 7.4, 7.5, 7.6_

- [x] 11. Checkpoint - Phase 3 AI & Smart Features Complete
  - Ensure all Phase 3 tests pass
  - Verify AI summary generation works with fallback
  - Verify skill matching suggests appropriate members
  - Verify skill ranking considers both match and workload
  - Ask the user if questions arise

### Phase 4: UX Polish Features

- [x] 12. Implement Focus Mode for Members
  - [x] 12.1 Create FocusModeManager client-side service
    - Implement enterFocusMode() method to transition UI state
    - Implement exitFocusMode() method to restore normal view
    - Implement getFocusModeState() method to track current state
    - Implement saveFocusModePreference() method using localStorage
    - Add timer logic for countdown or elapsed time display
    - _Requirements: 8.1, 8.5, 8.6_
  
  - [ ]* 12.2 Write property test for focus mode UI composition
    - **Property 25: Focus mode UI composition**
    - **Validates: Requirements 8.2, 8.3**
  
  - [ ]* 12.3 Write property test for focus mode persistence
    - **Property 26: Focus mode preference persistence**
    - **Validates: Requirements 8.6**
  
  - [x] 12.4 Create frontend focus mode UI components
    - Build FocusModeButton component with 🎯 icon toggle
    - Build FocusModeView component with minimal UI (task details, timer, notes, exit)
    - Build FocusModeTimer component for countdown/elapsed time
    - Build FocusModeExit component for returning to normal view
    - Add CSS to hide navigation, notifications, and other distractions in focus mode
    - Integrate focus mode toggle into member task view
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 13. Implement Soft Accountability Indicator
  - [x] 13.1 Create AccountabilityService class
    - Implement isOverdue() method to check if task deadline has passed
    - Implement getAccountabilityMessage() method returning "This task needs attention"
    - Implement getOverdueTasks() method for member's overdue tasks
    - _Requirements: 9.1, 9.2_
  
  - [ ]* 13.2 Write property test for overdue detection
    - **Property 27: Overdue task detection**
    - **Validates: Requirements 9.1**
  
  - [ ]* 13.3 Write property test for overdue indicator display
    - **Property 28: Overdue task indicator display**
    - **Validates: Requirements 9.2**
  
  - [ ]* 13.4 Write property test for completion clearing indicator
    - **Property 29: Completion clears overdue indicator**
    - **Validates: Requirements 9.5**
  
  - [x] 13.5 Create frontend accountability UI components
    - Build AccountabilityBadge component with ⚠ icon and gentle message
    - Build OverdueTaskCard component with soft styling (no harsh red)
    - Integrate accountability indicators into task cards and task lists
    - Ensure messaging uses neutral, non-judgmental language
    - _Requirements: 9.2, 9.3, 9.5_

- [x] 14. Implement Conflict Resolution Indicator
  - [x] 14.1 Add reassignment tracking logic
    - Modify task reassignment endpoint to increment reassignmentCount
    - Add reassignment history entry with fromMember, toMember, timestamp, reason
    - Implement logic to set isFrictionTask = true when reassignmentCount > 2
    - Implement logic to clear isFrictionTask when task is completed
    - _Requirements: 10.1, 10.2, 10.6_
  
  - [ ]* 14.2 Write property test for reassignment tracking
    - **Property 30: Reassignment count tracking**
    - **Validates: Requirements 10.1**
  
  - [ ]* 14.3 Write property test for friction classification
    - **Property 31: Friction task classification**
    - **Validates: Requirements 10.2**
  
  - [ ]* 14.4 Write property test for friction indicator display
    - **Property 32: Friction task indicator display**
    - **Validates: Requirements 10.3**
  
  - [ ]* 14.5 Write property test for completion clearing friction
    - **Property 33: Task completion clears friction status**
    - **Validates: Requirements 10.6**
  
  - [x] 14.6 Create API endpoints for friction tracking
    - Implement GET /api/teams/:id/friction-tasks endpoint
    - Implement GET /api/tasks/:id/reassignment-history endpoint
    - Add friction task count to dashboard summary endpoint
    - _Requirements: 10.4, 10.5_
  
  - [x] 14.7 Create frontend friction indicator UI components
    - Build FrictionBadge component with ⚠ icon and "High Friction Task" text
    - Build ReassignmentHistoryModal component showing reassignment timeline
    - Build FrictionTaskDashboard component for leader view
    - Integrate friction indicators into task cards and leader dashboard
    - _Requirements: 10.3, 10.4, 10.5_

- [x] 15. Final Integration and Polish
  - [x] 15.1 Wire all features together in the application
    - Ensure all Socket.io events are properly connected
    - Verify all API endpoints are registered and accessible
    - Test feature interactions (e.g., completing a dependency updates workload and risk)
    - Add loading states and error boundaries for all new components
    - _Requirements: All_
  
  - [x] 15.2 Add comprehensive error handling
    - Implement all error scenarios from design document
    - Add user-friendly error messages for all failure cases
    - Ensure graceful degradation when services are unavailable
    - Add retry logic for transient failures
    - _Requirements: All_
  
  - [x] 15.3 Performance optimization
    - Add database indexes for all new queries
    - Implement caching for frequently accessed data (workload, health score)
    - Optimize real-time updates to reduce Socket.io traffic
    - Add pagination to all list views
    - _Requirements: All_
  
  - [ ]* 15.4 Write integration tests for feature interactions
    - Test task completion triggering multiple updates (workload, risk, health score, activity log)
    - Test real-time updates across multiple clients
    - Test error handling and fallback behaviors
    - Test performance under load (100 members, 1000 tasks)

- [x] 16. Final Checkpoint - All Features Complete
  - Run full test suite (unit tests, property tests, integration tests)
  - Verify all 10 features work correctly in production-like environment
  - Test with realistic data volumes
  - Verify no regressions in existing TaskHive functionality
  - Ask the user if questions arise and if ready for deployment

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at phase boundaries
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples, edge cases, and error conditions
- All features are designed as additive changes to maintain code stability
- Real-time features use Socket.io for immediate UI updates
- Database schema changes are minimal and backward compatible
