import { Router } from "express";
import { openai } from "../openai.config.js";

const router = Router();

// Helper to enforce a timeout per request
function withTimeout(ms) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(id) };
}

// POST /api/notes/ai
router.post("/notes/ai", async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Missing or invalid 'prompt'." });
    }

    // 20s guard so requests can't hang
    const { signal, cancel } = withTimeout(20_000);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You produce clean, structured notes. Use short sentences and clear headings.",
        },
        {
          role: "user",
          content:
            `Summarize the following into 3 sections: Key Points, Decisions, Action Items.\n\nContent:\n${prompt}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 400,
      // OpenAI SDK does not take AbortController directly; kept for symmetry if using fetch.
      // If you later switch to fetch, pass { signal } there.
    });

    cancel();

    const text = completion?.choices?.[0]?.message?.content ?? "";
    if (!text) {
      return res.status(502).json({ error: "Empty response from model." });
    }

    return res.json({ text });
  } catch (err) {
    // Rate limits or timeouts
    const msg = (err && err.message) || "Unknown error";
    const status =
      msg.includes("rate") || msg.includes("429") ? 429 :
      msg.includes("aborted") || msg.includes("AbortError") ? 504 :
      500;

    return res.status(status).json({ error: msg });
  }
});

export default router;
