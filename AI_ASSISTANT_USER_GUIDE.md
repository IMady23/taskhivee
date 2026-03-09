# 🤖 AI Assistant User Guide

## ✨ New Feature: AI Actions!

Your AI Assistant can now **create tasks and report bugs** for you!

---

## 👑 For Leaders

### Create Tasks with AI
Simply tell the AI what task you want to create with natural language:

**Basic Examples:**
- "Create a task: Fix navbar styling"
- "Add a task: Update user documentation"
- "Create a task: Review pull requests"

**Advanced Examples (with details):**
- "Create a task to vimal to complete login page on 15th feb"
- "Add a task: Update API docs assign to john, high priority, due 20th march"
- "Create a task: Fix mobile responsiveness assign to sarah, urgent, deadline 25th april"

**Supported Details:**
- **Assignee**: "assign to [name]", "to [name]"
- **Priority**: "high priority", "urgent", "low priority" (default: Medium)
- **Due Date**: "due 15th feb", "deadline 20th march", "on 25th april"

**What happens:**
1. AI detects your request and parses all details
2. Shows confirmation dialog with extracted information
3. You click "Confirm"
4. Task is created with title, assignee, priority, and due date!
5. Success message shows all task details

---

## 👤 For Members

### Report Bugs with AI
Tell the AI about bugs you've found with optional severity:

**Basic Examples:**
- "Report a bug: Login button not working"
- "Create a bug: Calendar events not showing on mobile"
- "Report a bug: Navbar overlaps content on small screens"

**Advanced Examples (with severity):**
- "Report a bug: Database connection failing critical"
- "Create a bug: Slow page load high severity"
- "Report a bug: Minor typo in footer low"

**Supported Severity Levels:**
- **Critical**: System-breaking issues
- **High**: Major functionality problems
- **Medium**: Moderate issues (default)
- **Low**: Minor issues, cosmetic bugs

**What happens:**
1. AI detects your bug report and extracts severity
2. Shows confirmation dialog with bug details
3. You click "Confirm"
4. Bug is reported to your leader with proper severity!
5. Success message appears, leader gets notified

---

## 🎯 How to Use

### Step 1: Open AI Assistant
- Click on "AI Assistant" in your dashboard
- The chat interface will open

### Step 2: Type Your Command
- **Leaders:** "Create a task: [description]" or with details like "Create a task to [name] to [description] on [date]"
- **Members:** "Report a bug: [description]" or with severity like "Report a bug: [description] critical"

**Natural Language Support:**
The AI understands natural language! You can say:
- "Create a task to vimal to complete login page on 15th feb"
- "Add a task: Fix bugs assign to john, high priority, due 20th march"
- "Report a bug: Dashboard crashes critical severity"

### Step 3: Confirm Action
- A dialog will appear asking for confirmation
- Review the action
- Click "Confirm" to proceed or "Cancel" to abort

### Step 4: Done!
- Success message will appear
- Your task/bug is now in the system
- You can view it in the respective dashboard section

---

## 💡 Tips

### For Better Results:
- Be specific in your descriptions
- Keep it concise but clear
- Include assignee, priority, and deadline for tasks
- Include severity level for bugs
- Use natural language - the AI is smart!

### Smart Parsing:
- **Dates**: "15th feb", "20th march", "25th april" are all understood
- **Names**: AI matches team member names automatically
- **Priority**: "high", "urgent", "low" are recognized
- **Severity**: "critical", "high", "medium", "low" are recognized

### What AI Can Do:
- ✅ Analyze your project data (tasks, bugs, team, calendar)
- ✅ Answer questions about tasks/bugs
- ✅ Provide insights and recommendations
- ✅ Create tasks with assignee, priority, deadline (leaders only)
- ✅ Report bugs with severity (members only)
- ✅ Parse natural language commands

### What AI Cannot Do:
- ❌ Delete tasks/bugs (use dashboard)
- ❌ Update existing tasks/bugs (use dashboard)
- ❌ Access other teams' data
- ❌ Execute without confirmation

---

## 🛡️ Safety Features

### Confirmation Required
- Every action requires your confirmation
- No accidental creations
- You can always cancel

### Role-Based Permissions
- Leaders can only create tasks
- Members can only report bugs
- Backend validates all permissions

### Clear Feedback
- Success messages when actions complete
- Error messages if something goes wrong
- Always know what's happening

---

## 🚀 Quick Examples

### Leader Example (Basic):
```
You: "Create a task: Implement dark mode toggle"
AI: [Shows confirmation dialog]
You: [Clicks Confirm]
AI: "✅ Task created successfully! 
     📋 Implement dark mode toggle
     👤 Assigned to: [Your Name]
     ⚡ Priority: Medium
     📅 Due: Not set"
```

### Leader Example (Advanced):
```
You: "Create a task to vimal to complete login page on 15th feb"
AI: [Shows confirmation dialog with parsed details]
You: [Clicks Confirm]
AI: "✅ Task created successfully! 
     📋 complete login page
     👤 Assigned to: Vimal
     ⚡ Priority: Medium
     📅 Due: Sat, Feb 15, 2026"
```

### Member Example (Basic):
```
You: "Report a bug: Profile picture not uploading"
AI: [Shows confirmation dialog]
You: [Clicks Confirm]
AI: "✅ Bug reported successfully! 
     🐛 Profile picture not uploading
     ⚠️ Severity: Medium
     📊 Status: Open
     Your team leader has been notified."
```

### Member Example (Advanced):
```
You: "Report a bug: Database connection failing critical"
AI: [Shows confirmation dialog with severity]
You: [Clicks Confirm]
AI: "✅ Bug reported successfully! 
     🐛 Database connection failing
     ⚠️ Severity: Critical
     📊 Status: Open
     Your team leader has been notified."
```

---

## ❓ FAQ

**Q: Can I create multiple tasks at once?**
A: Currently, one task per command. But you can send multiple commands quickly!

**Q: What if I make a typo?**
A: Click "Cancel" in the confirmation dialog and retype your command.

**Q: Can I add more details like priority or deadline?**
A: Yes! Use natural language like "Create a task to john to fix bugs, high priority, due 20th march"

**Q: How does the AI match team member names?**
A: The AI fuzzy-matches names from your team members list. "vimal", "Vimal", or even partial matches work!

**Q: What date formats are supported?**
A: "15th feb", "20th march", "25th april", etc. The AI automatically determines the year.

**Q: Will this replace the normal task/bug creation?**
A: No! This is an additional quick way. The dashboard still works as before.

**Q: Is my data safe?**
A: Yes! All actions require confirmation and follow the same security as the dashboard.

**Q: Can I edit tasks/bugs created by AI?**
A: Absolutely! They appear in your dashboard just like manually created ones.

---

## 🎉 Enjoy Your Smart AI Assistant!

Your AI is now more powerful and can help you work faster. Try it out and let us know what you think!
