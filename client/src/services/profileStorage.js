export const getLocalProfile = (email) => {
    if (!email) return null;
    try {
        const data = localStorage.getItem(`taskhive_profile_${email}`);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error("Error reading local profile:", error);
        return null;
    }
};

export const saveLocalProfile = (email, base64Image) => {
    if (!email || !base64Image) return;
    try {
        const payload = {
            image: base64Image,
            updatedAt: Date.now()
        };
        localStorage.setItem(`taskhive_profile_${email}`, JSON.stringify(payload));
    } catch (error) {
        console.error("Error saving local profile:", error);
    }
};

export const getLocalChatMessages = (teamId) => {
    if (!teamId) return [];
    try {
        const data = localStorage.getItem(`taskhive_chat_${teamId}`);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Error reading local chat:", error);
        return [];
    }
};

export const saveLocalChatMessage = (teamId, message) => {
    if (!teamId || !message) return;
    try {
        const existing = getLocalChatMessages(teamId);
        const updated = [...existing, message];
        localStorage.setItem(`taskhive_chat_${teamId}`, JSON.stringify(updated));
    } catch (error) {
        console.error("Error saving local chat message:", error);
        // If quota exceeded, we might want to prune old messages
        if (error.name === 'QuotaExceededError') {
            const pruned = updated.slice(-50); // Keep last 50
            localStorage.setItem(`taskhive_chat_${teamId}`, JSON.stringify(pruned));
        }
    }
};
