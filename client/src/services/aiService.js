const API_URL = 'http://localhost:5000/api/ai';

export const askAI = async (prompt, context = {}, attachments = []) => {
    try {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${API_URL}/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                prompt,
                context,
                attachments
            })
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || "Failed to get AI response");
            throw new Error(errorMsg);
        }

        return data;
    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
};

export const executeAIAction = async (action, params, userRole, userId, teamId) => {
    try {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${API_URL}/action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                action,
                params,
                userRole,
                userId,
                teamId
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to execute action");
        }

        return data;
    } catch (error) {
        console.error("AI Action Error:", error);
        throw error;
    }
};
