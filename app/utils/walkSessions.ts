import { getSupabaseClient } from "./supabase";

type SupabaseResult = { data: unknown; error: { message: string } | null };
type SupabaseQuery = {
  select: (columns: string) => SupabaseQuery;
  insert: (values: unknown) => SupabaseQuery;
  delete: () => SupabaseQuery;
  eq: (column: string, value: unknown) => SupabaseQuery;
  order: (column: string, options: { ascending: boolean }) => SupabaseQuery;
  single: () => Promise<SupabaseResult>;
};
type SupabaseClientLoose = { from: (table: string) => SupabaseQuery };

export type WalkSession = {
  id: string;
  user_id: string;
  pet_id: string;
  pet_name: string;
  pet_species: "DOG" | "CAT";
  started_at: string;
  ended_at: string;
  duration_ms: number;
  distance_km: number | null;
  notes: string | null;
  created_at: string;
};

type CreateWalkSessionInput = Omit<WalkSession, "id" | "created_at">;

export async function fetchWalkSessions(userId: string): Promise<WalkSession[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const db = client as unknown as SupabaseClientLoose;

  const query = db
    .from("walk_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false });
  const { data, error } = (await query) as unknown as SupabaseResult;

  if (error) throw error;
  return (data as WalkSession[]) || [];
}

export async function createWalkSession(
  session: CreateWalkSessionInput
): Promise<WalkSession> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const db = client as unknown as SupabaseClientLoose;

  const query = db
    .from("walk_sessions")
    .insert(session)
    .select("*")
    .single();
  const { data, error } = await query;

  if (error) throw error;
  return data as WalkSession;
}

export async function deleteWalkSession(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const db = client as unknown as SupabaseClientLoose;

  const query = db.from("walk_sessions").delete().eq("id", id);
  const { error } = (await query) as unknown as SupabaseResult;

  if (error) throw error;
}
