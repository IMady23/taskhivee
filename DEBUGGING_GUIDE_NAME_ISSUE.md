# 🔍 Debugging Guide - Name Sync Issue

## Current Situation (From Screenshots)

### Leader Dashboard (Left)
- Shows: "Welcome (MODIFIED), madhav"
- Team member shows: "Nandu" (invited)
- Status: Invited (not yet joined)

### Member Dashboard (Right)
- Shows: "GOOD EVENING, NIKHIL"
- Should show: "GOOD EVENING, NANDU"
- Team shows: "nikhil (You)" as member

## 🎯 Root Cause Analysis

The member dashboard is showing "NIKHIL" instead of "NANDU" because:

1. ✅ **Firestore likely has "Nandu"** (invitation name)
2. ❌ **Dashboard reads from wrong source** (Auth cache or stale state)
3. ❌ **Real-time sync not working** (AuthContext not updating)

---

## 📋 Step-by-Step Debugging Checklist

### 1️⃣ Check Firestore Database
**Action:** Go to Firebase Console → Firestore Database

**Find the member's user document:**
- Collection: `users`
- Document ID: The member's UID
- Field to check: `name`

**Expected Result:**
- ✅ Should be: "Nandu"
- ❌ If it's "nikhil": Server/client failed to update

**Status:** [ ] Checked - Value: _______

---

### 2️⃣ Check Firebase Authentication
**Action:** Go to Firebase Console → Authentication → Users

**Find the member by email:**
- Look for: `thetestdreamers@gmail.com`
- Column to check: "Display name"

**Expected Result:**
- ✅ Should be: "Nandu"
- ❌ If it's "nikhil": Auth update failed

**Status:** [ ] Checked - Value: _______

---

### 3️⃣ Check Browser Console (Member Side)
**Action:** On member dashboard, press F12 → Console tab

**Look for these logs:**
```
[TeamService] Updating user name from invitation: Nandu
[TeamService] Auth displayName updated to: Nandu
[SyncUtil] Auth displayName synced with Firestore
```

**Expected Result:**
- ✅ All three logs present: Code executed successfully
- ❌ Missing logs: Code not reached or failed

**Status:** [ ] Checked - Logs found: _______

---

### 4️⃣ Check Server Logs (Backend)
**Action:** Look at server terminal when member registered/logged in

**Look for these logs:**
```
DEBUG: Using name from invitation: "Nandu"
[Server] Auth displayName updated to: Nandu
[Server] Notification created for leader ...
```

**Expected Result:**
- ✅ All logs present: Server updated successfully
- ❌ Missing logs: Server fix not applied or failed

**Status:** [ ] Checked - Logs found: _______

---

### 5️⃣ Check Dashboard Component Source
**Action:** Inspect MemberDashboard.jsx code

**Find where name is displayed:**
```jsx
// BAD ❌ - Reads from Auth cache
<h1>GOOD EVENING, {auth.currentUser?.displayName}</h1>

// GOOD ✅ - Reads from Firestore via Context
<h1>GOOD EVENING, {user?.name}</h1>
```

**Expected Result:**
- ✅ Uses `user.name` from AuthContext
- ❌ Uses `auth.currentUser.displayName`: THIS IS THE PROBLEM

**Status:** [ ] Checked - Uses: _______

---

### 6️⃣ Check AuthContext Real-Time Sync
**Action:** Verify AuthContext has Firestore listener

**In AuthContext.jsx, look for:**
```javascript
useEffect(() => {
  if (state.user?.uid) {
    const userDocRef = doc(db, 'users', state.user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      // Updates user state in real-time
    });
    return unsubscribe;
  }
}, [state.user?.uid]);
```

**Expected Result:**
- ✅ Has `onSnapshot` listener: Real-time updates enabled
- ❌ Only uses `getDoc`: One-time fetch, no updates

**Status:** [ ] Checked - Has real-time: _______

---

## 🚨 Most Likely Issues (Priority Order)

### Issue #1: Dashboard Uses Auth Instead of Firestore ⚠️ HIGH PRIORITY
**Problem:** MemberDashboard.jsx reads from `auth.currentUser.displayName`

