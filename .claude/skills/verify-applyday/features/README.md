# ApplyDay feature map

One file per user-facing feature. Each file opens with `Sources:` (paths
relative to `project/`), `Relies on:` (exact UI labels, endpoints, or names a
rename would break) and `Verified live:` (last date a pass drove it; `not yet`
= drafted from source only). Then the same H2s: `Sub-features`,
`How to get to it (user POV)`, `Driving it`, `Gotchas`. Name controls by
accessible name and role, never by snapshot ref. Fix drift in the same diff as
the UI change. `maintain-verify-applyday` describes the grep checks.

| Feature | File | Roles |
| --- | --- | --- |
| Sign-in, register, reset, roles | [sign-in-and-roles.md](sign-in-and-roles.md) | signed out, user, admin |
| Public pages (landing) | [public-pages.md](public-pages.md) | signed out |
| Quick Start wizard | [wizard.md](wizard.md) | signed out (trial), user |
| Dashboard (applications) | [dashboard.md](dashboard.md) | user |
| Application workspace | [application-workspace.md](application-workspace.md) | user |
| Market reports | [market-report.md](market-report.md) | user |
| Profile and resumes | [profile-and-resumes.md](profile-and-resumes.md) | user |
| AI settings | [settings.md](settings.md) | user |
| Admin | [admin.md](admin.md) | admin |

Redirect-only routes (`/insight`, `/report`, `/resume`) are covered under
[dashboard.md](dashboard.md).

## Sweep order

For "did we break the app broadly?", walk the table top to bottom, capturing
each file's end state, then run `npx playwright test`.
