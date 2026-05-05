import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { WikiLink } from "@/components/WikiLink";

export const metadata: Metadata = {
  title: "FAQ",
  description: "What generated.wiki is and how it works.",
};

type QA = { q: string; a: ReactNode };

const FAQS: QA[] = [
  {
    q: "What is this and why does it exist?",
    a: (
      <>
        <p>
          A prototype wiki where every article is generated on demand by an
          LLM. Click any wikilink — try{" "}
          <WikiLink target="octopus" /> — and a fresh article streams in for
          that topic.
        </p>
        <p className="mt-3">
          It isn&apos;t trying to replace traditional wikis. The model can be
          inaccurate, and a real encyclopedia will always be the authority on
          facts. The point is what a static wiki <em>can&apos;t</em> do: adapt
          the same topic to the reader — different depth, different framing,
          different links picked — based on who&apos;s asking.
        </p>
        <p className="mt-3">
          From my own use, it&apos;s become my favorite way of learning things
          I didn&apos;t know I wanted to know.
        </p>
      </>
    ),
  },
  {
    q: "Why does the same article look different on reload?",
    a: "Articles are generated, not stored. Reload re-rolls. A short-lived client cache exists for back/forward navigation, but a hard reload bypasses it.",
  },
  {
    q: "What does \"reading as\" do?",
    a: "It sets your persona — reading level (kid / general / expert) and an optional chaos voice. Persona is sent with each generation request and changes which facts and links the model picks.",
  },
  {
    q: "Is anything saved on the server?",
    a: "No user data. Persona lives in your browser. Articles are generated per request and cached client-side only.",
  },
  {
    q: "Why did an article get rejected?",
    a: "The model can refuse a topic (nonsense, unsafe, etc.). When it does, you get a rejection notice and suggested alternatives.",
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-8 font-serif">
      <header className="mb-8 flex items-center justify-between text-sm">
        <Link href="/" className="wiki-link">
          generated.wiki
        </Link>
        <nav className="flex gap-4">
          <Link href="/faq" className="wiki-link">
            FAQ
          </Link>
          <a
            href="https://github.com/chaychun/generated-wiki"
            target="_blank"
            rel="noopener noreferrer"
            className="wiki-link"
          >
            GitHub
          </a>
        </nav>
      </header>

      <h1 className="border-b border-[var(--rule)] pb-2 font-serif text-4xl text-[var(--ink)]">
        FAQ
      </h1>
      <p className="mt-1 text-xs italic text-zinc-500">
        Hand-written, not generated.
      </p>

      <div className="wiki-body mt-8 space-y-6 text-[1.05rem] leading-relaxed">
        {FAQS.map(({ q, a }) => (
          <div key={q}>
            <h2 className="font-semibold text-[var(--ink)]">{q}</h2>
            <div className="mt-1">{a}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
