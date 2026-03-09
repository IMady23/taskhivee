# Browser Cache Clear Guide

## Issue
You're seeing this error:
```
The requested module '/src/services/bugService.js' does not provide an export named 'createBug'
```

This is a **browser cache issue**. The browser is loading an old version of the file.

## Solution: Hard Refresh

### Windows/Linux:
1. **Chrome/Edge/Firefox**: Press `Ctrl + Shift + R` or `Ctrl + F5`
2. **Alternative**: Press `Ctrl + Shift + Delete` → Select "Cached images and files" → Clear

### Mac:
1. **Chrome/Edge**: Press `Cmd + Shift + R`
2. **Safari**: Press `Cmd + Option + E` (to empty cache), then `Cmd + R` (to reload)
3. **Firefox**: Press `Cmd + Shift + R`

### If Hard Refresh Doesn't Work:

#### Option 1: Clear Browser Cache Completely
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

#### Option 2: Clear Site Data
1. Open DevTools (F12)
2. Go to "Application" tab
3. Click "Clear site data"
4. Refresh the page

#### Option 3: Restart Dev Server
```bash
# Stop the client dev server (Ctrl+C in the terminal)
# Then restart it:
cd client
npm run dev
```

## Why This Happens
- Vite/React dev server caches modules
- Browser caches JavaScript files
- When files are recreated/modified, old versions may persist

## Verification
After clearing cache, check the browser console. The error should be gone and the app should load normally.

## Prevention
- Always do a hard refresh after major file changes
- Use incognito/private mode for testing
- Keep DevTools open with "Disable cache" checked (in Network tab)