**Solution:** Change to read from AuthContext
```jsx
// Find this in MemberDashboard.jsx
const { user } = useContext(AuthContext);

// Change display from:
{auth.currentUser?.displayName}

// To:
{user?.name}
```

---

### Issue #2: AuthContext Not Providing Updated User
**Problem:** AuthContext state not updating after name change

**Solution:** Ensure AuthContext has real-time listener (already implemented)

---

### Issue #3: Page Needs Refresh After Join
**Problem:** Name updates in database but UI doesn't reflect

**Solution:** Force page reload after team join (already implemented in MemberTeamJoin.jsx)

---

## 🛠️ Quick Manual Test

### Test in Browser Console (Member Side)
**After logging in, run this in browser console:**

```javascript
// Check what Auth has
console.log('Auth displayName:', auth.currentUser?.displayName);

// Check what Firestore has
import { doc, getDoc } from 'firebase/firestore';
import { db } from './config/firebase';

const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
console.log('Firestore name:', userDoc.data().name);

// Manually sync
import { updateProfile } from 'firebase/auth';
await updateProfile(auth.currentUser, { 
  displayName: userDoc.data().name 
});
console.log('Synced! Refresh page.');
```

**Then refresh the page and check if name updates.**

---

## 📊 Diagnosis Matrix

| Checkpoint | Expected | If Wrong | Action |
|------------|----------|----------|--------|
| Firestore `name` | "Nandu" | "nikhil" | Server/client update failed |
| Auth `displayName` | "Nandu" | "nikhil" | Auth sync failed |
| Browser logs | All 3 present | Missing | Client code not executed |
| Server logs | All 3 present | Missing | Server code not executed |
| Dashboard code | Uses `user.name` | Uses `auth.currentUser` | **FIX THIS FIRST** |
| AuthContext | Has `onSnapshot` | Only `getDoc` | Add real-time listener |

---

## 🎯 Action Plan

### Step 1: Verify Data Sources (5 min)
1. Check Firestore → Is name "Nandu"?
2. Check Auth → Is displayName "Nandu"?
3. This tells us if the backend fixes worked

### Step 2: Check Dashboard Code (2 min)
1. Open `client/src/pages/MemberDashboard.jsx`
2. Find where "GOOD EVENING" is displayed
3. Check if it uses `user.name` or `auth.currentUser.displayName`

### Step 3: Fix Dashboard (1 min)
1. If using `auth.currentUser.displayName`, change to `user.name`
2. Save and refresh browser

### Step 4: Test (5 min)
1. Log out and log in again
2. Check if name shows correctly
3. If still wrong, check console logs

---

## 🔧 Most Common Fix

**90% of the time, the issue is here:**

**File:** `client/src/pages/MemberDashboard.jsx`

**Find:**
```jsx
<h1>GOOD EVENING, {auth.currentUser?.displayName?.toUpperCase()}</h1>
```

**Change to:**
```jsx
<h1>GOOD EVENING, {user?.name?.toUpperCase()}</h1>
```

**Make sure you have:**
```jsx
const { user } = useContext(AuthContext);
```

---

## 📝 Next Steps

1. **Check Firestore and Auth first** - This confirms backend works
2. **Check dashboard code** - This is likely the issue
3. **Check console logs** - This confirms code execution
4. **Apply fix** - Change dashboard to use `user.name`
5. **Test** - Log out, log in, verify name

---

## ✅ Success Criteria

After fixing, you should see:
- ✅ Firestore has "Nandu"
- ✅ Auth has "Nandu"
- ✅ Dashboard shows "GOOD EVENING, NANDU"
- ✅ Leader sees "Nandu" in team members
- ✅ Notification says "Nandu joined"

---

## 🆘 If Still Not Working

If after all checks it still doesn't work:

1. **Clear browser cache and localStorage**
2. **Log out completely**
3. **Close all browser tabs**
4. **Open fresh tab and log in**
5. **Check console for errors**

If problem persists, provide:
- Firestore `name` value
- Auth `displayName` value
- Browser console logs
- Server console logs
- Dashboard code snippet

---

**Let's start with Step 1: Check Firestore and Auth values!**
