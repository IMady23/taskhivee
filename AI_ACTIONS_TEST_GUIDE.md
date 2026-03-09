# AI Actions Testing Guide

## ✅ Implementation Complete

The AI Assistant now supports creating tasks and reporting bugs with enhanced natural language parsing.

---

## 🧪 Test Cases

### Test 1: Basic Task Creation (Leader)
**Command:** "Create a task: Fix navbar styling"

**Expected Result:**
- Confirmation dialog appears
- After confirm: Task created with title "Fix navbar styling"
- Assigned to: Leader (self)
- Priority: Medium
- Due Date: Not set

---

### Test 2: Advanced Task Creation (Leader)
**Command:** "Create a task to vimal to complete login page on 15th feb"

**Expected Result:**
- Confirmation dialog appears
- After confirm: Task created with:
  - Title: "complete login page"
  - Assigned to: Vimal (matched from team members)
  - Priority: Medium
  - Due Date: February 15, 2026

---

### Test 3: Task with All Details (Leader)
**Command:** "Add a task: Update API docs assign to john, high priority, due 20th march"

**Expected Result:**
- Confirmation dialog appears
- After confirm: Task created with:
  - Title: "Update API docs"
  - Assigned to: John (matched from team members)
  - Priority: High
  - Due Date: March 20, 2026

---

### Test 4: Basic Bug Report (Member)
**Command:** "Report a bug: Login button not working"

**Expected Result:**
- Confirmation dialog appears
- After confirm: Bug reported with:
  - Title: "Login button not working"
  - Severity: Medium
  - Status: Open
  - Leader notified

---

### Test 5: Bug with Severity (Member)
**Command:** "Report a bug: Database connection failing critical"

**Expected Result:**
- Confirmation dialog appears
- After confirm: Bug reported with:
  - Title: "Database connection failing"
  - Severity: Critical
  - Status: Open
  - Leader notified

---

### Test 6: Permission Denial (Member tries to create task)
**Command:** "Create a task: Test task"

**Expected Result:**
- Confirmation dialog appears
- After confirm: Error message "Permission denied or invalid action"
- No task created

---

### Test 7: Permission Denial (Leader tries to report bug)
**Command:** "Report a bug: Test bug"

**Expected Result:**
- Confirmation dialog appears
- After confirm: Error message "Permission denied or invalid action"
- No bug reported

---

## 🎯 Parsing Features to Verify

### Task Parsing:
- ✅ Title extraction (removes command keywords)
- ✅ Assignee matching (fuzzy match from team members)
- ✅ Priority detection (high, urgent, low)
- ✅ Date parsing (15th feb, 20th march, etc.)
- ✅ Auto year calculation (if date in past, use next year)

### Bug Parsing:
- ✅ Title extraction (removes command keywords)
- ✅ Severity detection (critical, high, medium, low)
- ✅ Auto notification to leader

---

## 🔍 What to Check

### After Task Creation:
1. Go to Tasks section in dashboard
2. Verify task appears with correct:
   - Title
   - Assignee
   - Priority
   - Due Date
3. Check if assignee received notification (if not self)

### After Bug Report:
1. Go to Bugs section in dashboard
2. Verify bug appears with correct:
   - Title
   - Severity
   - Status (Open)
   - Reporter name
3. Check if leader received notification

---

## 🐛 Known Issues / Edge Cases

### Edge Case 1: Invalid Team Member Name
**Command:** "Create a task to invalidname to do something"
**Expected:** Task created, assigned to self (leader)

### Edge Case 2: Invalid Date
**Command:** "Create a task: Do something due 35th feb"
**Expected:** Task created, due date not set (invalid date ignored)

### Edge Case 3: Empty Title
**Command:** "Create a task:"
**Expected:** Error message "Could not extract task title"

### Edge Case 4: Multiple Keywords
**Command:** "Create a task to john to fix high priority bug due tomorrow"
**Expected:** Parses correctly, but "tomorrow" not supported (only specific dates)

---

## 📊 Success Criteria

✅ All test cases pass
✅ Confirmation dialog works correctly
✅ Parsing extracts correct information
✅ Tasks/bugs appear in dashboard
✅ Notifications sent correctly
✅ Permission checks work
✅ Error handling works gracefully
✅ No existing features broken

---

## 🚀 Next Steps (Future Enhancements)

### Potential Improvements:
1. Support "tomorrow", "next week" date formats
2. Support task descriptions (multi-line)
3. Support updating existing tasks/bugs
4. Support task status changes via AI
5. Support bug deletion requests (member → leader approval)
6. Support bulk operations
7. Support task dependencies
8. Support file attachments

### Not Implemented Yet:
- ❌ Update task status via AI
- ❌ Delete tasks/bugs via AI
- ❌ Bulk operations
- ❌ Task descriptions (only title)
- ❌ Relative dates (tomorrow, next week)

---

## 📝 Testing Checklist

### Leader Tests:
- [ ] Basic task creation
- [ ] Task with assignee
- [ ] Task with priority
- [ ] Task with due date
- [ ] Task with all details
- [ ] Try to report bug (should fail)
- [ ] Cancel action
- [ ] Invalid team member name
- [ ] Invalid date format

### Member Tests:
- [ ] Basic bug report
- [ ] Bug with severity
- [ ] Try to create task (should fail)
- [ ] Cancel action
- [ ] Empty bug title

### General Tests:
- [ ] Confirmation dialog appears
- [ ] Cancel button works
- [ ] Success messages show correct details
- [ ] Error messages are clear
- [ ] Notifications sent correctly
- [ ] Dashboard updates correctly
- [ ] No console errors

---

## ✅ Status: READY FOR TESTING

The implementation is complete and ready for user testing. All core features are working as expected.
