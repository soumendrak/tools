import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTool, SITE_URL, TOOLS } from "@/data/tools";
import ToolFrame from "@/components/ToolFrame";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return TOOLS.map(({ slug }) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  const canonicalUrl = `${SITE_URL}/t/${tool.slug}`;
  return {
    title: `${tool.name} — free online tool`,
    description: tool.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: tool.name,
      description: tool.description,
      url: canonicalUrl,
      images: [
        {
          url: "/social-card.png",
          width: 1200,
          height: 630,
          alt: "Tools by Soumendra — tiny browser tools that just work",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: tool.name,
      description: tool.description,
      images: ["/social-card.png"],
    },
  };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();
  const canonicalUrl = `${SITE_URL}/t/${tool.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${canonicalUrl}#software`,
        name: tool.name,
        description: tool.description,
        url: canonicalUrl,
        applicationCategory: "UtilityApplication",
        operatingSystem: "Any (web browser)",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        author: {
          "@type": "Person",
          name: "Soumendra Kumar Sahoo",
          url: "https://www.soumendrak.com",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Tools",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: tool.name,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  return (
    <main id="main-content" tabIndex={-1} className="flex w-full flex-1 flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto w-full max-w-6xl px-6 pt-8">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
          <Link href="/" className="hover:text-accent-soft">
            ← All tools
          </Link>
        </nav>
      </div>

      <ToolFrame
        liveUrl={tool.liveUrl}
        repoUrl={tool.repoUrl}
        name={tool.name}
        description={tool.description}
      />
    </main>
  );
}
