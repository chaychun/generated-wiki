import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { slugToDisplay } from "@/lib/parse";
import { normalizeSlug } from "@/lib/slug";

function decodeAndNormalize(rawSlug: string): string {
  let decoded: string;
  try {
    decoded = decodeURIComponent(rawSlug);
  } catch {
    decoded = rawSlug;
  }
  return normalizeSlug(decoded);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeAndNormalize(rawSlug);
  const display = slugToDisplay(slug);
  const title = /[A-Z]/.test(display)
    ? display
    : display.charAt(0).toUpperCase() + display.slice(1);
  return {
    title,
    description: `${title} — a generated article on generated.wiki.`,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  return <Article slug={decodeAndNormalize(rawSlug)} />;
}
