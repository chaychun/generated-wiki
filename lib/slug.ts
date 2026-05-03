import { HOME_SLUG } from "./types";

const MAX_SLUG_CHARS = 100;

export function normalizeSlug(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (trimmed === HOME_SLUG) return HOME_SLUG;
  return trimmed
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, MAX_SLUG_CHARS);
}
