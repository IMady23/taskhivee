# Task Completion and Notification Fixes

## Summary of Changes

I've implemented fixes for the issues you mentioned. Here's what was done:

### 1. ✅ File Upload System - Migrated to Firebase Storage

**Problem**: Leader couldn't see submitted work because localStorage doesn't sync across browser sessions.

**Solution**: 
- Created `client/src/services/firebaseStorage.js` with Firebase Storage integration
- Updated `client/src/pages/member/MemberTasks.jsx` to upload files to Firebase Storage
- Updated `client/src/components/tasks/TaskList.jsx` to view submissions from Firebase Storage URLs

**Files Modified**:
- `client/src/services/firebaseStorage.js` (NEW)
- `client/src/pages/member/MemberTasks.jsx`
- `client/src/components/tasks/TaskList.jsx`

### 2. ⚠️ Enhanced Notification System for Members

**Problem**: Members not receiving popup notifications when leaders approve/reject their work.

**Solution**: Enhanced the notification logic in TasksContext to send specific notifications for:
- Task approval (with success notification type)
- Task rejection (with attention notification type)
- Better notification titles and messages

**File to Modify**: `client/src/context/TasksContext.jsx`

**Required Change** (lines 162-180):
Replace the existing notification code with enhanced version that checks for `reviewDecision` field.

### 3. ✅ Task Completion Flow

**Current Flow** (Already Correct):
1. Member clicks "Request for Review" button
2. Modal opens asking for file upload
3. Member uploads work file
4. Task status changes to "Review"
5. Leader sees "View Submission", "Approve", and "Reject" buttons
6. Leader approves → Task marked as "Done"
7. Leader rejects → Task returns to "In Progress"

This flow is already implemented correctly in the codebase.

## Manual Fix Required

Due to whitespace matching issues, please manually update `client/src/context/TasksContext.jsx`:

**Find this code** (around line 163-180):

```javascript
          // Status update - notify current assignee
          const assigneeId = prev.assignedToUserId || prev.assignedTo;
          if (assigneeId && assigneeId !== 'Unassigned' && assigneeId !== user.uid) {
            let msg = '';
            if (safeUpdates.status && safeUpdates.status !== prev.status) {
              msg = `Task "${prev.title}" status updated to ${safeUpdates.status}`;
            }

            if (msg) {
              await sendNotification(
                assigneeId,
                teamId,
                'task_attention', // Yellow
                'Task Status Updated',
                `Task '${prev.title}' moved to ${safeUpdates.status}`
              );
            }
          }
```

**Replace with**:

```javascript
          // Status update - notify current assignee
          const assigneeId = prev.assignedToUserId || prev.assignedTo;
          if (assigneeId && assigneeId !== 'Unassigned' && assigneeId !== user.uid) {
            let title = '';
            let msg = '';
            let notifType = 'task_attention';
            
            if (safeUpdates.status && safeUpdates.status !== prev.status) {
              // Special handling for approval/rejection
              if (safeUpdates.reviewDecision === 'approved' && safeUpdates.status === 'Done') {
                title = '✅ Task Approved!';
                msg = `Your work on "${prev.title}" has been approved and marked as complete.`;
                notifType = 'task_success';
              } else if (safeUpdates.reviewDecision === 'rejected') {
                title = '⚠️ Task Needs Revision';
                msg = `Your submission for "${prev.title}" needs revision. Please review the feedback and resubmit.`;
                notifType = 'task_attention';
              } else {
                title = 'Task Status Updated';
                msg = `Task "${prev.title}" status updated to ${safeUpdates.status}`;
              }
            }

            if (msg) {
              await sendNotification(
                assigneeId,
                teamId,
                notifType,
                title,
                msg
              );
            }
          }
```

## Testing Instructions

1. **Test File Upload**:
   - Login as a member
   - Go to "My Tasks"
   - Click "Request for Review" on a task
   - Upload a file (PDF, image, or document)
   - Submit for review
   - Login as leader
   - Click "View Submission" - file should open in new tab

2. **Test Notifications**:
   - As leader, approve or reject a task
   - As member, you should see a popup notification
   - Check notification center for the notification

3. **Test Complete Flow**:
   - Member submits work → Leader gets notification
   - Leader approves → Member gets "Task Approved!" notification
   - Leader rejects → Member gets "Task Needs Revision" notification

## Notes

- Firebase Storage is already configured in your project
- The NotificationProvider is already set up correctly in App.jsx
- All other functionality remains unchanged as requested
