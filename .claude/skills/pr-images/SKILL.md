---
name: pr-images
description: Write an ApplyDay PR body with the pr skill, then attach screenshots and a rendered diagram of the change to the PR description in the browser. Use for UI changes, or when a flow or boundary is hard to explain in prose.
---

# PR Images

The PR body is the `pr` skill's body plus images, so a reviewer sees the change
before reading the diff:

- a **diagram** in `Summary`, after its short explanation, when a flow,
  boundary, or interaction is hard to explain in prose;
- **before and after screenshots** in `Evidence` for every screen a UI change
  touches.

A PR can have both. Screenshots and diagrams are both image files attached the
same way; only the body text goes through the API.

## 1. Write the body

Write the body with the `pr` skill. Keep every section's text: the Summary must still read correctly without the
image.

**Done when:** the body is complete as text.

## 2. Make the images

Make only the images a reviewer needs, usually one to three:

- **Screenshots** of each changed screen, before (from `origin/main`) and after
  (from the branch), with the same test data and viewport, and matching browser
  zoom. The `run` skill starts the app (`npm run dev` in `project/`); sign in with the
  test account from `.env.test.local` and create `[e2e]`-tagged test data first. Before capturing, use a
  desktop-sized viewport (for example, 1440×900 CSS pixels) and zoom the browser
  out as needed until the app shows its desktop navigation and column layout.
  Confirm the rendered layout before taking both screenshots. Capture only the
  region that changed, preserving enough context to show the desktop layout.
- **Diagram** rendered to PNG. Write it as
  Mermaid and render it with the machine's Chrome:
  `npx -y @mermaid-js/mermaid-cli@11 -i flow.mmd -o flow.png -w 1400 -b white -p <puppeteer.json>`
  where `puppeteer.json` is `{"executablePath":"/usr/bin/google-chrome","args":["--no-sandbox"]}`.
  Take labels and arrows from the reviewed code.

GitHub shows the description about 780px wide, so crop or resize screenshots
after capturing the desktop layout to keep each image about 900px wide or less
while keeping text legible. This output size is separate from the app viewport.
For diagrams, a top-down `flowchart TB` fits better than a long left-to-right one.

Use test or redacted data only: no real resumes, personal details, email
addresses, API keys (the key field and `localStorage` contents must never be
visible), or job descriptions that name an employer you really applied to.

**Done when:** you have opened every image file and checked it is accurate,
legible, and free of real data, and both screenshots show the desktop layout
at matching viewport and zoom settings.

## 3. Attach them to the description

GitHub has no CLI or API upload for PR images, so attach it in Orca's built-in
browser (`orca` CLI; load the `orca-cli` skill's browser reference first).

1. Publish the text body from step 1 first:
   `gh api -X PATCH repos/<owner>/<repo>/pulls/<n> -F body=@<file>`.
2. `orca tab create --url https://github.com/<owner>/<repo>/pull/<n>`, then
   `orca snapshot`. If the page shows **Sign in**, stop and ask the user to sign
   in to GitHub in that tab; never type their credentials.
3. Open the first comment's **Show options** menu (the description) and choose
   **Edit comment**; the editor is `textarea[name="pull_request[body]"]`.
4. Its file input is hidden and absent from the snapshot. With `orca eval`, give
   the input inside that textarea's form an `aria-label` and make it visible,
   re-snapshot, then `orca upload --element <ref> --files <path>` for each image.
   Wait until the textarea contains one
   `<img … src="https://github.com/user-attachments/assets/…">` tag per image.
5. With `orca eval`, move each tag to its place (the diagram after the
   Summary's first explanation; screenshots under **Before** and **After** in
   Evidence), set each `alt` to what the image shows, and dispatch an `input`
   event. Click the **Update comment** button inside that same form; other
   comments have hidden ones.

**Done when:** `gh pr view <n> --json body` contains every `user-attachments` URL
in its place, and an `orca screenshot` of the PR page shows each image rendered
in the description.
