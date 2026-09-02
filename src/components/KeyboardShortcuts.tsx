"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/* Same keymap as til.soumendrak.com. j/k moves real focus (rather than a
   painted highlight class) so Enter opens the link natively and screen
   readers track it — the .tool-card:focus-within style already gives the
   visual highlight. */
const KEYS: [string, string][] = [
  ["j / k", "Highlight next / previous tool"],
  ["↵ / o", "Open highlighted tool"],
  ["/", "Focus the search box"],
  ["t", "Toggle light / dark theme"],
  ["h", "Back to all tools"],
  ["? / Esc", "Show / hide this panel"],
];

function isTyping() {
  const el = document.activeElement;
  return (
    el instanceof HTMLElement &&
    (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
  );
}

function move(step: number) {
  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('main a[href^="/t/"]'),
  );
  if (!links.length) return;
  const at = links.indexOf(document.activeElement as HTMLAnchorElement);
  const next = at < 0 ? (step > 0 ? 0 : links.length - 1) : at + step;
  links[Math.max(0, Math.min(links.length - 1, next))].focus();
}

export default function KeyboardShortcuts() {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const d = dialog.current;
      if (e.key === "Escape") return; // <dialog> closes itself
      if (e.key === "/" && !isTyping()) {
        const search = document.querySelector<HTMLInputElement>(
          'input[type="search"]',
        );
        if (search) {
          e.preventDefault();
          search.focus();
        }
        return;
      }
      if (isTyping()) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === "?") {
        e.preventDefault();
        if (d?.open) d.close();
        else d?.showModal();
        return;
      }
      if (d?.open) return;
      if (key === "j") move(1);
      else if (key === "k") move(-1);
      else if (key === "o") (document.activeElement as HTMLElement)?.click();
      else if (key === "t")
        // delegate to ThemeToggle's own button rather than duplicate its logic
        document
          .querySelector<HTMLButtonElement>('button[aria-label^="Switch to"]')
          ?.click();
      else if (key === "h") router.push("/");
      else return;
      e.preventDefault();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label="Show keyboard shortcuts"
        title="Keyboard shortcuts (press ?)"
        className="fixed bottom-4 right-4 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card font-mono text-sm font-semibold text-muted shadow-sm backdrop-blur transition-colors hover:border-accent/50 hover:text-foreground"
      >
        ?
      </button>

      {/* native <dialog>: Esc, focus trap, focus restore, backdrop for free */}
      <dialog
        ref={dialog}
        aria-label="Keyboard shortcuts"
        className="m-auto w-[min(420px,calc(100%-2rem))] rounded-2xl border border-border bg-card p-0 text-foreground shadow-xl backdrop:bg-black/50"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">⌨ Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Close"
            className="p-1 text-muted transition-colors hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col px-3 py-2">
          {KEYS.map(([keys, desc]) => (
            <div
              key={desc}
              className="flex items-center justify-between gap-4 border-t border-border px-2 py-2.5 first:border-t-0"
            >
              <span className="text-sm text-muted">{desc}</span>
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs">
                {keys}
              </kbd>
            </div>
          ))}
        </div>
        <p className="border-t border-border px-5 py-3 font-mono text-[11px] text-muted">
          these work from any screen
        </p>
      </dialog>
    </>
  );
}
