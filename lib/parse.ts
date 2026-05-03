import yaml from "js-yaml";
import { normalizeSlug } from "./slug";
import type { Frontmatter } from "./types";

export type ParsedHead = {
  fm: Frontmatter;
  bodyStart: number;
};

export function parseFrontmatter(text: string): ParsedHead | null {
  const offset = findFrontmatterStart(text);
  if (offset === -1) return null;
  const inner = text.slice(offset);
  const closeIdx = inner.indexOf("\n---", 3);
  if (closeIdx === -1) return null;

  const yamlBlock = inner.slice(3, closeIdx).trim();
  let parsed: unknown;
  try {
    parsed = yaml.load(yamlBlock, { schema: yaml.FAILSAFE_SCHEMA });
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  const type = obj.type;
  if (type !== "article" && type !== "rejected") return null;

  let i = closeIdx + 4;
  if (inner[i] === "\n") i++;
  const bodyStart = offset + i;

  if (type === "article") {
    return {
      fm: { type: "article" },
      bodyStart,
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
    bodyStart,
  };
}

function findFrontmatterStart(text: string): number {
  const window = text.slice(0, 1000);
  if (window.startsWith("---")) return 0;
  const m = window.match(/(?:^|\n)---\r?\n/);
  if (!m || m.index === undefined) return -1;
  return m.index + (m[0].startsWith("\n") ? 1 : 0);
}

export function isErrorEnvelope(parsed: ParsedHead | null): boolean {
  return !!parsed && parsed.fm.type === "rejected" && parsed.fm.reason === "error";
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
  return normalizeSlug(target);
}

export function slugToDisplay(slug: string): string {
  return decodeURIComponent(slug).replace(/_/g, " ");
}
