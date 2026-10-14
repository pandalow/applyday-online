---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Never save to the OS temp directory (it gets cleaned) or the workspace. Save to the git common dir, which survives worktrees and is never committed:

```sh
dir="$(git rev-parse --path-format=absolute --git-common-dir)/applyday-handoffs"
mkdir -p -m 0700 "$dir"
ref="$(git branch --show-current | tr '/' '-')"
[ -n "$ref" ] || ref="detached-$(git rev-parse --short HEAD)"
file="$dir/$(date +%Y%m%d-%H%M%S)-$ref-$$-$RANDOM.md"
(umask 077; set -o noclobber; : > "$file")
```

The document contains conversation-derived content, so keep the file mode `0600`. Once written, print the path and then the full contents in your reply, so the next session has the state even if the file is gone.

Use this template; every field is required (write `none` rather than omit):

```md
# Handoff: <focus>
- Branch:
- Worktree path:
- PR(s) and head SHA:
- Done:
- Next:
- Open questions / blockers:
- Re-verify with: <commands, e.g. git status -sb, gh pr view <n> --json headRefOid,statusCheckRollup>
- Suggested skills:
```

"Suggested skills" names which skills the next agent should call the Skill tool for.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
