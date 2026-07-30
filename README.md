<div align="center">

<img src="public/logo.svg" width="96" height="96" alt="Tools by Soumendra logo">

# Tools by Soumendra

**44 free, zero-dependency browser tools — one searchable home.**

[![Live site](https://img.shields.io/badge/live-tools.soumendrak.com-b4522e?style=flat-square&logo=cloudflare&logoColor=white)](https://tools.soumendrak.com)
&nbsp;
![Tools](https://img.shields.io/badge/tools-44-b4522e?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-deployed-f38020?style=flat-square&logo=cloudflarepages&logoColor=white)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-2ea043?style=flat-square)](https://github.com/soumendrak/tools/pulls)

### [🔗 tools.soumendrak.com](https://tools.soumendrak.com)

</div>

---

A single point of entry for all my [mini projects](https://www.soumendrak.com/projects/foss/#mini-projects) — tiny, self-contained browser tools you can **browse, search, and use right in place**. Everything runs locally in your browser; no sign-up, no accounts.

## ✨ Features

- **44 tools, one origin** — most are single-file pages; the Fasting Tracker is an offline-first multi-file PWA. Every tool is vendored under `public/tools/` and embedded on its own page at `/t/<slug>` with one-click full screen.
- **Instant search & filter** — fuzzy search plus 7 category filters.
- **Recently added / updated** — surfaced on the landing page and kept fresh automatically from git history.
- **Light & dark** — a terracotta theme (matching [soumendrak.com](https://www.soumendrak.com)) shared across the site *and* every tool, with a persistent top-right toggle.
- **Built for discovery** — `sitemap.xml`, `robots.txt`, JSON-LD, Open Graph cards, per-tool canonical URLs, and machine-readable LLM indexes.
- **Fast & private** — statically exported, edge-hosted on Cloudflare Pages, tools compute entirely client-side.

## 🗂️ Categories

| Category | Tools | Examples |
| --- | :---: | --- |
| ⏳ Time & Life | 9 | Fasting Tracker, Pomodoro, Life Calendar |
| 🛠️ Developer Tools | 9 | JSON Pretty, Diff Checker, Base64 |
| 🎨 Fun & Visual | 11 | Mandelbrot, Conway's Game of Life, Odia 2048 |
| 📡 DevOps & Monitoring | 8 | API Playground, Webhook Inspector, Uptime Radar |
| 💰 Finance | 2 | SIP Calculator, Portfolio Tracker |
| ☎️ Telephony | 2 | Call Log Explorer, IVR Flow Builder |
| ✍️ Writing & Content | 3 | RSS → Substack, Citation Manager |

## 🧰 Tech stack

Next.js (App Router, static export) · Tailwind CSS v4 · TypeScript · Cloudflare Pages · [Rybbit](https://rybbit.io) analytics.

## 🚀 Local development

```bash
pnpm install
pnpm dev       # dev server — serves /tools/<slug>/ via rewrites
pnpm build     # static export → ./out
pnpm preview   # serve ./out like Cloudflare Pages (clean URLs + directory index)
```

## 🔎 Search and machine-readable discovery

The static export includes `/sitemap.xml` and `/robots.txt` for conventional crawling, `/llms.txt` for a concise categorized Markdown index, and `/llms-full.txt` for expanded entries with canonical, direct-use, and source URLs.

Both LLM indexes are generated from `src/data/tools.ts` during the Next.js build. Raw `/tools/<slug>/` pages canonicalize to their descriptive `/t/<slug>` pages via the head block injected by `scripts/skin-tools.py`.

The recency lists are automatic: `scripts/tool-dates.py` runs before every build and derives each tool's `updated` date from git history. A new tool's `added` date is seeded from its origin repository.

## ➕ Add a tool

Full steps live in the `tools-catalog` skill (`.claude/skills/tools-catalog/`). Short version:

1. Vendor the tool into `public/tools/<slug>/index.html`. If it uses relative JavaScript, manifest, service-worker, or icon assets, vendor the complete deployable directory.
2. `python3 scripts/skin-tools.py` — apply the shared theme skin and canonical URL.
3. Add one entry to `src/data/tools.ts` — the card, `/t/<slug>` page, sitemap, structured data, and LLM indexes all derive from it.
4. `python3 scripts/check-tools.py && pnpm build` — validate the catalog and refresh the *Recently added/updated* dates.

## 🎨 Theming

The site owns `<html data-theme>` and persists to `localStorage`; because the tools are served same-origin, they pick up the theme and live toggles automatically. `scripts/skin-tools.py` injects one stylesheet per tool that remaps its CSS variables to the shared terracotta palette for both modes — recolor everything by editing the palette in `src/app/globals.css` (site) and `scripts/skin-tools.py` (tools), plus `public/logo.svg` / `src/app/icon.svg` for the mark.

---

<div align="center">

Built by [Soumendra Kumar Sahoo](https://www.soumendrak.com) · Contributions welcome — open an [issue](https://github.com/soumendrak/tools/issues) or [PR](https://github.com/soumendrak/tools/pulls).

</div>
