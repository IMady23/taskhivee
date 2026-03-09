import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Subscribe to bugs for a team (Real-time)
 */
export const subscribeToTeamBugs = (teamId, callback) => {
    if (!teamId) return () => { };

    try {
        const q = query(
            collection(db, "bugs"),
            where("teamId", "==", teamId),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const bugs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            callback(bugs);
        }, (error) => {
            console.error("❌ Error subscribing to team bugs:", error);
            callback([]);
        });

        return unsubscribe;
    } catch (error) {
        console.error("❌ Setup error for bugs subscription:", error);
        return () => { };
    }
};

/**
 * Fetch all bugs for a team (One-time fetch)
 */
export const getTeamBugs = async (teamId) => {
    try {
        const q = query(
            collection(db, "bugs"),
            where("teamId", "==", teamId),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("❌ Error fetching team bugs:", error);
        throw error;
    }
};

/**
 * Report a new bug
 */
export const createBug = async (bugData) => {
    try {
        const payload = {
            ...bugData,
            status: bugData.status || "Open",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        const ref = await addDoc(collection(db, "bugs"), payload);
        return { id: ref.id, ...payload };
    } catch (error) {
        console.error("❌ Error creating bug:", error);
        throw error;
    }
};

/**
 * Update bug status
 */
export const updateBugStatus = async (bugId, status) => {
    try {
        const ref = doc(db, "bugs", bugId);
        await updateDoc(ref, {
            status,
            updatedAt: serverTimestamp()
        });
        const snap = await getDoc(ref);
        return { id: snap.id, ...snap.data() };
    } catch (error) {
        console.error("❌ Error updating bug status:", error);
        throw error;
    }
};

/**
 * Hard delete a bug
 */
export const deleteBug = async (bugId) => {
    try {
        const ref = doc(db, "bugs", bugId);
        await deleteDoc(ref);
    } catch (error) {
        console.error("❌ Error deleting bug:", error);
        throw error;
    }
};

export default {
    subscribeToTeamBugs,
    getTeamBugs,
    createBug,
    updateBugStatus,
    deleteBug
};
