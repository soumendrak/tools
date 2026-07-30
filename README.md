<p align="center">
  <img src="public/logo.svg" width="88" height="88" alt="Tools by Soumendra logo">
</p>

<h1 align="center">Tools by Soumendra</h1>

Single point of entry for all my [mini projects](https://www.soumendrak.com/projects/foss/#mini-projects) — 44 zero-dependency browser tools you can browse, search, and use in place. Most are single-file; the Fasting Tracker is an offline-first multi-file PWA.

Built with Next.js + Tailwind. **Statically exported** (`output: "export"` →
`out/`) and hosted on **Cloudflare Pages** at
[tools.soumendrak.com](https://tools.soumendrak.com). No server runtime, no
client-side data fetching, no tracking.

## Develop

```bash
pnpm dev       # local dev server (rewrites serve /tools/<slug>/ here)
pnpm build     # static export → ./out
pnpm preview   # serve ./out locally like Cloudflare Pages (clean URLs + dir index)
```

The landing page also shows **Recently added / Recently updated** lists and a
per-category filter (7 categories: Time & Life, Developer Tools, Fun & Visual,
DevOps & Monitoring, Finance, Telephony, Writing & Content).

## Search and machine-readable discovery

The static export includes the same catalog in formats intended for crawlers,
answer engines, and agents:

- `/sitemap.xml` and `/robots.txt` for conventional crawling.
- `/llms.txt` for a concise, categorized Markdown index.
- `/llms-full.txt` for expanded entries with canonical, direct-use, and source
  URLs.

Both LLM indexes are generated directly from `src/data/tools.ts` during the
Next.js build, so adding a catalog entry updates them automatically. Raw
`/tools/<slug>/` pages canonicalize to their descriptive `/t/<slug>` pages via
the head block injected by `scripts/skin-tools.py`.

The recency lists are **automatic**: `scripts/tool-dates.py` runs before every
build (via `prebuild`) and derives each tool's `updated` date from the vendored
file's last git commit, so committing an edit refreshes the list on the next
build — no manual date entry. `added` is seeded from the origin repo's creation
date.

## Add a tool

Full steps live in the `tools-catalog` skill (`.claude/skills/tools-catalog/`).
Short version:

1. Vendor the tool's page into `public/tools/<slug>/index.html`. If it has
   relative assets, vendor the complete deployable directory.
2. `python3 scripts/skin-tools.py` — apply the theme skin.
3. Add one line to `src/data/tools.ts` (card, `/t/<slug>` page, sitemap, and
   structured data all derive from it).
4. `python3 scripts/check-tools.py` and `pnpm build` — the build auto-refreshes
   the recency dates. (Run `pnpm run tool-dates` manually only to seed a brand-new
   tool's creation date from its origin repo.)

## Theming

Site and tools support light + dark mode with a toggle (top-right). The site
owns `<html data-theme>` and persists to `localStorage`; the tools are
same-origin, so they pick up the theme and live toggles automatically.

The tools originally shipped a dark orange theme. `scripts/skin-tools.py`
injects one stylesheet into each vendored tool that remaps its CSS variables
(`--bg`, `--accent`, `--orange`, …) to the shared terracotta palette (matching
[soumendrak.com](https://www.soumendrak.com)) for both modes. It's idempotent —
re-run it after re-syncing from upstream.

## Branding

`public/logo.svg` is the terracotta wrench mark (also the favicon via
`src/app/icon.svg`). To recolor everything, edit the palette in two places —
`src/app/globals.css` (site) and `scripts/skin-tools.py` (tools, then re-run
it) — plus `public/logo.svg` / `src/app/icon.svg` for the mark.

## Sync vendored tools

The tools under `public/tools/` are copies of the published single-file pages,
**with local modifications** (theme skin, removed credit footers, and the
rewritten typing test). Re-downloading from upstream overwrites those, so
re-apply the skin afterwards:

```bash
python3 -c "
import re
print('\n'.join(re.findall(r'^\s*t\(\s*\"([^\"]+)\"', open('src/data/tools.ts').read(), re.M)))
" | while read s; do
  mkdir -p "public/tools/$s"
  curl -sL "https://soumendrak.github.io/$s/" -o "public/tools/$s/index.html"
done
python3 scripts/skin-tools.py   # re-apply the theme skin
```

The loop above is only for single-file tools. For a multi-file tool such as
`fasting-tracker`, copy every deployable asset from its repository
(`index.html`, JavaScript, manifest, service worker, and icons) before
re-applying the skin.

## Deploy (Cloudflare Pages → tools.soumendrak.com)

The site is a static export, so Cloudflare Pages serves `out/` straight from the
edge — no Workers/runtime.

### One-time setup — Git-connected (recommended, auto-deploys on push)

1. **Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git**,
   pick the `soumendrak/tools` repo.
2. Build settings:
   - **Framework preset:** Next.js (Static HTML Export) — or set manually:
   - **Build command:** `pnpm build`
   - **Build output directory:** `out`
3. **Environment variables** (Production):
   - `NEXT_PUBLIC_SITE_URL = https://tools.soumendrak.com` (canonical URLs,
     sitemap, Open Graph)
   - `NODE_VERSION = 20` (or newer)
4. Save & deploy. You get a `*.pages.dev` URL first.
5. **Custom domain:** project → **Custom domains → Set up a custom domain →**
   `tools.soumendrak.com`. Since `soumendrak.com` is already on Cloudflare DNS,
   this auto-creates the `CNAME tools → <project>.pages.dev` record and issues
   the TLS cert. (If DNS is elsewhere, add that CNAME manually.)

Every push to the default branch now rebuilds and redeploys.

### Or deploy directly from the CLI

```bash
pnpm run deploy:cf   # = pnpm build && wrangler pages deploy out --project-name tools
```

First run prompts a Cloudflare login and creates the `tools` Pages project;
attach the custom domain once via step 5 above.

> The `prebuild` step (`tool-dates.py`) shells out to `python3` + `git`; it's
> guarded with `|| true`, so if either is unavailable in the build image the
> recency dates simply fall back to the committed seed and the build still
> succeeds.
