import { Article } from "@/components/Article";
import { normalizeSlug } from "@/lib/slug";

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  let decoded: string;
  try {
    decoded = decodeURIComponent(rawSlug);
  } catch {
    decoded = rawSlug;
  }
  const normalized = normalizeSlug(decoded);
  return <Article slug={normalized} />;
}
