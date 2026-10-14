# AI settings

Sources: `app/(protected)/settings/page.tsx`, `app/lib/aiConfig.ts`, `app/lib/apiKey.ts`
Relies on: `Save & Use`, `Save only`, `applyday_ai_settings`
Verified live: not yet

## Sub-features

- One tab per provider (OpenAI, Anthropic, Google): API key, model, optional
  reasoning toggle.
- **Save & Use** saves and activates; **Save only** saves; an activate button
  switches to an already-saved provider.
- Keys live only in browser `localStorage` (`applyday_ai_settings`); the legacy
  `applyday_openai_key` is migrated on load. Requests carry the key as
  `X-AI-Key` headers.

## How to get to it (user POV)

- Avatar menu → **Settings** (`/settings`).

## Driving it

```text
open /settings → switch provider tabs → enter a fake key → Save & Use
reload → settings persist; confirm no key appears in any /api request body
```

## Gotchas

- Never type a real key into a captured screenshot.
- Spec: `e2e/smoke.protected.spec.ts` (loads only).
