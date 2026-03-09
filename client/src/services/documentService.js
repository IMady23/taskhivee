
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    getDocs,
    serverTimestamp,
    getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { auth } from '../config/firebase';

const COLLECTION_NAME = 'documents';

/**
 * Create a new document
 * @param {Object} docData 
 */
export const createDocument = async (docData) => {
    try {
        console.log('[DocumentService] Creating document, auth user:', auth.currentUser?.uid);
        const payload = {
            ...docData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        const ref = await addDoc(collection(db, COLLECTION_NAME), payload);
        return { id: ref.id, ...payload };
    } catch (error) {
        console.error("Error creating document:", error);
        throw error;
    }
};

/**
 * Get all documents for a team
 * @param {string} teamId 
 */
export const getTeamDocuments = async (teamId) => {
    try {
        console.log('[DocumentService] Fetching documents for teamId:', teamId);
        console.log('[DocumentService] Current auth user:', auth.currentUser?.uid);
        console.log('[DocumentService] Auth token exists:', !!auth.currentUser);
        
        // Try without orderBy first to see if it's an index issue
        const q = query(
            collection(db, COLLECTION_NAME),
            where('teamId', '==', teamId)
        );
        const snapshot = await getDocs(q);
        console.log('[DocumentService] Found documents:', snapshot.docs.length);
        
        // Sort in memory instead
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => {
            const aTime = a.updatedAt?.toMillis() || 0;
            const bTime = b.updatedAt?.toMillis() || 0;
            return bTime - aTime;
        });
        
        return docs;
    } catch (error) {
        console.error("[DocumentService] Error details:", {
            code: error.code,
            message: error.message,
            teamId,
            authUser: auth.currentUser?.uid
        });
        throw error;
    }
};

/**
 * Update a document
 * @param {string} docId 
 * @param {Object} updates 
 */
export const updateDocument = async (docId, updates) => {
    try {
        const ref = doc(db, COLLECTION_NAME, docId);
        await updateDoc(ref, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return { id: docId, ...updates }; // structured return for optimistic UI
    } catch (error) {
        console.error("Error updating document:", error);
        throw error;
    }
};

/**
 * Delete a document
 * @param {string} docId 
 */
export const deleteDocument = async (docId) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, docId));
        return true;
    } catch (error) {
        console.error("Error deleting document:", error);
        throw error;
    }
};
