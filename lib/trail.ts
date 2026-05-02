import type { Referrer } from "./types";

const REFERRER_KEY = "gw:referrer:v1";
const TRAIL_KEY = "gw:trail:v1";
const TRAIL_MAX = 20;

export function getReferrer(): Referrer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(REFERRER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Referrer;
    if (!parsed.slug || !parsed.body) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setReferrer(r: Referrer): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(REFERRER_KEY, JSON.stringify(r));
  } catch {
    // ignore
  }
}

export function clearReferrer(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(REFERRER_KEY);
  } catch {
    // ignore
  }
}

export function pushTrail(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(TRAIL_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    if (arr[arr.length - 1] !== slug) arr.push(slug);
    while (arr.length > TRAIL_MAX) arr.shift();
    window.sessionStorage.setItem(TRAIL_KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

export function getTrail(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(TRAIL_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
