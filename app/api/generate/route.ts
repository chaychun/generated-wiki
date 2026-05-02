import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/prompts";
import type { Persona, Referrer } from "@/lib/types";
import { HOME_SLUG } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
const MAX_REFERRER_CHARS = 2000;
const MAX_FREEFORM_CHARS = 500;

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
    o.level === "kid" || o.level === "expert" || o.level === "general" ? o.level : "general";
  const chaosCandidates = ["off", "shakespeare", "caveman", "linkedin", "custom"] as const;
  const chaos = (chaosCandidates as readonly string[]).includes(o.chaos as string)
    ? (o.chaos as Persona["chaos"])
    : "off";
  const freeform =
    typeof o.freeform === "string" ? o.freeform.slice(0, MAX_FREEFORM_CHARS) : undefined;
  const chaosCustom = typeof o.chaosCustom === "string" ? o.chaosCustom.slice(0, 200) : undefined;
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

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("ANTHROPIC_API_KEY not configured", { status: 500 });
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

  const client = new Anthropic({ apiKey });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const response = await client.messages.create({
          model: MODEL,
          max_tokens: 800,
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
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
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
