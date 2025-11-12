import { Router } from "express";
import { generateSummary } from "../services/aiService.js";

const router = Router();

// POST /api/notes/ai
router.post("/notes/ai", async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Missing or invalid 'prompt'." });
    }
    if (prompt.length > 8000) {
      return res.status(413).json({ error: "Input too large." });
    }

    const text = await generateSummary(prompt);
    return res.json({ text });
  } catch (err) {
    const msg = String(err?.message || "Unknown error");
    const code = err?.status || err?.code;
    const isRate = code === 429 || /rate|429/i.test(msg);
    const isTimeout = err?.name === "TimeoutError" || /aborted|AbortError|timeout/i.test(msg);
    const status = isRate ? 429 : isTimeout ? 504 : 500;
    return res.status(status).json({ error: msg });
  }
});

export default router;
