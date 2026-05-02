"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getCached, putCached } from "@/lib/cache";
import { parseFrontmatter, slugToDisplay, tokenizeBody, type ParsedHead } from "@/lib/parse";
import { loadPersona, personaCacheKey } from "@/lib/persona";
import { clearReferrer, getReferrer, pushTrail, setReferrer } from "@/lib/trail";
import { HOME_SLUG, type Frontmatter } from "@/lib/types";
import { Settings } from "./Settings";
import { WikiLink } from "./WikiLink";

export function Article({ slug }: { slug: string }) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slugRef = useRef(slug);

  useEffect(() => {
    slugRef.current = slug;
    let cancelled = false;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    setText("");
    setDone(false);
    setError(null);
    pushTrail(slug);

    (async () => {
      const persona = loadPersona();
      const pkey = personaCacheKey(persona);

      const cached = await getCached(slug, pkey);
      if (cancelled) return;
      if (cached) {
        setText(cached);
        setDone(true);
        rememberAsReferrer(slug, cached);
        return;
      }

      const referrer = slug === HOME_SLUG ? null : getReferrer();

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug, persona, referrer }),
        });

        if (!res.ok || !res.body) {
          const message = await res.text().catch(() => `HTTP ${res.status}`);
          if (!cancelled) {
            setError(message || `HTTP ${res.status}`);
            setDone(true);
          }
          return;
        }

        reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { value, done: streamDone } = await reader.read();
          if (cancelled) return;
          if (value) {
            acc += decoder.decode(value, { stream: true });
            setText(acc);
          }
          if (streamDone) break;
        }
        if (cancelled) return;
        setDone(true);
        await putCached(slug, pkey, acc);
        rememberAsReferrer(slug, acc);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "stream failed");
          setDone(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      reader?.cancel().catch(() => {});
    };
  }, [slug]);

  const head = parseFrontmatter(text);
  const body = head ? text.slice(head.bodyStart) : "";

  return (
    <main className="mx-auto max-w-3xl px-6 py-8 font-serif">
      <header className="mb-2">
        <Link href="/" className="wiki-link text-sm">
          generated.wiki
        </Link>
      </header>
      <Settings />

      {error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {!head && !done && <SkeletonTitle slug={slug} />}
      {!head && done && !error && <p className="text-zinc-500">No content.</p>}

      {head?.fm.type === "article" && <ArticleView fm={head.fm} body={body} streaming={!done} />}

      {head?.fm.type === "rejected" && <RejectedView fm={head.fm} body={body} streaming={!done} />}
    </main>
  );
}

function rememberAsReferrer(slug: string, full: string) {
  const head = parseFrontmatter(full);
  if (!head) return;
  if (head.fm.type === "article") {
    setReferrer({ slug, body: full.slice(head.bodyStart).trim() });
  } else {
    clearReferrer();
  }
}

function SkeletonTitle({ slug }: { slug: string }) {
  const display = slug === HOME_SLUG ? "generated.wiki" : slugToDisplay(slug);
  return (
    <>
      <h1 className="border-b border-[var(--rule)] pb-2 font-serif text-4xl capitalize text-[var(--ink)]">
        {display}
      </h1>
      <p className="mt-3 animate-pulse text-zinc-500">Generating…</p>
    </>
  );
}

function ArticleView({
  fm,
  body,
  streaming,
}: {
  fm: Extract<Frontmatter, { type: "article" }>;
  body: string;
  streaming: boolean;
}) {
  return (
    <article>
      <h1 className="border-b border-[var(--rule)] pb-2 font-serif text-4xl text-[var(--ink)]">
        {fm.title || "Untitled"}
      </h1>
      <p className="mt-1 text-xs italic text-zinc-500">From generated.wiki</p>
      <div className="wiki-body mt-5 text-[1.05rem] leading-relaxed">
        <RenderedBody body={body} streaming={streaming} />
      </div>
    </article>
  );
}

function RejectedView({
  fm,
  body,
  streaming,
}: {
  fm: Extract<Frontmatter, { type: "rejected" }>;
  body: string;
  streaming: boolean;
}) {
  return (
    <article>
      <h1 className="border-b border-[var(--rule)] pb-2 font-serif text-4xl text-[var(--ink)]">
        Not a real topic
      </h1>
      <p className="mt-1 text-xs italic text-zinc-500">
        generated.wiki rejected this entry
        {fm.reason ? ` (${fm.reason})` : ""}
      </p>
      <div className="wiki-body mt-5 text-[1.05rem] leading-relaxed">
        <RenderedBody body={body} streaming={streaming} />
      </div>
      {fm.suggestions && fm.suggestions.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Try one of these
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            {fm.suggestions.map((s) => (
              <li key={s}>
                <WikiLink target={s} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function RenderedBody({ body, streaming }: { body: string; streaming: boolean }) {
  const trimmed = body.replace(/\s+$/, "");
  const paragraphs = trimmed.split(/\n{2,}/).filter(Boolean);
  return (
    <>
      {paragraphs.map((para, i) => (
        <p key={i}>
          {tokenizeBody(para).map((seg, j) =>
            seg.type === "text" ? (
              <span key={j}>{seg.text}</span>
            ) : (
              <WikiLink key={j} target={seg.target} />
            ),
          )}
          {streaming && i === paragraphs.length - 1 && (
            <span className="ml-0.5 inline-block h-[1em] w-[2px] -mb-[2px] animate-pulse bg-zinc-500 align-middle" />
          )}
        </p>
      ))}
    </>
  );
}

export type { ParsedHead };
