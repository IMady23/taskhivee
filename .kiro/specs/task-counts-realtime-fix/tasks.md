# Implementation Plan: Task Counts Real-Time Fix

## Overview

This implementation plan addresses the task counts bug by changing the filtering logic from name-based to UID-based in the `getMemberStats` function. The fix is surgical and minimal, requiring changes to only one function in `LeaderTeamManagement.jsx`. Additional tasks include setting up property-based testing infrastructure and auditing other pages for similar issues.

## Tasks

- [x] 1. Fix the getMemberStats function in LeaderTeamManagement.jsx
  - Change function parameter from `memberName` to `memberId`
  - Update filter logic to use `memberId` instead of `memberName`
  - Update function call to pass `member.id` instead of `member.name`
  - Add guard clause to handle undefined `memberId`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3_

- [ ] 2. Set up property-based testing infrastructure
  - Install fast-check library (`npm install --save-dev fast-check`)
  - Create test file `client/src/test/memberStats.property.test.js`
  - Set up test configuration for minimum 100 iterations
  - Create arbitraries for generating random members and tasks
  - _Requirements: Testing Strategy_

- [ ] 3. Write property test for UID-based filtering correctness
  - **Property 1: UID-based filtering correctness**
  - Generate random members with UIDs and random task collections
  - Verify filtering by member.id returns only tasks where assignedTo matches
  - Tag: `Feature: task-counts-realtime-fix, Property 1: UID-based filtering correctness`
  - **Validates: Requirements 1.1, 3.3, 6.2**
  - _Requirements: 1.1, 3.3, 6.2_

- [ ] 4. Write property test for count calculation correctness
  - **Property 2: Count calculation correctness**
  - Generate random members and tasks with various statuses
  - Verify assigned count equals tasks where assignedTo matches member.id
  - Verify completed count equals tasks where assignedTo matches AND status is "Done"
  - Tag: `Feature: task-counts-realtime-fix, Property 2: Count calculation correctness`
  - **Validates: Requirements 1.2, 1.3**
  - _Requirements: 1.2, 1.3_

- [ ] 5. Write property test for efficiency calculation correctness
  - **Property 3: Efficiency calculation correctness**
  - Generate random members with at least one assigned task
  - Verify efficiency equals Math.round((completed / assigned) * 100)
  - Include edge case: assigned = 0 should return efficiency = 0
  - Tag: `Feature: task-counts-realtime-fix, Property 3: Efficiency calculation correctness`
  - **Validates: Requirements 1.4, 1.5**
  - _Requirements: 1.4, 1.5_

- [ ] 6. Write property test for task exclusion with missing assignedTo
  - **Property 4: Task exclusion for missing assignedTo**
  - Generate tasks with and without assignedTo field
  - Verify tasks without assignedTo are excluded from all member counts
  - Tag: `Feature: task-counts-realtime-fix, Property 4: Task exclusion for missing assignedTo`
  - **Validates: Requirements 5.2**
  - _Requirements: 5.2_

- [ ] 7. Write unit tests for edge cases
  - Test with empty tasks array (should return 0 counts)
  - Test with undefined memberId (should return { 0, 0, 0 })
  - Test with member having 0 assigned tasks (efficiency should be 0%)
  - Test with tasks missing assignedTo field
  - Test with specific examples from verification matrix (TC1, TC2, TC5, TC6, TC7)
  - _Requirements: 5.1, 5.3, Verification Matrix_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Run `npm test` to verify all unit and property tests pass
  - Verify property tests run minimum 100 iterations each
  - Ask the user if questions arise

- [ ] 9. Audit and fix other pages with similar patterns
  - Search for `tasks.filter(t => t.assignedTo === member.name)` pattern in codebase
  - Check `LeaderDashboard.jsx` for member stats calculations
  - Check `MemberDashboard.jsx` for task count displays
  - Check `TaskBoard.jsx` for per-member filtering
  - Apply same UID-based filtering fix to any instances found
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 10. Write integration tests for cross-page consistency
  - Create test that verifies counts match across Team Management and Leader Dashboard
  - Verify same member shows same counts on different pages
  - Tag: `Feature: task-counts-realtime-fix, Cross-page consistency`
  - _Requirements: 6.3_

- [ ] 11. Manual verification and testing
  - Test TC1: Assign 3 tasks to a member, verify "3 ASSIGNED" displays
  - Test TC2: Mark 2 tasks as Done, verify "2 DONE" displays
  - Test TC3: Assign task in another browser, verify count updates within 2 seconds
  - Test TC4: Refresh page, verify counts persist correctly
  - Test TC8: Compare counts on Team Management vs Leader Dashboard
  - Test with 50+ members and 500+ tasks for performance verification
  - _Requirements: Verification Matrix, 4.1_

- [ ] 12. Final checkpoint - Ensure all tests pass and manual verification complete
  - Ensure all automated tests pass
  - Confirm manual verification checklist complete
  - Ask the user if questions arise or if ready for deployment

## Notes

- All tasks are required for comprehensive testing and validation
- The core fix (Task 1) is minimal and low-risk
- Property tests provide comprehensive validation across random inputs
- Unit tests cover specific edge cases and examples
- Manual testing verifies real-time behavior and cross-page consistency
- Each task references specific requirements for traceability
