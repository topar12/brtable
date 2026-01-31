import { getSupabaseClient } from "./supabase";
import type { PetProfile } from "../data/mock";

export type DbPetProfile = {
  id: string;
  user_id: string;
  name: string;
  species: "DOG" | "CAT";
  breed_id: string | null;
  breed_name: string | null;
  weight_kg: number;
  is_neutered: boolean;
  activity_level: 1 | 2 | 3 | 4 | 5;
  allergies: string[];
  birth_date: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function toPetProfile(db: DbPetProfile): PetProfile {
  return {
    name: db.name,
    species: db.species,
    breedId: db.breed_id || "",
    weightKg: db.weight_kg,
    isNeutered: db.is_neutered,
    activityLevel: db.activity_level,
    allergies: db.allergies || [],
  };
}

export async function fetchPetProfiles(userId: string): Promise<DbPetProfile[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");

  const { data, error } = await client
    .from("pet_profiles")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as DbPetProfile[]) || [];
}

type CreatePetProfileInput = Omit<DbPetProfile, "id" | "created_at" | "updated_at">;

export async function createPetProfile(profile: CreatePetProfileInput): Promise<DbPetProfile> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");

  const { data, error } = await (client as any)
    .from("pet_profiles")
    .insert(profile)
    .select()
    .single();

  if (error) throw error;
  return data as DbPetProfile;
}

type UpdatePetProfileInput = Partial<Omit<DbPetProfile, "id" | "user_id" | "created_at" | "updated_at">>;

export async function updatePetProfile(id: string, profile: UpdatePetProfileInput): Promise<DbPetProfile> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");

  const updateData = { ...profile, updated_at: new Date().toISOString() };
  
  const { error } = await (client as any)
    .from("pet_profiles")
    .update(updateData)
    .eq("id", id);

  if (error) throw error;
  
  const { data: updatedData, error: fetchError } = await client
    .from("pet_profiles")
    .select("*")
    .eq("id", id)
    .single();
    
  if (fetchError) throw fetchError;
  return updatedData as DbPetProfile;
}

export async function deletePetProfile(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");

  const { error } = await (client as any)
    .from("pet_profiles")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function setActivePetProfile(userId: string, profileId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");

  await (client as any)
    .from("pet_profiles")
    .update({ is_active: false })
    .eq("user_id", userId);

  const { error } = await (client as any)
    .from("pet_profiles")
    .update({ is_active: true })
    .eq("id", profileId);

  if (error) throw error;
}
