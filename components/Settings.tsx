"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_PERSONA, loadPersona, personaLabel, savePersona } from "@/lib/persona";
import { PERSONA_CHANGE_EVENT } from "@/lib/personaEvents";
import type { ChaosMode, Persona, ReadingLevel } from "@/lib/types";

const CHAOS_OPTIONS: { value: ChaosMode; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "shakespeare", label: "Shakespeare" },
  { value: "caveman", label: "Caveman" },
  { value: "linkedin", label: "LinkedIn influencer" },
  { value: "uwu", label: "uwu" },
  { value: "brainrot", label: "Brainrot (gen-Z / alpha)" },
  { value: "custom", label: "Custom…" },
];

const LEVEL_OPTIONS: { value: ReadingLevel; label: string }[] = [
  { value: "kid", label: "Curious kid" },
  { value: "general", label: "General reader" },
  { value: "expert", label: "Domain expert" },
];

export function Settings() {
  const [persona, setPersona] = useState<Persona>(DEFAULT_PERSONA);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Persona>(DEFAULT_PERSONA);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const p = loadPersona();
    setPersona(p);
    setDraft(p);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClickAway(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [open]);

  function apply() {
    savePersona(draft);
    setPersona(draft);
    setOpen(false);
    window.dispatchEvent(new CustomEvent(PERSONA_CHANGE_EVENT));
  }

  function cancel() {
    setDraft(persona);
    setOpen(false);
  }

  const chaosOn = draft.chaos !== "off";
  const chaosActive = isChaosActive(persona);

  return (
    <div
      ref={containerRef}
      className="relative mt-12 flex items-center justify-between border-t border-[var(--rule-soft)] pt-2 text-sm text-[var(--ink)]"
    >
      <p className="text-zinc-700">
        {chaosActive ? (
          <>
            Chaos: <span className="font-semibold">{renderChaosLabel(persona)}</span>
          </>
        ) : (
          <>
            Reading as <span className="font-semibold">{personaLabel(persona)}</span>
          </>
        )}
      </p>
      <button type="button" onClick={() => setOpen((v) => !v)} className="wiki-link">
        {open ? "close" : "change"}
      </button>

      {open && (
        <div
          className="absolute right-0 bottom-8 z-20 w-80 max-w-[calc(100vw-2rem)] rounded border border-[var(--rule)] bg-[var(--paper)] p-4 shadow-lg"
        >
          <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Reading level
          </label>
          <select
            className="mt-1 w-full rounded border border-[var(--rule)] bg-white p-1 disabled:cursor-not-allowed disabled:opacity-50"
            value={draft.level}
            disabled={chaosOn}
            onChange={(e) => setDraft({ ...draft, level: e.target.value as ReadingLevel })}
          >
            {LEVEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {chaosOn && (
            <p className="mt-1 text-xs text-zinc-500">
              Ignored while chaos is on.
            </p>
          )}

          <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Chaos mode
          </label>
          <select
            className="mt-1 w-full rounded border border-[var(--rule)] bg-white p-1"
            value={draft.chaos}
            onChange={(e) => setDraft({ ...draft, chaos: e.target.value as ChaosMode })}
          >
            {CHAOS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {draft.chaos === "custom" && (
            <input
              className="mt-1 w-full rounded border border-[var(--rule)] bg-white p-1 text-sm"
              maxLength={200}
              placeholder="describe a voice (≤200 chars)"
              value={draft.chaosCustom ?? ""}
              onChange={(e) => setDraft({ ...draft, chaosCustom: e.target.value })}
            />
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={apply}
              className="flex-1 rounded bg-[var(--link)] px-3 py-1 text-white hover:bg-[var(--link-hover)]"
            >
              Apply (regenerate)
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded border border-[var(--rule)] px-3 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function renderChaosLabel(persona: Persona): string {
  if (persona.chaos !== "custom") return persona.chaos;
  const c = (persona.chaosCustom ?? "").trim();
  return `custom (${c.slice(0, 24)}${c.length > 24 ? "…" : ""})`;
}

function isChaosActive(p: Persona): boolean {
  if (p.chaos === "off") return false;
  if (p.chaos === "custom") return (p.chaosCustom ?? "").trim().length > 0;
  return true;
}
