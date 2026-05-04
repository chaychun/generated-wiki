import { safeLocal } from "./storage";
import type { Persona } from "./types";

const KEY = "gw:persona:v1";

export const DEFAULT_PERSONA: Persona = {
  level: "general",
  chaos: "off",
};

export function loadPersona(): Persona {
  const parsed = safeLocal.get<Partial<Persona>>(KEY);
  if (!parsed) return DEFAULT_PERSONA;
  return { ...DEFAULT_PERSONA, ...parsed };
}

export function savePersona(p: Persona): void {
  safeLocal.set(KEY, p);
}

export function personaCacheKey(p: Persona): string {
  if (p.chaos === "custom") {
    const custom = (p.chaosCustom ?? "").trim().slice(0, 200);
    if (custom) return `chaos:custom:${custom}`;
    return `level:${p.level}`;
  }
  if (p.chaos === "off") {
    return `level:${p.level}`;
  }
  return `chaos:${p.chaos}`;
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
