# Providers, Environment, And Dependencies

Providers ApplyDay actually uses, and what to check for each:

- **Supabase Postgres** via `postgres` + Drizzle (`app/lib/drizzle.ts`):
  `DATABASE_URL` (transaction pooler, port 6543, `prepare: false`) at runtime;
  `DIRECT_URL` only for `drizzle-kit` migrations. No Row Level Security, so
  application queries are the only isolation (see `user-scoping.md`). Never run
  `db:push`, `db:migrate`, or any write against the hosted database as part of a
  review.
- **Resend** (`RESEND_API_KEY`, `EMAIL_FROM`): server-only; see
  `outbound-and-ai-egress.md`.
- **Upstash Redis** (`UPSTASH_REDIS_REST_URL`/`TOKEN`): rate limiting. It fails
  open when unset; a deploy that forgets the variables silently removes brute
  force protection.
- **Google OAuth** (`GOOGLE_CLIENT_ID`/`SECRET`, `arctic`): the redirect URI is
  built from `NEXTAUTH_URL`/`NEXT_PUBLIC_BASE_URL`; check state and PKCE handling
  per `auth-session.md`.
- **LLM providers** (OpenAI, Anthropic, Google GenAI, DeepSeek): per-user keys in
  the request header. `.env.example` lists `OPENAI_API_KEY`, `AI_PROVIDER` and
  similar, but no code reads them today ("BYOK, never on the server" is the
  README promise). A PR that starts using a platform-owned key adds a path where
  the platform pays, so it needs per-user rate limits and the key must never
  reach the browser.
- **Vercel** (`project/vercel.json`): environment variables live in Vercel;
  `.env*` files stay out of git (`.gitignore` covers them, but `.env.example` and
  `.env.test.local.example` are tracked and must hold placeholders only).

Check for:
- no secrets, tokens, API keys, connection strings, or test credentials
  committed, printed, snapshotted, or exposed to the browser; this includes
  `.claude/settings.json` allow-rules and README/docs examples
- secrets read only in server-only modules; nothing secret behind a
  `NEXT_PUBLIC_` name; modules reading secrets import `server-only` (as
  `session.ts` and `dal.ts` do)
- `SESSION_SECRET` presence is enforced, not defaulted
- external API failures handled without leaking payloads into user-visible
  errors or logs

For `package.json`, `package-lock.json`, `next.config.ts`, `proxy.ts`, or Drizzle
config changes:
- inspect new packages for necessity, maintenance, and server/client exposure;
  call out supply-chain risk when a small helper replaces simple local code
- `pdf-parse` 1.x is old and unmaintained; treat changes around it with care
- verify the `proxy.ts` matcher and route lists do not make a protected page
  public or expose `/admin` to non-admins
- Next.js 16 here has breaking changes (`proxy.ts` replaces `middleware.ts`);
  confirm conventions in `project/node_modules/next/dist/docs/`
- no security headers are configured in `next.config.ts` (no CSP, frame
  options); a PR that adds third-party scripts or embeds should say so
- build-time code must not leak environment values into client bundles

During review, prefer read-only commands. Do not run commands that upload logs,
diffs, source, secrets, or data externally unless the user explicitly asks.
