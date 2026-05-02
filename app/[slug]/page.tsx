import { Article } from "@/components/Article";
import { HOME_SLUG } from "@/lib/types";

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const decoded = decodeURIComponent(rawSlug).slice(0, 100);
  const normalized =
    decoded === HOME_SLUG ? HOME_SLUG : decoded.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return <Article slug={normalized || decoded} />;
}
