# 🧪 TEST: Name Update Issue

## Current Problem
- Email shows: "Hello Karthikeya"
- After login shows: "GOOD EVENING, NIKHIL"
- Leader dashboard shows: "Invited" instead of "Joined"

## Step-by-Step Testing

### Step 1: Check Backend Logs
When member registers, look for these logs in server terminal:
```
DEBUG: registerMember body: { name: '...', email: '...', teamCode: '...' }
DEBUG: Checking invitation for: { email: '...', displayName: '...' }
DEBUG: Current invitedMembers: [...]
DEBUG: Using name from invitation: "Karthikeya" (signup name was: "nikhil")
DEBUG: Creating new user ... with name: Karthikeya
```

**What to check:**
- Is `invitation.name` showing the correct name?
- Is `finalName` using the invitation name?

### Step 2: Check Firestore Directly
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Find `users` collection
4. Find the user document (search by email)
5. Check the `name` field

**Expected:** `name: "Karthikeya"`
**If showing:** `name: "nikhil"` → Backend update failed

### Step 3: Check Team Document
1. In Firestore, go to `teams` collection
2. Find your team document
3. Check two arrays:
   - `members`: Should include user ID
   - `invitedMembers`: Should NOT include user email

**Expected:**
```javascript
{
  members: ["leader_uid", "member_uid"],
  invitedMembers: [] // Empty or without this user's email
}
```

### Step 4: Test Fresh Registration
1. **Leader:** Delete team completely
2. **Leader:** Create NEW team
3. **Leader:** Invite with name "TestName123"
4. **Member:** Logout completely (clear cookies)
5. **Member:** Register with:
   - Name: "WrongName"
   - Email: (invited email)
   - Password: anything
   - Team Code: (from invitation)
6. **Check:** Backend logs should show:
   ```
   DEBUG: Using name from invitation: "TestName123" (signup name was: "WrongName")
   ```
7. **Member:** Complete OTP verification
8. **Member:** Login
9. **Check:** Dashboard should show "GOOD EVENING, TESTNAME123"

### Step 5: Check AuthContext
After login, check browser console for:
```
[AuthContext] User profile loaded: { name: "...", email: "...", ... }
```

**Expected:** `name: "TestName123"`
**If showing:** `name: "WrongName"` → AuthContext not loading updated profile

## Common Issues & Fixes

### Issue 1: Backend Not Using Invitation Name
**Symptom:** Backend logs show `finalName` is wrong
**Fix:** Check `invitation.name` exists in team document

### Issue 2: Firestore Not Updated
**Symptom:** Firestore still shows old name
**Fix:** Backend batch commit might be failing

### Issue 3: AuthContext Not Refreshing
**Symptom:** Firestore has correct name, but UI shows old name
**Fix:** Page reload should fix (we added `window.location.reload()`)

### Issue 4: User Already Exists
**Symptom:** User registered before invitation
**Fix:** Backend should UPDATE existing user (we handle this with `batch.update`)

## Debug Commands

### Check User in Firestore (Firebase CLI)
```bash
# If you have Firebase CLI
firebase firestore:get users/{userId}
```

### Check Team Document
```bash
firebase firestore:get teams/{teamId}
```

### Check Backend Logs
```bash
# In server terminal, look for:
grep "DEBUG:" server.log
```

## Expected Flow

1. **Leader invites "Karthikeya"**
   - Team document: `invitedMembers: [{ name: "Karthikeya", email: "..." }]`

2. **Member registers as "nikhil"**
   - Backend receives: `{ name: "nikhil", email: "..." }`
   - Backend finds invitation: `{ name: "Karthikeya", email: "..." }`
   - Backend uses: `finalName = "Karthikeya"` ✅
   - Firestore saves: `users/{uid}.name = "Karthikeya"` ✅

3. **Member verifies OTP and logs in**
   - AuthContext loads: `name: "Karthikeya"` ✅
   - Dashboard shows: "GOOD EVENING, KARTHIKEYA" ✅

4. **Leader dashboard updates**
   - Team document: `members: [..., uid]` ✅
   - Team document: `invitedMembers: []` (removed) ✅
   - Leader sees: "Karthikeya" in "Team Members" ✅

## If Still Not Working

### Nuclear Option: Manual Firestore Update
1. Go to Firebase Console → Firestore
2. Find `users/{userId}`
3. Manually edit `name` field to "Karthikeya"
4. Save
5. Member: Logout and login again
6. Should now show correct name

### Check for Caching Issues
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## Success Criteria

✅ Backend logs show invitation name being used
✅ Firestore `users/{uid}.name` has correct name
✅ Team `members` array includes user ID
✅ Team `invitedMembers` array does NOT include user email
✅ Member dashboard shows correct name
✅ Leader dashboard shows member as "Joined" (not "Invited")
✅ Leader receives notification: "Karthikeya joined your team"

---

**Next Steps:**
1. Check backend logs first
2. Then check Firestore directly
3. If both are correct but UI is wrong → AuthContext issue
4. If Firestore is wrong → Backend issue
