export async function generateNoteAI(prompt) {
    const res = await fetch("http://localhost:3001/api/notes/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
  
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json(); // { text }
  }
  