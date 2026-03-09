# User Name Sync Fix - Implementation Plan

## 🎯 Problem Summary

**Root Cause:** User display name stored in TWO places that become out of sync:
1. ✅ Firestore `users/{uid}.name` - Updates correctly
2. ❌ Firebase Auth `currentUser.displayName` - NEVER updates after initial registration

**Impact:**
- Dashboard shows old name (reads from Auth cache)
- Leader notifications fail or show wrong name
- Re-invited users keep old identity

---

## 📋 Implementation Plan

### Phase 1: Server-Side Fixes (Backend)
**File:** `server/controllers/authController.js`

#### Fix 1.1: Update Firebase Auth displayName on Re-Registration
**Location:** Inside `registerMember` function, after batch update
**Action:** Add Firebase Admin SDK call to update Auth displayName

```javascript
// After: batch.update(userRef, { name: finalName, ... })
// Add this:
try {
  await auth.updateUser(firebaseUser.uid, { displayName: finalName });
  console.log(`[Server] Auth displayName updated to: ${finalName}`);
} catch (authError) {
  console.error('[Server] Failed to update Auth displayName:', authError);
}
```

**Why:** Ensures Firebase Auth profile matches Firestore when user re-registers

---

#### Fix 1.2: Reliable Leader Notification
**Location:** Inside `registerMember` function, after batch.commit()
**Action:** Replace unreliable notification import with direct Firestore write

```javascript
// Replace the current notification block with:
try {
  const leaderId = teamData.leaderId;
  if (leaderId) {
    await db.collection('notifications').add({
      userId: leaderId,
      teamId: teamId,
      type: 'MEMBER_JOINED',
      title: 'Member Joined',
      message: `${finalName} has joined the team.`,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
      metadata: { memberId: firebaseUser.uid }
    });
    console.log(`[Server] Notification created for leader ${leaderId}`);
  }
} catch (notifError) {
  console.error('[Server] Failed to create notification:', notifError);
}
```

**Why:** Direct Firestore write is more reliable than importing notificationController

---

### Phase 2: Client-Side Fixes (Frontend)
**File:** `client/src/services/teamService.js`

#### Fix 2.1: Sync Auth displayName When Joining Team
**Location:** Inside `addMemberToTeam` function, after name update decision
**Action:** Add Firebase Auth updateProfile call

```javascript
// At top of file, add import:
import { auth } from '../config/firebase';
import { updateProfile } from 'firebase/auth';

// Inside addMemberToTeam, after:
// if (invitation && invitation.name) { userUpdates.name = invitation.name; }
// Add this:
if (invitation && invitation.name) {
  userUpdates.name = invitation.name;
  console.log(`[TeamService] Updating user name from invitation: ${invitation.name}`);
  
  // 🚀 NEW: Sync Firebase Auth displayName
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      await updateProfile(currentUser, { displayName: invitation.name });
      console.log(`[TeamService] Auth displayName updated to: ${invitation.name}`);
    } catch (authError) {
      console.warn('Failed to update Auth profile:', authError);
    }
  }
}
```

**Why:** Ensures Auth profile updates when member joins via client

---

### Phase 3: Dashboard Fix (Frontend)
**File:** `client/src/context/AuthContext.jsx`

#### Fix 3.1: Dashboard Must Read from Firestore, Not Auth Cache
**Location:** Already implemented via `onSnapshot` listener
**Action:** VERIFY that dashboard components use `user.name` from context, NOT `auth.currentUser.displayName`

**Check these files:**
- `client/src/pages/LeaderDashboard.jsx`
- `client/src/pages/MemberDashboard.jsx`
- Any component showing user name

**Ensure they use:**
```javascript
const { user } = useContext(AuthContext);
// Use: user.name ✅
// NOT: auth.currentUser.displayName ❌
```

**Why:** AuthContext already has real-time Firestore sync, just need to use it

---

### Phase 4: Auth Sync Utility (Optional but Recommended)
**File:** `client/src/utils/syncUserProfile.js` (NEW FILE)

#### Fix 4.1: Create Sync Utility
**Action:** Create helper function to sync Auth with Firestore

```javascript
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

export const syncUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const firestoreName = userDoc.data().name;
      if (auth.currentUser && auth.currentUser.displayName !== firestoreName) {
        await updateProfile(auth.currentUser, { displayName: firestoreName });
        console.log('[SyncUtil] Auth displayName synced with Firestore');
      }
    }
  } catch (error) {
    console.error('[SyncUtil] Failed to sync profile:', error);
  }
};
```

