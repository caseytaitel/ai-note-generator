API: POST /api/notes/ai
Rate limit: 20 req/min/IP
Timeout: 20s soft timeout with 2 retries
Frontend dev: cd frontend && npm run dev

W6 Notes:
Model access pattern: React → Express → OpenAI → Express → React.
Security: Keys live in .env (never in client). Backend proxies all AI calls.
Reliability: Timeouts (Promise.race) + retries (exponential backoff) + server rate limiting.
Prompting: Clear, scoped template + low temperature for consistency.
UX hygiene: Loading state, client cooldown, validation, copy/download actions.
Structure: Routes (I/O + validation) vs Services (business logic).