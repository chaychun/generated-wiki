"use client";

import Link from "next/link";
import { targetToSlug } from "@/lib/parse";

export function WikiLink({ target, children }: { target: string; children?: React.ReactNode }) {
  const slug = targetToSlug(target);
  if (!slug) return <span>{children ?? target}</span>;
  return (
    <Link href={`/${slug}`} className="wiki-link">
      {children ?? target}
    </Link>
  );
}
