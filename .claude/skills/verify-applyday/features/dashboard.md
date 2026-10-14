# Dashboard

Sources: `app/(protected)/app/page.tsx`, `components/ApplicationTable.tsx`, `components/ApplicationControls.tsx`, `components/Dashboard.tsx`, `components/ApplicationItem.tsx`, `app/api/applications/route.ts`, `app/api/applications/[id]/route.ts`, `app/api/applications/stats/route.ts`, `app/(protected)/insight/page.tsx`, `app/(protected)/report/page.tsx`, `app/(protected)/resume/page.tsx`
Relies on: `Dashboard`, `Company *`, `Job Title *`, `Toggle detail`, `/api/applications`, `/api/applications/stats`
Verified live: not yet

## Sub-features

- Stats (total, per-status counts, recent activity) from `/api/applications/stats`.
- Application table: add row, inline edit company/title/status/channel/notes
  (PATCH `/api/applications/<id>`), delete, search and status filter.
- Status pipeline values: `prepared`, `applied`, `interviewed`, `offered`,
  `rejected`.
- Each row has a link named like "Open" (spec matches `/open/i`) to `/applications/<id>`.
- Empty state when the user has no applications.
- Redirect-only routes: `/insight` → `/app`, `/report` → `/insight`,
  `/resume` → `/app`.

## How to get to it (user POV)

- Sign in → lands on `/app`; navigation **Dashboard**.

## Driving it

```text
open /app → New Application → fill Company, Job Title → save
change status → reload → status persists
search "[e2e]" → only tagged rows → delete them
```

Requests: POST `/api/applications` (201), PATCH `/api/applications/<id>`,
DELETE (204).

## Gotchas

- Users only see their own applications; another user's id returns 404.
- Specs: `e2e/integration/ui.dashboard.spec.ts`,
  `e2e/integration/api.applications.spec.ts`.
