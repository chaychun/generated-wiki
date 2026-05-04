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
        ? (obj.suggestions as unknown[])
            .filter((s): s is string => typeof s === "string")
            .map(cleanSuggestion)
            .filter((s) => s.length > 0)
        : undefined,
    },
    bodyStart,
  };
}

function cleanSuggestion(s: string): string {
  let out = s.trim().replace(/^\[\[/, "").replace(/\]\]$/, "").trim();
  const pipeIdx = out.indexOf("|");
  if (pipeIdx !== -1) out = out.slice(0, pipeIdx).trim();
  return out;
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

export type Segment =
  | { type: "text"; text: string }
  | { type: "link"; target: string; display?: string };

export function tokenizeBody(body: string): Segment[] {
  const out: Segment[] = [];
  const re = /\[\[([^\]\n]+)\]\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    if (m.index > last) {
      out.push({ type: "text", text: body.slice(last, m.index) });
    }
    const inner = m[1];
    const pipeIdx = inner.indexOf("|");
    if (pipeIdx === -1) {
      out.push({ type: "link", target: inner.trim() });
    } else {
      const target = inner.slice(0, pipeIdx).trim();
      const display = inner.slice(pipeIdx + 1).trim();
      out.push({
        type: "link",
        target,
        display: display.length > 0 ? display : undefined,
      });
    }
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
  try {
    return decodeURIComponent(slug).replace(/_/g, " ");
  } catch {
    return slug.replace(/_/g, " ");
  }
}
