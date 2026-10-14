# Bugs Axis

Find code in the diff under review that will do the wrong thing at runtime.
Report only concrete failures you can trigger, not style, security, or spec
gaps; the other axes own those.

Check each changed hunk, and the unchanged callers and callees it affects:

- **Logic and edge cases**: empty, null, zero, boundary, and duplicate inputs;
  off-by-one errors; inverted conditions; wrong units or time zone (application
  dates are `timestamp` without time zone; `new Date(body.x)` can be invalid).
- **Error handling**: swallowed errors, missing `await`, unhandled rejections,
  and failures that leave partial state (for example a report left `pending`, or
  rows deleted before the replacement insert fails).
- **Concurrency and async**: races, stale reads, double submits, retries without
  idempotency, and ordering assumptions between requests (report processing,
  suggestion and OKR regeneration, the wizard's multi-step flow).
- **Data integrity**: writes that should share a transaction, lost updates,
  cascades (`onDelete: 'cascade'`) that remove more than intended, and Drizzle
  migrations that break existing rows or drift from `app/db/schema.ts`.
- **Next.js and React**: server versus client component boundaries, `params` and
  `cookies()` being async in this Next version, stale React state or effects,
  SWR keys that fail to revalidate or `mutate` calls on the wrong key,
  optimistic updates that are never reconciled, hydration mismatches from
  `localStorage` reads (AI settings are read client-side).
- **AI calls**: provider, model, or header handling that throws for an unlisted
  value, LLM JSON that is parsed and used without a shape check, missing
  truncation of large pasted text, and results saved to the wrong
  application/resume pair.
- **i18n**: user-facing strings added without a `locales/` entry, or keys used
  but not defined.
- **Types that lie**: casts, non-null assertions (`process.env.X!`), and `any`
  that hide a runtime shape mismatch.
- **Regressions**: changed contracts whose unchanged callers now break (an API
  response shape consumed by components, `e2e/integration` specs, or another
  route).

For each finding give: `file:line`, the trigger, the observable consequence, the
smallest fix, and the test that would fail before the fix (a Playwright
spec under `project/e2e/integration/`). Severity:

- `high`: data loss, another user's data affected, crash or blank page on a
  common path.
- `medium`: wrong result or crash on a realistic edge case.
- `low`: unlikely edge case or latent risk.

If nothing qualifies, return no findings and name the riskiest area you checked.
