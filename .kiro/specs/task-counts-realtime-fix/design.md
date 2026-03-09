# Design Document: Task Counts Real-Time Fix

## Overview

This design addresses a critical bug where the Team Management page displays incorrect task counts (0 ASSIGNED | 0 DONE) due to a mismatch between the filtering logic and Firestore data structure. The current implementation filters tasks by member name, but Firestore stores the `assignedTo` field as a user UID. This design provides a minimal, surgical fix that changes the comparison logic from name-based to UID-based filtering.

The fix is intentionally narrow in scope: change one line of code in the `getMemberStats` function to use `member.id` instead of `member.name`. This ensures immediate resolution of the bug while maintaining all existing real-time functionality provided by the TasksContext.

## Architecture

### Current Architecture

```
┌─────────────────────────────────────┐
│  LeaderTeamManagement.jsx           │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ getMemberStats(memberName)    │ │
│  │   - Filters by name (WRONG)   │ │
│  │   - Returns { assigned,       │ │
│  │     completed, efficiency }   │ │
│  └───────────────────────────────┘ │
│           ↓                         │
│  ┌───────────────────────────────┐ │
│  │ tasks.filter(t =>             │ │
│  │   t.assignedTo === memberName)│ │ ← MISMATCH
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  TasksContext                       │
│  - Real-time listener via           │
│    fs.onTasksByTeam()               │
│  - Provides tasks array             │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Firestore Database                 │
│  tasks: {                           │
│    assignedTo: "uid123" ← UID       │
│    status: "Done"                   │
│  }                                  │
└─────────────────────────────────────┘
```

### Fixed Architecture

```
┌─────────────────────────────────────┐
│  LeaderTeamManagement.jsx           │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ getMemberStats(memberId)      │ │
│  │   - Filters by UID (CORRECT)  │ │
│  │   - Returns { assigned,       │ │
│  │     completed, efficiency }   │ │
│  └───────────────────────────────┘ │
│           ↓                         │
│  ┌───────────────────────────────┐ │
│  │ tasks.filter(t =>             │ │
│  │   t.assignedTo === memberId)  │ │ ← MATCH ✓
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  TasksContext                       │
│  - Real-time listener (unchanged)   │
│  - Provides tasks array             │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Firestore Database                 │
│  tasks: {                           │
│    assignedTo: "uid123" ← UID       │
│    status: "Done"                   │
│  }                                  │
└─────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Minimal Change Principle**: Only modify the filtering logic, not the data structure or context system
2. **Leverage Existing Infrastructure**: Use the existing TasksContext real-time listener without modification
3. **Single Source of Truth**: Continue using Firestore as the authoritative data source
4. **Client-Side Aggregation**: Maintain the current pattern of filtering and counting on the client side

## Components and Interfaces

### Modified Component: LeaderTeamManagement.jsx

**Location**: `client/src/pages/leader/LeaderTeamManagement.jsx`

**Current Implementation** (Line 60):
```javascript
const getMemberStats = (memberName) => {
  const assigned = tasks.filter(t => t.assignedTo === memberName).length;
  const completed = tasks.filter(t => t.assignedTo === memberName && t.status === 'Done').length;
  const efficiency = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
  return { assigned, completed, efficiency };
};
```

**Fixed Implementation**:
```javascript
const getMemberStats = (memberId) => {
  const assigned = tasks.filter(t => t.assignedTo === memberId).length;
  const completed = tasks.filter(t => t.assignedTo === memberId && t.status === 'Done').length;
  const efficiency = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
  return { assigned, completed, efficiency };
};
```

**Function Call Update**:
```javascript
// Current (WRONG)
const stats = getMemberStats(member.name);

// Fixed (CORRECT)
const stats = getMemberStats(member.id);
```

### Unchanged Components

**TasksContext**: Provides real-time task updates via `fs.onTasksByTeam()`. No changes required.

**Member Object Structure**:
```javascript
{
  id: "uid123",        // Firestore UID
  name: "John Doe",    // Display name
  email: "john@example.com",
  role: "member"
}
```

**Task Object Structure**:
```javascript
{
  id: "task123",
  assignedTo: "uid123",  // Firestore UID
  status: "Done",        // "To Do" | "In Progress" | "Done"
  title: "Task title",
  // ... other fields
}
```

## Data Models

### Member Model
```typescript
interface Member {
  id: string;          // Firestore UID (required for filtering)
  name: string;        // Display name
  email: string;
  role: "leader" | "member";
}
```

### Task Model
```typescript
interface Task {
  id: string;
  assignedTo: string;  // Firestore UID (matches Member.id)
  status: "To Do" | "In Progress" | "Done";
  title: string;
  description?: string;
  priority?: string;
  dueDate?: Date;
}
```

### MemberStats Model
```typescript
interface MemberStats {
  assigned: number;    // Count of tasks where assignedTo === memberId
  completed: number;   // Count of tasks where assignedTo === memberId && status === "Done"
  efficiency: number;  // (completed / assigned) * 100, or 0 if assigned === 0
}
```

## Data Flow

### Current Flow (Broken)
```
1. TasksContext fetches tasks from Firestore
   → tasks = [{ assignedTo: "uid123", ... }]

