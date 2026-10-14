---
name: maintain-verify-applyday
description: Periodic upkeep pass for the verify-applyday feature map. Checks every feature file against source, drives every feature live, and ships at most one PR of proven corrections.
disable-model-invocation: true
---

# Maintain verify-applyday

The feature map in [`../verify-applyday/features/`](../verify-applyday/features/README.md)
rots as the app changes. No checker scripts exist, so this pass runs the grep
checks below, then drives each feature live. Run commands from `project/`.

## Outcome

End with exactly one, and say which:

- **clean**: no drift, every feature driven or explained, no regression found.
- **changed**: one PR of proven map corrections.
- **blocked**: coverage could not finish; name the exact blocker.

Any outcome lists the GitHub issue drafts written for regressions.

## Edit scope

Edit only `.claude/skills/verify-applyday/` and, when a spec is missing for a
mapped feature, `e2e/`. Never edit product code. Behaviour the map describes
that the app no longer does is either map drift (fix the map) or a regression
(draft an issue, never paper over it in the map).

## Pass

1. **Start.** Fresh branch off an up-to-date `main`, `npm install` done.
   Done when `git status` is clean.
2. **Route coverage.** List every route and confirm some feature file's
   `Sources:` claims it:
   ```bash
   find app -name page.tsx | sort
   find app/api -name route.ts | sort
   grep -h '^Sources:' ../.claude/skills/verify-applyday/features/*.md
   ```
   Done when every `page.tsx` and `route.ts` appears in a `Sources:` line (as
   the file, or its route directory), or is a redirect-only page listed in
   `dashboard.md`. Add a feature file for any user-facing surface that has none.
3. **Path and string drift.** For each feature file, check that every path in
   `Sources:` exists (`ls <path>`) and every `Relies on:` string is still in
   source (`grep -rF "<string>" app components locales proxy.ts`). Fix every
   miss first. Done when each check passes.
4. **Changed since verified.** For each file whose `Verified live:` has a date,
   `git log --since=<date> --name-only -- <Sources paths>` shows what moved.
   Read those files and compare with the feature text: entry points, roles,
   success/error/empty/persistence paths. Done when each flagged file is reread.
5. **Live pass.** Follow `verify-applyday` exactly (`npm run dev`, sign in,
   drive every recipe, then `npx playwright test`). A feature you cannot reach
   (no admin account, no model key, real email) is `undriven` with the
   prerequisite and route tried. Set `Verified live:` to today's date only on
   files you drove.
6. **Triage.** Wrong description → fix the feature file. Missing spec → add one
   under `e2e/`. Broken app behaviour → write a GitHub issue draft (title,
   repro, expected, actual, evidence) and list it for the user; do not open it
   and keep it out of the PR.
7. **Ship or stop.** `changed`: commit the corrections on the branch, run
   `npm run lint` and `npx tsc --noEmit`, then open a PR with `gh pr create`
   when the user asks. `clean` or `blocked`: no branch; report coverage.

Keep run notes in the session scratchpad; do not commit them.
