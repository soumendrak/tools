import Link from "next/link";
import ToolsExplorer from "@/components/ToolsExplorer";
import { CATEGORIES, recentTools, SITE_URL, TOOLS, type Tool } from "@/data/tools";

const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

function RecentList({
  title,
  tools,
  field,
}: {
  title: string;
  tools: Tool[];
  field: "added" | "updated";
}) {
  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted">
        {title}
      </h2>
      <ul className="space-y-2 text-sm">
        {tools.map((tool) => (
          <li key={tool.slug} className="flex flex-wrap items-baseline gap-x-2">
            <Link
              href={`/t/${tool.slug}`}
              className="font-medium text-accent-soft hover:text-accent hover:underline"
            >
              {tool.name}
            </Link>
            <span className="text-muted">— {fmtDate(tool[field]!)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Home() {
  const recentlyAdded = recentTools("added", 8);
  const recentlyUpdated = recentTools("updated", 8);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Tools by Soumendra",
        description:
          "A collection of free, single-file, zero-dependency browser tools.",
        inLanguage: "en",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/?q={search_term_string}#tools`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/#tool-catalog`,
        name: "Tools by Soumendra",
        description:
          "A collection of free, single-file, zero-dependency browser tools.",
        url: SITE_URL,
        numberOfItems: TOOLS.length,
        itemListElement: TOOLS.map((tool, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE_URL}/t/${tool.slug}`,
          name: tool.name,
        })),
      },
    ],
  };

  return (
    <main id="main-content" tabIndex={-1}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <header className="relative overflow-hidden px-6 pb-20 pt-28 text-center sm:pt-36">
        <div
          aria-hidden="true"
          className="orb left-1/4 top-0 h-72 w-72 bg-accent"
        />
        <div
          aria-hidden="true"
          className="orb right-1/4 top-24 h-64 w-64 bg-orange-400"
          style={{ animationDelay: "-9s" }}
        />

        <div className="relative mx-auto max-w-3xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="Tools by Soumendra logo"
            width={72}
            height={72}
            className="animate-rise mx-auto mb-6 rounded-[22px] shadow-lg"
            style={{ height: 72, width: 72 }}
          />
          <p
            className="animate-rise mb-5 inline-block rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted"
            style={{ animationDelay: "0.05s" }}
          >
            {TOOLS.length} tools · {CATEGORIES.length} categories · 0 sign-ups
          </p>
          <h1
            className="animate-rise text-balance text-4xl font-bold tracking-tight sm:text-6xl"
            style={{ animationDelay: "0.1s" }}
          >
            Tiny tools that <span className="gradient-text">just work</span>
          </h1>
          <p
            className="animate-rise mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg"
            style={{ animationDelay: "0.2s" }}
          >
            A growing collection of single-file, zero-dependency web tools —
            timers, dev utilities, visual toys, and DevOps helpers. Free, open
            source, no sign-up. Everything runs in your browser.
          </p>
          <div
            className="animate-rise mt-8 flex flex-wrap items-center justify-center gap-4"
            style={{ animationDelay: "0.3s" }}
          >
            <a
              href="#tools"
              className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-105"
            >
              Browse the tools
            </a>
            <a
              href="https://github.com/soumendrak"
              className="rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-accent/50"
            >
              Star on GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Recently added / updated — discoverability */}
      <section
        aria-label="Recent tools"
        className="mx-auto w-full max-w-6xl px-6 pb-16"
      >
        <div className="grid gap-8 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2 sm:p-8">
          <RecentList
            title="Recently added"
            tools={recentlyAdded}
            field="added"
          />
          <RecentList
            title="Recently updated"
            tools={recentlyUpdated}
            field="updated"
          />
        </div>
      </section>

      <ToolsExplorer />
    </main>
  );
}
