import { db } from '../config/firebase';
import { collection, addDoc, getDoc, doc, serverTimestamp } from 'firebase/firestore';

/**
 * Fallback file storage using Firestore (works without Storage rules)
 * Stores files as Base64 in Firestore
 * Limitation: Files should be < 1MB for best performance
 */

const COLLECTION_NAME = 'taskSubmissions';

/**
 * Convert file to Base64
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Upload task submission file to Firestore
 * @param {string} taskId - Task ID
 * @param {File} file - File to upload
 * @param {string} userId - User ID who is uploading
 * @returns {Promise<{url: string, name: string, size: number, type: string, docId: string}>}
 */
export const uploadTaskSubmission = async (taskId, file, userId) => {
  try {
    // Check file size (recommend < 1MB for Firestore)
    if (file.size > 1024 * 1024) {
      throw new Error('File size should be less than 1MB. Please use a smaller file or compress it.');
    }
    
    // Convert file to Base64
    const base64Data = await fileToBase64(file);
    
    // Store in Firestore
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      taskId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileData: base64Data,
      uploadedBy: userId,
      uploadedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });
    
    return {
      url: base64Data, // Return Base64 data URL
      name: file.name,
      size: file.size,
      type: file.type,
      docId: docRef.id,
      path: `${COLLECTION_NAME}/${docRef.id}`
    };
  } catch (error) {
    console.error('Error uploading task submission to Firestore:', error);
    
    if (error.message.includes('size')) {
      throw error; // Re-throw size error with original message
    }
    
    throw new Error('Failed to upload file. Please try again.');
  }
};

/**
 * Get task submission file from Firestore
 * @param {string} docId - Document ID
 * @returns {Promise<{url: string, name: string, size: number, type: string}>}
 */
export const getTaskSubmission = async (docId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, docId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Submission not found');
    }
    
    const data = docSnap.data();
    
    return {
      url: data.fileData,
      name: data.fileName,
      size: data.fileSize,
      type: data.fileType
    };
  } catch (error) {
    console.error('Error getting task submission:', error);
    throw new Error('Failed to retrieve file. Please try again.');
  }
};

/**
 * Delete task submission from Firestore
 * @param {string} docId - Document ID
 * @returns {Promise<boolean>}
 */
export const deleteTaskSubmission = async (docId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, docId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting task submission:', error);
    return false;
  }
};
