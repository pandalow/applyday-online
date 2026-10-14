---
name: prepare-and-push-pr
description: Validate and publish the exact ApplyDay commit approved by local-pr-review, then open or update its PR.
---

# Prepare And Push PR

Publish an unchanged, committed candidate after `local-pr-review` reports
`review-clean` for the same `HEAD`.

Implementation owns formatting, repair, and commit creation; this skill proves
and publishes the reviewed commit. Run every npm command from `project/`.

## Reviewed handoff

Require an explicit current-run request to publish, and the latest clean
review's base, merge base, and `HEAD` SHA for a committed, drift-free candidate;
otherwise surface the status and stop. A review-only request does not authorize
a push or PR mutation.

## Candidate provenance

Use this workflow only for the maintainer's own branches. Checking out or
reviewing someone else's PR does not authorize running its package scripts or
test suite: those run with your `.env.local` database and API credentials.
Keep other people's branches static-only; reconstruct approved changes on a
branch you own before publishing.

## Workflow

1. Verify the handoff.
- Run `git status -sb` and inspect the intended diff.
- Confirm the latest `local-pr-review` result is `review-clean` for the current
  `HEAD`.
- Do not format, repair, stage, or commit in this skill.

2. Check base freshness.
- Run `git fetch origin <baseRefName>` (`main` for a new PR).
- Run `git rev-list --left-right --count origin/<baseRefName>...HEAD`.
- Report how far the branch is behind; do not merge or rebase here. Being
  behind does not block a push.

3. Prove the candidate is unchanged.
- Re-record `git rev-parse HEAD`, `git merge-base HEAD origin/<baseRefName>`,
  and `git status --porcelain`.
- Require `HEAD` and the merge base to equal the clean review handoff and the
  worktree to be clean. On any mismatch, rerun `local-pr-review` without
  pushing.

4. Validate the exact head. From `project/`:
- `npm run lint`
- `npx tsc --noEmit --skipLibCheck`
- `npm run build` when the diff touches routing, `proxy.ts`, `next.config.ts`,
  server/client component boundaries, or Drizzle schema imports.
- Browser tests: `npx playwright test --project=smoke:public`, plus
  `--project=smoke:protected` and `--project=integration` when the diff touches
  an authenticated page or an `app/api` route. They need a dev server (the
  config starts one) and `.env.test.local`; the integration project writes
  `[e2e]`-tagged rows to the configured database and deletes them afterwards.
- Report a command you could not run as `Not run: <reason>`; never as passed.
- Confirm `HEAD` still equals the reviewed SHA and the worktree has no new
  drift. There is no CI in this repo: these local results are the gate, so
  paste them accurately into the PR body.

5. Push safely.
- For a first push: `git push -u origin $(git branch --show-current)`.
- After an already-reviewed branch rewrite: `git push --force-with-lease`.

6. Open or update the PR.
- Prefer updating the existing PR for the branch; otherwise create one against
  `main` with `gh pr create`.
- Update an existing PR's body with
  `gh api -X PATCH repos/{owner}/{repo}/pulls/<n> -F body=@<file>`;
  `gh pr edit` can fail on the retired Projects (classic) API.
- Vercel (`vercel.json`) may attach a preview deployment; if it does, link it
  in the body, and do not call a preview that built "verified".

## PR title and body

Keep the title specific to shipped behavior. There is no
`.github/pull_request_template.md`: write the body with the `pr` skill, and use
its `Summary`, `Evidence`, and `Merge danger` sections. List the exact commands
from step 4 under `Validation`. For a UI change or a hard-to-explain flow, use
`pr-images` to add a screenshot or diagram. Evidence uses test data only: no
real resumes, job descriptions that name a real employer you applied to, email
addresses, or API keys.

For a UI diff, include a `Verified with` section: the `verify-applyday`
feature file, the flow driven, and the evidence. `N/A` is not accepted for a
changed page under `project/app/**` (except `project/app/api/**`) or
`project/components/**`.

## Hard rules

- Never bypass git hooks (`--no-verify`) if any are ever configured.
- Never run an unknown-provenance candidate from a worktree that holds
  `.env.local` or `.env.test.local`.
- Never publish a candidate that differs from its latest clean `local-pr-review`.
- Never include `.env*` files, `e2e/.auth/`, `playwright-report/`, or
  `test-results/` in the pushed diff.
- If the PR exists, update its title and body to match the final branch state.
