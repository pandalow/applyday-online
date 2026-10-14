# Sensitive Data Exposure

ApplyDay stores personal career data. Look for leakage of:
- resume text and uploaded resume file names (names, addresses, phone numbers,
  work history)
- job description text, notes (`stageNotes`), contact person, contact email or
  phone extracted from a JD
- user identity: username, email, Google ID, avatar URL
- the user's AI provider key (`X-AI-Key`; four routes also accept the legacy
  `X-OpenAI-Key`), which lives in browser `localStorage` (`applyday_ai_settings`)
- `passwordHash`, `rsaPublicKey`, password reset tokens, the `session` cookie,
  RSA challenge tokens, OAuth `state` and `code_verifier`
- AI outputs derived from the above (insights, cover letters, OKRs, reports)

Block or flag:
- API responses returning full rows when a summary is enough (`select()` of
  `users` or `*` joins); user lists must never include `passwordHash`,
  `rsaPublicKey`, or tokens
- `console.log`/`console.error` of request bodies, headers, resume or JD text,
  provider errors that may echo a key, or `X-AI-Key` values
- returning `err.message` from a provider or database error to the client
  (provider error text can include request details); prefer a generic message
  and log server-side
- the AI key stored in the database, a cookie, a URL, an analytics event, or a
  server cache; it must travel only in the request header to the chosen provider
- sensitive data in query strings or in SWR cache keys shared across users
- `NEXT_PUBLIC_*` variables holding anything but public values; secrets read in a
  client component
- `dangerouslySetInnerHTML` or raw-HTML markdown plugins rendering LLM or user
  text (today `react-markdown` is used without raw HTML; keep it that way)
- tests, fixtures, e2e traces, screenshots, or review comments containing real
  resumes, real credentials, or `.env.test.local` values (Playwright writes
  `e2e/.auth/user.json` session state, which must stay untracked)
- committed credentials of any kind: check `git ls-files` for `.env*`,
  `.claude/settings*.json` allow-rules containing connection strings, and
  `e2e/.auth/`

Review comments must redact or summarize sensitive examples instead of quoting
them.
