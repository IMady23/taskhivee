# Online Presence Tracking Setup Guide

## Overview
Real-time online/offline status tracking has been implemented using Firebase Realtime Database. Users who are actually on the website will show as "Online" with a green indicator, while others will show as "Offline" with a gray indicator.

## What Was Changed

### 1. New Files Created
- `client/src/services/presenceService.js` - Service for managing presence tracking
- `database.rules.json` - Firebase Realtime Database security rules

### 2. Modified Files
- `client/src/config/firebase.js` - Added Realtime Database initialization
- `client/src/context/AuthContext.jsx` - Added automatic presence tracking on login/logout
- `client/src/pages/member/TeamChat.jsx` - Integrated real-time presence display

## How It Works

### Automatic Presence Tracking
1. When a user logs in, their presence is automatically set to "online"
2. Firebase monitors the connection and automatically sets them to "offline" when:
   - They close the browser tab
   - They lose internet connection
   - They log out
   - Their session expires

### Real-Time Updates
- The TeamChat sidebar subscribes to presence changes for all team members
- When someone comes online or goes offline, the UI updates instantly
- Green pulsing dot = Online
- Gray dot = Offline

## Firebase Setup Required

### Step 1: Enable Firebase Realtime Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click "Realtime Database" in the left sidebar
4. Click "Create Database"
5. Choose a location (use the same region as your Firestore for best performance)
6. Start in **test mode** for now (we'll set proper rules next)

### Step 2: Get Database URL

After creating the database, you'll see a URL like:
```
https://your-project-id-default-rtdb.firebaseio.com
```

### Step 3: Add Database URL to Environment Variables

Add this to your `client/.env` file:
```env
VITE_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
```

**Note:** If you don't add this, the code will automatically generate the URL from your project ID.

### Step 4: Deploy Security Rules

1. In Firebase Console → Realtime Database → Rules tab
2. Replace the rules with the content from `database.rules.json`:

```json
{
  "rules": {
    "presence": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

3. Click "Publish"

**What these rules do:**
- Anyone can read presence status (so team members can see who's online)
- Users can only write their own presence status (security)

## Testing

### Test Online Status
1. Open the app in two different browsers (or incognito + regular)
2. Log in as different team members in each browser
3. Go to Team Chat
4. You should see:
   - Yourself with green "Online" indicator
   - Other logged-in members with green "Online" indicator
   - Members not logged in with gray "Offline" indicator

### Test Offline Detection
1. Close one browser tab
2. Wait 5-10 seconds
3. In the other browser, that user should now show as "Offline"

### Test Network Disconnect
1. Disconnect internet on one device
2. Wait 5-10 seconds
3. That user should show as "Offline" on other devices

## Troubleshooting

### Issue: Everyone shows as Offline
**Solution:** Make sure you've enabled Realtime Database and deployed the security rules.

### Issue: "Permission denied" errors in console
**Solution:** Check that your database rules are deployed correctly. The rules should allow authenticated users to read all presence data.

### Issue: Status doesn't update when closing tab
**Solution:** This is normal browser behavior. The disconnect detection happens within 5-10 seconds. If it takes longer, check your Firebase connection.

### Issue: Database URL not found
**Solution:** Either add `VITE_FIREBASE_DATABASE_URL` to your `.env` file, or make sure your `VITE_FIREBASE_PROJECT_ID` is correct (the URL will be auto-generated).

## Architecture

### Presence Data Structure
```
presence/
  ├── userId1/
  │   ├── state: "online"
  │   ├── lastChanged: timestamp
  │   ├── name: "User Name"
  │   ├── email: "user@example.com"
  │   └── role: "member"
  └── userId2/
      ├── state: "offline"
      └── lastChanged: timestamp
```

### Key Features
- **Automatic cleanup:** Firebase's `onDisconnect()` ensures users are marked offline even if the app crashes
- **Real-time sync:** All clients receive updates within milliseconds
- **Minimal bandwidth:** Only presence changes are transmitted
- **Battery efficient:** Uses Firebase's optimized connection pooling

## Future Enhancements

Possible improvements:
1. Show "last seen" timestamp for offline users
2. Add "away" status after 5 minutes of inactivity
3. Show typing indicators in the presence system
4. Add presence to other pages (not just chat)
5. Show online count in team overview

## Cost Considerations

Firebase Realtime Database pricing:
- **Spark (Free) Plan:** 1GB storage, 10GB/month bandwidth
- **Blaze (Pay-as-you-go):** $5/GB storage, $1/GB bandwidth

For a team of 50 users:
- Storage: ~50KB (negligible)
- Bandwidth: ~10MB/day (well within free tier)

**Conclusion:** Presence tracking is essentially free for small to medium teams.
