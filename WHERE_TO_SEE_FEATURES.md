# 🎯 WHERE TO SEE THE NEW FEATURES - STEP BY STEP

## 🚀 START HERE

### Step 1: Open Your Browser
Go to: **http://localhost:5173**

### Step 2: Login as Leader
- Use your leader credentials
- You should land on `/leader/dashboard`

---

## 📍 FEATURE LOCATIONS

### ✅ Feature 1-3: Workload, Friction, AI Summary
**Location**: Leader Dashboard (Home Page)
**URL**: `http://localhost:5173/leader/dashboard`

**What You'll See**:
1. Scroll down past the "Quick Actions" section
2. You'll see **TWO NEW CARDS** side by side:
   - Left: **"Workload Dashboard"** (shows team members with colored bars)
   - Right: **"High Friction Tasks"** (shows tasks reassigned multiple times)
3. Below that: **"AI Weekly Summary"** section with a "Generate" button

**Screenshot Location**:
```
[Quick Actions Section]
[Task Progress | Team Status]
[Team Overview]
👇 NEW FEATURES START HERE 👇
[Workload Dashboard | Friction Tasks]  ← NEW!
[AI Weekly Summary]                     ← NEW!
```

---

### ✅ Feature 4: Activity Timeline
**Location**: New Page in Sidebar
**URL**: `http://localhost:5173/leader/activity`

**How to Access**:
1. Look at the left sidebar
2. Find **"Activity"** or **"Activity Timeline"** link
3. Click it
4. You'll see a vertical timeline of all team events

**OR** type directly in browser: `http://localhost:5173/leader/activity`

---

### ✅ Feature 5: Team Performance (Real-time Updates)
**Location**: Team Performance Page
**URL**: `http://localhost:5173/leader/performance`

**What You'll See**:
- Efficiency Map (bar chart)
- Velocity Pulse (donut chart)
- Outcome Breakdown (table)

**How to Test Real-time**:
1. Keep this page open
2. Open incognito/another browser
3. Login as a member
4. Complete a task
5. Watch the charts update automatically (no refresh needed!)

---

## 🔍 TROUBLESHOOTING

### "I don't see Workload Dashboard"

**Check**:
1. Are you on `/leader/dashboard`? (not `/leader/performance`)
2. Did you scroll down past "Team Overview"?
3. Do you have team members? (Need at least 1 member with tasks)

**Quick Fix**:
```bash
# In browser console (F12):
window.location.href = '/leader/dashboard'
```

---

### "I don't see Activity Timeline in sidebar"

**Direct Access**:
Just type in browser: `http://localhost:5173/leader/activity`

---

### "Features show but are empty"

**This is NORMAL if**:
- You have no team members yet
- You have no tasks yet
- Tasks don't have the required fields

**Solution**:
1. Create a team (if you haven't)
2. Add team members
3. Create some tasks
4. Assign tasks to members
5. Complete some tasks
6. Reassign a task 3+ times (to see friction)

---

## 🎬 DEMO FLOW

### Quick Demo (5 minutes):

1. **Go to Leader Dashboard**
   ```
   http://localhost:5173/leader/dashboard
   ```
   - Scroll down
   - See Workload Dashboard
   - See Friction Tasks
   - Click "Generate Weekly Summary"

2. **Go to Activity Timeline**
   ```
   http://localhost:5173/leader/activity
   ```
   - See all team events
   - Filter by date/type

3. **Go to Team Performance**
   ```
   http://localhost:5173/leader/performance
   ```
   - See Efficiency Map
   - See Velocity Pulse
   - See Outcome Breakdown

4. **Test Real-time** (Optional)
   - Keep Performance page open
   - Open incognito as member
   - Complete a task
   - Watch charts update!

---

## 📸 VISUAL GUIDE

### Leader Dashboard Layout:
```
┌─────────────────────────────────────┐
│  Welcome back, [Name]               │
│  Managing team: [Team Name]         │
├─────────────────────────────────────┤
│  [Total Tasks] [To Do] [In Progress]│
│  [Completed] [Open Bugs] [Members]  │
├─────────────────────────────────────┤
│  Quick Actions  │  Task Progress    │
│                 │  Team Status      │
├─────────────────────────────────────┤
│  Team Overview                      │
│  • Team has X members               │
│  • Y tasks completed this week      │
├─────────────────────────────────────┤
│  ⭐ NEW FEATURES BELOW ⭐           │
├─────────────────────────────────────┤
│  Workload Dashboard │ Friction Tasks│
│  [Member bars]      │ [Friction list]│
├─────────────────────────────────────┤
│  AI Weekly Summary                  │
│  [Generate Button]                  │
│  [Summary Display]                  │
│  [History]                          │
└─────────────────────────────────────┘
```

---

## 🆘 STILL NOT SEEING IT?

### Option 1: Hard Refresh
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### Option 2: Clear Cache
```javascript
// In browser console (F12):
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Option 3: Check Console
- Press `F12`
- Go to "Console" tab
- Look for any red errors
- Share the errors with me

### Option 4: Verify Server
```bash
# Check if servers are running:
# Server should be on: http://localhost:5000
# Client should be on: http://localhost:5173
```

---

## 📞 NEED HELP?

Tell me:
1. Which URL are you on?
2. Are you logged in as Leader or Member?
3. Do you see the "Team Overview" section?
4. Any errors in browser console (F12)?

I'll help you find the features!
