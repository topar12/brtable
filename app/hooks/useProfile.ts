import { useEffect, useState, useCallback } from "react";
import type { PetProfile } from "../data/mock";
import { defaultPet } from "../data/mock";
import { getSupabaseClient } from "../utils/supabase";

interface ProfileState {
  profile: PetProfile;
  isLoading: boolean;
  error: string | null;
}

interface UseProfileReturn extends ProfileState {
  saveProfile: (profile: PetProfile) => Promise<void>;
  isAuthenticated: boolean;
}

export function useProfile(): UseProfileReturn {
  const [state, setState] = useState<ProfileState>({
    profile: defaultPet,
    isLoading: true,
    error: null,
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const client = getSupabaseClient();

  useEffect(() => {
    if (!client) {
      const stored = localStorage.getItem("petProfile");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as PetProfile;
          setState({ profile: parsed, isLoading: false, error: null });
        } catch {
          setState({ profile: defaultPet, isLoading: false, error: null });
        }
      } else {
        setState({ profile: defaultPet, isLoading: false, error: null });
      }
      return;
    }

    let mounted = true;

    async function loadProfile() {
      if (!client) return;
      const { data: authData } = await client.auth.getUser();
      if (!authData.user) {
        if (mounted) {
          setIsAuthenticated(false);
          setState((s) => ({ ...s, isLoading: false }));
        }
        return;
      }

      setIsAuthenticated(true);

      const { data, error } = await client
        .from("profiles")
        .select("pet_name,species,breed_id,weight_kg,is_neutered,activity_level,allergies")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (!mounted) return;

      if (error || !data) {
        setState({ profile: defaultPet, isLoading: false, error: null });
        return;
      }

      const row = data as Record<string, unknown>;
      const profile: PetProfile = {
        name: (row.pet_name as string) ?? defaultPet.name,
        species: (row.species as PetProfile["species"]) ?? defaultPet.species,
        breedId: (row.breed_id as string) ?? defaultPet.breedId,
        weightKg: (row.weight_kg as number) ?? defaultPet.weightKg,
        isNeutered: (row.is_neutered as boolean) ?? defaultPet.isNeutered,
        activityLevel: (row.activity_level as PetProfile["activityLevel"]) ?? defaultPet.activityLevel,
        allergies: (row.allergies as string[]) ?? defaultPet.allergies,
      };

      setState({ profile, isLoading: false, error: null });
    }

    loadProfile();

    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setIsAuthenticated(true);
        loadProfile();
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        setState({ profile: defaultPet, isLoading: false, error: null });
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [client]);

  const saveProfile = useCallback(async (profile: PetProfile) => {
    if (!client) {
      localStorage.setItem("petProfile", JSON.stringify(profile));
      setState((s) => ({ ...s, profile }));
      return;
    }

    const { data: authData } = await client.auth.getUser();
    if (!authData.user) {
      localStorage.setItem("petProfile", JSON.stringify(profile));
      setState((s) => ({ ...s, profile }));
      return;
    }

    const payload = {
      id: authData.user.id,
      pet_name: profile.name,
      species: profile.species,
      breed_id: profile.breedId,
      weight_kg: profile.weightKg,
      is_neutered: profile.isNeutered,
      activity_level: profile.activityLevel,
      allergies: profile.allergies,
    };

    const { error } = await client.from("profiles" as any).upsert(payload as any);

    if (error) {
      setState((s) => ({ ...s, error: error.message }));
      return;
    }

    setState((s) => ({ ...s, profile, error: null }));
  }, [client]);

  return {
    ...state,
    saveProfile,
    isAuthenticated,
  };
}
