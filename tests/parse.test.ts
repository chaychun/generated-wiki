import { describe, expect, test } from "bun:test";
import {
  parseFrontmatter,
  slugToDisplay,
  targetToSlug,
  tokenizeBody,
} from "@/lib/parse";

describe("parseFrontmatter", () => {
  test("valid article", () => {
    const text = `---\ntype: article\n---\nbody here`;
    const r = parseFrontmatter(text);
    expect(r).not.toBeNull();
    expect(r!.fm).toEqual({ type: "article" });
    expect(text.slice(r!.bodyStart)).toBe("body here");
  });

  test("ignores extra title field on article", () => {
    const text = `---\ntype: article\ntitle: Whatever\n---\nbody`;
    const r = parseFrontmatter(text);
    expect(r).not.toBeNull();
    expect(r!.fm).toEqual({ type: "article" });
  });

  test("valid rejected with reason and suggestions", () => {
    const text = `---\ntype: rejected\nreason: too vague\nsuggestions:\n  - foo\n  - bar\n---\n`;
    const r = parseFrontmatter(text);
    expect(r).not.toBeNull();
    expect(r!.fm).toEqual({
      type: "rejected",
      reason: "too vague",
      suggestions: ["foo", "bar"],
    });
  });

  test("strips [[...]] and pipes from suggestions", () => {
    const text = `---\ntype: rejected\nreason: x\nsuggestions:\n  - "[[Niels Bohr]]"\n  - "[[octopus|octopuses]]"\n  - plain\n---\n`;
    const r = parseFrontmatter(text);
    expect(r!.fm).toEqual({
      type: "rejected",
      reason: "x",
      suggestions: ["Niels Bohr", "octopus", "plain"],
    });
  });

  test("missing closing ---", () => {
    const text = `---\ntype: article\n`;
    expect(parseFrontmatter(text)).toBeNull();
  });

  test("malformed YAML", () => {
    const text = `---\ntype: "unterminated\n---\nbody`;
    expect(parseFrontmatter(text)).toBeNull();
  });

  test("type !== article|rejected", () => {
    const text = `---\ntype: bogus\n---\nbody`;
    expect(parseFrontmatter(text)).toBeNull();
  });

  test("no frontmatter at all", () => {
    expect(parseFrontmatter("just body, no fm")).toBeNull();
  });
});

describe("tokenizeBody", () => {
  test("plain text", () => {
    expect(tokenizeBody("hello world")).toEqual([
      { type: "text", text: "hello world" },
    ]);
  });

  test("single [[link]]", () => {
    expect(tokenizeBody("a [[Foo]] b")).toEqual([
      { type: "text", text: "a " },
      { type: "link", target: "Foo" },
      { type: "text", text: " b" },
    ]);
  });

  test("multiple links", () => {
    expect(tokenizeBody("[[A]] mid [[B C]]")).toEqual([
      { type: "link", target: "A" },
      { type: "text", text: " mid " },
      { type: "link", target: "B C" },
    ]);
  });

  test("unclosed [[", () => {
    expect(tokenizeBody("text [[unclosed rest")).toEqual([
      { type: "text", text: "text [[unclosed rest" },
    ]);
  });

  test("empty", () => {
    expect(tokenizeBody("")).toEqual([]);
  });
});

describe("targetToSlug / slugToDisplay round-trip", () => {
  test("preserves case", () => {
    const slug = targetToSlug("Hello World");
    expect(slug).toBe("Hello_World");
    expect(slugToDisplay(slug)).toBe("Hello World");
  });

  test("preserves acronym casing", () => {
    const slug = targetToSlug("Generated AI");
    expect(slug).toBe("Generated_AI");
    expect(slugToDisplay(slug)).toBe("Generated AI");
  });

  test("strips punctuation", () => {
    expect(targetToSlug("Foo, Bar!")).toBe("Foo_Bar");
  });

  test("preserves hyphens and digits", () => {
    expect(targetToSlug("UTF-8 Encoding 2")).toBe("UTF-8_Encoding_2");
  });

  test("collapses whitespace", () => {
    expect(targetToSlug("  multi   space  ")).toBe("multi_space");
  });

  test("truncates to 100 chars", () => {
    const slug = targetToSlug("a".repeat(150));
    expect(slug.length).toBe(100);
  });

  test("slugToDisplay decodes percent-encoding", () => {
    expect(slugToDisplay("caf%C3%A9_bar")).toBe("café bar");
  });
});

describe("tokenizeBody piped links", () => {
  test("[[target|display]]", () => {
    expect(tokenizeBody("a [[Generated AI|AI-generated]] b")).toEqual([
      { type: "text", text: "a " },
      { type: "link", target: "Generated AI", display: "AI-generated" },
      { type: "text", text: " b" },
    ]);
  });

  test("trims whitespace around pipe", () => {
    expect(tokenizeBody("[[ Niels Bohr | Bohr's ]]")).toEqual([
      { type: "link", target: "Niels Bohr", display: "Bohr's" },
    ]);
  });

  test("empty display falls back to target", () => {
    expect(tokenizeBody("[[Niels Bohr|]]")).toEqual([
      { type: "link", target: "Niels Bohr" },
    ]);
  });

  test("plain link has no display", () => {
    expect(tokenizeBody("[[Niels Bohr]]")).toEqual([
      { type: "link", target: "Niels Bohr" },
    ]);
  });
});
