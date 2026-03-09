# Complete Authentication System - Implementation Guide

## Overview
This guide covers the complete authentication system with email verification/OTP for both Leaders and Members in TaskHivee.

## Features Implemented

### ✅ Backend (Node.js + Express + MongoDB)
- **User Model**: Enhanced with `isEmailVerified`, `otp`, `otpExpiry` fields
- **Password Hashing**: Using bcryptjs (10 salt rounds)
- **Email Service**: Nodemailer integration with OTP generation
- **JWT Authentication**: 7-day token expiration
- **Role-Based Access**: Leader vs Member separation
- **OTP Verification**: 10-minute expiration window

### ✅ Frontend (React + Vite)
- **LeaderAuth Page**: Complete login/signup forms with validation
- **MemberAuth Page**: Complete login/signup forms with validation
- **OTPVerification Component**: Interactive 6-digit OTP input
- **AuthContext**: Global state management with Redux-like reducer
- **Form Validation**: Client-side validation before submission
- **Error Handling**: User-friendly error messages
- **Success Messages**: Confirmation feedback for actions

### ✅ Authentication Flow
1. User signs up → OTP sent to email
2. User verifies OTP → Email marked as verified
3. User logs in → JWT token generated
4. Token stored in localStorage
5. Automatic redirect to dashboard (Leader/Member)

## Project Structure

```
TaskHivee/
├── server/
│   ├── models/
│   │   └── User.js (Enhanced with email verification fields)
│   ├── controllers/
│   │   └── authController.js (Complete implementation)
│   ├── routes/
│   │   └── authRoutes.js (All endpoints)
│   ├── middleware/
│   │   └── authMiddleware.js (JWT verification)
│   ├── utils/
│   │   └── emailService.js (Nodemailer setup)
│   ├── config/
│   │   └── db.js (MongoDB connection)
│   ├── index.js (Express server)
│   ├── package.json
│   └── .env (Create from .env.example)
│
└── client/
    ├── src/
    │   ├── pages/
    │   │   ├── Landing.jsx (Home page)
    │   │   ├── LeaderAuth.jsx (Leader login/signup)
    │   │   └── MemberAuth.jsx (Member login/signup)
    │   ├── components/
    │   │   └── OTPVerification.jsx (OTP modal)
    │   ├── context/
    │   │   └── AuthContext.jsx (Auth state management)
    │   ├── config.js (API endpoints)
    │   └── App.jsx (Routing setup)
    ├── package.json
    └── .env.local (Create from root .env.example)
```

## API Endpoints

### Auth Endpoints
- `POST /api/auth/register-leader` - Register as leader
- `POST /api/auth/register-member` - Register as member
- `POST /api/auth/verify-otp` - Verify email with OTP
- `POST /api/auth/resend-otp` - Resend OTP code
- `POST /api/auth/login` - Login (any role)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user (protected)

## Setup Instructions

### 1. Server Setup

#### Install Dependencies
```bash
cd server
npm install nodemailer  # Already done
npm install
```

#### Create .env File
```bash
# Copy the template
cp .env.example ../server/.env

# Update these values:
MONGODB_URI=mongodb://localhost:27017/taskhivee
JWT_SECRET=your_random_secret_key_min_32_chars
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_from_google
```

#### Generate Gmail App Password
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Windows Computer"
3. Google will generate a password - copy it to `EMAIL_PASSWORD` in .env

#### Start Server
```bash
npm start        # Production mode
npm run dev      # Development mode with nodemon
```

Expected output:
```
✅ MongoDB Connected
🚀 Server running on port 5000
```

### 2. Client Setup

#### Create .env.local File
```bash
# In the client directory
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

#### Start Client
```bash
cd client
npm install
npm run dev
```

Expected output:
```
VITE v7.1.7 running at:
  ➜  http://localhost:5173/
```

### 3. Database Setup

#### Using MongoDB Locally
```bash
# Install MongoDB Community Edition
# macOS: brew install mongodb-community
# Windows: Download from mongodb.com

