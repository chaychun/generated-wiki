"use client";

import Link from "next/link";
import { targetToSlug } from "@/lib/parse";

export function WikiLink({
  target,
  display,
  children,
}: {
  target: string;
  display?: string;
  children?: React.ReactNode;
}) {
  const slug = targetToSlug(target);
  const text = children ?? display ?? target;
  if (!slug) return <span>{text}</span>;
  return (
    <Link href={`/${slug}`} className="wiki-link">
      {text}
    </Link>
  );
}
