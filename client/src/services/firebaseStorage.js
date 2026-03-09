import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Upload task submission file to Firebase Storage
 * @param {string} taskId - Task ID
 * @param {File} file - File to upload
 * @param {string} userId - User ID who is uploading
 * @returns {Promise<{url: string, name: string, size: number, type: string}>}
 */
export const uploadTaskSubmission = async (taskId, file, userId) => {
  try {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `task-submissions/${taskId}/${fileName}`;
    
    const storageRef = ref(storage, filePath);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file, {
      customMetadata: {
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        taskId: taskId
      }
    });
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      name: file.name,
      size: file.size,
      type: file.type,
      path: filePath
    };
  } catch (error) {
    console.error('Error uploading task submission:', error);
    throw new Error('Failed to upload file. Please try again.');
  }
};

/**
 * Delete task submission from Firebase Storage
 * @param {string} filePath - Path to file in storage
 * @returns {Promise<boolean>}
 */
export const deleteTaskSubmission = async (filePath) => {
  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error('Error deleting task submission:', error);
    return false;
  }
};
