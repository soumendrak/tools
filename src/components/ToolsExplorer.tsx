"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CATEGORIES, TOOLS, type Category } from "@/data/tools";

export default function ToolsExplorer() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "All">("All");

  useEffect(() => {
    const initialQuery = new URLSearchParams(window.location.search).get("q");
    if (initialQuery) {
      // This intentionally synchronizes the client-only URL with the static page.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery(initialQuery);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter(
      (tool) =>
        (category === "All" || tool.category === category) &&
        (q === "" ||
          tool.name.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q)),
    );
  }, [query, category]);

  return (
    <section id="tools" aria-label="Tool catalog" className="mx-auto w-full max-w-6xl px-6 pb-24">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <form action="/" role="search" className="relative flex-1">
          <label className="block">
            <span className="sr-only">Search tools</span>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" d="m21 21-4.35-4.35M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
            </svg>
            <input
              type="search"
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${TOOLS.length} tools…`}
              className="w-full rounded-xl border border-border bg-card py-3 pl-11 pr-4 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </label>
        </form>
        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
          {(["All", ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                category === c
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-card text-muted hover:border-accent/50 hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <p className="sr-only" role="status">
        {filtered.length} tools shown
      </p>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-muted">
          No tools match “{query}”. Try a different search.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tool) => (
            <li key={tool.slug} className="reveal">
              <article className="tool-card group relative flex h-full flex-col rounded-2xl border border-border bg-card p-5">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold">
                    <Link
                      href={`/t/${tool.slug}`}
                      className="after:absolute after:inset-0 after:content-['']"
                    >
                      {tool.name}
                    </Link>
                  </h3>
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                    {tool.category}
                  </span>
                </div>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-muted">
                  {tool.description}
                </p>
                <div className="relative z-10 flex gap-4 text-xs font-medium">
                  <a
                    href={tool.liveUrl}
                    target="_blank"
                    rel="noopener"
                    className="text-accent-soft hover:text-accent"
                  >
                    Open ↗
                  </a>
                  <a
                    href={tool.repoUrl}
                    target="_blank"
                    rel="noopener"
                    className="text-muted hover:text-foreground"
                  >
                    Source
                  </a>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
