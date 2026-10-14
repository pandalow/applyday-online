# Standards Axis

Review the frozen candidate only for repository standards and maintainability.
ApplyDay has no `CODING_STANDARDS.md`. Read `project/AGENTS.md` and
`project/CLAUDE.md` (which say Next.js 16 differs from training data: check
`project/node_modules/next/dist/docs/` before judging framework usage), the root
`README.md`, `project/eslint.config.mjs`, `project/tsconfig.json`, and any other
standards sources supplied in the reviewer envelope. Where nothing is written
down, the standard is the surrounding code: the idiom of the nearest sibling
file (for example how other `app/api/**` handlers call `verifySession()` and
return `Response.json`, how components use SWR, and how `app/lib/ai/*` modules
are shaped). Cite the sibling file when you rely on it.

Report every documented-standard violation with the exact source rule. Skip
anything deterministic tooling already enforces. Apply this smell baseline only
as labelled judgement calls; a documented repo standard overrides it:

- **Mysterious Name**: a name hides what a value or behavior means.
- **Duplicated Code**: the same logic shape appears in more than one changed
  location.
- **Feature Envy**: behavior reaches into another module's data more than its
  own.
- **Data Clumps**: the same fields or parameters repeatedly travel together.
- **Primitive Obsession**: a primitive stands in for a meaningful domain type.
- **Repeated Switches**: repeated branching on the same discriminator.
- **Shotgun Surgery**: one behavior change requires scattered edits.
- **Divergent Change**: one module changes for unrelated reasons.
- **Speculative Generality**: abstraction exists for needs the spec does not
  have.
- **Message Chains**: callers navigate through another module's internals.
- **Middle Man**: a layer delegates without adding policy or leverage.
- **Refused Bequest**: an implementation ignores most of an inherited contract.

Use the shared [review finding contract](review-finding-contract.md).
Use `hard` severity for a documented-standard violation and `judgement` for a
smell. For each smell, set `violated_invariant` to its name and describe the
concrete maintenance or correctness consequence. Complete only after every
changed hunk has been checked against the applicable documented sources and
smell baseline.
