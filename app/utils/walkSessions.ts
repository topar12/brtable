export type WalkSessionV1 = {
  id: string;
  createdAtIso: string;
  startedAtIso: string;
  endedAtIso: string;
  durationMs: number;
  distanceKm: number | null;
  notes: string;
  profileSnapshot: {
    name: string;
    species: "DOG" | "CAT";
    weightKg: number;
  };
};

type WalkSessionsStorageV1 = {
  version: 1;
  sessions: WalkSessionV1[];
};

const STORAGE_KEY = "walkSessions:v1";

function parseStoredSessions(raw: string | null): WalkSessionV1[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as WalkSessionsStorageV1;
    if (!parsed || typeof parsed !== "object") return [];
    if (parsed.version !== 1) return [];
    if (!Array.isArray(parsed.sessions)) return [];
    return parsed.sessions;
  } catch (error) {
    return [];
  }
}

export function loadWalkSessions(): WalkSessionV1[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const sessions = parseStoredSessions(raw);
    return sessions.sort((a, b) =>
      b.startedAtIso.localeCompare(a.startedAtIso)
    );
  } catch (error) {
    return [];
  }
}

export function saveWalkSessions(sessions: WalkSessionV1[]): void {
  if (typeof window === "undefined") return;
  try {
    const storage: WalkSessionsStorageV1 = {
      version: 1,
      sessions,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch {}

}

export function addWalkSession(
  session: Omit<WalkSessionV1, "id" | "createdAtIso">
): WalkSessionV1 {
  const newSession: WalkSessionV1 = {
    ...session,
    id: Date.now().toString(),
    createdAtIso: new Date().toISOString(),
  };
  const sessions = loadWalkSessions();
  sessions.unshift(newSession);
  saveWalkSessions(sessions);
  return newSession;
}

export function deleteWalkSession(id: string): void {
  const sessions = loadWalkSessions();
  const filtered = sessions.filter((s) => s.id !== id);
  saveWalkSessions(filtered);
}
