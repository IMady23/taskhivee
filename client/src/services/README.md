# Firestore Service — usage examples

This file contains quick usage snippets for the shared Firestore helpers in `src/services/firestoreService.js`.

## Import

```js
import firestoreService from '../services/firestoreService';
// or named imports:
// import { createTask, onTasksByTeam, createOrUpdateUser, onUser } from '../services/firestoreService';
```

## Tasks

Create a task:
```js
const task = await firestoreService.createTask({ title: 'Update docs', teamId: 'team1', assignedTo: 'alice' });
console.log('created', task.id);
```

Subscribe to tasks for a team:
```js
const unsub = firestoreService.onTasksByTeam('team1', (tasks) => {
  console.log('tasks', tasks);
});
// call unsub() when no longer needed
```

## Users

Create or update user record after authentication:
```js
await firestoreService.createOrUpdateUser(uid, { displayName: 'Alice', teamId: 'team1' });
```

Listen to realtime user updates:
```js
const unsubUser = firestoreService.onUser(uid, (user) => {
  console.log('user', user);
});
// unsubUser() to stop listening
```

## Teams & Activity

Add a team member:
```js
await firestoreService.addTeamMember('team1', { name: 'Bob', role: 'member' });
```

Add activity entry:
```js
await firestoreService.addActivity('team1', 'Created new sprint');
```

---

Notes:
- Functions generally return plain objects with an `id` field for convenience.
- Use the `on*` helpers (e.g., `onTasksByTeam`, `onUser`) for realtime listeners and call the returned function to unsubscribe.
- These helpers are intentionally minimal and are safe to call from UI components or services.