#### Fix 4.2: Call Sync Utility After Login
**File:** `client/src/context/AuthContext.jsx`
**Location:** Inside `login` function, after successful login
**Action:** Add sync call

```javascript
// After: dispatch({ type: 'AUTH_SUCCESS', ... });
// Add:
import { syncUserProfile } from '../utils/syncUserProfile';
await syncUserProfile(firebaseUser.uid);
```

**Why:** Ensures Auth is always in sync with Firestore after login

---

## 🧪 Testing Checklist

### Test Scenario 1: Fresh Invite
- [ ] Leader invites `test@example.com` as "Alice"
- [ ] Email says "Hello Alice"
- [ ] Member registers
- [ ] Dashboard shows "Hello Alice"
- [ ] Leader gets notification "Alice joined"

### Test Scenario 2: Re-Invite After Team Delete
- [ ] Leader deletes team
- [ ] Leader creates new team
- [ ] Leader invites same email as "Bob"
- [ ] Email says "Hello Bob"
- [ ] Member logs in
- [ ] Dashboard shows "Hello Bob" (NOT old name)
- [ ] Leader gets notification "Bob joined"

### Test Scenario 3: Persistence
- [ ] Refresh page → Still shows "Bob"
- [ ] Log out and log in → Still shows "Bob"
- [ ] Check Firestore `users/{uid}.name` → "Bob"
- [ ] Check Firebase Auth `displayName` → "Bob"

### Test Scenario 4: Leader Dashboard
- [ ] Leader dashboard shows member as "Bob"
- [ ] Team members list shows "Bob"
- [ ] Notifications show "Bob joined"

---

## 📦 Files to Modify

### Backend (2 files)
1. ✅ `server/controllers/authController.js`
   - Add Auth displayName update
   - Fix leader notification

### Frontend (3 files)
1. ✅ `client/src/services/teamService.js`
   - Add Auth displayName sync on join

2. ✅ `client/src/context/AuthContext.jsx`
   - Add sync utility call after login

3. ✅ `client/src/utils/syncUserProfile.js` (NEW)
   - Create sync utility

### Verification (Check only)
4. ⚠️ `client/src/pages/LeaderDashboard.jsx`
   - Verify uses `user.name` not `auth.currentUser.displayName`

5. ⚠️ `client/src/pages/MemberDashboard.jsx`
   - Verify uses `user.name` not `auth.currentUser.displayName`

---

## 🎯 Success Criteria

✅ **Name Sync:**
- Firestore `users/{uid}.name` matches Firebase Auth `displayName`
- Both update when user is re-invited

✅ **Dashboard Display:**
- Shows correct name immediately after login
- Shows correct name after page refresh
- Shows correct name after re-invite

✅ **Leader Notifications:**
- Leader receives notification when member joins
- Notification shows correct (new) member name
- Leader dashboard shows member with correct name

✅ **Persistence:**
- Name persists across sessions
- Name persists across team deletions/re-invites
- No stale data anywhere

---

## 🚀 Implementation Order

1. **Start with Backend** (Most Critical)
   - Fix `authController.js` first
   - This ensures server always updates both places

2. **Then Client Join Flow**
   - Fix `teamService.js`
   - This handles client-side joins

3. **Add Sync Utility**
   - Create `syncUserProfile.js`
   - Call it after login

4. **Verify Dashboard**
   - Check all components use `user.name`
   - Test thoroughly

5. **Test Everything**
   - Run all test scenarios
   - Verify with real data

---

## ⏱️ Estimated Time

- Backend fixes: 15 minutes
- Client fixes: 15 minutes
- Sync utility: 10 minutes
- Testing: 30 minutes
- **Total: ~70 minutes**

---

## 🔍 Debugging Tips

If name still doesn't update:

1. **Check Server Logs:**
   ```
   DEBUG: Using name from invitation: "NewName"
   [Server] Auth displayName updated to: NewName
   ```

2. **Check Client Logs:**
   ```
   [TeamService] Updating user name from invitation: NewName
   [TeamService] Auth displayName updated to: NewName
   ```

3. **Check Firestore:**
   - Open Firebase Console
   - Navigate to `users/{uid}`
   - Verify `name` field is correct

4. **Check Firebase Auth:**
   - Open Firebase Console → Authentication
   - Find user by email
   - Check "Display name" column

5. **Check Browser:**
   - Open DevTools → Application → Local Storage
   - Clear all TaskHive data
   - Log in again

---

## ✅ Ready to Implement?

Review this plan and let me know if you want me to:
1. ✅ Implement all fixes
2. ⚠️ Implement specific fixes only
3. 📝 Explain any part in more detail

Just say "implement" and I'll apply all changes! 🚀