2. Component receives member object
   → member = { id: "uid123", name: "John Doe" }

3. getMemberStats called with member.name
   → getMemberStats("John Doe")

4. Filter tasks by name
   → tasks.filter(t => t.assignedTo === "John Doe")
   → Result: [] (no match, assignedTo is "uid123")

5. Display counts
   → 0 ASSIGNED | 0 DONE ❌
```

### Fixed Flow
```
1. TasksContext fetches tasks from Firestore
   → tasks = [{ assignedTo: "uid123", ... }]

2. Component receives member object
   → member = { id: "uid123", name: "John Doe" }

3. getMemberStats called with member.id
   → getMemberStats("uid123")

4. Filter tasks by UID
   → tasks.filter(t => t.assignedTo === "uid123")
   → Result: [{ assignedTo: "uid123", ... }] ✓

5. Display counts
   → 3 ASSIGNED | 2 DONE ✓
```

### Real-Time Update Flow
```
1. Task assigned in Firestore
   → assignedTo: "uid123"

2. TasksContext listener triggers
   → onTasksByTeam() receives update

3. React re-renders with new tasks array

4. getMemberStats recalculates
   → Filters by member.id ("uid123")

5. UI updates within 2 seconds
   → New count displayed ✓
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified the following testable properties:
- **1.1, 3.3, 6.2**: All test UID-based filtering - these are the same property
- **1.2**: Tests assigned count calculation
- **1.3**: Tests completed count calculation  
- **1.4**: Tests efficiency formula
- **5.2**: Tests exclusion of tasks without assignedTo

**Redundancy Analysis**:
- Properties 1.1, 3.3, and 6.2 are identical - they all verify UID-based filtering works correctly
- Property 1.2 (assigned count) and 1.3 (completed count) can be combined into a single comprehensive property that validates both counts simultaneously
- Property 1.4 (efficiency calculation) is a derived property that depends on 1.2 and 1.3, but tests a distinct calculation, so it should remain separate

**Final Property Set** (after eliminating redundancy):
1. UID-based filtering correctness (combines 1.1, 3.3, 6.2)
2. Count calculation correctness (combines 1.2, 1.3)
3. Efficiency calculation correctness (1.4)
4. Task exclusion for missing assignedTo (5.2)

### Properties

**Property 1: UID-based filtering correctness**

*For any* member with a UID and any collection of tasks, filtering tasks where `assignedTo` equals the member's UID should return exactly those tasks assigned to that member and no others.

**Validates: Requirements 1.1, 3.3, 6.2**

**Property 2: Count calculation correctness**

*For any* member and any collection of tasks, the assigned count should equal the number of tasks where `assignedTo` matches the member's UID, and the completed count should equal the number of tasks where `assignedTo` matches the member's UID AND status is "Done".

**Validates: Requirements 1.2, 1.3**

**Property 3: Efficiency calculation correctness**

*For any* member with at least one assigned task, the efficiency percentage should equal `Math.round((completed / assigned) * 100)`, where completed and assigned are the counts calculated by Property 2.

**Validates: Requirements 1.4**

**Property 4: Task exclusion for missing assignedTo**

*For any* member and any task where the `assignedTo` field is undefined or null, that task should not be included in the member's assigned or completed counts.

**Validates: Requirements 5.2**

### Edge Cases

The following edge cases will be handled by the property test generators to ensure comprehensive coverage:

1. **Zero assigned tasks** (Requirement 1.5): When a member has 0 assigned tasks, efficiency should be 0% without division-by-zero errors
2. **Missing member.id** (Requirement 5.1): When member.id is undefined, the function should return `{ assigned: 0, completed: 0, efficiency: 0 }` gracefully
3. **Empty tasks array** (Requirement 5.3): When the tasks array is empty, all members should show 0 counts without errors

## Error Handling

### Input Validation

**Member Object Validation**:
```javascript
const getMemberStats = (memberId) => {
  // Handle missing or invalid memberId
  if (!memberId) {
    return { assigned: 0, completed: 0, efficiency: 0 };
  }
  
  // Continue with normal logic
  const assigned = tasks.filter(t => t.assignedTo === memberId).length;
  const completed = tasks.filter(t => t.assignedTo === memberId && t.status === 'Done').length;
  const efficiency = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
  return { assigned, completed, efficiency };
};
```

**Task Array Validation**:
- If `tasks` is undefined or null, treat as empty array
- If individual task lacks `assignedTo`, it will naturally be excluded by the filter

