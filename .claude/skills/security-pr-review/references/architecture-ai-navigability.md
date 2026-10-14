# Architecture And AI-Navigability

Use the `codebase-design` skill's vocabulary precisely:
- `module`
- `interface`
- `implementation`
- `depth`
- `seam`
- `adapter`
- `leverage`
- `locality`

Do not drift into vague "clean code" language when the issue is shallow depth,
poor locality, or a misleading interface.

Review every non-trivial PR for whether it makes the app easier or harder for the
next human or AI agent to understand safely:
- one domain concept (application, resume, job description, report, OKR) should
  have one obvious module path under `app/lib`, `app/api`, and `components`
- interfaces should hide policy and sequencing details instead of making each
  caller remember them
- security-critical invariants (ownership scoping, session checks, AI key
  handling) should live behind a small interface, not be copied through routes,
  UI components, and tests
- a module should earn its existence; apply the deletion test to wrappers,
  pass-through helpers, and route glue
- a seam is real when it has more than one adapter or a concrete reason to vary;
  avoid speculative abstraction
- tests should verify behavior at the interface that concentrates the invariant
- docs (`README.md`, `project/AGENTS.md`) should stay aligned when a PR changes
  where agents should look

Architecture findings should be actionable and scoped. Prefer comments like:
- "This ownership query is repeated across the `[id]` routes; move it behind an
  owned-record helper so scoping has one interface and one test surface."
- "`login` exists as both a server action and `POST /api/auth/login`, and only
  one of them has the register rate limit. Pick one authority so a fix lands
  once."
- "This helper is shallow: deleting it would remove complexity instead of
  concentrating it. Inline it or deepen it by owning the invariant."

Do not block a PR just because a better architecture exists. Block or flag
architecture when it hides security policy, spreads sensitive-data rules across
callers, creates a second authority for a domain concept, or makes relevant
behavior materially harder to test or navigate.
