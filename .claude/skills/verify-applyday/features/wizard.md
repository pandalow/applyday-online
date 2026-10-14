# Quick Start wizard

Sources: `app/(nav)/wizard/page.tsx`, `app/api/wizard/extract/route.ts`, `app/api/try/extract/route.ts`, `app/api/try/job-insight/route.ts`, `app/api/auth/check/route.ts`, `app/api/applications/route.ts`, `app/api/extract/route.ts`
Relies on: `Quick Start`, `/api/try/extract`, `/api/try/job-insight`, `/api/wizard/extract`, `X-AI-Key`
Verified live: not yet

## Sub-features

- Signed in (uses the key saved on `/settings`): paste JD → AI extracts company/title (`/api/wizard/extract`) →
  create application (`/api/applications`) → save JD (`/api/extract`) →
  generate Job Insight → link to `/workspace?app=<id>&tab=jobinsight`. A
  resume can be chosen (`/api/resumes`).
- Signed out (trial): inline API key input; steps are `/api/try/extract` and
  `/api/try/job-insight`; results show inline with a sign-up CTA. Nothing is
  saved.
- Step indicator shows idle/running/done/error per step.

## How to get to it (user POV)

- Navigation **Quick Start** (`/wizard`); works signed in or out.

## Driving it

```text
signed out: open /wizard → trial banner + API key field visible
signed in:  open /wizard → no banner, no inline key field, JD textarea + Analyze
```

Running Analyze needs a model key (see SKILL.md); otherwise stop at the
"AI API key required" 400 and report unverified. After a signed-in run, check
the new application row and delete it (tag `[e2e]`).

## Gotchas

- `/api/try/*` is rate limited per IP (5/hour) when Upstash is configured.
- Spec: `e2e/integration/ui.wizard.spec.ts`, `e2e/integration/api.extract.spec.ts`.
