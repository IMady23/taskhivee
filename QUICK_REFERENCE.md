# Quick Reference - TaskHivee Authentication

## 🚀 Quick Start (5 Minutes)

### 1. Setup Environment
```bash
cd server
cp ../.env.example .env
```

### 2. Edit .env
```env
MONGODB_URI=mongodb://localhost:27017/taskhivee
JWT_SECRET=your_random_secret_key_min_32_chars
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_from_google
```

### 3. Get Gmail App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Copy password → paste in .env

### 4. Start Servers
```bash
# Terminal 1 - Backend
cd server && npm start

# Terminal 2 - Frontend
cd client && npm run dev
```

### 5. Test
- Visit http://localhost:5173
- Click "Leader Sign Up"
- Check email for OTP
- Verify and done! ✓

---

## 📋 Routes & Endpoints

### Public Routes
```
GET  /                           Landing page
GET  /leader-auth?mode=login     Leader login
GET  /leader-auth?mode=signup    Leader signup
GET  /member-auth?mode=login     Member login
GET  /member-auth?mode=signup    Member signup
```

### Auth API Endpoints
```
POST /api/auth/register-leader   → registerLeader()
POST /api/auth/register-member   → registerMember()
POST /api/auth/login             → login()
POST /api/auth/verify-otp        → verifyOTP()
POST /api/auth/resend-otp        → resendOTP()
GET  /api/auth/me                → getCurrentUser() [Protected]
POST /api/auth/logout            → logout()
```

### Protected Routes
```
GET  /leader-dashboard           [role: leader]
GET  /member-dashboard           [role: member]
```

---

## 🔐 Authentication Headers

### Send Token
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

fetch('/api/auth/me', { 
  method: 'GET', 
  headers 
});
```

---

## 📁 Key Files

### Backend
| File | Purpose |
|------|---------|
| `server/models/User.js` | User schema (email verification) |
| `server/controllers/authController.js` | Auth logic (7 functions) |
| `server/routes/authRoutes.js` | API endpoints |
| `server/utils/emailService.js` | Email/OTP service |
| `server/middleware/authMiddleware.js` | JWT verification |

### Frontend
| File | Purpose |
|------|---------|
| `client/src/pages/LeaderAuth.jsx` | Leader login/signup form |
| `client/src/pages/MemberAuth.jsx` | Member login/signup form |
| `client/src/components/OTPVerification.jsx` | OTP modal |
| `client/src/context/AuthContext.jsx` | Global auth state |
| `client/src/config.js` | API endpoints |

---

## 💻 Code Examples

### Login Example
```javascript
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function LoginForm() {
  const { login, isLoading, error } = useContext(AuthContext);
  
  const handleLogin = async (email, password) => {
    try {
      await login(email, password);
      // Auto-redirect via AuthContext
    } catch (err) {
      console.error(err.message);
    }
  };
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleLogin(email, password);
    }}>
      {/* form fields */}
    </form>
  );
}
```

### Protected Route Example
```javascript
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useContext(AuthContext);
  
  if (!isAuthenticated) {
    return <Navigate to="/leader-auth?mode=login" />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" />;
  }
  
  return children;
}

// Usage in Routes
<Route 
  path="/leader-dashboard" 
  element={
    <ProtectedRoute requiredRole="leader">
      <LeaderDashboard />
    </ProtectedRoute>
  } 
/>
```

---

## 🧪 Test Scenarios

### Success Flow
1. ✅ Signup with valid data
2. ✅ OTP sent to email
3. ✅ Verify OTP
4. ✅ Redirect to dashboard
5. ✅ Can login again

### Error Flow
- ❌ Invalid email → Error shown
- ❌ Password too short → Error shown
- ❌ Email exists → Error shown
- ❌ Wrong OTP → Error shown
- ❌ Wrong password → Error shown

---

## 🛠️ Troubleshooting

### Email Not Sending?
- [ ] Check EMAIL_USER in .env
- [ ] Verify EMAIL_PASSWORD (App Password, not regular)
- [ ] Ensure 2FA enabled on Gmail
- [ ] Check server console for errors

### Can't Login After Signup?
- [ ] Check email for OTP
- [ ] Verify OTP in modal
- [ ] Email must be verified first
- [ ] OTP expires after 10 minutes

### MongoDB Connection Error?
- [ ] Ensure MongoDB running locally
- [ ] Or update MONGODB_URI to Atlas
- [ ] Check connection string format
- [ ] Verify database name

### Token Errors?
- [ ] Clear localStorage and re-login
- [ ] Check JWT_SECRET is set
- [ ] Verify Authorization header format
- [ ] Token expires after 7 days

---

## 🔍 Debug Checklist

```
□ MongoDB running/connected
□ Server showing "🚀 Server running on port 5000"
□ Client showing "VITE running at http://localhost:5173"
□ .env file exists in server directory
□ All .env variables populated
□ Gmail App Password configured
□ No console errors in browser
□ No console errors in terminal
□ Can access landing page
□ Can click signup button
□ Form renders without errors
□ Can submit form
□ API call succeeds (check Network tab)
□ Email received within 5 seconds
□ OTP modal appears
□ Can enter OTP
□ Verification succeeds
□ Redirect happens
□ Stored in localStorage
□ Can logout
□ Auto-login works on refresh
```

---

## 📊 State Management

### AuthContext Structure
```javascript
{
  user: {
    id: String,
    name: String,
    email: String,
    role: String, // 'leader' | 'member'
    avatar: String,
    isEmailVerified: Boolean,
    createdAt: Date
  },
  token: String,              // JWT token
  isLoading: Boolean,         // API call in progress
  error: String,              // Error message
  isAuthenticated: Boolean,   // Auth status
}
```

### Actions
```javascript
dispatch({ type: 'LOGIN_START' })        // Start login
dispatch({ type: 'LOGIN_SUCCESS', ... }) // Success
dispatch({ type: 'LOGIN_FAIL', ... })    // Failure
dispatch({ type: 'LOGOUT' })             // Logout
dispatch({ type: 'SET_USER', ... })      // Update user
dispatch({ type: 'CLEAR_ERROR' })        // Clear error
```

---

## 🎯 Environment Variables Checklist

```
Backend (.env):
□ PORT=5000
□ NODE_ENV=development
□ MONGODB_URI=...
□ JWT_SECRET=...
□ EMAIL_SERVICE=gmail
□ EMAIL_USER=...
□ EMAIL_PASSWORD=...
□ FRONTEND_URL=http://localhost:5173

