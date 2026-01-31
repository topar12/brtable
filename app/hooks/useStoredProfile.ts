import { useEffect, useState } from "react";

import { defaultPet, type PetProfile } from "../data/mock";
import { loadStoredProfile } from "../utils/profile";

export function useStoredProfile() {
  const [profile, setProfile] = useState<PetProfile>(defaultPet);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfile(loadStoredProfile());
    setHydrated(true);
  }, []);

  return { profile, setProfile, hydrated };
}
