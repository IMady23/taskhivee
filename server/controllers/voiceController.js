import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const DAILY_API_KEY = process.env.DAILY_API_KEY;

/**
 * Voice Controller - Daily.co Integration
 * Handles room creation and token generation
 */

// Create a meeting room
export const createRoom = async (req, res) => {
    try {
        const { teamId } = req.body;

        if (!teamId) {
            return res.status(400).json({ error: "Team ID is required" });
        }

        const roomName = `taskhive-${teamId}`;

        const response = await fetch('https://api.daily.co/v1/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DAILY_API_KEY}`
            },
            body: JSON.stringify({
                name: roomName,
                properties: {
                    enable_chat: true,
                    start_audio_off: false,
                    start_video_off: true, // Audio-only by default
                    exp: Math.round(Date.now() / 1000) + 3600 // 1 hour expiry
                }
            })
        });

        const data = await response.json();

        // If room already exists, it might return 400. We should handle that.
        if (!response.ok && data.error === "invalid-request-error" && data.message.includes("already exists")) {
            // Get existing room info
            const getResponse = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
                headers: { 'Authorization': `Bearer ${DAILY_API_KEY}` }
            });
            const existingRoom = await getResponse.json();
            return res.json({ roomUrl: existingRoom.url, roomName: existingRoom.name });
        }

        if (!response.ok) {
            throw new Error(data.message || "Failed to create Daily.co room");
        }

        res.json({ roomUrl: data.url, roomName: data.name });

    } catch (error) {
        console.error("Daily.co Create Room Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Generate a meeting token for a user
export const joinRoom = async (req, res) => {
    try {
        const { roomName, userName, userId } = req.body;

        if (!roomName || !userName) {
            return res.status(400).json({ error: "Room name and user name are required" });
        }

        const response = await fetch('https://api.daily.co/v1/meeting-tokens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DAILY_API_KEY}`
            },
            body: JSON.stringify({
                properties: {
                    room_name: roomName,
                    user_name: userName,
                    user_id: userId,
                    is_owner: false,
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to generate meeting token");
        }

        res.json({ token: data.token });

    } catch (error) {
        console.error("Daily.co Join Room Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export default { createRoom, joinRoom };
