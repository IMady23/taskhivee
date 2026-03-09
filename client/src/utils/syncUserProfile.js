import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

/**
 * Sync Firebase Auth displayName with Firestore user.name
 * Ensures Auth profile matches Firestore (source of truth)
 * @param {string} uid - User ID
 */
export const syncUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const firestoreName = userDoc.data().name;
      if (auth.currentUser && auth.currentUser.displayName !== firestoreName) {
        await updateProfile(auth.currentUser, { displayName: firestoreName });
        console.log('[SyncUtil] Auth displayName synced with Firestore');
      }
    }
  } catch (error) {
    console.error('[SyncUtil] Failed to sync profile:', error);
  }
};
