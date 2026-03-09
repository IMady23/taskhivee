import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Upload a file to Firebase Storage
 * @param {File} file - The file object to upload
 * @param {string} path - The storage path (e.g., 'teams/teamId/chat')
 * @param {string} [fileName] - Optional custom file name
 * @returns {Promise<string>} - The download URL
 */
export const uploadFile = async (file, path, fileName) => {
    if (!file) throw new Error("No file provided");

    try {
        const finalName = fileName || `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `${path}/${finalName}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};

/**
 * Get file metadata (optional wrapper)
 * @param {string} url 
 */
export const getFileMetadata = async (url) => {
    // Placeholder for future metadata extraction if needed
    return { url };
};
