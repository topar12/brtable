import { useEffect, useState } from "react";

import { defaultPet, type PetProfile } from "../data/mock";
import { useAuth } from "../hooks/useAuth";
import { fetchPetProfiles, toPetProfile } from "../utils/petProfiles";
import { loadStoredProfile } from "../utils/profile";

export function useStoredProfile() {
  const [profile, setProfile] = useState<PetProfile>(defaultPet);
  const [hydrated, setHydrated] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (isAuthenticated && user?.id) {
        try {
          const profiles = await fetchPetProfiles(user.id);
          if (mounted && profiles.length > 0) {
            setProfile(toPetProfile(profiles[0]));
            setHydrated(true);
            return;
          }
        } catch {
          // fall back to local profile
        }
      }

      if (mounted) {
        setProfile(loadStoredProfile());
        setHydrated(true);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user?.id]);

  return { profile, setProfile, hydrated };
}
