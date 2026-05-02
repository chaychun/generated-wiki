import type { Persona } from "./types";

const KEY = "gw:persona:v1";

export const DEFAULT_PERSONA: Persona = {
  level: "general",
  chaos: "off",
};

export function loadPersona(): Persona {
  if (typeof window === "undefined") return DEFAULT_PERSONA;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PERSONA;
    const parsed = JSON.parse(raw) as Partial<Persona>;
    return { ...DEFAULT_PERSONA, ...parsed };
  } catch {
    return DEFAULT_PERSONA;
  }
}

export function savePersona(p: Persona): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

export function personaCacheKey(p: Persona): string {
  const chaos =
    p.chaos === "custom" ? `custom:${(p.chaosCustom ?? "").trim().slice(0, 200)}` : p.chaos;
  return `${p.level}|${(p.freeform ?? "").trim()}|${chaos}`;
}

export function personaLabel(p: Persona): string {
  switch (p.level) {
    case "kid":
      return "curious kid";
    case "expert":
      return "domain expert";
    default:
      return "general reader";
  }
}
