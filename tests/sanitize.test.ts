import { describe, expect, test } from "bun:test";
import {
  sanitizePersona,
  sanitizeReferrer,
  sanitizeSlug,
} from "@/app/api/generate/route";
import { HOME_SLUG } from "@/lib/types";

describe("sanitizeSlug", () => {
  test("non-string → empty", () => {
    expect(sanitizeSlug(undefined)).toBe("");
    expect(sanitizeSlug(null)).toBe("");
    expect(sanitizeSlug(42)).toBe("");
    expect(sanitizeSlug({})).toBe("");
  });

  test("HOME_SLUG passthrough", () => {
    expect(sanitizeSlug(HOME_SLUG)).toBe(HOME_SLUG);
  });

  test("lowercases and strips disallowed", () => {
    expect(sanitizeSlug("Hello World!")).toBe("helloworld");
    expect(sanitizeSlug("foo-bar_baz")).toBe("foo-bar_baz");
  });

  test("trims and caps at 100 chars", () => {
    expect(sanitizeSlug("  abc  ")).toBe("abc");
    expect(sanitizeSlug("a".repeat(150)).length).toBe(100);
  });

  test("empty string", () => {
    expect(sanitizeSlug("")).toBe("");
  });
});

describe("sanitizePersona", () => {
  test("non-object → defaults", () => {
    expect(sanitizePersona(null)).toEqual({ level: "general", chaos: "off" });
    expect(sanitizePersona("hi")).toEqual({ level: "general", chaos: "off" });
    expect(sanitizePersona(undefined)).toEqual({
      level: "general",
      chaos: "off",
    });
  });

  test("invalid level/chaos fall back to defaults", () => {
    const r = sanitizePersona({ level: "wizard", chaos: "doom" });
    expect(r.level).toBe("general");
    expect(r.chaos).toBe("off");
  });

  test("valid level and chaos preserved", () => {
    const r = sanitizePersona({ level: "expert", chaos: "shakespeare" });
    expect(r).toEqual({
      level: "expert",
      chaos: "shakespeare",
      freeform: undefined,
      chaosCustom: undefined,
    });
  });

  test("oversized freeform truncated to 500", () => {
    const r = sanitizePersona({
      level: "kid",
      chaos: "off",
      freeform: "x".repeat(700),
    });
    expect(r.freeform!.length).toBe(500);
  });

  test("oversized chaosCustom truncated to 200", () => {
    const r = sanitizePersona({
      level: "general",
      chaos: "custom",
      chaosCustom: "y".repeat(400),
    });
    expect(r.chaosCustom!.length).toBe(200);
  });

  test("non-string freeform/chaosCustom → undefined", () => {
    const r = sanitizePersona({
      level: "general",
      chaos: "off",
      freeform: 123,
      chaosCustom: {},
    });
    expect(r.freeform).toBeUndefined();
    expect(r.chaosCustom).toBeUndefined();
  });
});

describe("sanitizeReferrer", () => {
  test("non-object → null", () => {
    expect(sanitizeReferrer(null)).toBeNull();
    expect(sanitizeReferrer("hi")).toBeNull();
    expect(sanitizeReferrer(undefined)).toBeNull();
  });

  test("missing slug or body → null", () => {
    expect(sanitizeReferrer({ slug: "x" })).toBeNull();
    expect(sanitizeReferrer({ body: "y" })).toBeNull();
    expect(sanitizeReferrer({ slug: "x", body: 1 })).toBeNull();
  });

  test("empty slug or body → null", () => {
    expect(sanitizeReferrer({ slug: "", body: "y" })).toBeNull();
    expect(sanitizeReferrer({ slug: "x", body: "" })).toBeNull();
  });

  test("valid passthrough", () => {
    expect(sanitizeReferrer({ slug: "foo", body: "hello" })).toEqual({
      slug: "foo",
      body: "hello",
    });
  });

  test("oversized slug capped at 100, body capped at 2000", () => {
    const r = sanitizeReferrer({
      slug: "a".repeat(150),
      body: "b".repeat(3000),
    });
    expect(r!.slug.length).toBe(100);
    expect(r!.body.length).toBe(2000);
  });
});
