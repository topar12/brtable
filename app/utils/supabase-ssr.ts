import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client for Cloudflare Workers
// Uses direct values since import.meta.env.VITE_* is not available in workers

const SUPABASE_URL = "https://cekkcfxkukltllmzjmfl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNla2tjZnhrdWtsdGxsbXpqbWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDE5NjUsImV4cCI6MjA4NTI3Nzk2NX0.YDnC1UIHnSwftEZGqogQK2Wo-QgqY87mc1VmcV6bUzg";

let serverSupabaseClient: ReturnType<typeof createClient> | null = null;

export function getServerSupabaseClient() {
    if (serverSupabaseClient) return serverSupabaseClient;
    serverSupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return serverSupabaseClient;
}
