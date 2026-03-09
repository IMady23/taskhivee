import { db } from '../config/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';

const COLLECTION = 'teamChats';
const LOCAL_FILE_PREFIX = 'taskhive_chat_file_v1';

const buildLocalFileKey = (teamId, messageId) => `${LOCAL_FILE_PREFIX}:${teamId}:${messageId}`;

const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });

// Subscribe to team chat messages
export const subscribeToChat = (teamId, callback) => {
    if (!teamId) return () => { };

    const q = query(
        collection(db, COLLECTION),
        where('teamId', '==', teamId),
        orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(messages);
    });
};

// Add reaction to a message
export const addReaction = async (messageId, emoji, userId) => {
    try {
        const messageRef = doc(db, COLLECTION, messageId);
        const messageSnap = await getDoc(messageRef);
        
        if (!messageSnap.exists()) {
            throw new Error('Message not found');
        }

        const messageData = messageSnap.data();
        const reactions = messageData.reactions || {};
        
        // Initialize emoji array if it doesn't exist
        if (!reactions[emoji]) {
            reactions[emoji] = [];
        }
        
        // Toggle reaction: remove if already exists, add if not
        if (reactions[emoji].includes(userId)) {
            reactions[emoji] = reactions[emoji].filter(id => id !== userId);
            // Remove emoji key if no users left
            if (reactions[emoji].length === 0) {
                delete reactions[emoji];
            }
        } else {
            reactions[emoji].push(userId);
        }

        await updateDoc(messageRef, { reactions });
    } catch (error) {
        console.error("Error adding reaction:", error);
        throw error;
    }
};

// Remove reaction from a message
export const removeReaction = async (messageId, emoji, userId) => {
    try {
        const messageRef = doc(db, COLLECTION, messageId);
        const messageSnap = await getDoc(messageRef);
        
        if (!messageSnap.exists()) {
            throw new Error('Message not found');
        }

        const messageData = messageSnap.data();
        const reactions = messageData.reactions || {};
        
        if (reactions[emoji]) {
            reactions[emoji] = reactions[emoji].filter(id => id !== userId);
            if (reactions[emoji].length === 0) {
                delete reactions[emoji];
            }
        }

        await updateDoc(messageRef, { reactions });
    } catch (error) {
        console.error("Error removing reaction:", error);
        throw error;
    }
};

// Send a basic text message
export const sendMessage = async ({ teamId, senderId, senderName, senderRole, senderPhotoURL = null, message, type = 'text', fileUrl = null, fileName = null, fileType = null, replyTo = null, mentions = [] }) => {
    try {
        // Validate and sanitize photoURL - only allow HTTP/HTTPS URLs, not base64
        let validPhotoURL = null;
        if (senderPhotoURL && typeof senderPhotoURL === 'string') {
            if (senderPhotoURL.startsWith('http://') || senderPhotoURL.startsWith('https://')) {
                // Only store if it's a reasonable length (< 500 chars)
                if (senderPhotoURL.length < 500) {
                    validPhotoURL = senderPhotoURL;
                }
            }
            // Ignore base64 or overly long URLs
        }

        const messageData = {
            teamId,
            senderId,
            senderName,
            senderRole,
            senderPhotoURL: validPhotoURL,
            type, // 'text' | 'system' | 'file' | 'image'
            message,
            fileUrl,
            fileName, // for files
            fileType, // 'image/png' etc
            createdAt: serverTimestamp()
        };

        // Add optional fields only if they exist
        if (replyTo) {
            messageData.replyTo = replyTo;
        }
        if (mentions && mentions.length > 0) {
            messageData.mentions = mentions;
        }

        await addDoc(collection(db, COLLECTION), messageData);
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};

// Send system message (joined/left)
export const sendSystemMessage = async (teamId, message) => {
    return sendMessage({
        teamId,
        senderId: 'SYSTEM',
        senderName: 'System',
        senderRole: 'system',
        type: 'system',
        message
    });
};

// Upload file and send message
export const sendFileMessage = async (teamId, senderId, senderName, senderRole, senderPhotoURL, file) => {
    try {
        // 1. Create a dummy Doc Ref to get an ID for the storage path
        const messageRef = doc(collection(db, COLLECTION));
        const messageId = messageRef.id;

        // 2. Identify type
        let msgType = 'file';
        let fileType = 'doc';

        if (file.type.startsWith('image/')) {
            msgType = 'image';
            fileType = 'image';
        } else if (file.type === 'application/pdf') {
            fileType = 'pdf';
        }

        // 3. Store file locally (temporary, no DB / no cloud storage).
        const fileLocalKey = buildLocalFileKey(teamId, messageId);
        const dataUrl = await readFileAsDataUrl(file);

        try {
            localStorage.setItem(
                fileLocalKey,
                JSON.stringify({
                    dataUrl,
                    name: file.name,
                    mime: file.type,
                    size: file.size,
                    createdAt: Date.now(),
                })
            );
        } catch {
            // QuotaExceededError (or similar) commonly occurs for large files.
            throw new Error('Local storage is full. Please try a smaller file or clear site data.');
        }

        // 4. Save Message with the pre-generated ID (stores only a localStorage key).
        await setDoc(messageRef, {
            teamId,
            senderId,
            senderName,
            senderRole,
            senderPhotoURL,
            type: msgType,
            message: file.name, // Display name
            fileURL: null, // legacy field (cloud URL). Not used with local-only storage.
            fileName: file.name,
            fileType: fileType,
            fileMime: file.type || null,
            fileSize: file.size || null,
            fileLocalKey,
            createdAt: serverTimestamp()
        });

    } catch (err) {
        console.error("Error uploading file:", err);
        throw err;
    }
};

// Typing Indicators
const TYPING_COLLECTION = 'typingStatus';

export const setTypingStatus = async (teamId, userId, userName, isTyping) => {
    try {
        const typingRef = doc(db, TYPING_COLLECTION, `${teamId}_${userId}`);
        
        if (isTyping) {
            await setDoc(typingRef, {
                teamId,
                userId,
                userName,
                isTyping: true,
                lastTyped: serverTimestamp()
            });
        } else {
            // Remove typing status when user stops typing
            await setDoc(typingRef, {
                teamId,
                userId,
                userName,
                isTyping: false,
                lastTyped: serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Error setting typing status:", error);
    }
};

export const subscribeToTypingStatus = (teamId, currentUserId, callback) => {
    if (!teamId) return () => {};

    const q = query(
        collection(db, TYPING_COLLECTION),
        where('teamId', '==', teamId),
        where('isTyping', '==', true)
    );

    return onSnapshot(q, (snapshot) => {
        const typingUsers = snapshot.docs
            .map(doc => doc.data())
            .filter(data => data.userId !== currentUserId); // Exclude current user
        
        callback(typingUsers);
    });
};
