import { openai } from "../src/server/openai.config.js";

async function testPrompt() {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "Write a 1-sentence note about focus." }],
  });

  console.log(completion.choices[0].message.content);
}

testPrompt();
