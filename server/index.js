import express from "express";
import dotenv from "dotenv";
import fs from 'fs';
import cors from "cors";
import { createServer } from "http";
import { initSocket } from "./socket.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import bugRoutes from "./routes/bugRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import voiceRoutes from "./routes/voiceRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";

import "./config/firebase.js"; // Initialize Firebase Admin

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// DEBUG LOGGER
app.use((req, res, next) => {
    try {
        const msg = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;
        fs.appendFileSync('request_debug.log', msg);
        console.log(msg.trim());
    } catch (e) { }
    next();
});

// ✅ API routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/bugs", bugRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/members", memberRoutes);


// ✅ Server + Socket setup
const server = createServer(app);
const io = initSocket(server); // socket.io initialization

// Attach io to app for use in controllers
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
