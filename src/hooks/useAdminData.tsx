import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAllOrganizations() {
  return useQuery({
    queryKey: ["admin-organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAllOrgMembers() {
  return useQuery({
    queryKey: ["admin-org-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_members")
        .select("*, organizations(name, slug, clinic_type)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAllProfiles() {
  return useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function usePlatformStats() {
  return useQuery({
    queryKey: ["admin-platform-stats"],
    queryFn: async () => {
      const [orgsRes, profilesRes, patientsRes, appointmentsRes] = await Promise.all([
        supabase.from("organizations").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }),
      ]);

      return {
        totalClinics: orgsRes.count || 0,
        totalUsers: profilesRes.count || 0,
        totalPatients: patientsRes.count || 0,
        totalAppointments: appointmentsRes.count || 0,
      };
    },
  });
}

export function useOrgMemberCounts() {
  return useQuery({
    queryKey: ["admin-org-member-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_members")
        .select("org_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((m) => {
        counts[m.org_id] = (counts[m.org_id] || 0) + 1;
      });
      return counts;
    },
  });
}

export function useOrgPatientCounts() {
  return useQuery({
    queryKey: ["admin-org-patient-counts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("patients")
        .select("org_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((p: any) => {
        counts[p.org_id] = (counts[p.org_id] || 0) + 1;
      });
      return counts;
    },
  });
}
