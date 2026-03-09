# Task Completion & Notification Fixes - Implementation Guide

## Overview
This guide provides step-by-step instructions to fix the task completion workflow and notification system issues.

## Issues Fixed

### ✅ 1. File Upload System (Completed)
**Problem**: Leader couldn't view submitted work because localStorage doesn't sync across sessions.

**Solution**: Migrated to Firebase Storage for persistent file storage.

**Files Created/Modified**:
- ✅ `client/src/services/firebaseStorage.js` - NEW file for Firebase Storage operations
- ✅ `client/src/pages/member/MemberTasks.jsx` - Updated to use Firebase Storage
- ✅ `client/src/components/tasks/TaskList.jsx` - Updated to view files from Firebase Storage

### ⚠️ 2. Member Notifications (Requires Manual Fix)
**Problem**: Members not receiving popup notifications when leaders approve/reject their work.

**Solution**: Enhanced notification logic to send specific messages for approvals and rejections.

**File to Fix**: `client/src/context/TasksContext.jsx`

## Manual Fix Required

### Step 1: Open TasksContext.jsx
Open the file: `client/src/context/TasksContext.jsx`

### Step 2: Find the Code to Replace
Search for this code (around line 163-180):

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

### Step 3: Replace with Enhanced Code
Replace the above code with this enhanced version:

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

### Step 4: Save the File
Save `client/src/context/TasksContext.jsx`

## Testing Instructions

### Test 1: File Upload & View Submission
1. **As Member**:
   - Login as a member
   - Navigate to "My Tasks"
   - Find a task in "In Progress" or "To Do" status
   - Click "Request for Review" button
   - Upload a file (PDF, image, document, etc.)
   - Click "Submit for Review"
   - Verify: Task status changes to "Awaiting Review"

2. **As Leader**:
   - Login as leader
   - Navigate to "Task Management"
   - Find the task with "Review" status
   - Click "View Submission" button
   - Verify: File opens in a new browser tab
   - Click "Approve" or "Reject"

### Test 2: Approval Notifications
1. **As Leader**:
   - Find a task in "Review" status
   - Click "Approve" button
   - Verify: Task status changes to "Done"

2. **As Member**:
   - Check for popup notification (toast)
   - Verify: Notification says "✅ Task Approved!"
   - Verify: Message says "Your work on [task name] has been approved and marked as complete."
   - Check notification center (bell icon)
   - Verify: Notification appears in the list

### Test 3: Rejection Notifications
1. **As Leader**:
   - Find a task in "Review" status
   - Click "Reject" button
   - Verify: Task status changes to "In Progress"

2. **As Member**:
   - Check for popup notification (toast)
   - Verify: Notification says "⚠️ Task Needs Revision"
   - Verify: Message says "Your submission for [task name] needs revision..."
   - Check notification center
   - Verify: Notification appears in the list

### Test 4: Complete Workflow
1. Member creates/receives a task
2. Member works on the task
3. Member clicks "Request for Review"
4. Member uploads work file
5. Member submits for review
6. Leader receives notification "Task Needs Review"
7. Leader clicks "View Submission"
8. Leader reviews the file
9. Leader approves or rejects
10. Member receives appropriate notification

## Troubleshooting

### Issue: "View Submission" shows "No submitted work found"
**Cause**: File wasn't uploaded properly or task doesn't have submissionFile data.

**Solution**:
1. Check browser console for upload errors
2. Verify Firebase Storage is configured correctly in `.env`
3. Check Firebase Storage rules allow read/write access
4. Resubmit the task with a file

### Issue: Member not receiving notifications
**Cause**: NotificationContext not properly initialized or notification service error.

**Solution**:
1. Verify you applied the manual fix to TasksContext.jsx
2. Check browser console for errors
3. Verify NotificationProvider is wrapping the app in App.jsx
4. Check Firebase Firestore rules allow notification creation
5. Try logging out and logging back in

### Issue: File upload fails
**Cause**: Firebase Storage not configured or file too large.

**Solution**:
1. Check `.env` file has `VITE_FIREBASE_STORAGE_BUCKET` set
2. Verify Firebase Storage is enabled in Firebase Console
3. Check file size (limit is typically 5-10MB for free tier)
4. Check Firebase Storage rules

## Firebase Storage Rules

Make sure your Firebase Storage rules allow authenticated users to upload and read files:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /task-submissions/{taskId}/{fileName} {
      // Allow authenticated users to upload
      allow write: if request.auth != null;
      // Allow authenticated users to read
      allow read: if request.auth != null;
    }
  }
}
```

## Summary of Changes

### Files Modified:
1. ✅ `client/src/services/firebaseStorage.js` (NEW)
   - Added `uploadTaskSubmission()` function
   - Added `deleteTaskSubmission()` function

2. ✅ `client/src/pages/member/MemberTasks.jsx`
   - Changed import from `taskAttachmentStorage` to `firebaseStorage`
   - Updated `handleSubmitWork()` to use Firebase Storage
   - Now stores file URL and metadata in task document

3. ✅ `client/src/components/tasks/TaskList.jsx`
   - Updated "View Submission" button to open file from URL
   - Simplified logic (no more localStorage lookup)
   - Added `completedAt` timestamp when approving

4. ⚠️ `client/src/context/TasksContext.jsx` (MANUAL FIX REQUIRED)
   - Enhanced notification logic for approvals/rejections
   - Added specific notification titles and messages
   - Added notification type differentiation

### Features Working:
- ✅ Member can upload files when requesting review
- ✅ Files stored in Firebase Storage (persistent across sessions)
- ✅ Leader can view submitted files
- ✅ Leader can approve/reject submissions
- ✅ Task status updates correctly
- ⚠️ Notifications work (after manual fix applied)

## Next Steps

1. Apply the manual fix to `TasksContext.jsx`
2. Test the complete workflow
3. Verify notifications appear for members
4. Check Firebase Storage console to see uploaded files
5. Test with different file types (PDF, images, documents)

## Support

If you encounter any issues:
1. Check browser console for errors
2. Verify all environment variables are set
3. Check Firebase Console for any service issues
4. Ensure Firebase Storage rules are configured correctly
5. Try clearing browser cache and reloading
