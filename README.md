<div align="center">

<img src="public/logo.svg" width="96" height="96" alt="Tools by Soumendra logo">

# Tools by Soumendra

**43 free, single-file, zero-dependency browser tools — one searchable home.**

[![Live site](https://img.shields.io/badge/live-tools.soumendrak.com-b4522e?style=flat-square&logo=cloudflare&logoColor=white)](https://tools.soumendrak.com)
&nbsp;
![Tools](https://img.shields.io/badge/tools-43-b4522e?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-deployed-f38020?style=flat-square&logo=cloudflarepages&logoColor=white)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-2ea043?style=flat-square)](https://github.com/soumendrak/tools/pulls)

### [🔗 tools.soumendrak.com](https://tools.soumendrak.com)

</div>

---

A single point of entry for all my [mini projects](https://www.soumendrak.com/projects/foss/#mini-projects) — tiny, self-contained HTML tools you can **browse, search, and use right in place**. Everything runs locally in your browser; no sign-up, no accounts.

## ✨ Features

- **43 tools, one origin** — each is a single self-contained page, vendored under `public/tools/` and embedded on its own page at `/t/<slug>` with a one-click full screen.
- **Instant search & filter** — fuzzy search plus 7 category filters.
- **Recently added / updated** — surfaced on the landing page and kept fresh automatically from git history.
- **Light & dark** — a terracotta theme (matching [soumendrak.com](https://www.soumendrak.com)) shared across the site *and* every tool, with a persistent top-right toggle.
- **Built for discovery** — `sitemap.xml`, `robots.txt`, JSON-LD, Open Graph, and per-tool canonical URLs.
- **Fast & private** — statically exported, edge-hosted on Cloudflare Pages, tools compute entirely client-side.

## 🗂️ Categories

| Category | Tools | Examples |
| --- | :---: | --- |
| ⏳ Time & Life | 8 | Pomodoro, Year Progress, Life Calendar |
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

## ➕ Add a tool

Full steps live in the `tools-catalog` skill (`.claude/skills/tools-catalog/`). Short version:

1. Vendor the tool's page into `public/tools/<slug>/index.html`.
2. `python3 scripts/skin-tools.py` — apply the shared theme skin.
3. Add one line to `src/data/tools.ts` — the card, `/t/<slug>` page, sitemap, and structured data all derive from it.
4. `python3 scripts/check-tools.py && pnpm build` — the build auto-refreshes the *Recently added/updated* dates.

## 🎨 Theming

The site owns `<html data-theme>` and persists to `localStorage`; because the tools are served same-origin, they pick up the theme and live toggles automatically. `scripts/skin-tools.py` injects one stylesheet per tool that remaps its CSS variables to the shared terracotta palette for both modes — recolor everything by editing the palette in `src/app/globals.css` (site) and `scripts/skin-tools.py` (tools), plus `public/logo.svg` / `src/app/icon.svg` for the mark.

---

<div align="center">

Built by [Soumendra Kumar Sahoo](https://www.soumendrak.com) · Contributions welcome — open an [issue](https://github.com/soumendrak/tools/issues) or [PR](https://github.com/soumendrak/tools/pulls).

</div>
