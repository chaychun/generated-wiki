import { safeSession } from "./storage";
import type { Referrer } from "./types";

const REFERRER_KEY = "gw:referrer:v1";
const TRAIL_KEY = "gw:trail:v1";
const TRAIL_MAX = 20;

export function getReferrer(): Referrer | null {
  const parsed = safeSession.get<Referrer>(REFERRER_KEY);
  if (!parsed || !parsed.slug || !parsed.body) return null;
  return parsed;
}

export function setReferrer(r: Referrer): void {
  safeSession.set(REFERRER_KEY, r);
}

export function clearReferrer(): void {
  safeSession.remove(REFERRER_KEY);
}

export function pushTrail(slug: string): void {
  const arr = safeSession.get<string[]>(TRAIL_KEY) ?? [];
  if (arr[arr.length - 1] !== slug) arr.push(slug);
  while (arr.length > TRAIL_MAX) arr.shift();
  safeSession.set(TRAIL_KEY, arr);
}

export function getTrail(): string[] {
  return safeSession.get<string[]>(TRAIL_KEY) ?? [];
}
