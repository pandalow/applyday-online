# Inputs, Uploads, And AI Prompts

Request edges here are untyped `request.json()` casts, `FormData`, and headers.

Validate at the edge:
- **Bodies**: required fields, types, lengths, and enum values. `status` is
  checked against the five application statuses; do the same for any new enum
  (`language` is coerced to `'en' | 'zh'`; `provider` is cast from a header with
  no check, so an unknown provider reaches `createLLM`'s `switch` and fails
  late). Whitelist fields instead of spreading the body into Drizzle
  `.set()`/`.values()`.
- **Dates and IDs**: `new Date(body.x)` can yield an invalid date; path and body
  IDs are uuid columns, so a non-uuid raises a database error that should be a
  400, not a 500.
- **Search**: user text in `ilike` is parameterized (no SQL injection) but `%` and
  `_` act as wildcards; acceptable. Any raw `sql` template with request data
  interpolated is a finding.
- **Sort/filter params** map through a `switch` allowlist (see
  `app/api/applications/route.ts`); keep that shape, never pass a request string
  as a column name.

PDF upload (`POST /api/resumes`, `pdf-parse`):
- the type check is by MIME or file extension, both client-controlled; the real
  check is that `pdfParse` succeeds
- no explicit size limit in the handler (`serverActions.bodySizeLimit` applies to
  server actions only; the platform body limit applies to routes); a new upload
  path should cap bytes and extracted text length
- extracted text is stored and later put into prompts: treat it as hostile
- the file itself is not stored, so there is no file-serving path to protect; if
  a PR adds storage, check path traversal, content type on serve, and ownership

LLM prompt input (pasted JD text, resume text, notes):
- these are untrusted. Prompt injection can distort a verdict or push text into
  the output, so the output is untrusted too: never render it as HTML, never use
  it to build SQL, URLs, file paths, or shell commands, and parse JSON through
  `jsonrepair` plus a shape check, not blind casts, before storing
- truncate or cap input (`extractJobMeta` slices to 6000 chars; other prompts
  should bound theirs) so a huge paste cannot run up the caller's bill or time
  out
- the prompt must not contain secrets or other users' data
- LLM calls are billed to the caller's own key, so cost abuse of the platform is
  limited to the guest path (`/api/try/*`), which is rate limited per IP

Mutations and retries:
- ownership check, then write, with `userId` in the write's `where`
- double submit or retry: report processing checks `status !== 'pending'` and
  writes later, which is not atomic; "delete old, insert new" upserts
  (suggestions) are not in a transaction. Flag changes that make this worse or
  that depend on exactly-once behaviour, and prefer a unique constraint or
  transaction
- destructive operations (`DELETE`, cascades from `users` or `applications`)
  need explicit ownership scoping; `onDelete: 'cascade'` means deleting an
  application removes its OKRs and suggestions
- migrations (`project/drizzle/`): check new columns holding sensitive data,
  `NOT NULL` additions on populated tables, and that generated SQL matches
  `app/db/schema.ts`
