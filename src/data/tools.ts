import { TOOL_DATES } from "./tool-dates";

export type Category =
  | "Time & Life"
  | "Developer Tools"
  | "Fun & Visual"
  | "DevOps & Monitoring"
  | "Finance"
  | "Telephony"
  | "Writing & Content";

export interface Tool {
  slug: string;
  name: string;
  description: string;
  category: Category;
  liveUrl: string;
  repoUrl: string;
  added?: string;
  updated?: string;
}

const t = (
  slug: string,
  name: string,
  description: string,
  category: Category,
  repoUrl?: string,
): Tool => ({
  slug,
  name,
  description,
  category,
  liveUrl: `/tools/${slug}/`,
  repoUrl:
    repoUrl ??
    `https://github.com/soumendrak/tools/blob/main/public/tools/${slug}/index.html`,
  added: TOOL_DATES[slug]?.added,
  updated: TOOL_DATES[slug]?.updated,
});

export const CATEGORIES: Category[] = [
  "Time & Life",
  "Developer Tools",
  "Fun & Visual",
  "DevOps & Monitoring",
  "Finance",
  "Telephony",
  "Writing & Content",
];

export const TOOLS: Tool[] = [
  // Time & Life
  t("dayleft", "Day Left", "Minimal countdown showing how much time is left in the day. Custom targets, calendar picker, localStorage.", "Time & Life"),
  t("yearprogress", "Year Progress", "Live year progress bar with circular ring, day-of-year counter, and free days remaining.", "Time & Life"),
  t("weekprogress", "Week Progress", "Live work week progress bar — shows day, week number, hours remaining. Toggle 5-day / 7-day.", "Time & Life"),
  t("pomodoro", "Pomodoro Timer", "Focus timer with 25/5/15 min cycles, visual ring, audio beep, keyboard shortcuts.", "Time & Life"),
  t("breathe", "Breathe", "Guided breathing exercise with expanding circle. 4-7-8, box breathing, and energizing modes.", "Time & Life"),
  t("age-in-seconds", "Age in Seconds", "Real-time seconds counter from your birth date, plus heartbeats and breaths taken since birth.", "Time & Life"),
  t("deadline-counter", "Deadline Counter", "Flip-card countdown to any target date/time. Multiple deadlines with localStorage persistence.", "Time & Life"),
  t("lifecalendar", "Life Calendar", "90-year week grid — each box is one week of your life. Existential but motivating.", "Time & Life"),
  t(
    "fasting-tracker",
    "Fasting Tracker",
    "Offline-first fasting and weight tracker with timers, streaks, water and body metrics, plus a 30-day weight projection.",
    "Time & Life",
    "https://github.com/soumendrak/fasting-tracker",
  ),
  // Developer Tools
  t("json-pretty", "JSON Pretty", "Paste JSON, get formatted, minified, or tree-view output. Drag-and-drop support.", "Developer Tools"),
  t("color-palette", "Color Palette", "Enter a hex colour, get complementary, analogous, triadic, and monochromatic palettes.", "Developer Tools"),
  t("base64", "Base64 Encoder / Decoder", "Encode/decode text and files to/from Base64. Drag-and-drop file support.", "Developer Tools"),
  t("markdown-live", "Markdown Live Preview", "Split-view markdown editor with live rendered HTML. Custom 75-line parser.", "Developer Tools"),
  t("diff-checker", "Diff Checker", "Side-by-side text comparison with LCS diff — green/red line highlighting.", "Developer Tools"),
  t("passphrase", "Passphrase Generator", "Diceware-style passphrase generator with 2,300+ words and entropy indicator.", "Developer Tools"),
  t("unit-convert", "Unit Converter", "Convert temperature, length, weight, area, and volume — 35+ units, live updates.", "Developer Tools"),
  t("text-counter", "Text Counter", "Real-time character, word, sentence, reading/speaking time counter with Twitter/SMS bars.", "Developer Tools"),
  t("yaml-validator", "YAML Validator", "YAML syntax, style, and schema validation with optional JSON Schema support.", "Developer Tools"),
  // Fun & Visual
  t("conway-gol", "Conway's Game of Life", "Cellular automaton on canvas. Click to toggle cells, 5 preset patterns, start/stop/reset.", "Fun & Visual"),
  t("pixel-art", "Pixel Art Editor", "32×32 grid canvas with 16 colours. Click to paint, export as PNG.", "Fun & Visual"),
  t("analog-clock", "Analog Clock", "Canvas clock with second hand. 3 visual themes (classic, dark, neon). Odia numerals option.", "Fun & Visual"),
  t("orbital-sim", "Orbital Sim", "2-body/3-body gravity simulation. Click to add mass, watch Newton's laws in action.", "Fun & Visual"),
  t("odia-numerals-clock", "Odia Numerals Clock", "Live clock in Odia numerals (୦ ୧ ୨ ୩ ୪ ୫ ୬ ୭ ୮ ୯) with Odia day names.", "Fun & Visual"),
  t("mandelbrot", "Mandelbrot Explorer", "Zoomable Mandelbrot set fractal — click to zoom, drag to pan, scroll iterations.", "Fun & Visual"),
  t("typing-test", "Typing Test", "Type quotes, track real-time WPM and accuracy. Character-level highlighting.", "Fun & Visual"),
  t("matching-game", "Matching Game", "4×4 memory card flip game with emoji pairs, star rating, and local high scores.", "Fun & Visual"),
  t("noise-canvas", "Noise Canvas", "Hypnotic Perlin noise visualisation with frequency, octaves, speed controls. Screensaver mode.", "Fun & Visual"),
  t("snowfall", "Snowfall", "Falling snow particle system with wind control and seasonal colour modes.", "Fun & Visual"),
  t("odia-2048", "Odia 2048", "The 2048 sliding-tile game played entirely in Odia numerals (୦–୯). Touch and keyboard, dark/light mode.", "Fun & Visual"),
  t("handwriting-font", "Handwriting Font Maker", "Print a template, write, snap a photo — get a TTF font of your own handwriting. Runs entirely in the browser.", "Fun & Visual"),
  // DevOps & Monitoring
  t("api-playground", "API Playground", "HTTP API testing tool with custom headers, methods, and response inspection.", "DevOps & Monitoring"),
  t("config-diff", "Config Diff", "Compare configuration files side-by-side with diff highlighting.", "DevOps & Monitoring"),
  t("webhook-inspector", "Webhook Inspector", "Capture, inspect, and replay webhook payloads.", "DevOps & Monitoring"),
  t("uptime-radar", "Uptime Radar", "Endpoint availability and latency monitor with real-time status.", "DevOps & Monitoring"),
  t("cron-log-viewer", "Cron Log Viewer", "Browse, filter, and inspect cron job execution logs.", "DevOps & Monitoring"),
  t("cost-tracker", "Cost Tracker", "LLM API cost tracker across OpenRouter, Anthropic, and OpenAI.", "DevOps & Monitoring"),
  t("coolify-dashboard-widget", "Coolify Dashboard", "Single-file HTML dashboard for Coolify: deployment status, container health, resource usage.", "DevOps & Monitoring"),
  t("env-var-manager", "Env Var Manager", "AES-GCM encrypted environment variable manager with 3 envs and diff viewer.", "DevOps & Monitoring"),
  // Finance
  t("emi", "EMI Calculator", "Solves for EMI, loan amount, tenure or rate — with prepayments, moratorium, floating and flat rates, APR, foreclosure and a full amortization schedule.", "Finance"),
  t("portfolio-tracker", "Portfolio Tracker", "Track stock portfolio, dividends, and financial goals.", "Finance"),
  t("sip-calculator", "SIP Calculator", "SIP and investment calculator with wealth projections and comparisons.", "Finance"),
  // Telephony
  t("call-log-explorer", "Call Log Explorer", "Plivo CDR analysis and visualization with drag-drop support.", "Telephony"),
  t("ivr-flow-builder", "IVR Flow Builder", "Visual drag-and-drop phone tree designer with Plivo XML/JSON export.", "Telephony"),
  // Writing & Content
  t("writing-scheduler", "Writing Scheduler", "Lightweight editorial calendar with drag-and-drop scheduling and GitHub commit linking.", "Writing & Content"),
  t("citation-manager", "Citation Manager", "Paste a URL, auto-fetch metadata, generate citations in 5 formats.", "Writing & Content"),
  t("blog-to-substack", "RSS → Substack", "Load any RSS or Atom feed, pick a post, and copy it as Substack-ready rich text — formatting, links, and images preserved.", "Writing & Content"),
];

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tools.soumendrak.com";

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}

/** Tools sorted by `field` date (most recent first). */
export function recentTools(field: "added" | "updated", limit = 10): Tool[] {
  return TOOLS.filter((t) => t[field])
    .slice()
    .sort((a, b) => (b[field]! < a[field]! ? -1 : b[field]! > a[field]! ? 1 : 0))
    .slice(0, limit);
}
