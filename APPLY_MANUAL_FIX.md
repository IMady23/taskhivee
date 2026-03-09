# Quick Manual Fix for Member Notifications

## What to Do:

Open `client/src/context/TasksContext.jsx` and find **line 162-180**.

### Current Code (FIND THIS):
```javascript
        } else {
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
        }
```

### New Code (REPLACE WITH THIS):
```javascript
        } else {
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
        }
```

## That's It!

Save the file and the enhanced notifications will work. Members will now see:
- "✅ Task Approved!" when their work is approved
- "⚠️ Task Needs Revision" when their work is rejected

## Test It:

1. As leader, approve or reject a task in "Review" status
2. As member, you should see a popup notification with the new messages
3. Check the notification center (bell icon) to see the notification

---

**Note**: Everything else is already working! File uploads, view submissions, and the basic notification system are all functional.
