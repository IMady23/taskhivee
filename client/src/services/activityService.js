/**
 * Activity Log Service
 * Handles recording and retrieving project activities/audit logs
 * Phase 6: Activity Log
 */

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Log a new activity
 * @param {string} teamId - The team ID
 * @param {string} type - Activity type (TASK_CREATED, TASK_UPDATED, BUG_REPORTED, BUG_UPDATED, etc.)
 * @param {string} description - Human readable description
 * @param {Object} user - User performing the action { id, name }
 * @param {Object} metadata - Optional additional data { targetId, targetType, etc. }
 */
export const logActivity = async (teamId, type, description, user, metadata = {}) => {
    try {
        if (!teamId) return;

        await addDoc(collection(db, 'activities'), {
            teamId,
            type,
            description,
            performedBy: user.id,
            performedByName: user.name || 'Unknown User',
            performedByPhotoURL: user.photoURL || null,
            metadata,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.warn('Failed to log activity:', error);
        // We don't throw here to avoid blocking the main action
    }
};

/**
 * Get recent activities for a team
 * @param {string} teamId - Team ID
 * @param {number} limitCount - Number of activities to fetch (default 50)
 * @returns {Promise<Array>} List of activities
 */
export const getTeamActivities = async (teamId, limitCount = 50) => {
    try {
        const q = query(
            collection(db, 'activities'),
            where('teamId', '==', teamId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching activities:', error);
        // If index is missing, return empty array safely
        if (error.code === 'failed-precondition') {
            console.warn('Activity Log Index missing - check Firebase Console');
        }
        return [];
    }
};
