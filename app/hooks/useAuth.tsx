import { useEffect, useState, createContext, useContext, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, type UserRole, hasAdminAccess, hasMasterAccess } from "../utils/supabase";

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMaster: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: "guest",
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  isMaster: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>("guest");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    async function loadSession() {
      if (!client) return;
      const { data } = await client.auth.getSession();
      if (!mounted) return;
      
      if (data.session?.user) {
        setUser(data.session.user);
        await loadRole(data.session.user.id);
      }
      setIsLoading(false);
    }

    async function loadRole(userId: string) {
      if (!client) return;
      const { data } = await client
        .from("users_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      
      const userRole = (data as { role: UserRole } | null)?.role ?? "member";
      if (mounted) setRole(userRole);
    }

    loadSession();

    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        loadRole(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setRole("guest");
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const client = getSupabaseClient();
    if (!client) return;
    await client.auth.signOut();
    setUser(null);
    setRole("guest");
  };

  const value: AuthContextType = {
    user,
    role,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: hasAdminAccess(role),
    isMaster: hasMasterAccess(role),
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
