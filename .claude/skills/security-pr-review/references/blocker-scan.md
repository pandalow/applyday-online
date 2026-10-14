# Blocker Scan

Before reviewing architecture or code quality, answer these questions:

- Can a signed-in user read, change, or delete another user's application,
  resume, job description, report, OKR, suggestion, or profile?
- Can a user-supplied ID (path param, query param, or body field such as
  `applicationId`, `resumeId`, `jobTextId`, `applicationIds`) reach a query
  before ownership is proven, or be stored as a link to another user's row?
- Can an unauthenticated caller reach a route that should call `verifySession()`?
  Remember `proxy.ts` does not cover `/api`, and its `protectedRoutes` list is a
  prefix allowlist: a new top-level page must be added or must verify the
  session itself (the `(protected)` layout does this for pages under it).
- Can a non-admin reach `/admin` or `/api/admin/*`? The role comes from the
  signed JWT, so also check that no route trusts a role from the request body.
- Can a session, reset token, RSA challenge, OAuth state, or API key be forged,
  replayed, leaked, logged, or kept after it should expire?
- Can the guest path (`/api/try/*`, wizard in trial mode) read or write stored
  data, or burn something other than the caller's own key?
- Can a user's AI key (`X-AI-Key`) be stored server-side, logged, echoed in an
  error, or sent anywhere except the chosen LLM provider?
- Can resume or job-description text be sent to a provider or recipient the user
  did not choose?
- Can an uploaded file, prompt-injected text, or LLM output run code, write
  outside the intended row, or be rendered as HTML?
- Can a retry, double submit, or stale request leave duplicate or mismatched rows
  (report processing, suggestions upsert, OKR generation)?

If any answer is yes or unclear, produce a finding before continuing.

For each risky change, identify what proves it safe:
- existing negative test (see `project/e2e/integration/*.spec.ts`)
- new negative test needed
- `verifySession()` plus a `userId` condition in the same query
- DB constraint, unique index, or transaction
- rate limit (`checkRateLimit`) on abusable endpoints
- Playwright flow

When a finding reveals a repeatable pattern, recommend a deterministic
follow-up: a shared `getOwned*` helper in `app/lib`, a Drizzle query wrapper that
always takes `userId`, a zod schema at the edge, a rate-limit key, or an
integration spec.
