#!/usr/bin/env python3
"""Validate that every tool follows the repo standard (see the tools-catalog
skill). Run by the pre-commit hook and available as `pnpm run check:tools`.

Invariants:
  1. Every slug in src/data/tools.ts has public/tools/<slug>/index.html.
  2. Every vendored index.html has the theme skin injected
     (site-theme-override + site-theme-sync) — else run scripts/skin-tools.py.
  3. No vendored tool ships a personal credit footer (name / GitHub link in a
     <footer> or .footer element).
  4. No orphan tool dirs: every public/tools/<slug>/ is listed in tools.ts.
  5. Every raw tool page canonicalizes to its descriptive /t/<slug> page.

Exits non-zero (with actionable messages) on any violation.
"""

import os
import pathlib
import re
import sys

# TOOLS_ROOT lets the pre-commit hook point us at a snapshot of the staged index
# (what will actually be committed) instead of the working tree.
ROOT = pathlib.Path(os.environ.get("TOOLS_ROOT") or
                    pathlib.Path(__file__).resolve().parent.parent)
TOOLS_TS = ROOT / "src" / "data" / "tools.ts"
TOOLS_DIR = ROOT / "public" / "tools"
SITE_URL = "https://tools.soumendrak.com"

# Footer-type element (either <footer> or class="...footer...") crediting the author.
CREDIT_FOOTER = re.compile(
    r'(<footer\b[^>]*>.*?</footer>'
    r'|<div\s+class="[^"]*\bfooter\b[^"]*">.*?</div>)',
    re.I | re.S,
)


def slugs_from_ts() -> list[str]:
    text = TOOLS_TS.read_text()
    return re.findall(r'^\s*t\(\s*"([^"]+)"', text, re.M)


def main() -> int:
    errors: list[str] = []
    if not TOOLS_TS.exists():
        print(f"check-tools: {TOOLS_TS} not found (incomplete snapshot?)")
        return 1
    slugs = slugs_from_ts()
    if not slugs:
        print("check-tools: could not parse any tools from src/data/tools.ts")
        return 1

    slug_set = set(slugs)
    unskinned, footered, uncanonical = [], [], []

    for slug in slugs:
        html = TOOLS_DIR / slug / "index.html"
        if not html.exists():
            errors.append(
                f"missing vendored file: public/tools/{slug}/index.html "
                f"(listed in tools.ts)"
            )
            continue
        s = html.read_text()
        if "site-theme-override" not in s or "site-theme-sync" not in s:
            unskinned.append(slug)
        canonical = (
            f'<link id="site-canonical" rel="canonical" '
            f'href="{SITE_URL}/t/{slug}">'
        )
        if canonical not in s:
            uncanonical.append(slug)
        if any("soumendrak" in m.group(0).lower() for m in CREDIT_FOOTER.finditer(s)):
            footered.append(slug)

    # Orphan dirs (present on disk but not in tools.ts)
    for d in sorted(TOOLS_DIR.glob("*/index.html")):
        if d.parent.name not in slug_set:
            errors.append(
                f"orphan tool: public/tools/{d.parent.name}/ is not listed in "
                f"src/data/tools.ts (add a t(...) entry or delete the dir)"
            )

    if unskinned:
        errors.append(
            "theme skin missing on: "
            + ", ".join(unskinned)
            + "  → run: python3 scripts/skin-tools.py"
        )
    if footered:
        errors.append(
            "personal credit footer still present on: "
            + ", ".join(footered)
            + "  → remove the <footer>/.footer credit block"
        )
    if uncanonical:
        errors.append(
            "canonical link missing or incorrect on: "
            + ", ".join(uncanonical)
            + "  → run: python3 scripts/skin-tools.py"
        )

    if errors:
        print("✗ tools standard check failed:\n")
        for e in errors:
            print("  - " + e)
        print(
            "\nSee the tools-catalog skill: "
            ".claude/skills/tools-catalog/SKILL.md"
        )
        return 1

    print(f"✓ tools standard check passed ({len(slugs)} tools)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
