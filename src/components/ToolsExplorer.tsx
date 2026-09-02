"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CATEGORIES, TOOLS, type Category } from "@/data/tools";
import { useSearch } from "./Search";

export default function ToolsExplorer() {
  const { query, setQuery } = useSearch();
  const [category, setCategory] = useState<Category | "All">("All");

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
      <div className="mb-6 flex flex-col gap-4">
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

      <p
        role="status"
        className="mb-6 flex flex-wrap items-baseline gap-x-2 text-sm text-muted"
      >
        {query.trim() ? (
          <>
            <span>
              <strong className="font-semibold text-foreground">
                {filtered.length}
              </strong>{" "}
              {filtered.length === 1 ? "tool" : "tools"} matching “{query.trim()}”
            </span>
            <button
              onClick={() => setQuery("")}
              className="font-medium text-accent-soft underline-offset-4 hover:text-accent hover:underline"
            >
              Clear
            </button>
          </>
        ) : (
          <span>
            Showing all {filtered.length} tools
            {category !== "All" && ` in ${category}`}
          </span>
        )}
      </p>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted">No tools match “{query.trim()}”.</p>
          <button
            onClick={() => setQuery("")}
            className="mt-4 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-colors hover:border-accent/50"
          >
            Clear search
          </button>
        </div>
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
