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
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const p = loadPersona();
    setPersona(p);
    setDraft(p);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClickAway(e: MouseEvent) {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(e.target as Node)) setOpen(false);
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

  return (
    <div className="relative mb-4 flex items-center justify-between border-b border-[var(--rule-soft)] pb-2 text-sm text-[var(--ink)]">
      <p className="text-zinc-700">
        Reading as <span className="font-semibold">{personaLabel(persona)}</span>
        {persona.chaos !== "off" && (
          <>
            {" "}
            · chaos: <span className="font-semibold">{renderChaosLabel(persona)}</span>
          </>
        )}
      </p>
      <button type="button" onClick={() => setOpen((v) => !v)} className="wiki-link">
        {open ? "close" : "change"}
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-8 z-20 w-80 max-w-[calc(100vw-2rem)] rounded border border-[var(--rule)] bg-[var(--paper)] p-4 shadow-lg"
        >
          <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Reading level
          </label>
          <select
            className="mt-1 w-full rounded border border-[var(--rule)] bg-white p-1"
            value={draft.level}
            onChange={(e) => setDraft({ ...draft, level: e.target.value as ReadingLevel })}
          >
            {LEVEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Freeform context (optional)
          </label>
          <textarea
            className="mt-1 w-full rounded border border-[var(--rule)] bg-white p-1 text-sm"
            rows={2}
            maxLength={500}
            placeholder='e.g., "I already know Rust, explain in those terms"'
            value={draft.freeform ?? ""}
            onChange={(e) => setDraft({ ...draft, freeform: e.target.value })}
          />

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
  const c = persona.chaosCustom ?? "";
  return `custom (${c.slice(0, 24)}${c.length > 24 ? "…" : ""})`;
}
