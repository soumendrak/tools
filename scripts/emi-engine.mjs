/* Loads the EMI calculator's engine out of the shipped HTML and returns it.
 *
 * The tool is vendored as one self-contained file, so there is nothing to import. Rather than
 * keep a second copy of the maths in the test suite — the exact mistake that let the capitalised
 * interest double-count survive in one place after being fixed in another — this evaluates the
 * real <script> from public/tools/emi/index.html. The page guards its own bootstrap behind a
 * `typeof document` check, so with no DOM present it defines everything and stops.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const HERE = dirname(fileURLToPath(import.meta.url));
export const TOOL_PATH = join(HERE, "..", "public", "tools", "emi", "index.html");

export function loadEngine(path = TOOL_PATH) {
  const html = readFileSync(path, "utf8");

  // the engine lives in the last inline <script> with no src attribute
  const blocks = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => m[1])
    .filter((s) => s.includes("function simulate"));
  if (blocks.length !== 1) {
    throw new Error(`expected exactly one engine <script>, found ${blocks.length}`);
  }

  const sandbox = {
    console,
    Intl,
    Date,
    Math,
    URLSearchParams,
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
    setTimeout,
    clearTimeout,
    addEventListener() {},
    location: { hash: "", pathname: "/", search: "" },
    history: { replaceState() {} },
    navigator: {},
    matchMedia: () => ({ matches: false }),
    // no `document`: the page's bootstrap guard sees this and returns before touching the DOM
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(blocks[0], sandbox, { filename: "emi-engine" });

  if (!sandbox.__EMI__) throw new Error("engine did not export __EMI__ — did the bootstrap guard change?");
  return sandbox.__EMI__;
}
