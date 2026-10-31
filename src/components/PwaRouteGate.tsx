import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isStandalone, isPublicSitePath } from "@/hooks/usePwa";
import { useAuth } from "@/hooks/useAuth";

/**
 * When running as an installed PWA (standalone display mode), public
 * marketing/site pages are off-limits: send the user to their clinic
 * dashboard (or login when signed out). Public pages stay reachable
 * in a normal browser.
 */
export function PwaRouteGate() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!isStandalone()) return;
    if (!isPublicSitePath(pathname)) return;
    if (loading) return;

    if (session) {
      let lastSlug: string | null = null;
      try {
        lastSlug = localStorage.getItem("clinexus:last_org_slug");
      } catch {
        /* ignore */
      }
      navigate(lastSlug ? `/app/clinic/${lastSlug}/dashboard` : "/app/select-clinic", { replace: true });
    } else {
      navigate("/app/login", { replace: true });
    }
  }, [pathname, session, loading, navigate]);

  return null;
}
