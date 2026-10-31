// @ts-nocheck
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthProfile {
  full_name: string;
  phone?: string;
  avatar_url?: string;
}

interface OrgMembership {
  org_id: string;
  role: string;
  org_name: string;
  org_slug: string;
  clinic_type: string;
  parent_org_id: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: AuthProfile | null;
  session: Session | null;
  roles: string[]; // platform roles
  orgMemberships: OrgMembership[];
  loading: boolean;
  signOut: () => Promise<void>;
  refetchUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  roles: [],
  orgMemberships: [],
  loading: true,
  signOut: async () => {},
  refetchUserData: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [orgMemberships, setOrgMemberships] = useState<OrgMembership[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile, platform roles and org memberships in parallel
      const [{ data: profileData }, { data: rolesData }, { data: memberships }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone, avatar_url").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase
          .from("org_members")
          .select("org_id, role, organizations(name, slug, clinic_type, parent_org_id)")
          .eq("user_id", userId),
      ]);

      if (profileData) setProfile(profileData);
      setRoles((rolesData || []).map((r) => r.role));
      setOrgMemberships(
        (memberships || []).map((m: any) => ({
          org_id: m.org_id,
          role: m.role,
          org_name: m.organizations?.name || "",
          org_slug: m.organizations?.slug || "",
          clinic_type: m.organizations?.clinic_type || "dental",
          parent_org_id: m.organizations?.parent_org_id ?? null,
        }))
      );
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let currentUserId: string | null = null;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Only block the UI when the signed-in user actually changes.
          // Token refreshes (e.g. when returning from the mobile file
          // picker) must not unmount the current page mid-task.
          const sameUser = currentUserId === newSession.user.id;
          currentUserId = newSession.user.id;
          if (!sameUser) setLoading(true);
          setTimeout(async () => {
            await fetchUserData(newSession.user.id);
            if (isMounted && !sameUser) setLoading(false);
          }, 0);
        } else {
          currentUserId = null;
          setProfile(null);
          setRoles([]);
          setOrgMemberships([]);
          setLoading(false);
        }
      }
    );

    // INITIAL load — await all data before setting loading false
    const initializeAuth = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(existingSession);
        setUser(existingSession?.user ?? null);

        if (existingSession?.user) {
          currentUserId = existingSession.user.id;
          await fetchUserData(existingSession.user.id);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refetchUserData = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      await fetchUserData(currentSession.user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    try {
      localStorage.removeItem("clinexus:last_org_slug");
    } catch {
      /* ignore storage errors */
    }

    setUser(null);
    setSession(null);

    setProfile(null);
    setRoles([]);
    setOrgMemberships([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        roles,
        orgMemberships,
        loading,
        signOut,
        refetchUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