**Division by Zero**:
- Already handled: `assigned > 0 ? Math.round((completed / assigned) * 100) : 0`
- When assigned is 0, efficiency defaults to 0%

### Error Scenarios

| Scenario | Current Behavior | Expected Behavior | Handling |
|----------|------------------|-------------------|----------|
| member.id is undefined | Filters by undefined, returns 0 | Return { 0, 0, 0 } | Add guard clause |
| tasks array is empty | Returns 0 counts | Return { 0, 0, 0 } | Already handled ✓ |
| task.assignedTo is undefined | Excluded by filter | Excluded from counts | Already handled ✓ |
| assigned === 0 | Division by zero risk | Return 0% efficiency | Already handled ✓ |
| Invalid status value | Not counted as "Done" | Not counted as completed | Already handled ✓ |

## Testing Strategy

### Dual Testing Approach

This fix requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Test with specific member UIDs and task assignments
- Test edge cases: empty arrays, missing fields, zero counts
- Test error handling: undefined memberId, null tasks array
- Test integration points: TasksContext updates trigger recalculation

**Property Tests**: Verify universal properties across all inputs
- Generate random members with UIDs
- Generate random task collections with various assignedTo values
- Verify filtering, counting, and efficiency calculations hold for all inputs
- Run minimum 100 iterations per property test

### Property-Based Testing Configuration

**Library**: fast-check (JavaScript/React property-based testing library)

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: task-counts-realtime-fix, Property {N}: {property text}`

**Property Test Implementation**:

Each correctness property will be implemented as a single property-based test:

1. **Property 1 Test**: Generate random members and tasks, verify UID filtering returns correct subset
2. **Property 2 Test**: Generate random members and tasks, verify assigned and completed counts are accurate
3. **Property 3 Test**: Generate random members with assigned tasks, verify efficiency formula
4. **Property 4 Test**: Generate tasks with and without assignedTo, verify exclusion logic

### Test Coverage

**Unit Test Coverage**:
- `getMemberStats` function with various inputs
- Edge cases: empty arrays, missing fields, zero values
- Error handling: undefined memberId, null tasks
- Specific examples from verification matrix (TC1-TC8)

**Property Test Coverage**:
- All four correctness properties
- Edge case generators for zero tasks, missing fields
- Random data generation for comprehensive input coverage

**Integration Test Coverage** (manual verification):
- Real-time updates when tasks are assigned (TC3)
- Persistence across page refresh (TC4)
- Cross-page consistency (TC8)
- Performance with 50+ members (Requirement 4.1)

### Testing Tools

- **Jest**: Unit test framework
- **React Testing Library**: Component testing
- **fast-check**: Property-based testing library
- **Manual Testing**: Real-time updates, cross-page consistency, performance

### Test Execution

```bash
# Run all tests
npm test

# Run property tests specifically
npm test -- --testNamePattern="Property"

# Run with coverage
npm test -- --coverage
```

## Implementation Notes

### Minimal Change Strategy

This fix intentionally makes the smallest possible change to resolve the bug:
1. Change parameter name from `memberName` to `memberId` for clarity
2. Change filter comparison from `member.name` to `member.id`
3. Update function call from `getMemberStats(member.name)` to `getMemberStats(member.id)`

**Lines to Change**:
- Line 60: Function signature and filter logic
- Line ~80-100: Function call site (exact line depends on component structure)

### Cross-Page Application

After fixing `LeaderTeamManagement.jsx`, audit these files for similar patterns:
- `client/src/pages/LeaderDashboard.jsx` - May display team member stats
- `client/src/pages/MemberDashboard.jsx` - May display own task counts
- `client/src/components/TaskBoard.jsx` - May display per-member counts

**Search Pattern**: Look for `tasks.filter(t => t.assignedTo === member.name)` or similar name-based filtering.

### Performance Considerations

**Current Performance**: O(n × m) where n = number of members, m = number of tasks
- For each member, filter entire tasks array
- With 50 members and 500 tasks: 25,000 comparisons

**Optimization Opportunity** (future enhancement, not part of this fix):
- Pre-compute a Map<memberId, Task[]> once when tasks update
- Lookup becomes O(1) per member
- Total: O(m) for map creation + O(n) for lookups = O(m + n)

**Current Fix**: Maintain existing O(n × m) approach for minimal change. Performance is acceptable for typical team sizes (< 50 members, < 1000 tasks).

### Deployment Considerations

**Risk Assessment**: Low risk
- Single function change
- No database schema changes
- No API changes
- Backward compatible (member.id already exists)

**Rollback Plan**: Revert single commit if issues arise

**Testing Checklist**:
- [ ] Unit tests pass
- [ ] Property tests pass (100+ iterations each)
- [ ] Manual verification of TC1-TC8
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Performance test with 50 members, 500 tasks

**Monitoring**:
- Watch for console errors related to undefined member.id
- Monitor page load times for Team Management page
- Verify real-time updates still work within 2 seconds
