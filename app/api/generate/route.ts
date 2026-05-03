import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/prompts";
import type { Persona, Referrer } from "@/lib/types";
import { HOME_SLUG } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4.6";
const MAX_REFERRER_CHARS = 2000;
const MAX_FREEFORM_CHARS = 500;
const MAX_TOKENS = 800;

type Provider = "anthropic" | "openrouter";

function pickProvider():
  | { provider: Provider; apiKey: string }
  | { error: string } {
  const override = process.env.LLM_PROVIDER?.toLowerCase();
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const orKey = process.env.OPENROUTER_API_KEY;

  if (override === "openrouter") {
    if (!orKey)
      return {
        error: "LLM_PROVIDER=openrouter but OPENROUTER_API_KEY missing",
      };
    return { provider: "openrouter", apiKey: orKey };
  }
  if (override === "anthropic") {
    if (!anthropicKey)
      return { error: "LLM_PROVIDER=anthropic but ANTHROPIC_API_KEY missing" };
    return { provider: "anthropic", apiKey: anthropicKey };
  }
  if (anthropicKey) return { provider: "anthropic", apiKey: anthropicKey };
  if (orKey) return { provider: "openrouter", apiKey: orKey };
  return {
    error: "no LLM key configured (ANTHROPIC_API_KEY or OPENROUTER_API_KEY)",
  };
}

type GenerateBody = {
  slug?: unknown;
  persona?: unknown;
  referrer?: unknown;
};

function sanitizeSlug(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim().slice(0, 100);
  if (trimmed === HOME_SLUG) return trimmed;
  return trimmed.toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

function sanitizePersona(raw: unknown): Persona {
  const def: Persona = { level: "general", chaos: "off" };
  if (!raw || typeof raw !== "object") return def;
  const o = raw as Record<string, unknown>;
  const level =
    o.level === "kid" || o.level === "expert" || o.level === "general"
      ? o.level
      : "general";
  const chaosCandidates = [
    "off",
    "shakespeare",
    "caveman",
    "linkedin",
    "custom",
  ] as const;
  const chaos = (chaosCandidates as readonly string[]).includes(
    o.chaos as string,
  )
    ? (o.chaos as Persona["chaos"])
    : "off";
  const freeform =
    typeof o.freeform === "string"
      ? o.freeform.slice(0, MAX_FREEFORM_CHARS)
      : undefined;
  const chaosCustom =
    typeof o.chaosCustom === "string" ? o.chaosCustom.slice(0, 200) : undefined;
  return { level, chaos, freeform, chaosCustom };
}

function sanitizeReferrer(raw: unknown): Referrer | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.slug !== "string" || typeof o.body !== "string") return null;
  const slug = o.slug.slice(0, 100);
  const body = o.body.slice(0, MAX_REFERRER_CHARS);
  if (!slug || !body) return null;
  return { slug, body };
}

async function* streamFromAnthropic(apiKey: string, userMessage: string) {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
    stream: true,
  });
  for await (const event of response) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}

type CachedTextPart = OpenAI.Chat.ChatCompletionContentPartText & {
  cache_control?: { type: "ephemeral" };
};
type OpenRouterExtras = {
  reasoning?: { enabled: boolean; exclude: boolean };
};

async function* streamFromOpenRouter(apiKey: string, userMessage: string) {
  const defaultHeaders: Record<string, string> = {};
  if (process.env.OR_REFERER)
    defaultHeaders["HTTP-Referer"] = process.env.OR_REFERER;
  if (process.env.OR_TITLE) defaultHeaders["X-Title"] = process.env.OR_TITLE;

  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders,
  });
  const systemContent: CachedTextPart[] = [
    {
      type: "text",
      text: SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" },
    },
  ];
  const body: OpenAI.Chat.ChatCompletionCreateParamsStreaming &
    OpenRouterExtras = {
    model: OPENROUTER_MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: "system", content: systemContent },
      { role: "user", content: userMessage },
    ],
    stream: true,
    reasoning: { enabled: false, exclude: true },
  };
  const response = await client.chat.completions.create(body);
  for await (const chunk of response) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) yield text;
  }
}

export async function POST(req: Request) {
  const picked = pickProvider();
  if ("error" in picked) {
    return new Response(picked.error, { status: 500 });
  }

  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return new Response("invalid JSON", { status: 400 });
  }

  const slug = sanitizeSlug(body.slug);
  if (!slug) return new Response("missing or invalid slug", { status: 400 });

  const persona = sanitizePersona(body.persona);
  const referrer = sanitizeReferrer(body.referrer);
  const userMessage = buildUserMessage(slug, persona, referrer);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const debug = process.env.LLM_DEBUG === "1";
      const buf: string[] | null = debug ? [] : null;
      try {
        const iter =
          picked.provider === "anthropic"
            ? streamFromAnthropic(picked.apiKey, userMessage)
            : streamFromOpenRouter(picked.apiKey, userMessage);
        for await (const text of iter) {
          buf?.push(text);
          controller.enqueue(encoder.encode(text));
        }
        if (buf) {
          console.log(
            `[gen ${picked.provider}/${slug}] ${buf.join("").slice(0, 2000)}`,
          );
        }
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "unknown error";
        controller.enqueue(
          encoder.encode(
            `---\ntype: rejected\nreason: error\nsuggestions: []\n---\nGeneration failed: ${message}`,
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
