"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCached, putCached } from "@/lib/cache";
import {
  isErrorEnvelope,
  parseFrontmatter,
  slugToDisplay,
  tokenizeBody,
  type ParsedHead,
} from "@/lib/parse";
import { loadPersona, personaCacheKey } from "@/lib/persona";
import { clearReferrer, getReferrer, pushTrail, setReferrer } from "@/lib/trail";
import { HOME_SLUG, type Frontmatter } from "@/lib/types";
import { Settings } from "./Settings";
import { WikiLink } from "./WikiLink";

export function Article({ slug }: { slug: string }) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    setText("");
    setDone(false);
    setError(null);
    if (slug !== HOME_SLUG) pushTrail(slug);

    (async () => {
      const persona = loadPersona();
      const pkey = personaCacheKey(persona);

      const cached = await getCached(slug, pkey);
      if (cancelled) return;
      if (cached && !isErrorEnvelope(parseFrontmatter(cached))) {
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
        if (!isErrorEnvelope(parseFrontmatter(acc))) {
          await putCached(slug, pkey, acc);
        }
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

  const parsed = useMemo(() => parseFrontmatter(text), [text]);
  const synthesized = !parsed && done && text.trim().length > 0;
  const head: ParsedHead | null = parsed ?? (synthesized ? synthesizeArticleHead() : null);
  const body = parsed ? text.slice(parsed.bodyStart) : head ? text : "";
  const headTitle = slugToTitle(slug);
  const isHome = slug === HOME_SLUG;

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

      {synthesized && (
        <p className="mt-4 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
          couldn&apos;t parse output — showing raw stream
        </p>
      )}

      {head?.fm.type === "article" && (
        <ArticleView title={headTitle} isHome={isHome} body={body} streaming={!done} />
      )}

      {head?.fm.type === "rejected" && (
        <RejectedView title={headTitle} fm={head.fm} body={body} streaming={!done} />
      )}
    </main>
  );
}

function slugToTitle(slug: string): string {
  return slug === HOME_SLUG ? "generated.wiki" : slugToDisplay(slug);
}

function synthesizeArticleHead(): ParsedHead {
  return { fm: { type: "article" }, bodyStart: 0 };
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
  const isHome = slug === HOME_SLUG;
  return (
    <>
      <h1
        className={`border-b border-[var(--rule)] pb-2 font-serif text-4xl text-[var(--ink)] ${isHome ? "" : "capitalize"}`}
      >
        {slugToTitle(slug)}
      </h1>
      <p className="mt-3 animate-pulse text-zinc-500">Generating…</p>
    </>
  );
}

function ArticleView({
  title,
  isHome,
  body,
  streaming,
}: {
  title: string;
  isHome: boolean;
  body: string;
  streaming: boolean;
}) {
  return (
    <article>
      <h1
        className={`border-b border-[var(--rule)] pb-2 font-serif text-4xl text-[var(--ink)] ${isHome ? "" : "capitalize"}`}
      >
        {title}
      </h1>
      <p className="mt-1 text-xs italic text-zinc-500">From generated.wiki</p>
      <div className="wiki-body mt-5 text-[1.05rem] leading-relaxed">
        <RenderedBody body={body} streaming={streaming} />
      </div>
    </article>
  );
}

function RejectedView({
  title,
  fm,
  body,
  streaming,
}: {
  title: string;
  fm: Extract<Frontmatter, { type: "rejected" }>;
  body: string;
  streaming: boolean;
}) {
  return (
    <article>
      <h1 className="border-b border-[var(--rule)] pb-2 font-serif text-4xl capitalize text-[var(--ink)]">
        {title}
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
  const paragraphs = useMemo(() => {
    let safe = body;
    if (streaming) {
      const lastOpen = safe.lastIndexOf("[[");
      const lastClose = safe.lastIndexOf("]]");
      if (lastOpen > lastClose) safe = safe.slice(0, lastOpen);
    }
    const trimmed = safe.replace(/\s+$/, "");
    return trimmed
      .split(/\n{2,}/)
      .filter(Boolean)
      .map((para) => tokenizeBody(para));
  }, [body, streaming]);

  return (
    <>
      {paragraphs.map((segs, i) => (
        <p key={i}>
          {segs.map((seg, j) =>
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
