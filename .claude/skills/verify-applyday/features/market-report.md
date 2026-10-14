# Market reports

Sources: `app/(protected)/market/page.tsx`, `components/ReportGenerator.tsx`, `components/ReportDetail.tsx`, `components/ReportItem.tsx`, `components/ReportDashboard.tsx`, `components/ReportAnalysis.tsx`, `components/ReportOKR.tsx`, `app/api/reports/route.ts`, `app/api/reports/[id]/route.ts`, `app/api/reports/[id]/process/route.ts`, `app/api/reports/[id]/insight/route.ts`, `app/api/reports/[id]/okrs/route.ts`
Relies on: `Market`, `New Report`, `Generate Report`, `/api/reports`
Verified live: not yet

## Sub-features

- **New Report** toggles a generator panel: pick applications, language
  (English/Chinese), resume; **Generate Report** POSTs `/api/reports` (202) and
  shows a success toast.
- Report list/detail with dashboard, analysis and OKR sections; report status
  `pending` → `done`/`failed`.
- DELETE `/api/reports/<id>` (204).

## How to get to it (user POV)

- Navigation **Market** (`/market`).

## Driving it

```text
open /market → New Report → panel opens, Cancel closes it
select ≥1 application → Generate Report (needs model key) → report appears
POST /api/reports without applicationIds → 400
```

## Gotchas

- Generation needs a user key; report unverified otherwise.
- Spec: `e2e/integration/ui.market.spec.ts`, `e2e/integration/api.reports.spec.ts`.
