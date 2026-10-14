# Authentication And Session

Authority model: a signed HS256 JWT in the httpOnly `session` cookie
(`app/lib/session.ts`, 7 days, payload `userId`, `role`, `username`).
`verifySession()` in `app/lib/dal.ts` is the server-side gate; it redirects to
`/login` instead of returning 401, so API callers see a redirect. `proxy.ts`
only guards page routes (its matcher excludes `api`). Roles are `admin | user`
and are read from the token, not re-read from the database.

Check any change touching these:

- **Gate present**: every `app/api/**` handler other than the intended public
  ones calls `verifySession()` before reading the body or touching the DB. The
  intended public handlers are `auth/*` and `try/*`. `/api/try/*` is the guest
  path: it must stay stateless (no DB reads or writes) and keep its `try` rate
  limit.
- **Route guard**: new top-level pages are added to `protectedRoutes` in
  `proxy.ts` or live under `app/(protected)`, whose layout calls
  `verifySession()`. The `/admin` check must also hold in the handler, not just
  in `proxy.ts`.
- **Session secret and cookie**: `SESSION_SECRET` is required at import time,
  never defaulted, never sent to the client. Cookie stays `httpOnly`,
  `sameSite: 'lax'`, `secure` in production, `path: '/'`. Logout must delete it.
  There is no server-side revocation, so a changed password or role does not end
  existing sessions: flag any change that assumes it does, or that lengthens the
  lifetime.
- **Token confusion**: the RSA challenge is signed with the same secret and
  algorithm as the session token (`type: 'rsa-challenge'`). A new JWT type must
  carry an explicit `type` claim, and `decrypt()` consumers must not accept it
  as a session (a session needs `userId`).
- **Password login**: `bcrypt.compare` against `passwordHash`, generic error for
  unknown user and wrong password, `checkRateLimit(ip, 'login')` first. The
  `login` server action in `app/actions/auth.ts` and `POST /api/auth/login` are
  two entry points to one check, and likewise register and RSA login: a fix to
  one must reach the other, and a guard present on one but not the other is a
  finding.
- **RSA login**: the challenge must be the server-issued, expiring token, the
  signature must verify over its nonce, and it should be single use. An entry
  point that accepts a client-supplied challenge string verifies nothing about
  freshness. RSA login has no rate limit today; a new login path should add one.
- **Google OAuth** (`arctic`): `state` and `code_verifier` cookies are checked and
  cleared, `email_verified` is required, the callback never trusts a
  client-supplied redirect target. Account linking by email is only safe when the
  existing account's email is verified; registration here does not verify email,
  so linking by email deserves scrutiny in any change.
- **Password reset**: token from `randomBytes`, stored, expiring (1 h), deleted on
  use, response never reveals whether the email exists, `forgot` and `reset` rate
  limited. Check the reset link is built from the configured base URL, never from
  a request `Host` header.
- **Rate limiting**: `checkRateLimit` fails open when Upstash env vars are
  absent, and keys on `x-forwarded-for`, which is only trustworthy behind
  Vercel's proxy. A new abusable endpoint (login-like, email-sending, or one that
  spends the caller's LLM credit) needs a limiter key.
- **Input at the edge**: validate with `zod` (as `app/actions/auth.ts` does), not
  casts. Registration should reject a duplicate email with a clean error, not a
  database unique-violation 500.
- **Enumeration**: registration and login messages may reveal that a username or
  email exists; do not widen that.
