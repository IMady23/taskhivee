import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Badge Definitions
 */
export const BADGES = {
    BUG_SLAYER: {
        id: 'bug_slayer',
        name: 'Bug Slayer',
        description: 'Resolved 5 or more bugs',
        icon: '⚔️',
        criteria: (tasks, bugs) => bugs.filter(b => b.status === 'Resolved' || b.status === 'Fixed').length >= 5
    },
    TASK_FINISHER: {
        id: 'task_finisher',
        name: 'Task Finisher',
        description: 'Completed 10 or more tasks',
        icon: '✅',
        criteria: (tasks, bugs) => tasks.filter(t => t.status === 'Done').length >= 10
    },
    STREAK_MASTER: {
        id: 'streak_master',
        name: 'Activity Streak',
        description: 'Active for 3 consecutive days',
        icon: '🔥',
        criteria: (tasks, bugs) => {
            // Simplistic streak check based on createdAt of tasks/bugs
            const dates = new Set([
                ...tasks.map(t => new Date(t.createdAt?.seconds * 1000).toDateString()),
                ...bugs.map(b => new Date(b.createdAt?.seconds * 1000).toDateString())
            ].filter(d => d !== "Invalid Date"));

            const sortedDates = Array.from(dates).map(d => new Date(d)).sort((a, b) => a - b);
            if (sortedDates.length < 3) return false;

            let consecutive = 1;
            for (let i = 1; i < sortedDates.length; i++) {
                const diffDays = (sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24);
                if (diffDays === 1) {
                    consecutive++;
                    if (consecutive >= 3) return true;
                } else {
                    consecutive = 1;
                }
            }
            return false;
        }
    }
};

/**
 * Calculate which badges a user is eligible for based on tasks and bugs.
 * @param {Array} tasks 
 * @param {Array} bugs 
 * @returns {Array} List of badge IDs
 */
export const calculateBadges = (tasks, bugs) => {
    const earnedBadges = [];
    for (const badge of Object.values(BADGES)) {
        if (badge.criteria(tasks, bugs)) {
            earnedBadges.push(badge.id);
        }
    }
    return earnedBadges;
};

/**
 * Update user badges in Firestore.
 * @param {string} userId 
 * @param {Array} badges 
 */
export const updateUserBadges = async (userId, badges) => {
    if (!userId || !badges) return;
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            badges: badges,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error("Error updating user badges:", error);
        throw error;
    }
};

/**
 * Calculate and award new badges (Convenience wrapper)
 */
export const checkAndAwardBadges = async (userId, tasks, bugs) => {
    if (!userId) return [];

    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return [];

        const userData = userSnap.data();
        const existingBadges = userData.badges || [];

        const allEarned = calculateBadges(tasks, bugs);
        const newBadges = allEarned.filter(id => !existingBadges.includes(id));

        if (newBadges.length > 0) {
            const updatedBadges = [...existingBadges, ...newBadges];
            await updateUserBadges(userId, updatedBadges);

            // Notify User for each new badge
            const { sendNotification } = await import('./notificationService');
            for (const badgeId of newBadges) {
                const badge = Object.values(BADGES).find(b => b.id === badgeId);
                if (badge) {
                    await sendNotification(
                        userId,
                        userData.teamId || 'system',
                        'team_success', // Green
                        'Badge Unlocked!',
                        `Congratulations! You've earned the "${badge.name}" badge ${badge.icon}`
                    ).catch(e => console.warn("Failed to send badge notification:", e));
                }
            }
            return newBadges; // Return newly awarded badges for extra local feedback if needed
        }

        return [];
    } catch (error) {
        console.error("Error checking/awarding badges:", error);
        return [];
    }
};
