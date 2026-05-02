import yaml from "js-yaml";
import type { Frontmatter } from "./types";

export type ParsedHead = {
  fm: Frontmatter;
  bodyStart: number;
};

export function parseFrontmatter(text: string): ParsedHead | null {
  if (!text.startsWith("---")) return null;
  const closeIdx = text.indexOf("\n---", 3);
  if (closeIdx === -1) return null;

  const yamlBlock = text.slice(3, closeIdx).trim();
  let parsed: unknown;
  try {
    parsed = yaml.load(yamlBlock);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  const type = obj.type;
  if (type !== "article" && type !== "rejected") return null;

  let i = closeIdx + 4;
  if (text[i] === "\n") i++;

  if (type === "article") {
    return {
      fm: { type: "article", title: String(obj.title ?? "") },
      bodyStart: i,
    };
  }
  return {
    fm: {
      type: "rejected",
      reason: typeof obj.reason === "string" ? obj.reason : undefined,
      suggestions: Array.isArray(obj.suggestions)
        ? (obj.suggestions as unknown[]).filter((s): s is string => typeof s === "string")
        : undefined,
    },
    bodyStart: i,
  };
}

export type Segment = { type: "text"; text: string } | { type: "link"; target: string };

export function tokenizeBody(body: string): Segment[] {
  const out: Segment[] = [];
  const re = /\[\[([^\]\n]+)\]\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    if (m.index > last) {
      out.push({ type: "text", text: body.slice(last, m.index) });
    }
    out.push({ type: "link", target: m[1].trim() });
    last = re.lastIndex;
  }
  if (last < body.length) {
    out.push({ type: "text", text: body.slice(last) });
  }
  return out;
}

export function targetToSlug(target: string): string {
  return target
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 100);
}

export function slugToDisplay(slug: string): string {
  return decodeURIComponent(slug).replace(/_/g, " ");
}
