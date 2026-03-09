/**
 * Presence Service
 * Real-time online/offline status tracking using Firebase Realtime Database
 */
import { ref, onValue, onDisconnect, set, serverTimestamp } from 'firebase/database';
import { database } from '../config/firebase';

/**
 * Initialize presence tracking for a user
 * Sets user as online and automatically sets offline on disconnect
 */
export const initializePresence = (userId, userData = {}) => {
  if (!userId) return null;

  const userStatusRef = ref(database, `presence/${userId}`);
  
  // Filter out undefined values (Firebase Realtime Database doesn't allow undefined)
  const cleanUserData = Object.entries(userData).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key] = value;
    }
    return acc;
  }, {});
  
  // User is online
  const onlineStatus = {
    state: 'online',
    lastChanged: serverTimestamp(),
    ...cleanUserData
  };

  // User is offline
  const offlineStatus = {
    state: 'offline',
    lastChanged: serverTimestamp(),
    ...cleanUserData
  };

  // Set up disconnect handler - automatically set offline when user disconnects
  onDisconnect(userStatusRef).set(offlineStatus);

  // Set user as online
  set(userStatusRef, onlineStatus);

  // Return cleanup function
  return () => {
    set(userStatusRef, offlineStatus);
  };
};

/**
 * Subscribe to presence status for multiple users
 * @param {string[]} userIds - Array of user IDs to track
 * @param {function} callback - Called with { userId: { state: 'online'|'offline', lastChanged, ...userData } }
 */
export const subscribeToPresence = (userIds, callback) => {
  if (!userIds || userIds.length === 0) return () => {};

  const presenceData = {};
  const unsubscribers = [];

  userIds.forEach(userId => {
    const userStatusRef = ref(database, `presence/${userId}`);
    
    const unsubscribe = onValue(userStatusRef, (snapshot) => {
      const data = snapshot.val();
      presenceData[userId] = data || { state: 'offline' };
      callback({ ...presenceData });
    });

    unsubscribers.push(unsubscribe);
  });

  // Return cleanup function that unsubscribes all listeners
  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
};

/**
 * Subscribe to a single user's presence
 */
export const subscribeToUserPresence = (userId, callback) => {
  if (!userId) return () => {};

  const userStatusRef = ref(database, `presence/${userId}`);
  
  return onValue(userStatusRef, (snapshot) => {
    const data = snapshot.val();
    callback(data || { state: 'offline' });
  });
};

/**
 * Manually set user offline (for logout)
 */
export const setUserOffline = (userId) => {
  if (!userId) return;
  
  const userStatusRef = ref(database, `presence/${userId}`);
  set(userStatusRef, {
    state: 'offline',
    lastChanged: serverTimestamp()
  });
};
