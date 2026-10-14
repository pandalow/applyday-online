# Application workspace

Sources: `app/(protected)/applications/[id]/page.tsx`, `app/(protected)/workspace/page.tsx`, `components/ApplicationDetail.tsx`, `components/InsightJob.tsx`, `components/InsightResume.tsx`, `components/CoverLetter.tsx`, `components/InsightOKR.tsx`, `app/api/jd/route.ts`, `app/api/extract/route.ts`, `app/api/applications/[id]/job-insight/route.ts`, `app/api/applications/[id]/resume-suggestions/route.ts`, `app/api/applications/[id]/cover-letter/route.ts`, `app/api/applications/[id]/okr/route.ts`, `app/api/applications/[id]/generate-all/route.ts`, `app/api/okrs/route.ts`
Relies on: `Job Description`, `Job Insight`, `Resume Tailoring`, `Cover Letter`, `OKR & Prep`, `/api/applications/<id>/generate-all`
Verified live: not yet

## Sub-features

- `/applications/<id>`: five tabs (`jd`, `jobinsight`, `resume`, `coverletter`,
  `okr`) selected by `?tab=`; default `jd`. Header shows company, title, status;
  back link to `/app`.
- `/workspace`: same tabs behind an application picker
  (`?app=<id>&tab=jobinsight`, default tab Job Insight).
- JD tab: paste/save text. AI tabs generate and persist insight, resume
  suggestions, cover letter, 30/60/90 OKRs. `generate-all` returns 202 with
  `jobIds`.
- Unknown id shows "application not found" with a link back to `/app`.

## How to get to it (user POV)

- Dashboard row's Open link, navigation workspace link, or a direct URL.

## Driving it

```text
open /applications/<id> → 5 tabs visible → click each, URL ?tab= updates
JD tab: paste text, save → reload → text persists
AI tabs: require a model key (see SKILL.md); otherwise stop at 400 and report unverified
open /applications/unknown-id → not-found message
```

## Gotchas

- Specs: `e2e/integration/ui.workspace.spec.ts`; AI endpoints have no
  automated spec.
- Generated content costs the user's tokens; do not rerun needlessly.
