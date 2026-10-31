import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface OrgContextType {
  currentOrg: {
    org_id: string;
    org_name: string;
    org_slug: string;
    clinic_type: string;
    role: string;
    parent_org_id: string | null;
  } | null;
  isBranch: boolean;
  mainOrgId: string | null;
  setCurrentOrgBySlug: (slug: string) => void;
  basePath: string;
  realRole: string | null;
  viewAsRole: string | null;
  setViewAsRole: (role: string | null) => void;
}

const OrgContext = createContext<OrgContextType>({
  currentOrg: null,
  setCurrentOrgBySlug: () => {},
  basePath: "",
  isBranch: false,
  mainOrgId: null,
  realRole: null,
  viewAsRole: null,
  setViewAsRole: () => {},
});

export function OrgProvider({ children }: { children: ReactNode }) {
  const { orgMemberships, roles, loading } = useAuth();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [currentOrg, setCurrentOrg] = useState<OrgContextType["currentOrg"]>(null);

  const [viewAsRole, setViewAsRoleState] = useState<string | null>(() => {
    try { return sessionStorage.getItem("clinexus:view_as_role"); } catch { return null; }
  });
  const setViewAsRole = (r: string | null) => {
    setViewAsRoleState(r);
    try { r ? sessionStorage.setItem("clinexus:view_as_role", r) : sessionStorage.removeItem("clinexus:view_as_role"); } catch { /* ignore */ }
  };
  const isSuperAdmin = roles.includes("super_admin");
  const devPreview = typeof window !== "undefined" && window.localStorage.getItem("__devpreview") === "1";

  const setCurrentOrgBySlug = (targetSlug: string) => {
    const membership = orgMemberships.find((m) => m.org_slug === targetSlug);
    if (membership) {
      setCurrentOrg({
        org_id: membership.org_id,
        org_name: membership.org_name,
        org_slug: membership.org_slug,
        clinic_type: membership.clinic_type,
        role: membership.role,
        parent_org_id: membership.parent_org_id ?? null,
      });
    }
  };

  // Sync from URL slug
  useEffect(() => {
    if (devPreview) { if (!currentOrg) setCurrentOrg({ org_id: "dev", org_name: "Dev Clinic", org_slug: slug || "dev", clinic_type: "dental", role: "owner", parent_org_id: null }); return; }
    if (loading || !slug) return;

    // Already resolved for this slug — nothing to do
    if (currentOrg?.org_slug === slug) return;

    const membership = orgMemberships.find((m) => m.org_slug === slug);
    if (membership) {
      setCurrentOrg({
        org_id: membership.org_id,
        org_name: membership.org_name,
        org_slug: membership.org_slug,
        clinic_type: membership.clinic_type,
        role: membership.role,
        parent_org_id: membership.parent_org_id ?? null,
      });
      return;
    }

    if (isSuperAdmin) {
      // Super admin can access any org — fetch it directly
      let cancelled = false;
      supabase
        .from("organizations")
        .select("id, name, slug, clinic_type, parent_org_id")
        .eq("slug", slug)
        .maybeSingle()
        .then(({ data, error }) => {
          if (cancelled) return;
          if (data) {
            setCurrentOrg({
              org_id: data.id,
              org_name: data.name,
              org_slug: data.slug,
              clinic_type: data.clinic_type,
              role: "owner", // super admin gets full access
              parent_org_id: (data as any).parent_org_id ?? null,
            });
          } else if (!error) {
            // Slug genuinely does not exist
            navigate("/admin", { replace: true });
          }
        });
      return () => {
        cancelled = true;
      };
    }

    navigate("/select-clinic", { replace: true });
  }, [slug, orgMemberships, loading, isSuperAdmin, navigate, currentOrg?.org_slug, devPreview, currentOrg]);

  // Remember the last clinic so returning users land straight back in it
  useEffect(() => {
    if (currentOrg?.org_slug) {
      try {
        localStorage.setItem("clinexus:last_org_slug", currentOrg.org_slug);
      } catch {
        /* ignore storage errors */
      }
    }
  }, [currentOrg?.org_slug]);

  const realRole = currentOrg?.role ?? null;
  const canViewAs = realRole === "owner" || realRole === "admin";
  const effectiveOrg = currentOrg && canViewAs && viewAsRole ? { ...currentOrg, role: viewAsRole } : currentOrg;

  const isBranch = !!currentOrg?.parent_org_id;
  const mainOrgId = currentOrg ? (currentOrg.parent_org_id || currentOrg.org_id) : null;
  const basePath = currentOrg ? `/app/clinic/${currentOrg.org_slug}` : "";


  return (
    <OrgContext.Provider value={{ currentOrg: effectiveOrg, setCurrentOrgBySlug, basePath, isBranch, mainOrgId, realRole, viewAsRole: canViewAs ? viewAsRole : null, setViewAsRole }}>
      {children}
    </OrgContext.Provider>
  );
}

export const useOrg = () => useContext(OrgContext);