# Start MongoDB
mongod
```

#### Using MongoDB Atlas (Cloud)
1. Create account at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in server/.env

## Testing the Authentication System

### Test Signup Flow
1. Open http://localhost:5173
2. Click "Leader Sign Up" or "Member Sign Up"
3. Enter name, email, password
4. Check email for OTP code
5. Enter OTP in modal (6 digits)
6. Verify success message
7. Should redirect to dashboard

### Test Login Flow
1. Open http://localhost:5173
2. Click "Leader Login" or "Member Login"
3. Enter verified email and password
4. Should redirect to dashboard

### Test Error Handling
- Invalid email format → Error message
- Password too short → Error message
- Password mismatch → Error message
- Wrong OTP → Error message displayed in modal
- Email already exists → Error message
- Invalid credentials → Error message

## Code Examples

### Register as Leader
```javascript
const response = await fetch('http://localhost:5000/api/auth/register-leader', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePass123',
    confirmPassword: 'SecurePass123'
  })
});
const data = await response.json();
// Returns: { userId, email, requiresOTP: true }
```

### Verify OTP
```javascript
const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: '507f1f77bcf86cd799439011',
    otp: '123456'
  })
});
const data = await response.json();
// Returns: { token, user: { id, name, email, role } }
```

### Login
```javascript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePass123'
  })
});
const data = await response.json();
// Returns: { token, user: { id, name, email, role } }
```

## Key Security Features

✅ **Password Hashing**: bcryptjs with 10 salt rounds
✅ **JWT Tokens**: 7-day expiration
✅ **Email Verification**: OTP required before login
✅ **OTP Expiration**: 10-minute window
✅ **CORS**: Configured for localhost:5173
✅ **Environment Variables**: Sensitive data in .env
✅ **Input Validation**: Both client and server-side
✅ **Error Handling**: Graceful error messages

## Troubleshooting

### Email Not Sending
- Check EMAIL_USER and EMAIL_PASSWORD in .env
- Gmail: Make sure App Password is generated (not regular password)
- Check email service configuration in emailService.js

### OTP Not Received
- Check spam/junk folder
- Verify EMAIL_USER and EMAIL_PASSWORD are correct
- Check server logs for email sending errors

### MongoDB Connection Failed
- Ensure MongoDB is running (`mongod` command)
- Check MONGODB_URI in .env
- Verify database name in connection string

### JWT Token Error
- Clear localStorage and try logging in again
- Check JWT_SECRET is set in .env
- Verify token is included in Authorization header

### CORS Error
- Ensure VITE_API_BASE_URL in client .env.local is correct
- Check CORS configuration in server/index.js

## File Modifications Summary

### Backend Files Created/Modified
- ✅ `server/models/User.js` - Added email verification fields
- ✅ `server/controllers/authController.js` - Complete implementation
- ✅ `server/routes/authRoutes.js` - Clean endpoints
- ✅ `server/utils/emailService.js` - Nodemailer service
- ✅ `server/package.json` - Added nodemailer
- ✅ `.env.example` - Complete configuration template

### Frontend Files Created/Modified
- ✅ `client/src/pages/LeaderAuth.jsx` - Complete login/signup form
- ✅ `client/src/pages/MemberAuth.jsx` - Complete login/signup form
- ✅ `client/src/components/OTPVerification.jsx` - OTP modal
- ✅ `client/src/context/AuthContext.jsx` - Complete API integration
- ✅ `client/src/pages/Landing.jsx` - Preserved from Prompt B
- ✅ `client/src/App.jsx` - Routing preserved

## Next Steps

### To Complete the Application:
1. **Implement Dashboards**: Create LeaderDashboard and MemberDashboard pages
2. **Project Management**: Implement project creation and management
3. **Task Management**: Implement task CRUD operations
4. **Real-Time Features**: Setup Socket.io for live updates
5. **Bug Tracking**: Implement bug reporting system
6. **Team Collaboration**: Add team member management
7. **Chat System**: Implement real-time messaging

### Production Deployment:
1. Set NODE_ENV=production
2. Use strong JWT_SECRET (32+ characters)
3. Setup MongoDB Atlas for cloud database
4. Configure email service (SendGrid, AWS SES, etc.)
5. Deploy frontend to Vercel/Netlify
6. Deploy backend to Heroku/Railway/Render
7. Setup HTTPS/SSL certificates
8. Configure environment variables on hosting platform

## Support & Documentation

- **MongoDB Documentation**: https://docs.mongodb.com
- **Express Documentation**: https://expressjs.com
- **React Documentation**: https://react.dev
- **Nodemailer Documentation**: https://nodemailer.com
- **JWT Documentation**: https://jwt.io

---

**Status**: ✅ Complete authentication system ready for development
**Last Updated**: November 14, 2025
**Version**: 1.0.0
