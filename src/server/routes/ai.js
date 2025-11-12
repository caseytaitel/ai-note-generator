import { Router } from "express";
import { openai } from "../openai.config.js";

const router = Router();

// Helper prompt
function buildPrompt(rawNotes) {
  return [
    "You are an assistant that turns raw meeting notes into clean, actionable summaries.",
    "",
    "Formatting rules:",
    "- Use three sections with these exact headings: Key Points, Decisions, Action Items.",
    "- Keep bullets short and concrete. Prefer verbs. No filler.",
    "- If a section is empty, still include the heading and write 'None.'",
    "",
    "Constraints:",
    "- Do not invent facts.",
    "- Keep to 120–200 words total unless the input is extremely long.",
    "",
    "Raw notes:",
    rawNotes,
  ].join("\n");
}

// Retry + timeout helpers
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withTimeout(ms, errMsg = "Request timed out") {
  await sleep(ms);
  const e = new Error(errMsg);
  e.name = "TimeoutError";
  throw e;
}

async function withRetries(fn, { retries = 2, baseDelay = 800 } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      const msg = String(err?.message || err);
      const isRate = (err?.status === 429) || /rate|429/i.test(msg);
      if (attempt >= retries || !isRate) throw err;
      await sleep(baseDelay * Math.pow(2, attempt)); // 800ms, 1600ms
      attempt += 1;
    }
  }
}

// POST /api/notes/ai
router.post("/notes/ai", async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Missing or invalid 'prompt'." });
    }

    const messages = [
      { role: "system", content: "You produce clean, structured notes for busy teams." },
      { role: "user", content: buildPrompt(prompt) },
    ];

    const completion = await withRetries(
      () =>
        Promise.race([
          openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            temperature: 0.2,
            max_tokens: 500,
          }),
          withTimeout(20_000),
        ]),
      { retries: 2, baseDelay: 800 }
    );

    const text = completion?.choices?.[0]?.message?.content ?? "";
    if (!text) {
      return res.status(502).json({ error: "Empty response from model." });
    }

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

