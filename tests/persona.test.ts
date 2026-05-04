import { describe, expect, test } from "bun:test";
import { personaCacheKey } from "@/lib/persona";
import type { Persona } from "@/lib/types";

describe("personaCacheKey", () => {
  test("same persona → same key", () => {
    const a: Persona = { level: "general", chaos: "off" };
    const b: Persona = { level: "general", chaos: "off" };
    expect(personaCacheKey(a)).toBe(personaCacheKey(b));
  });

  test("differing level → different keys (chaos off)", () => {
    const a: Persona = { level: "kid", chaos: "off" };
    const b: Persona = { level: "expert", chaos: "off" };
    expect(personaCacheKey(a)).not.toBe(personaCacheKey(b));
  });

  test("differing chaos → different keys", () => {
    const a: Persona = { level: "general", chaos: "shakespeare" };
    const b: Persona = { level: "general", chaos: "linkedin" };
    expect(personaCacheKey(a)).not.toBe(personaCacheKey(b));
  });

  test("custom chaos with differing chaosCustom → different keys", () => {
    const a: Persona = { level: "general", chaos: "custom", chaosCustom: "x" };
    const b: Persona = { level: "general", chaos: "custom", chaosCustom: "y" };
    expect(personaCacheKey(a)).not.toBe(personaCacheKey(b));
  });

  test("level ignored when chaos is on (no cache fragmentation)", () => {
    const a: Persona = { level: "kid", chaos: "shakespeare" };
    const b: Persona = { level: "expert", chaos: "shakespeare" };
    expect(personaCacheKey(a)).toBe(personaCacheKey(b));
  });

  test("level ignored when chaos is custom (same custom text)", () => {
    const a: Persona = { level: "kid", chaos: "custom", chaosCustom: "pirate" };
    const b: Persona = { level: "expert", chaos: "custom", chaosCustom: "pirate" };
    expect(personaCacheKey(a)).toBe(personaCacheKey(b));
  });

  test("chaosCustom whitespace trimmed", () => {
    const a: Persona = { level: "general", chaos: "custom", chaosCustom: " hi " };
    const b: Persona = { level: "general", chaos: "custom", chaosCustom: "hi" };
    expect(personaCacheKey(a)).toBe(personaCacheKey(b));
  });

  test("empty/whitespace custom collapses to chaos:off (matches server)", () => {
    const off: Persona = { level: "general", chaos: "off" };
    const empty: Persona = { level: "general", chaos: "custom", chaosCustom: "" };
    const blank: Persona = { level: "general", chaos: "custom", chaosCustom: "   " };
    const missing: Persona = { level: "general", chaos: "custom" };
    expect(personaCacheKey(empty)).toBe(personaCacheKey(off));
    expect(personaCacheKey(blank)).toBe(personaCacheKey(off));
    expect(personaCacheKey(missing)).toBe(personaCacheKey(off));
  });
});
