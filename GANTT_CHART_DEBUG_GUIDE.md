# Gantt Chart / Bar Chart Task Assignment Debug Guide

## Issue
All team members showing 9 tasks in the bar chart, even though tasks were assigned to specific members (Karthikeya: 5, Manaswini: 4).

## Root Cause Analysis

The issue is likely one of the following:

### 1. Tasks Have Wrong `assignedTo` Value
The `assignedTo` field in Firestore might contain:
- Member NAME instead of member ID/UID
- Team ID instead of member ID
- Empty/null value
- Inconsistent format

### 2. Member IDs Don't Match
The member IDs in the `teamMembers` array might not match the `assignedTo` values in tasks.

## Debug Steps

### Step 1: Check Browser Console
1. Open Leader Dashboard
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for messages starting with "📊"
5. You should see:
   ```
   📊 Chart - Member: Karthikeya ID: <some-id>
   📊 Chart - Tasks for Karthikeya : 9
   📊 Chart - Member: Manaswini ID: <some-id>
   📊 Chart - Tasks for Manaswini : 9
   ...
   📊 Total tasks in context: 9
   📊 Sample task: {assignedTo: "...", title: "...", ...}
   ```

### Step 2: Compare IDs
Compare the member IDs shown in the console with the `assignedTo` value in the sample task.

**If they DON'T match**, that's the problem!

### Step 3: Check Firestore Data
1. Go to Firebase Console
2. Open Firestore Database
3. Navigate to `tasks` collection
4. Click on a few tasks
5. Check the `assignedTo` field value

**Expected:** Should be a UID like `abc123xyz456`
**Problem:** Might be a name like `"Karthikeya"` or team ID

## Solutions

### Solution 1: If `assignedTo` Contains Names (Not IDs)
The tasks were created with member names instead of IDs. We need to update the task creation logic.

**File to check:** `client/src/services/taskService.js`

Look for where tasks are created and ensure `assignedTo` is set to the member's UID/ID, not their name.

### Solution 2: If Member IDs Are Inconsistent
Some members might have `id` field while others have `uid` field.

**Current filtering logic (already handles this):**
```javascript
const memberTasksForChart = tasks.filter(t => 
  t.assignedTo === m.id || 
  t.assignedToUserId === m.id ||
  t.assignedTo === m.uid ||
  t.assignedToUserId === m.uid
);
```

### Solution 3: Update Existing Tasks in Firestore
If tasks already exist with wrong `assignedTo` values, we need to update them.

**Option A: Manual Update in Firebase Console**
1. Go to each task in Firestore
2. Update `assignedTo` field to the correct member UID

**Option B: Create a Migration Script**
Create a script to bulk update all tasks with correct member IDs.

## Quick Test

To verify the fix is working:

1. **Create a NEW task** and assign it to Karthikeya
2. Check the bar chart - Karthikeya should now show 10 tasks (or 6 if old tasks are wrong)
3. If the new task shows correctly but old tasks don't, the issue is with existing data in Firestore

## Expected Behavior

After fix:
- Karthikeya: 5 tasks (blue bar)
- Manaswini: 4 tasks (blue bar)
- Other members: 0 tasks (no bar or very small bar)
- Leader (you): 0 tasks (unless you assigned tasks to yourself)

## Next Steps

Please check the browser console and share:
1. What the member IDs look like (e.g., `abc123xyz`)
2. What the `assignedTo` value looks like in the sample task
3. Whether they match or not

This will help me provide the exact fix needed!
