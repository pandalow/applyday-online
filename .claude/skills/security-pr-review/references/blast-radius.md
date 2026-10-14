# Blast Radius

Classify the PR before reviewing details.

- **Low**: UI-only, copy or styling, no auth, no data access, no new network call.
- **Medium**: a server read path scoped to the signed-in user, or a mutation on
  one low-risk entity such as application status or notes.
- **High**: anything that reads or writes resumes, job descriptions, reports, or
  OKRs; an `app/api/**/[id]` route; a schema or migration change; the AI header
  contract (`X-AI-Key` and friends); PDF upload; admin endpoints; Resend email.
- **Critical**: login, register, logout, session creation or verification,
  `proxy.ts`, `dal.ts`, `session.ts`, RSA login, Google OAuth, password reset,
  rate limiting, role checks, or the guest `/api/try/*` path.

For high or critical PRs:
- do not rely on summary review
- trace page or component -> fetch -> route handler or server action -> DAL or
  Drizzle query -> provider or email
- require at least one proof for the main invariant
- prefer a negative test showing the wrong user, a guest, or a non-admin cannot
  read, mutate, delete, or infer another user's data

Size matters. If a PR touches more than 400 changed lines or crosses more than
two high-risk areas, recommend splitting unless the coupling is necessary and
explained.

Do not waste review attention on formatting, import order, or issues that
`npm run lint` or `npx tsc --noEmit --skipLibCheck` already catch.
