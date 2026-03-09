/**
 * Firebase Firestore Service
 * Handles user profile and data operations
 */
import { db } from '../config/firebase.js';

/**
 * Create user profile in Firestore
 * @param {string} uid - Firebase Auth UID
 * @param {object} userData - User data (name, email, role)
 */
export const createUserProfile = async (uid, userData) => {
  try {
    const userRef = db.collection('users').doc(uid);
    await userRef.set({
      uid,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'member',
      isEmailVerified: userData.isEmailVerified || false,
      avatar: userData.avatar || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    });
    console.log(`✅ User profile created for ${uid}`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating user profile:`, error.message);
    throw error;
  }
};

/**
 * Get user profile from Firestore
 * @param {string} uid - Firebase Auth UID
 */
export const getUserProfile = async (uid) => {
  try {
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error('User profile not found');
    }

    return userDoc.data();
  } catch (error) {
    console.error(`❌ Error getting user profile:`, error.message);
    throw error;
  }
};

/**
 * Update user profile in Firestore
 * @param {string} uid - Firebase Auth UID
 * @param {object} updates - Data to update
 */
export const updateUserProfile = async (uid, updates) => {
  try {
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      ...updates,
      updatedAt: new Date(),
    });
    console.log(`✅ User profile updated for ${uid}`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating user profile:`, error.message);
    throw error;
  }
};

/**
 * Delete user profile from Firestore
 * @param {string} uid - Firebase Auth UID
 */
export const deleteUserProfile = async (uid) => {
  try {
    await db.collection('users').doc(uid).delete();
    console.log(`✅ User profile deleted for ${uid}`);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting user profile:`, error.message);
    throw error;
  }
};

/**
 * Get user profile by email
 * @param {string} email - User email
 */
export const getUserByEmail = async (email) => {
  try {
    const snapshot = await db
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data();
  } catch (error) {
    console.error(`❌ Error getting user by email:`, error.message);
    throw error;
  }
};

/**
 * Get all users with a specific role
 * @param {string} role - User role (leader/member)
 */
export const getUsersByRole = async (role) => {
  try {
    const snapshot = await db
      .collection('users')
      .where('role', '==', role)
      .get();

    const users = [];
    snapshot.forEach((doc) => {
      users.push(doc.data());
    });

    return users;
  } catch (error) {
    console.error(`❌ Error getting users by role:`, error.message);
    throw error;
  }
};

/**
 * Mark email as verified
 * @param {string} uid - Firebase Auth UID
 */
export const markEmailVerified = async (uid) => {
  try {
    await updateUserProfile(uid, {
      isEmailVerified: true,
    });
    return true;
  } catch (error) {
    console.error(`❌ Error marking email as verified:`, error.message);
    throw error;
  }
};

export default {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getUserByEmail,
  getUsersByRole,
  markEmailVerified,
};
