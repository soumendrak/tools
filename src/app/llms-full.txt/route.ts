import { buildLlmsFullIndex } from "@/data/machine-index";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildLlmsFullIndex(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
