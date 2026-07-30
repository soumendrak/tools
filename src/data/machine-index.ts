import { CATEGORIES, SITE_URL, TOOLS } from "./tools";

const SITE_DESCRIPTION =
  "Free, single-file browser tools for time, development, creativity, DevOps, finance, telephony, and writing. No sign-up is required; tools run in the browser.";

function canonicalUrl(slug: string) {
  return `${SITE_URL}/t/${slug}`;
}

function directUrl(slug: string) {
  return `${SITE_URL}/tools/${slug}/`;
}

export function buildLlmsIndex(): string {
  const sections = CATEGORIES.map((category) => {
    const links = TOOLS.filter((tool) => tool.category === category)
      .map(
        (tool) =>
          `- [${tool.name}](${canonicalUrl(tool.slug)}): ${tool.description}`,
      )
      .join("\n");
    return `## ${category}\n\n${links}`;
  }).join("\n\n");

  return `# Tools by Soumendra

> ${SITE_DESCRIPTION}

Tools by Soumendra is a statically exported directory of ${TOOLS.length} focused web utilities. Each canonical tool page describes and embeds the interactive tool; direct tool URLs are available in the full index.

${sections}

## More

- [Full machine-readable catalog](${SITE_URL}/llms-full.txt): Expanded entries with canonical, direct-use, and source URLs.
- [XML sitemap](${SITE_URL}/sitemap.xml): Crawlable canonical page inventory.
- [Source repository](https://github.com/soumendrak/tools): Open-source HTML and site code.
`;
}

export function buildLlmsFullIndex(): string {
  const tools = CATEGORIES.flatMap((category) => {
    const entries = TOOLS.filter((tool) => tool.category === category)
      .map(
        (tool) => `### ${tool.name}

- Category: ${tool.category}
- Canonical page: ${canonicalUrl(tool.slug)}
- Direct tool: ${directUrl(tool.slug)}
- Source: ${tool.repoUrl}
- Description: ${tool.description}
- Access: Free; no account required; runs in a modern web browser.`,
      )
      .join("\n\n");
    return [`## ${category}`, entries];
  }).join("\n\n");

  return `# Tools by Soumendra — Full Catalog

> ${SITE_DESCRIPTION}

## Site facts

- Canonical site: ${SITE_URL}
- Publisher: Soumendra Kumar Sahoo
- Tool count: ${TOOLS.length}
- Categories: ${CATEGORIES.length}
- Delivery: Static HTML from Cloudflare Pages
- Data handling: Tool interactions run client-side unless a tool explicitly calls a user-selected external API.
- Preferred citations: Use each tool's canonical \`/t/<slug>\` page.
- Interactive access: Use the corresponding \`/tools/<slug>/\` URL.

${tools}
`;
}
