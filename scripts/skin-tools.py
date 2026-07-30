#!/usr/bin/env python3
"""Re-skin every vendored tool in public/tools/ to the site's theme.

The tools share a CSS-variable convention (--bg, --surface, --accent, --text,
--orange, ...). Rather than hand-editing each file, we inject one stylesheet
that redefines those variables for both light and dark, plus a tiny script that
reads the theme from localStorage (shared same-origin with the site) and reacts
to live toggles via `storage` / `postMessage`.

Idempotent: re-running refreshes the injected block. Run this after any
`Sync vendored tools` step that re-downloads the upstream HTML.
"""

import pathlib
import re

SNIPPET = """<style id="site-theme-override">
:root[data-theme="dark"]{--bg:#231c17;--surface:#2d251f;--bg-card:#2d251f;--bg-toggle:#38302a;--card-bg:#2d251f;--border:#3a3129;--text:#f2ebe0;--fg:#f2ebe0;--text-dim:#b0a496;--text-muted:#8a7d6f;--muted:#b0a496;--accent:#d17d5c;--accent-light:#e19b7f;--accent-dark:#b4522e;--accent-dim:#b4522e;--accent-hover:#e19b7f;--accent-glow:rgba(209,125,92,.25);--accent-subtle:rgba(209,125,92,.12);--orange:#d17d5c;--orange-glow:rgba(209,125,92,.4);--orange-dim:rgba(209,125,92,.14);color-scheme:dark;}
:root[data-theme="light"]{--bg:#f7f0e6;--surface:#fdf8f0;--bg-card:#ffffff;--bg-toggle:#efe6d8;--card-bg:#ffffff;--border:#e6dccc;--text:#2a201a;--fg:#2a201a;--text-dim:#6f6255;--text-muted:#948676;--muted:#6f6255;--accent:#b4522e;--accent-light:#c96a44;--accent-dark:#9c4527;--accent-dim:#b4522e;--accent-hover:#9c4527;--accent-glow:rgba(180,82,46,.18);--accent-subtle:rgba(180,82,46,.08);--orange:#b4522e;--orange-glow:rgba(180,82,46,.28);--orange-dim:rgba(180,82,46,.12);color-scheme:light;}
</style>
<script id="site-theme-sync">(function(){function a(t){document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}var t;try{t=localStorage.getItem('theme');}catch(e){}if(!t){t=(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}a(t);addEventListener('storage',function(e){if(e.key==='theme'&&e.newValue)a(e.newValue);});addEventListener('message',function(e){if(e.data&&e.data.__theme)a(e.data.__theme);});})();</script>
</head>"""


def main() -> None:
    root = pathlib.Path(__file__).resolve().parent.parent / "public" / "tools"
    count = 0
    for p in sorted(root.glob("*/index.html")):
        s = p.read_text()
        if "site-theme-override" in s:
            s = re.sub(
                r'<style id="site-theme-override">.*?</head>', SNIPPET, s, flags=re.S
            )
        elif "</head>" in s:
            s = s.replace("</head>", SNIPPET, 1)
        else:
            continue
        p.write_text(s)
        count += 1
    print(f"skinned {count} tools")


if __name__ == "__main__":
    main()
