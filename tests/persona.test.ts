import { describe, expect, test } from "bun:test";
import { personaCacheKey } from "@/lib/persona";
import type { Persona } from "@/lib/types";

describe("personaCacheKey", () => {
  test("same persona → same key", () => {
    const a: Persona = { level: "general", chaos: "off" };
    const b: Persona = { level: "general", chaos: "off" };
    expect(personaCacheKey(a)).toBe(personaCacheKey(b));
  });

  test("differing freeform → different keys", () => {
    const a: Persona = { level: "kid", chaos: "off", freeform: "hi" };
    const b: Persona = { level: "kid", chaos: "off", freeform: "bye" };
    expect(personaCacheKey(a)).not.toBe(personaCacheKey(b));
  });

  test("differing level → different keys", () => {
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

  test("undefined freeform === empty freeform", () => {
    const a: Persona = { level: "general", chaos: "off" };
    const b: Persona = { level: "general", chaos: "off", freeform: "" };
    expect(personaCacheKey(a)).toBe(personaCacheKey(b));
  });

  test("freeform whitespace trimmed", () => {
    const a: Persona = { level: "general", chaos: "off", freeform: " hi " };
    const b: Persona = { level: "general", chaos: "off", freeform: "hi" };
    expect(personaCacheKey(a)).toBe(personaCacheKey(b));
  });
});
