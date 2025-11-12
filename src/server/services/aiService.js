// src/server/services/aiService.js
import { openai } from "../openai.config.js";

// ---- Prompt helper
export function buildPrompt(rawNotes) {
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

// ---- Retry + timeout helpers
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
      await sleep(baseDelay * Math.pow(2, attempt)); // 800, 1600
      attempt += 1;
    }
  }
}

// ---- Public service: generate notes summary
export async function generateSummary(rawNotes) {
  const messages = [
    { role: "system", content: "You produce clean, structured notes for busy teams." },
    { role: "user", content: buildPrompt(rawNotes) },
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
    const e = new Error("Empty response from model.");
    e.status = 502;
    throw e;
  }
  return text;
}