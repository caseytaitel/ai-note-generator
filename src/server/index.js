import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import aiRouter from "./routes/ai.js";

// Create server + configure to handle JSON
const app = express();
app.use(express.json());

// CORS for local dev; tighten later if needed
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  methods: ["GET", "POST", "OPTIONS"],
}));

// Health check
app.get("/health", (req, res) => res.json({ ok: true }));

// Limit: 20 requests per IP per 1 minute
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Mount routes
app.use("/api", aiLimiter, aiRouter);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
