---
name: verify-applyday
description: Prove an ApplyDay change works in the running web app (browser UI, its /api calls, and database rows) on the local dev server, with recorded evidence. Use after implementing UI or API behaviour, before opening a PR, or to reproduce a bug locally.
---

# Verify ApplyDay

Drive the real app the way a user does, then check what it wrote. Run every
command from `project/`. There is no custom harness: the tools are
`npm run dev`, Playwright, the browser MCP tools, and read-only SQL.

## Steps

1. **Launch.** `npm run dev` (Next 16, `http://localhost:3000`; `proxy.ts` guards
   routes). Needs `project/.env.local` with `DATABASE_URL` and `SESSION_SECRET`.
   Done when `/login` returns 200. If port 3000 already serves another checkout,
   stop and ask; a proof against the wrong server is not evidence.
2. **Map.** Read [`features/README.md`](features/README.md) and every feature
   file the change touches. Done when you have listed each entry point, each
   affected role (`admin`, `user`, signed out), and each success, error, empty,
   and persistence path you will drive.
3. **Sign in.** Credentials live in `.env.test.local` (`E2E_USERNAME`,
   `E2E_PASSWORD`; copy `.env.test.local.example`). Sign in through `/login`
   in the browser, or run `npx playwright test --project=setup` to save a
   session to `e2e/.auth/user.json`. The session is an HS256 JWT in the
   `session` cookie. For the admin path you need an admin account; if none is
   available, report it unverified. Never put credentials in a report.
4. **Drive.** Use the browser MCP tools (snapshot, click, type) through the
   production UI path. One action per step; re-snapshot before reusing a ref.
   Done when every path from step 2 has run through the visible UI.
5. **Proof.** At each end state take a screenshot. Verify side effects too:
   - requests: the `/api/*` call and its status/body (browser network tools, or
     a Playwright trace via `npx playwright test --trace on`);
   - rows: read-only SQL, e.g. `psql "$DATABASE_URL" -c 'select …'`, with the URL
     read from `.env.local`; never print or paste the URL or password.
     `npm run db:studio` is the interactive alternative;
   - a reload round trip that shows the change persisted.
6. **Regression specs.** Run the Playwright project that covers the area:
   `npx playwright test --project=smoke:public`, `smoke:protected`, or
   `integration` (all need a working `.env.test.local`). Add or extend a spec in
   `e2e/` when the change adds behaviour worth keeping.
7. **Cleanup.** Delete rows you created (tag them `[e2e]` in company/title so
   they are findable), stop the dev server you started, and keep screenshots.
   Ask before deleting anything you did not create.

## Proof bar

- Drive the production user path. Use `eval`/direct API calls to inspect state
  after the path ran, never as the action under test.
- **AI is BYOK.** Provider keys live in the browser (`localStorage`
  `applyday_ai_settings`, set on `/settings`) and travel as `X-AI-Key`,
  `X-AI-Provider`, `X-AI-Model` headers. Flows that call a model (wizard,
  Job Insight, Resume, Cover Letter, OKR, reports, generate-all) are `verified`
  only if the user supplied a key to use; otherwise report them unverified and
  stop at the first request that needs the key. `/api/try/*` is the signed-out
  path and is rate limited per IP.
- **Email is real.** `forgot-password` sends through Resend with no simulation.
  Report delivery unverified unless the user approves a send to an address they
  own.
- Upstash rate limiting is a no-op unless `UPSTASH_REDIS_REST_*` is set; a
  429 test needs those variables.
- Only capture your own test data; delete a capture that shows other users' rows.
- Treat each console error and failed request in a capture as a finding until
  you can explain it.
- Open each screenshot and read it before describing it. Say "verified" only
  for flows you drove; everything else is "undriven" with the reason.

## Report

End with an evidence list: one line per feature file in scope, `driven` plus
the screenshot/request/row that proves it, or `undriven` plus the blocker and
the route you tried.

## Gotchas

- The dev database is the shared Supabase Postgres in `DATABASE_URL`. There is
  no per-branch database: run migrations (`npm run db:migrate`) only when the
  change adds one, and ask first.
- `drizzle-kit` reads `DIRECT_URL` for migrations (IPv6); the runtime uses the
  pooler URL.
- Next 16 here differs from older versions; read `node_modules/next/dist/docs/`
  before assuming API behaviour (see `project/AGENTS.md`).
- Several pages redirect: `/insight` → `/app`, `/report` → `/insight`,
  `/resume` → `/app`. A signed-in user hitting `/login` or `/register` is sent
  to `/app`.
