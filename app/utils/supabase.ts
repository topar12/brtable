import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (supabaseClient) return supabaseClient;
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export type UserRole = "master" | "operator" | "member" | "guest";

export interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
}

export async function getCurrentUserWithRole(): Promise<UserWithRole | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data: authData } = await client.auth.getUser();
  if (!authData.user) return null;

  const { data: roleData } = await client
    .from("users_roles")
    .select("role")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  const role = (roleData as { role: UserRole } | null)?.role ?? "member";

  return {
    id: authData.user.id,
    email: authData.user.email ?? "",
    role,
  };
}

export async function signInWithGoogle() {
  const client = getSupabaseClient();
  if (!client) return { error: "Supabase not configured" };
  
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  return { error: error?.message };
}

export async function signInWithKakao() {
  const client = getSupabaseClient();
  if (!client) return { error: "Supabase not configured" };
  
  const { error } = await client.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  return { error: error?.message };
}

export async function signOut() {
  const client = getSupabaseClient();
  if (!client) return { error: "Supabase not configured" };
  
  const { error } = await client.auth.signOut();
  return { error: error?.message };
}

export function hasAdminAccess(role: UserRole): boolean {
  return role === "master" || role === "operator";
}

export function hasMasterAccess(role: UserRole): boolean {
  return role === "master";
}
