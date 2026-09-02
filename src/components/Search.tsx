"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { TOOLS } from "@/data/tools";

const SearchCtx = createContext<{
  query: string;
  setQuery: (q: string) => void;
}>({ query: "", setQuery: () => {} });

export const useSearch = () => useContext(SearchCtx);

/** Shares one query between the hero search bar and the catalog below it. */
export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("q");
    if (initial) {
      // This intentionally synchronizes the client-only URL with the static page.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery(initial);
    }
  }, []);

  return (
    <SearchCtx.Provider value={{ query, setQuery }}>
      <div data-searching={query.trim() ? "" : undefined}>{children}</div>
    </SearchCtx.Provider>
  );
}

/** Renders children only while no search is active, so results sit directly
    under the search bar instead of behind a wall of secondary content. */
export function HideOnSearch({ children }: { children: ReactNode }) {
  const { query } = useSearch();
  return query.trim() ? null : <>{children}</>;
}

export function SearchBox({ big = false }: { big?: boolean }) {
  const { query, setQuery } = useSearch();

  return (
    <form
      action="/"
      role="search"
      className={big ? "relative w-full" : "relative flex-1"}
      onSubmit={(e) => {
        e.preventDefault();
        document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
      }}
    >
      <label className="block">
        <span className="sr-only">Search tools</span>
        <svg
          aria-hidden="true"
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted ${
            big ? "left-5 h-5 w-5" : "left-4 h-4 w-4"
          }`}
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
          className={`w-full rounded-xl border border-border bg-card placeholder:text-muted focus:border-accent focus:outline-none ${
            big
              ? "py-4 pl-13 pr-5 text-base shadow-lg sm:text-lg"
              : "py-3 pl-11 pr-4 text-sm"
          }`}
        />
      </label>
    </form>
  );
}
