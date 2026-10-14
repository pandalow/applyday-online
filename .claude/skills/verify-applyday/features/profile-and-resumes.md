# Profile and resumes

Sources: `app/(protected)/profile/page.tsx`, `components/ResumeManager.tsx`, `app/api/profile/route.ts`, `app/api/resumes/route.ts`, `app/api/resumes/[id]/route.ts`, `app/api/resumes/[id]/format/route.ts`
Relies on: `Profile`, `/api/profile`, `/api/resumes`, `LinkedIn`
Verified live: not yet

## Sub-features

- Profile form: headline, bio, skills, location, phone, LinkedIn; saved with
  PATCH `/api/profile`.
- Resume manager on the same page: upload PDF (POST `/api/resumes`, 400 for a
  non-PDF or missing `file`), list, delete, AI formatting via
  `/api/resumes/<id>/format`.

## How to get to it (user POV)

- Avatar menu → **Profile** (`/profile`).

## Driving it

```text
open /profile → edit headline → save → reload → value persists
upload a small test PDF → appears in list → delete it
```

## Gotchas

- Upload only your own test PDF; delete it afterwards.
- Format needs a model key.
- Specs: `e2e/integration/api.profile.spec.ts`, `e2e/integration/api.resumes.spec.ts`.
