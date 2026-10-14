# Sign-in, register, reset, roles

Sources: `app/login/page.tsx`, `app/register/page.tsx`, `app/forgot-password/page.tsx`, `app/reset-password/page.tsx`, `app/actions/auth.ts`, `app/api/auth`, `app/lib/session.ts`, `app/lib/dal.ts`, `proxy.ts`
Relies on: `input[name="username"]`, `input[name="password"]`, `Continue with Google`, `/api/auth/login`, `/api/auth/rsa-login`, `/api/auth/challenge`, `/api/auth/google`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/forgot-password`, `/api/auth/reset-password`
Verified live: not yet

## Sub-features

- Username/password login (`/login`), plus an RSA-signature login option that
  fetches a challenge from `/api/auth/challenge`.
- **Continue with Google** (`/api/auth/google` → callback). A Google-only
  account cannot use password login.
- Register (`/register`: username, email, password, optional RSA public key).
- Forgot/reset password (`/forgot-password`, `/reset-password?token=`; link
  expires in 1 hour, sent through Resend).
- Logout from the navigation menu (POST `/api/auth/logout`); the Playwright
  smoke spec expects a redirect to the home page.
- Roles: `admin` or `user` (`session.role`). `proxy.ts` protects `/app`,
  `/report`, `/extract`, `/admin`, `/applications`, `/market`, `/workspace`,
  `/profile`, `/settings`.

## How to get to it (user POV)

- Signed out: any protected URL redirects to `/login`.
- Signed in: `/login` and `/register` redirect to `/app`; `/` stays reachable.
- `/admin` for a non-admin redirects to `/app`.

## Driving it

```text
open /login → fill username, password → submit → lands on /app
GET /api/auth/me → { id, username, email, role }
open /applications/x while signed out → /login
```

Wrong password → "Invalid credentials" (401). Five rapid failures return 429
only when Upstash env vars are set.

## Gotchas

- Forgot-password sends a real email; report delivery unverified without user
  approval.
- Google OAuth needs a real Google account; mark it undriven otherwise.
- Specs: `e2e/global.setup.ts`, `e2e/integration/api.auth.spec.ts`,
  `e2e/smoke.public.spec.ts`, `e2e/smoke.protected.spec.ts`.
