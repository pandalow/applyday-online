# Admin

Sources: `app/(protected)/admin/page.tsx`, `app/api/admin/users/route.ts`, `proxy.ts`
Relies on: `Total Users`, `Admins`, `/api/admin/users`
Verified live: not yet

## Sub-features

- Users table with counts (Total Users, Admins, Regular Users) and a role badge
  per user; read-only.
- GET `/api/admin/users` returns 403 for a non-admin session.

## How to get to it (user POV)

- Navigation **Admin** link, shown only when `role === 'admin'`; direct URL
  `/admin`. `proxy.ts` sends a non-admin to `/app`.

## Driving it

```text
as user: open /admin → redirected to /app; no Admin nav link
as admin: open /admin → counts and table render
```

## Gotchas

- Needs an admin account; if you have none, mark undriven.
- No e2e spec covers admin.
