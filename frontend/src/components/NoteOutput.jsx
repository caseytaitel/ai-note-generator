export default function NoteOutput({ text }) {
    if (!text) return null;
    return (
      <div className="card fade-in" aria-live="polite">
        <h3 style={{ color: "var(--gold)" }}>AI Notes</h3>
        <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{text}</pre>
      </div>
    );
  }
  