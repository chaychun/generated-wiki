import { describe, expect, test } from "bun:test";
import {
  parseFrontmatter,
  slugToDisplay,
  targetToSlug,
  tokenizeBody,
} from "@/lib/parse";

describe("parseFrontmatter", () => {
  test("valid article", () => {
    const text = `---\ntype: article\ntitle: Hello World\n---\nbody here`;
    const r = parseFrontmatter(text);
    expect(r).not.toBeNull();
    expect(r!.fm).toEqual({ type: "article", title: "Hello World" });
    expect(text.slice(r!.bodyStart)).toBe("body here");
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

  test("missing closing ---", () => {
    const text = `---\ntype: article\ntitle: oops\n`;
    expect(parseFrontmatter(text)).toBeNull();
  });

  test("malformed YAML", () => {
    const text = `---\ntype: article\ntitle: "unterminated\n---\nbody`;
    expect(parseFrontmatter(text)).toBeNull();
  });

  test("type !== article|rejected", () => {
    const text = `---\ntype: bogus\ntitle: x\n---\nbody`;
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
  test("simple words", () => {
    const slug = targetToSlug("Hello World");
    expect(slug).toBe("hello_world");
    expect(slugToDisplay(slug)).toBe("hello world");
  });

  test("strips punctuation", () => {
    expect(targetToSlug("Foo, Bar!")).toBe("foo_bar");
  });

  test("preserves hyphens and digits", () => {
    expect(targetToSlug("UTF-8 Encoding 2")).toBe("utf-8_encoding_2");
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
