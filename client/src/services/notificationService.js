import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  writeBatch,
  limit
} from 'firebase/firestore';

const COLLECTION_NAME = 'notifications';

/**
 * Notification Types
 */
export const NOTIFICATION_TYPES = {
  // Task notifications
  TASK_ASSIGNED: 'task_assigned',
  TASK_STATUS_CHANGED: 'task_status_changed',
  TASK_COMMENT: 'task_comment',
  TASK_DUE_SOON: 'task_due_soon',
  
  // Bug notifications
  BUG_REPORTED: 'bug_reported',
  BUG_STATUS_CHANGED: 'bug_status_changed',
  BUG_DELETED: 'bug_deleted',
  BUG_DELETION_REQUESTED: 'bug_deletion_requested',
  
  // Other notifications
  MEMBER_JOINED: 'member_joined',
  EVENT_REMINDER: 'event_reminder',
  TEAM_UPDATE: 'team_update',
  LEADERSHIP_CHANGE: 'leadership_change'
};

/**
 * Notification Categories for tabs
 */
export const NOTIFICATION_CATEGORIES = {
  TASKS: 'tasks',
  BUGS: 'bugs',
  OTHERS: 'others'
};

/**
 * Get category from notification type
 */
export const getCategoryFromType = (type) => {
  if (type.startsWith('task_')) return NOTIFICATION_CATEGORIES.TASKS;
  if (type.startsWith('bug_')) return NOTIFICATION_CATEGORIES.BUGS;
  return NOTIFICATION_CATEGORIES.OTHERS;
};

/**
 * Create a notification
 * @param {Object} notificationData
 * @returns {Promise<Object>}
 */
export const createNotification = async (notificationData) => {
  try {
    const payload = {
      userId: notificationData.userId,
      teamId: notificationData.teamId,
      type: notificationData.type,
      category: getCategoryFromType(notificationData.type),
      title: notificationData.title,
      message: notificationData.message,
      link: notificationData.link || null,
      metadata: notificationData.metadata || {},
      read: false,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
    
    return {
      id: docRef.id,
      ...payload,
      createdAt: new Date()
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Subscribe to user notifications (real-time)
 * @param {string} userId
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
export const subscribeToNotifications = (userId, callback) => {
  if (!userId) return () => {};

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(notifications);
    }, (error) => {
      console.error('Error subscribing to notifications:', error);
      callback([]);
    });
  } catch (error) {
    console.error('Error setting up notification subscription:', error);
    return () => {};
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId
 * @returns {Promise<void>}
 */
export const markAsRead = async (notificationId) => {
  try {
    const notifRef = doc(db, COLLECTION_NAME, notificationId);
    await updateDoc(notifRef, {
      read: true,
      readAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {Array} notificationIds
 * @returns {Promise<void>}
 */
export const markAllAsRead = async (notificationIds) => {
  try {
    const batch = writeBatch(db);
    
    notificationIds.forEach(id => {
      const notifRef = doc(db, COLLECTION_NAME, id);
      batch.update(notifRef, {
        read: true,
        readAt: serverTimestamp()
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error marking all as read:', error);
    throw error;
  }
};

/**
 * Helper: Create task assignment notification
 */
export const notifyTaskAssigned = async (taskId, taskTitle, assigneeId, assigneeName, assignedBy, teamId) => {
  return createNotification({
    userId: assigneeId,
    teamId,
    type: NOTIFICATION_TYPES.TASK_ASSIGNED,
    title: 'New Task Assigned',
    message: `${assignedBy} assigned you "${taskTitle}"`,
    link: `/tasks/${taskId}`,
    metadata: { taskId, taskTitle }
  });
};

/**
 * Helper: Create task comment notification
 */
export const notifyTaskComment = async (taskId, taskTitle, commenterId, commenterName, assigneeId, teamId) => {
  if (commenterId === assigneeId) return; // Don't notify yourself
  
  return createNotification({
    userId: assigneeId,
    teamId,
    type: NOTIFICATION_TYPES.TASK_COMMENT,
    title: 'New Comment on Task',
    message: `${commenterName} commented on "${taskTitle}"`,
    link: `/tasks/${taskId}`,
    metadata: { taskId, taskTitle, commenterId }
  });
};

/**
 * Helper: Create bug reported notification
 */
export const notifyBugReported = async (bugId, bugTitle, reporterId, reporterName, leaderId, teamId) => {
  return createNotification({
    userId: leaderId,
    teamId,
    type: NOTIFICATION_TYPES.BUG_REPORTED,
    title: 'New Bug Reported',
    message: `${reporterName} reported: "${bugTitle}"`,
    link: `/bugs/${bugId}`,
    metadata: { bugId, bugTitle, reporterId }
  });
};

/**
 * Helper: Create bug deleted notification
 */
export const notifyBugDeleted = async (bugTitle, reporterId, deletedBy, teamId) => {
  return createNotification({
    userId: reporterId,
    teamId,
    type: NOTIFICATION_TYPES.BUG_DELETED,
    title: 'Bug Deleted',
    message: `${deletedBy} deleted your bug: "${bugTitle}"`,
    metadata: { bugTitle }
  });
};

/**
 * Helper: Create member joined notification
 */
export const notifyMemberJoined = async (memberName, leaderId, teamId) => {
  return createNotification({
    userId: leaderId,
    teamId,
    type: NOTIFICATION_TYPES.MEMBER_JOINED,
    title: 'New Team Member',
    message: `${memberName} joined your team`,
    metadata: { memberName }
  });
};

/**
 * Legacy compatibility: sendNotification
 * Maps old notification format to new createNotification
 * @deprecated Use createNotification or specific helper functions instead
 */
export const sendNotification = async (userId, teamId, type, title, message, metadata = {}) => {
  // Map old type format to new NOTIFICATION_TYPES
  let notificationType = type;
  
  // Handle legacy type strings
  if (type === 'bug_report') notificationType = NOTIFICATION_TYPES.BUG_REPORTED;
  else if (type === 'bug_resolved') notificationType = NOTIFICATION_TYPES.BUG_STATUS_CHANGED;
  else if (type === 'bug_deleted') notificationType = NOTIFICATION_TYPES.BUG_DELETED;
  else if (type === 'task_assigned') notificationType = NOTIFICATION_TYPES.TASK_ASSIGNED;
  else if (type === 'task_completed') notificationType = NOTIFICATION_TYPES.TASK_STATUS_CHANGED;
  else if (type === 'task_started') notificationType = NOTIFICATION_TYPES.TASK_STATUS_CHANGED;
  else if (type === 'task_reassigned') notificationType = NOTIFICATION_TYPES.TASK_ASSIGNED;
  else if (type === 'task_deleted') notificationType = NOTIFICATION_TYPES.TASK_STATUS_CHANGED;
  else if (type === 'task_reminder') notificationType = NOTIFICATION_TYPES.TASK_DUE_SOON;
  else if (type === 'team_success') notificationType = NOTIFICATION_TYPES.TEAM_UPDATE;
  else if (type === 'leadership_transition') notificationType = NOTIFICATION_TYPES.LEADERSHIP_CHANGE;
  
  return createNotification({
    userId,
    teamId,
    type: notificationType,
    title,
    message,
    metadata
  });
};

export default {
  createNotification,
  subscribeToNotifications,
  markAsRead,
  markAllAsRead,
  notifyTaskAssigned,
  notifyTaskComment,
  notifyBugReported,
  notifyBugDeleted,
  notifyMemberJoined,
  sendNotification, // Legacy compatibility
  NOTIFICATION_TYPES,
  NOTIFICATION_CATEGORIES,
  getCategoryFromType
};
