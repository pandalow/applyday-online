# User Scoping

ApplyDay is a multi-user app on one Postgres database with no Row Level Security.
The only thing separating two users' rows is the application code. Every
sensitive read or write must be scoped server-side to `session.userId` before
data leaves the server.

The established pattern, to hold new code to:

```ts
const session = await verifySession()           // app/lib/dal.ts
const row = await db.query.applications.findFirst({
  where: and(eq(applications.id, id), eq(applications.userId, session.userId)),
})
if (!row) return Response.json({ error: 'Not found' }, { status: 404 })
```

Tables carrying `userId`: `applications`, `jobDescriptionTexts`, `resumeTexts`,
`analysisReports`, `applicationOkrs`, `resumeSuggestions`, `userProfiles`, and,
per `app/db/schema.ts`, the insight, cover-letter and generation-job tables
(confirm the column when a PR touches one). `jobDescriptions`, `analysisResults`
and `summaries` are owned through a parent (`jobDescriptionTexts`,
`analysisReports`), so a query on them must join or pre-check the parent.

Treat a missing `userId` condition as high severity even if the UI hides the
route.

Flag:
- fetching, updating, or deleting by ID alone, including an `UPDATE`/`DELETE`
  whose `where` omits `userId` after an ownership pre-check (check-then-act with
  a looser write is fragile)
- a body or query field that names another entity (`applicationId`, `resumeId`,
  `jobTextId`, `applicationIds`) and is stored or used without proving the caller
  owns it
- mass assignment: spreading `request.json()` into `.set()` or `.values()`
  (`jd/[id]` strips only `id`, `jobTextId`, `createdAt`); anything that could
  later add `userId`, `role`, `passwordHash`, `googleId`, or `rsaPublicKey`
  to the spread is critical
- unscoped joins, `with:` relations, stats, search (`ilike`), or list endpoints
- error messages or status codes that reveal a record exists for another user
  (prefer the same 404 for missing and not-owned)
- role checks that trust anything other than the verified session payload, and
  admin endpoints that return more user columns than needed (never
  `passwordHash`, `rsaPublicKey`, or reset tokens)
- client cache keys (SWR) that omit the user, so one user's data renders for the
  next sign-in in the same tab

Require negative tests for high-risk scope changes. A good test signs in as user
A, creates a row, then proves user B gets 404/403 on GET, PATCH, PUT, DELETE and
on any action that takes that ID in the body. Existing specs in
`project/e2e/integration/` are the place to extend.

Prefer a small helper that takes `userId` and returns the owned row. If the same
ownership query is copied across several routes, flag the missing locality.
