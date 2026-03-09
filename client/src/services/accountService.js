/**
 * Account Management Service
 * Handles account deletion and cleanup
 */

import { auth, db } from '../config/firebase';
import { doc, deleteDoc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';

/**
 * Delete user account completely
 * Removes from Firebase Auth, Firestore, and team
 * @returns {Promise<void>}
 */
export const deleteAccount = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    const userId = currentUser.uid;
    
    // 1. Get user data to find team
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // 2. Remove from team if member of one
      if (userData.teamId) {
        const teamDocRef = doc(db, 'teams', userData.teamId);
        const teamDoc = await getDoc(teamDocRef);
        
        if (teamDoc.exists()) {
          // Remove user from team members array
          await updateDoc(teamDocRef, {
            members: arrayRemove(userId)
          });
          
          console.log('[AccountService] Removed user from team');
        }
      }
      
      // 3. Delete Firestore user document
      await deleteDoc(userDocRef);
      console.log('[AccountService] Deleted Firestore user document');
    }
    
    // 4. Delete Firebase Auth account
    await deleteUser(currentUser);
    console.log('[AccountService] Deleted Firebase Auth account');
    
    // 5. Clear local storage
    localStorage.clear();
    sessionStorage.clear();
    
    return { success: true, message: 'Account deleted successfully' };
    
  } catch (error) {
    console.error('[AccountService] Error deleting account:', error);
    
    // Handle specific errors
    if (error.code === 'auth/requires-recent-login') {
      throw new Error('For security, please log out and log in again before deleting your account.');
    }
    
    throw new Error(error.message || 'Failed to delete account');
  }
};

/**
 * Check if user can delete account
 * Leaders cannot delete if they have team members
 * @returns {Promise<{canDelete: boolean, reason?: string}>}
 */
export const canDeleteAccount = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { canDelete: false, reason: 'Not logged in' };
    }
    
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { canDelete: true };
    }
    
    const userData = userDoc.data();
    
    // If leader, check if team has other members
    if (userData.role === 'leader' && userData.teamId) {
      const teamDocRef = doc(db, 'teams', userData.teamId);
      const teamDoc = await getDoc(teamDocRef);
      
      if (teamDoc.exists()) {
        const teamData = teamDoc.data();
        const otherMembers = (teamData.members || []).filter(id => id !== currentUser.uid);
        
        if (otherMembers.length > 0) {
          return { 
            canDelete: false, 
            reason: 'You must remove all team members or delete the team before deleting your account.' 
          };
        }
      }
    }
    
    return { canDelete: true };
    
  } catch (error) {
    console.error('[AccountService] Error checking delete permission:', error);
    return { canDelete: false, reason: 'Error checking permissions' };
  }
};
