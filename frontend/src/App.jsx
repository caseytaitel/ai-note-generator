import { useState } from "react";
import { generateNoteAI } from "./api";
import NoteOutput from "./components/NoteOutput";

export default function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const MAX = 4000; // client-side sanity cap

  async function handleGenerate() {
    setError("");

    if (!input.trim()) {
      setError("Enter some notes to summarize.");
      return;
    }
    if (input.length > MAX) {
      setError(`Input is too long (${input.length}). Please shorten below ${MAX} chars.`);
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

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(output || "");
    } catch {}
  }

  function handleClear() {
    setInput("");
    setOutput("");
    setError("");
  }

  function handleDownload() {
    const blob = new Blob([output || ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-notes.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container">
      <h1 className="h1">AI Note Generator</h1>
      <p className="sub">Summarize raw notes into Key Points, Decisions, and Action Items.</p>

      <label className="label" htmlFor="notes">Paste meeting notes:</label>
      <textarea
        id="notes"
        className="textarea"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Standup: shipped auth, blocked on billing, decide Stripe vs LemonSqueezy..."
      />

      <div className="row">
        <button className="btn" onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate Notes"}
        </button>
        <button className="btn btn-secondary" onClick={handleClear} disabled={loading && !output}>
          Clear
        </button>
        <button className="btn btn-secondary" onClick={handleCopy} disabled={!output}>
          Copy
        </button>
        <button className="btn btn-secondary" onClick={handleDownload} disabled={!output}>
          Download
        </button>
        <span className="counter">{input.length}/{MAX}</span>
      </div>

      {error && <div className="row" style={{ marginTop: 8 }}><span className="error">{error}</span></div>}

      <NoteOutput text={output} />
    </div>
  );
}