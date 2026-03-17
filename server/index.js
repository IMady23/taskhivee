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

const allowedOrigins = [
    ...(process.env.CORS_ORIGIN || "").split(",").map(o => o.trim()),
    ...(process.env.FRONTEND_URL || "").split(",").map(o => o.trim()),
    "http://localhost:5173"
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(ao => origin.startsWith(ao))) {
            callback(null, true);
        } else {
            console.log("CORS Blocked for origin:", origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};

app.use(cors(corsOptions));
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

// ✅ Health check for Render
app.get("/", (req, res) => {
    res.json({ status: "active", message: "TaskHive API is running" });
});


// ✅ Server + Socket setup
const server = createServer(app);
const io = initSocket(server); // socket.io initialization

// Attach io to app for use in controllers
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
