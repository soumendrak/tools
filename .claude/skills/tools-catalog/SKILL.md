---
name: tools-catalog
description: >
  The standard for adding and maintaining tools in this repo (the "Tools by
  Soumendra" catalog). Use whenever adding a new tool, editing/refreshing an
  existing vendored tool, changing the theme/skin, or touching src/data/tools.ts,
  public/tools/, ToolFrame, or the /t/[slug] page. Keeps every tool consistent:
  catalog entry + vendored HTML + theme skin + no credit footer.
---

# Tools catalog standard

This site is a single point of entry for 40+ single-file HTML tools. Each tool
is **vendored** (a self-contained `index.html` copied into this repo) and served
same-origin at `/tools/<slug>/`, then embedded on an SEO page at `/t/<slug>`.

## Anatomy of a tool

| Piece | Location | Source of truth |
|-------|----------|-----------------|
| Catalog entry | `src/data/tools.ts` | one `t(slug, name, description, category)` line |
| Vendored page | `public/tools/<slug>/index.html` | the tool's own HTML |
| Live URL | `/tools/<slug>/` | derived by `t()` |
| Source link | this repo's file on GitHub | derived by `t()` (`repoUrl`) |
| SEO + embed page | `/t/<slug>` | auto-generated from the catalog entry |
| Added/updated dates | `src/data/tool-dates.ts` | generated from the origin repo (feeds the landing page's Recently added/updated lists) |

`t()` derives `liveUrl` and `repoUrl`; never hand-write those. Categories are
fixed in `CATEGORIES` (`src/data/tools.ts`) — reuse one, or add a new one to
both the `Category` union and the `CATEGORIES` array. The filter pills and card
badges derive from it automatically.

## Add a tool

1. **Vendor the HTML.** Put the tool's self-contained page at
   `public/tools/<slug>/index.html`. From GitHub Pages:
   ```bash
   mkdir -p public/tools/<slug>
   curl -sL "https://soumendrak.github.io/<slug>/" -o public/tools/<slug>/index.html
   ```
   (Or `raw.githubusercontent.com/soumendrak/<repo>/main/index.html` if Pages
   isn't enabled.)
2. **Fix sibling links.** Rewrite any `https://soumendrak.github.io/<other>/`
   links to local `/tools/<other>/`.
3. **Remove the credit footer.** Delete any `<footer>`/`.footer` block that
   links to the author's name or GitHub. Leave demo data and code comments
   alone (e.g. a sample webhook payload that happens to contain the name).
4. **Apply the theme skin:** `python3 scripts/skin-tools.py` (idempotent).
5. **Add the catalog entry** — one line in `src/data/tools.ts`:
   ```ts
   t("<slug>", "<Name>", "<one-sentence description>", "<Category>"),
   ```
7. **Verify:** `python3 scripts/check-tools.py`, then `pnpm build` and eyeball
   `/t/<slug>` in both light and dark mode.

Dates for the Recently added/updated lists are **automatic** — see below. You
don't hand-enter them; committing the tool is enough.

## Theme system (light + dark)

- The **site** owns `<html data-theme="light|dark">`, persisted to
  `localStorage.theme`, toggled top-right (`ThemeToggle`), applied pre-paint by
  an inline script in `layout.tsx`. Palette lives in `globals.css` (terracotta
  accent on warm cream/espresso surfaces, matching soumendrak.com).
- **Tools** are same-origin, so `scripts/skin-tools.py` injects one stylesheet
  that remaps each tool's CSS variables (`--bg`, `--surface`, `--accent`,
  `--orange`, …) to the shared palette for both modes, plus a tiny script that
  reads the theme and reacts to live toggles (`storage` + `postMessage`).
- To restyle all tools, edit the palette **once** in `scripts/skin-tools.py` and
  re-run it. Don't hand-edit colors in individual tool files — it won't scale
  and will drift.

## Recently added / updated (auto)

`scripts/tool-dates.py` writes `src/data/tool-dates.ts`, and it runs
automatically before every build (`prebuild` in package.json + `.npmrc`'s
`enable-pre-post-scripts=true`). So the lists refresh themselves on each
build/deploy — no manual date entry.

- **added** — stable creation date, seeded from the origin repo's `created_at`
  (kept in the committed `tool-dates.ts`); a brand-new tool falls back to its
  first git commit.
- **updated** — the vendored file's **last git commit date**, so it advances the
  moment you edit a tool and commit. Floored by `UPDATED_OVERRIDES` (for edits
  not yet committed) and the previous value, so it never regresses and still
  works on shallow CI clones.

Only reach for `pnpm run tool-dates` manually if you want to refresh the seed
right now (e.g. to pull a new tool's `created_at`); it needs an authed `gh` only
for tools missing from the seed. Add a `REPO_OVERRIDES` entry when a slug ≠ its
repo name.

## Maintain / refresh

Re-downloading a tool from upstream **overwrites** the local edits (skin,
removed footer, any rewrites like the typing test). After any re-sync, redo
steps 2–4 and run `python3 scripts/skin-tools.py`. See the README "Sync
vendored tools" section for the batch loop.

## The commit guard

`.githooks/pre-commit` runs `scripts/check-tools.py` on every commit and blocks
if the standard is violated (missing vendored file, missing skin, leftover
credit footer, orphan dir). It validates the **staged snapshot** (the index
exported to a temp dir, via `TOOLS_ROOT`), not the working tree, so a
fixed-but-unstaged file can't let an invalid staged version through. Enable it
once per clone:

```bash
git config core.hooksPath .githooks
```

The hook also **reminds you to update this skill** when you change a
mechanism file (`skin-tools.py`, `check-tools.py`, `tool-dates.py`,
`ToolFrame.tsx`, `/t/[slug]/page.tsx`) without touching this `SKILL.md`. Editing
`tools.ts` does **not** trigger the reminder — adding a tool is routine catalog
data, not a change to the standard.

## Keeping this skill current

When you change how tools work, keep this `SKILL.md` in sync with the mechanism
files it describes — the same set the commit guard watches:

- `scripts/check-tools.py` — the enforced invariants,
- `scripts/skin-tools.py` — the applied palette/skin,
- `scripts/tool-dates.py` — the added/updated date source,
- `src/components/ToolFrame.tsx` — the embed/full-screen/theme-sync frame,
- `src/app/t/[slug]/page.tsx` — the per-tool SEO + embed page.

If you add a new invariant, encode it in `check-tools.py` and describe it here.
If you relax one, remove it from both. The pre-commit hook reminds you when any
of these files change without a matching `SKILL.md` edit.
