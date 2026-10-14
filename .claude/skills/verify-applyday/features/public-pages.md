# Public pages

Sources: `app/page.tsx`, `app/layout.tsx`, `components/Footer.tsx`, `proxy.ts`
Relies on: `Continue with Google`, `/login`, `/register`, `/wizard`
Verified live: not yet

## Sub-features

- Landing page `/` with hero and calls to action, readable signed in or out.
- Public auth pages: `/login`, `/register`, `/forgot-password`,
  `/reset-password`.

## How to get to it (user POV)

- Open `/` while signed out. `proxy.ts` treats `/`, `/login`, `/register` as
  public; a signed-in user is redirected from `/login` and `/register`, not `/`.

## Driving it

```text
open / → snapshot → confirm hero + links to /login, /register, /wizard
open /app signed out → expect redirect to /login
```

## Gotchas

- Spec: `e2e/smoke.public.spec.ts` (home, login, register, forgot-password,
  guest wizard banner, protected redirects).
