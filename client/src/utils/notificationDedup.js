import { db } from '../config/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Notification Deduplication Utility
 * Prevents duplicate notifications from being sent multiple times
 * Enterprise-grade notification management
 */

const DEDUP_COLLECTION = 'notificationDedup';
const EXPIRY_HOURS = 24; // Dedup keys expire after 24 hours

/**
 * Check if a notification with this key has already been sent recently
 * @param {string} notificationKey - Unique key for the notification (e.g., "LEADER_JOINED_teamId_userId")
 * @returns {Promise<boolean>} - True if already sent, false otherwise
 */
export const checkNotificationSent = async (notificationKey) => {
    try {
        const dedupRef = doc(db, DEDUP_COLLECTION, notificationKey);
        const dedupDoc = await getDoc(dedupRef);

        if (!dedupDoc.exists()) {
            return false; // Not sent yet
        }

        const data = dedupDoc.data();
        const sentAt = data.sentAt?.toDate?.() || new Date(data.sentAt);
        const now = new Date();
        const hoursSince = (now - sentAt) / (1000 * 60 * 60);

        // If sent more than EXPIRY_HOURS ago, consider it expired
        if (hoursSince > EXPIRY_HOURS) {
            return false;
        }

        return true; // Already sent recently
    } catch (error) {
        console.error('Error checking notification dedup:', error);
        return false; // On error, allow sending (fail open)
    }
};

/**
 * Mark a notification as sent to prevent duplicates
 * @param {string} notificationKey - Unique key for the notification
 * @param {object} metadata - Optional metadata about the notification
 */
export const markNotificationSent = async (notificationKey, metadata = {}) => {
    try {
        const dedupRef = doc(db, DEDUP_COLLECTION, notificationKey);
        await setDoc(dedupRef, {
            sentAt: serverTimestamp(),
            key: notificationKey,
            ...metadata
        });
    } catch (error) {
        console.error('Error marking notification as sent:', error);
        // Don't throw - this is non-critical
    }
};

/**
 * Clear a deduplication key (useful for testing or manual resets)
 * @param {string} notificationKey
 */
export const clearNotificationDedup = async (notificationKey) => {
    try {
        const dedupRef = doc(db, DEDUP_COLLECTION, notificationKey);
        await setDoc(dedupRef, {
            sentAt: null,
            cleared: true,
            clearedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error clearing notification dedup:', error);
    }
};

/**
 * Generate a standard notification key for common scenarios
 */
export const generateNotificationKey = {
    leaderJoined: (teamId, newLeaderId) => `LEADER_JOINED_${teamId}_${newLeaderId}`,
    taskReassigned: (taskId, timestamp) => `TASK_REASSIGNED_${taskId}_${timestamp}`,
    memberAdded: (teamId, memberId) => `MEMBER_ADDED_${teamId}_${memberId}`,
};
