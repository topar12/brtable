import { getSupabaseClient } from "./supabase";

export type UserProfile = {
  id: string;
  user_id: string;
  nickname: string;
  has_pet: boolean;
  interests: string[];
  region: string | null;
  age_group: string | null;
  referral_source: string | null;
  created_at: string;
  updated_at: string;
  is_banned?: boolean;
  deleted_at?: string | null;
};

export type CreateUserProfileInput = Omit<
  UserProfile,
  "id" | "created_at" | "updated_at"
>;

function ensureSupabaseClient() {
  if (typeof window !== "undefined" && typeof window.document === "undefined") {
    return null;
  }
  return getSupabaseClient();
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "알 수 없는 오류가 발생했습니다.";
}

export async function fetchMyUserProfile(
  userId: string
): Promise<{ data: UserProfile | null; error: string | null }> {
  const client = ensureSupabaseClient();
  if (!client) {
    return { data: null, error: "Supabase 클라이언트를 초기화할 수 없습니다." };
  }

  try {
    const { data, error } = await client
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return { data: data as UserProfile | null, error: null };
  } catch (error) {
    return { data: null, error: formatError(error) };
  }
}

export async function upsertMyUserProfile(
  payload: CreateUserProfileInput
): Promise<{ data: UserProfile | null; error: string | null }> {
  const client = ensureSupabaseClient();
  if (!client) {
    return { data: null, error: "Supabase 클라이언트를 초기화할 수 없습니다." };
  }

  try {
    const { data, error } = await (client as any)
      .from("user_profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();

    if (error) throw error;
    return { data: data as UserProfile | null, error: null };
  } catch (error) {
    return { data: null, error: formatError(error) };
  }
}

export async function checkProfileExists(
  userId: string
): Promise<boolean> {
  const client = ensureSupabaseClient();
  if (!client) {
    return false;
  }

  try {
    const { data, error } = await client
      .from("user_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (error) return false;
    return !!data;
  } catch (error) {
    return false;
  }
}

export async function checkNicknameAvailable(
  nickname: string,
  userId?: string
): Promise<{ available: boolean; error: string | null }> {
  const client = ensureSupabaseClient();
  if (!client) {
    return { available: false, error: "Supabase 클라이언트를 초기화할 수 없습니다." };
  }

  try {
    let query = client
      .from("user_profiles")
      .select("user_id")
      .eq("nickname", nickname)
      .limit(1);

    if (userId) {
      query = query.neq("user_id", userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    const isTaken = (data ?? []).length > 0;
    return { available: !isTaken, error: null };
  } catch (error) {
    return { available: false, error: formatError(error) };
  }
}
