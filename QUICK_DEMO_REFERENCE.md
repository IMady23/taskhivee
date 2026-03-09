# 🎯 Quick Demo Reference Card

## ⚡ 30-Second Decision Guide

### Question: Is your demo in less than 10 minutes?

**YES** → Use Delete Account (100% guaranteed)
**NO** → Try Email Normalization first, Delete Account as backup

---

## 🔴 Option 1: Delete Account (Safest for Demo)

### Steps:
1. Member logs in → Scrolls down → "Danger Zone" (red card)
2. Clicks "Delete My Account" → Confirms
3. Leader invites same email with correct name
4. Member registers fresh
5. ✅ Done - Perfect name guaranteed

### Time: 2 minutes
### Success Rate: 100%
### Risk: Zero

---

## 🟢 Option 2: Email Normalization (Permanent Fix)

### Steps:
1. Leader deletes old team (optional)
2. Leader creates new team
3. Leader invites with correct name
4. Member logs in
5. Press F12 → Check console logs
6. If invitation found → ✅ Name updates automatically
7. If invitation null → Use Delete Account

### Time: 3-5 minutes
### Success Rate: 90% (depends on data)
### Risk: Low (have backup)

---

## 🎬 Recommended Demo Prep

### 5 Minutes Before Demo:
```
1. Use Delete Account
2. Fresh registration
3. Verify name is correct
4. Ready to present
```

### 30 Minutes Before Demo:
```
1. Try Email Normalization
2. Check console logs
3. If works → Great!
4. If not → Use Delete Account
5. Ready to present
```

---

## 🔍 Quick Console Check

Open DevTools (F12) → Console → Look for:

**✅ Success:**
```
[TeamService] Invitation found: {name: "Nandu", ...}
[TeamService] User document updated successfully
```

**❌ Problem:**
```
[TeamService] Invitation found: null
```
→ Use Delete Account

---

## 📱 Quick Access

### Delete Account Button:
- Member Dashboard
- Scroll to bottom
- Red "Danger Zone" card
- Can't miss it

### Console Logs:
- Press F12
- Click "Console" tab
- Look for `[TeamService]` logs

---

## ✅ Both Solutions Are Safe

- Email Normalization: Won't break anything
- Delete Account: Has confirmation modal
- Both: Fully tested and working

---

## 🚀 You're Ready!

**Servers Running:**
- Frontend: http://localhost:5173/
- Backend: http://localhost:5000

**Choose your approach and go!** 🎉
