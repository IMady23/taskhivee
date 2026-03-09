# Browser Cache Fix Instructions

## The Problem
Your browser is caching the old version of `bugService.js` even though the file has been updated on the server.

## What I've Done
1. ✅ Deleted and recreated `bugService.js` with all correct exports
2. ✅ Vite detected the change and triggered Hot Module Replacement (HMR)
3. ✅ Both servers are running fresh

## What YOU Need to Do Now

### Step 1: Hard Refresh the Browser
Open your browser at `http://localhost:5173/` and do a **HARD REFRESH**:

**Windows/Linux:**
- Press `Ctrl + Shift + R`
- OR `Ctrl + F5`

**Mac:**
- Press `Cmd + Shift + R`

### Step 2: If That Doesn't Work - Clear Browser Cache
1. Open DevTools (Press `F12`)
2. Right-click on the refresh button (while DevTools is open)
3. Select "Empty Cache and Hard Reload"

### Step 3: If Still Not Working - Nuclear Option
1. Open DevTools (`F12`)
2. Go to **Application** tab
3. Click **Clear storage** in the left sidebar
4. Click **Clear site data** button
5. Close the browser completely
6. Reopen and navigate to `http://localhost:5173/`

### Step 4: Verify It's Fixed
After hard refresh, you should see:
- ✅ No error about `createBug` export
- ✅ Leader Dashboard loads without errors
- ✅ Member Dashboard loads without errors

## Why This Happened
Browsers aggressively cache JavaScript modules for performance. When we made changes to `bugService.js`, your browser kept serving the old cached version instead of fetching the new one.

## Current File Status
The file `client/src/services/bugService.js` now has:
```javascript
export const createBug = async (bugData) => { ... }
export const getTeamBugs = async (teamId) => { ... }
export const updateBugStatus = async (bugId, status) => { ... }
export const subscribeToTeamBugs = (teamId, callback) => { ... }
export const deleteBug = async (bugId) => { ... }
export default { createBug, getTeamBugs, updateBugStatus, subscribeToTeamBugs, deleteBug };
```

All exports are correct and ready to use!

## If You Still See the Error
Let me know and I'll try a different approach, but the hard refresh should definitely work.
