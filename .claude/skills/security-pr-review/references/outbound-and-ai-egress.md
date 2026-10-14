# Outbound Email And AI Egress

ApplyDay sends data out in two ways.

**Email (Resend, `app/lib/email.ts`)**: only the password reset email today.
- the recipient is the `users.email` of the row found by lookup, not an address
  re-read from the request
- the reset URL uses `NEXTAUTH_URL` (fallback `http://localhost:3000`); a
  production deploy without it would mail localhost links, and the link must
  never be derived from a request header
- subject and body must not embed user-supplied HTML unescaped
- any new email (verification, notification) is rate limited, sent only to a
  verified owner address, and re-derives the recipient server-side at send time
- the endpoint must not reveal whether the address is registered (it returns
  `{ ok: true }` either way; keep status and, as far as practical, timing the
  same)

**LLM providers (`app/lib/ai/llm.ts`, LangChain.js)**: resume text, JD text, and
profile data are sent to OpenAI, Anthropic, Google, or DeepSeek using the user's
own key, chosen by the user in Settings.
- provider and model come from headers (`X-AI-Provider`, `X-AI-Model`); the
  server must only call provider hosts it constructs itself. Any change that
  lets a header or body choose a base URL, endpoint, or extra headers is SSRF and
  key exfiltration (DeepSeek already sets a fixed `baseURL`)
- the key is used for the call and dropped: not stored, logged, cached, or put in
  an error message
- only the data needed for the task is sent (no `passwordHash`, email, or other
  users' rows); new prompts should send the minimum fields
- `timeout` and `maxRetries` stay bounded
- the guest path accepts a key and text with no account: it must not read or
  write the database or reuse a key across requests
- data sent to a third party is a privacy decision: a PR that sends data to a new
  provider, or starts sending a previously unsent field, needs an explicit
  `decision_required` note and an update to the README privacy statement
