import { defaultPet, type PetProfile } from "../data/mock";

const PROFILE_STORAGE_KEY = "petProfile";

function parseStoredProfile(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as Partial<PetProfile>;
  } catch (error) {
    return null;
  }
}

export function mergeProfile(partial?: Partial<PetProfile> | null) {
  return {
    ...defaultPet,
    ...(partial ?? {}),
  } satisfies PetProfile;
}

export function loadStoredProfile() {
  if (typeof window === "undefined") return defaultPet;
  const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
  const parsed = parseStoredProfile(raw);
  return mergeProfile(parsed ?? undefined);
}

export function saveStoredProfile(profile: PetProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function clearStoredProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PROFILE_STORAGE_KEY);
}
