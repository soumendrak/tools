"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  liveUrl: string;
  repoUrl: string;
  name: string;
  description: string;
}

export default function ToolFrame({
  liveUrl,
  repoUrl,
  name,
  description,
}: Props) {
  const [full, setFull] = useState(false);
  const exitRef = useRef<HTMLButtonElement>(null);

  const enter = useCallback(() => setFull(true), []);
  const exit = useCallback(() => setFull(false), []);

  // Lock scroll + Escape-to-exit while in full screen.
  useEffect(() => {
    if (!full) return;
    exitRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && exit();
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [full, exit]);

  const syncTheme = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    const theme =
      document.documentElement.getAttribute("data-theme") || "light";
    e.currentTarget.contentWindow?.postMessage({ __theme: theme }, "*");
  };

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <button
              type="button"
              onClick={enter}
              aria-label="Open full screen"
              title="Full screen"
              className="rounded-lg border border-border bg-card p-2 text-muted transition-colors hover:border-accent/50 hover:text-foreground"
            >
              <ExpandIcon />
            </button>
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener"
              className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:border-accent/50"
            >
              View source
            </a>
          </div>
        </div>
      </div>

      {/* The iframe is mounted exactly once; entering/exiting full screen only
          toggles this container's class, so the tool keeps its in-memory state
          (running timers, typed input, canvas, etc.) instead of reloading. */}
      <div
        className={
          full
            ? "fixed inset-0 z-50 flex flex-col bg-background"
            : "flex w-full flex-1 flex-col"
        }
        {...(full
          ? { role: "dialog", "aria-modal": true, "aria-label": `${name} — full screen` }
          : {})}
      >
        <button
          ref={exitRef}
          type="button"
          onClick={exit}
          aria-label="Exit full screen"
          title="Minimize (Esc)"
          className={
            full
              ? "absolute right-4 top-4 z-10 rounded-lg border border-border bg-card/90 p-2 text-muted backdrop-blur transition-colors hover:border-accent/50 hover:text-foreground"
              : "hidden"
          }
        >
          <MinimizeIcon />
        </button>
        <iframe
          src={liveUrl}
          title={`${name} — interactive tool`}
          loading="lazy"
          onLoad={syncTheme}
          className={full ? "h-full w-full border-0" : "w-full flex-1 border-0"}
          style={full ? undefined : { minHeight: "78vh", background: "transparent" }}
          sandbox="allow-scripts allow-same-origin allow-downloads allow-popups allow-forms allow-modals"
        />
      </div>
    </>
  );
}

function ExpandIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M16 21h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M16 21v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  );
}
