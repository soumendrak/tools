# Long-form Reader

A single-file, dependency-free reading aid for pasted text and `.txt` / `.md` files, served at `/tools/long-form-reader/` and listed at `/t/long-form-reader`.

- **Full text:** continuous reading with headings, paragraphs, lists, quotes and fenced code blocks.
- **Skim:** selected original sentences, with native expandable controls for the complete supporting passages. List items always retain at least their first sentence.
- **Focus:** key sentences gain accent color while scrolling; supporting sentences fade temporarily. All text returns to normal after scrolling stops. Reduced-motion preferences disable transitions.
- **Fold sections:** expandable headings with up to two selected original sentences as an excerpt. Contents links expand their target section.
- **Reading comfort:** adjustable type, shared light/dark theme, contents navigation and reading progress.
- **Optional resume:** opt into saving the current article and its section/relative position in localStorage. Clear it at any time. Reading-lens and type preferences are saved separately.
- **Export:** download the original imported text, without the reading transformations.

The parser supports Markdown headings, flat lists, blockquotes and triple-backtick code blocks. Inline formatting, links, tables, nested lists and HTML are displayed as text rather than interpreted. Plain text needs blank lines between paragraphs; Markdown headings make sections foldable.

No network requests, external libraries, fonts, AI calls or API keys are used. To read a URL, copy its article text into the reader. Import is limited to 200,000 characters. Saved text is available to other same-origin pages and anyone using that browser profile; saving is off by default.

## Reading cues

Sentence selection uses local rules: recurring long words, an opening-sentence bonus, an ending-sentence bonus, and a target of roughly 30% of sentences per section. This is extractive assistance, not a semantic summary or a guarantee of important information. The UI labels cues as excerpts, preserves the original context and avoids presenting generated prose in the author's voice.

## Inspiration

Inspired by the interaction ideas described in [Reading Long Form, Interfaces that think](https://github.com/onepixelaway/interfaces-that-think/blob/main/reading-long-form/README.md): reading lenses, scroll emphasis, collapsible supporting text and section overviews. This is an original implementation with an original sample essay. No upstream code, assets or third-party essay text are included. AI-written bridges, semantic list regrouping and card carousels are not implemented.

## Single-file packaging

The complete tool lives in `public/tools/long-form-reader/index.html`: markup, styles, text processing, sample content, app logic and shared theme integration. Copy that file anywhere and open it directly in a browser, or serve it from a static host. No build step or companion assets are needed. Saving still depends on browser storage availability, which can vary for local files.

The repository tests extract the inline `reader-core` script from the HTML, so the shipped file is the source of truth.

## Verify

Run `pnpm test:reader`, `python3 scripts/check-tools.py`, and `pnpm build`. Test import, lenses, folding, themes, narrow viewports, saving and clearing in the browser.
