---
name: security-pr-review
description: Review a PR or diff for concrete ApplyDay security and privacy failure paths across changed trust boundaries (auth and session, per-user data scoping, BYOK AI keys, uploads, outbound email and LLM calls).
---

# Security PR Review

Trace changed trust boundaries and answer:

> Can this change expose, send, mutate, delete, infer, or act on one user's data
> or authority for the wrong user, session, or role?

This is read-only unless the user explicitly authorizes fixes or external review
actions.

## Freeze and scope

1. Resolve the reviewed base (the PR's `baseRefName`, a user-supplied fixed
   point, or `origin/main`), `git merge-base HEAD <base>`, `HEAD`, and the
   changed-file list. Review `git diff <base>...HEAD` plus staged, unstaged,
   and untracked changes.
2. Read the root `README.md`, `project/AGENTS.md`, and the touched code's
   neighbours. The app lives in `project/` (Next.js App Router, Drizzle on
   Postgres, `app/api/**` route handlers, server actions in `app/actions`,
   `proxy.ts` route guard). Next.js here has breaking changes: read
   `project/node_modules/next/dist/docs/` before judging a framework behaviour.
3. Inventory every changed source-like file and the supporting code needed to
   understand it. Build a trust-boundary map of actors (guest, user, admin),
   data, authority, ingress, storage, egress, and side effects.
4. Classify blast radius with
   [references/blast-radius.md](references/blast-radius.md), then run
   [references/blocker-scan.md](references/blocker-scan.md) before lower-risk
   analysis.

When called by an orchestrator, consume its frozen reviewer envelope from
[the shared finding contract](../review-fix-loop/references/review-finding-contract.md)
instead of independently choosing a base.

## Trace failure paths

Follow each changed trust boundary end to end through UI, route or server
action, `app/lib/*`, database, provider call, and email as applicable. Load
only matching references:

- login, session cookie, route guard, roles, RSA login, Google OAuth, password
  reset: [auth-session.md](references/auth-session.md)
- object ownership and per-user scoping:
  [user-scoping.md](references/user-scoping.md)
- resumes, job descriptions, API keys, tokens, logs, and browser state:
  [sensitive-data.md](references/sensitive-data.md)
- request bodies, PDF upload, LLM prompt input, and mutations:
  [inputs-uploads-ai.md](references/inputs-uploads-ai.md)
- Resend email and data sent to LLM providers:
  [outbound-and-ai-egress.md](references/outbound-and-ai-egress.md)
- providers, environment, secrets, and dependencies:
  [providers-dependencies.md](references/providers-dependencies.md)
- architecture only where it obscures, duplicates, or weakens authority:
  [architecture-ai-navigability.md](references/architecture-ai-navigability.md)

For every boundary, either identify concrete proof or emit a finding. Proof can
be a server-side `verifySession()` plus a `userId` filter in the query, a
negative test (second user gets 404), a DB constraint, a rate limit, a token
check, or a Playwright integration spec. UI-only checks and the `proxy.ts`
redirect alone are not authority: `proxy.ts` skips `/api`.

## Severity

- `P0`: auth bypass, cross-user data exposure, secret or session leak, account
  takeover, or destructive data loss.
- `P1`: plausible security or privacy exploit, missing server-side ownership
  check on a mutation, or a regression that weakens a guard.
- `P2`: missing authorization edge, missing rate limit on a costly or abusable
  endpoint, or absent proof for a material boundary.
- `P3`: security-relevant maintainability issue that obscures or duplicates an
  authority boundary.

## Findings

Use [the shared finding contract](../review-fix-loop/references/review-finding-contract.md)
with `axis: security`. Each finding must name the affected actor and data or
operation, concrete trigger, observable consequence, why existing checks fail,
smallest safe fix, and focused proving gate. Use `decision_required` for risks
that need an accepted-risk or product decision rather than a code patch.

Lead with findings ordered by native severity, then open questions, gates run,
and residual risk. Recommend `Approve`, `Approve with comments`, or
`Request changes`. Never approve while ownership scoping, authentication, or
sensitive-data scope is unclear.

The review is complete only when every changed trust boundary is either proven
safe or represented by a finding against the reviewed `HEAD`. If no findings
exist, return `findings: []` and state residual risk and gates not run.

## Review constraints

- Preserve the existing model: the signed `session` cookie identifies the user,
  and every row is authorized by `userId` in the query. Do not propose a
  parallel authorization scheme.
- Redact resume text, job descriptions, emails, API keys, tokens, and cookies
  from evidence.
- Prefer a focused guard or test over a broad rewrite.
- Keep destructive DB operations, `db:push`/`db:migrate` against a real
  database, and external uploads outside review unless explicitly authorized.
  The configured database is a hosted Supabase instance, not a throwaway one.