Frontend (.env.local):
□ VITE_API_BASE_URL=http://localhost:5000/api
□ VITE_SOCKET_URL=http://localhost:5000
```

---

## 📚 Useful Commands

```bash
# Check if MongoDB is running
mongod

# Start MongoDB (if installed)
brew services start mongodb-community  # macOS
# or on Windows: MongoDB is a service

# View server logs
cd server && npm run dev

# Check network requests
Chrome DevTools → Network tab

# View localStorage
Chrome DevTools → Application → localStorage

# Check email delivery
Gmail inbox (may take 5-10 seconds)
Check spam folder too!

# Kill port if occupied
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:5000 | xargs kill -9
```

---

## 🚨 Common Errors & Solutions

### "Cannot find module 'nodemailer'"
```bash
cd server
npm install nodemailer
```

### "ECONNREFUSED - Cannot connect to MongoDB"
```bash
# Start MongoDB
mongod

# Or update MONGODB_URI to Atlas connection string
```

### "Email not sending"
```
1. Check EMAIL_PASSWORD is App Password (not regular password)
2. Ensure 2FA enabled on Gmail
3. Check EMAIL_USER spelling
4. Look for SMTP errors in server logs
```

### "OTP modal not appearing"
```bash
# Check if OTP component imported in LeaderAuth
import OTPVerification from '../components/OTPVerification';

# Check if state management working
console.log(showOTP) // should be true after signup
```

### "Form not submitting"
```javascript
// Check form validation
console.log(errors) // should be empty {}

// Check API response
console.log(response) // check status and data

// Check network tab for failed requests
```

---

## ✅ Pre-Launch Checklist

- [ ] MongoDB configured and running
- [ ] .env file created with all variables
- [ ] Gmail App Password generated and configured
- [ ] Nodemailer installed (`npm install nodemailer`)
- [ ] Both servers started (backend on 5000, frontend on 5173)
- [ ] Landing page loads
- [ ] Can navigate to signup forms
- [ ] Can fill and submit forms
- [ ] OTP email received
- [ ] OTP modal works
- [ ] Verification succeeds
- [ ] Redirects to correct dashboard
- [ ] Token stored in localStorage
- [ ] Logout works
- [ ] Auto-login works on refresh
- [ ] Error messages display correctly
- [ ] Mobile responsive design works

---

## 📖 Documentation Files

1. **AUTHENTICATION_GUIDE.md** - Complete setup & usage guide
2. **AUTHENTICATION_CHECKLIST.md** - Implementation checklist
3. **AUTHENTICATION_COMPLETE.md** - Summary of all changes
4. **AUTHENTICATION_SYSTEM_OVERVIEW.md** - System architecture diagrams
5. **README.md** (This file) - Quick reference

---

## 🎓 Learning Resources

- **JWT**: https://jwt.io
- **Bcryptjs**: https://github.com/dcodeIO/bcrypt.js
- **Nodemailer**: https://nodemailer.com
- **MongoDB**: https://docs.mongodb.com
- **React Context**: https://react.dev/reference/react/useContext
- **Express**: https://expressjs.com/en/api/app.html

---

## 💡 Tips & Best Practices

1. **Always use HTTPS in production**
2. **Rotate JWT_SECRET regularly**
3. **Use environment variables for sensitive data**
4. **Never commit .env to git**
5. **Test on multiple devices**
6. **Clear localStorage when debugging**
7. **Check email spam folder**
8. **Monitor server logs for errors**
9. **Validate on both client and server**
10. **Keep dependencies updated**

---

## 🎉 Success Indicators

✅ You'll know it's working when:
- Server shows "🚀 Server running on port 5000"
- Frontend loads at http://localhost:5173
- Can signup and receive OTP email
- OTP verification succeeds
- Redirects to dashboard
- Can login with credentials
- Token persists in localStorage
- Can logout and re-login
- All forms validate correctly
- Errors display user-friendly messages

---

**Status**: Ready for Production 🚀
**Last Updated**: November 14, 2025
**Support**: Check documentation files for detailed help
