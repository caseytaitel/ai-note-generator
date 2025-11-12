import { useState } from "react";
import { generateNoteAI } from "./api";

export default function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setError("");
    if (!input.trim()) {
      setError("Enter some notes to summarize.");
      return;
    }
    try {
      setLoading(true);
      const { text } = await generateNoteAI(input);
      setOutput(text);
    } catch (e) {
      setError(e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>AI Note Generator</h1>
      <label htmlFor="notes">Paste meeting notes:</label>
      <textarea
        id="notes"
        rows={8}
        style={{ width: "100%", marginTop: 8 }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Standup: shipped auth, blocked on billing, decide Stripe vs LemonSqueezy..."
      />
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate Notes"}
        </button>
        {error && <span style={{ color: "crimson" }}>{error}</span>}
      </div>

      {output && (
        <div style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 8, whiteSpace: "pre-wrap" }}>
          {output}
        </div>
      )}
    </div>
  );
}
