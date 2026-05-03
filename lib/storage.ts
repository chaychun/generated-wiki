type StorageKind = "session" | "local";

function store(kind: StorageKind): Storage | null {
  if (typeof window === "undefined") return null;
  return kind === "session" ? window.sessionStorage : window.localStorage;
}

function makeSafe(kind: StorageKind) {
  return {
    get<T>(key: string): T | null {
      const s = store(kind);
      if (!s) return null;
      try {
        const raw = s.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        return null;
      }
    },
    set<T>(key: string, value: T): void {
      const s = store(kind);
      if (!s) return;
      try {
        s.setItem(key, JSON.stringify(value));
      } catch {
        // ignore
      }
    },
    remove(key: string): void {
      const s = store(kind);
      if (!s) return;
      try {
        s.removeItem(key);
      } catch {
        // ignore
      }
    },
  };
}

export const safeSession = makeSafe("session");
export const safeLocal = makeSafe("local");
