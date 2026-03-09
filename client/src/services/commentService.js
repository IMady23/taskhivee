import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';

const COLLECTION_NAME = 'taskComments';

/**
 * Add a comment to a task
 * @param {Object} commentData - { taskId, userId, userName, userRole, comment }
 * @returns {Promise<Object>}
 */
export const addTaskComment = async (commentData) => {
  try {
    const payload = {
      taskId: commentData.taskId,
      userId: commentData.userId,
      userName: commentData.userName,
      userRole: commentData.userRole,
      comment: commentData.comment,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
    
    return {
      id: docRef.id,
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

/**
 * Subscribe to comments for a specific task (real-time)
 * @param {string} taskId
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
export const subscribeToTaskComments = (taskId, callback) => {
  if (!taskId) return () => {};

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('taskId', '==', taskId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(comments);
    }, (error) => {
      console.error('Error subscribing to comments:', error);
      callback([]);
    });
  } catch (error) {
    console.error('Error setting up comment subscription:', error);
    return () => {};
  }
};

/**
 * Update a comment
 * @param {string} commentId
 * @param {string} newComment
 * @returns {Promise<void>}
 */
export const updateTaskComment = async (commentId, newComment) => {
  try {
    const commentRef = doc(db, COLLECTION_NAME, commentId);
    await updateDoc(commentRef, {
      comment: newComment,
      updatedAt: serverTimestamp(),
      edited: true
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

/**
 * Delete a comment
 * @param {string} commentId
 * @returns {Promise<void>}
 */
export const deleteTaskComment = async (commentId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, commentId));
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

/**
 * Get comment count for a task
 * @param {string} taskId
 * @returns {Promise<number>}
 */
export const getCommentCount = async (taskId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('taskId', '==', taskId)
    );
    
    return new Promise((resolve) => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        resolve(snapshot.size);
        unsubscribe();
      });
    });
  } catch (error) {
    console.error('Error getting comment count:', error);
    return 0;
  }
};

export default {
  addTaskComment,
  subscribeToTaskComments,
  updateTaskComment,
  deleteTaskComment,
  getCommentCount
};
