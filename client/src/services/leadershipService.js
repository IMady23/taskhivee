import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    getDoc,
    doc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { API_BASE_URL } from '../config';

/**
 * Leadership Service
 * Handles professional leadership transition requests.
 */

/**
 * Submit a leadership transition request
 * @param {string} teamId 
 * @param {string} requestedBy - User ID of the member requesting
 * @param {string} proposedLeaderEmail 
 * @param {string} reason 
 */
export const submitLeadershipRequest = async (teamId, requestedBy, proposedLeaderEmail, reason) => {
    try {
        const docRef = await addDoc(collection(db, 'leadershipRequests'), {
            teamId,
            requestedBy,
            proposedLeaderEmail,
            reason,
            status: 'pending',
            createdAt: serverTimestamp()
        });

        // Professional Email Notification
        try {
            const [userSnap, teamSnap] = await Promise.all([
                getDoc(doc(db, 'users', requestedBy)),
                getDoc(doc(db, 'teams', teamId))
            ]);

            const requesterName = userSnap.exists() ? userSnap.data().name : 'A team member';
            const teamName = teamSnap.exists() ? teamSnap.data().name : 'TaskHive Team';
            const teamCode = teamSnap.exists() ? teamSnap.data().teamId : '';

            await fetch(`${API_BASE_URL}/email/leadership-transition`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: proposedLeaderEmail,
                    proposedBy: requesterName,
                    reason,
                    teamName,
                    teamCode
                })
            });
        } catch (emailErr) {
            console.warn('⚠️ Transition email failed (optional step):', emailErr);
        }

        return docRef.id;
    } catch (error) {
        console.error('Error submitting leadership request:', error);
        throw error;
    }
};

/**
 * Get pending request for a specific email
 * @param {string} email 
 */
export const getPendingRequestByEmail = async (email) => {
    try {
        const q = query(
            collection(db, 'leadershipRequests'),
            where('proposedLeaderEmail', '==', email),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;

        return {
            id: querySnapshot.docs[0].id,
            ...querySnapshot.docs[0].data()
        };
    } catch (error) {
        console.error('Error getting leadership request by email:', error);
        return null;
    }
};

/**
 * Update a leadership request status
 */
export const updateLeadershipRequest = async (requestId, updates) => {
    try {
        const docRef = doc(db, 'leadershipRequests', requestId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error updating leadership request:', error);
        throw error;
    }
};

/**
 * Get all pending requests for a team
 * @param {string} teamId 
 */
export const getPendingRequests = async (teamId) => {
    try {
        const q = query(
            collection(db, 'leadershipRequests'),
            where('teamId', '==', teamId),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting leadership requests:', error);
        return [];
    }
};
