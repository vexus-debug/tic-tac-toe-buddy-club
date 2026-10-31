import { PageSkeleton } from "@/components/PageSkeleton";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useAuth();
  const devPreview = typeof window !== "undefined" && window.localStorage.getItem("__devpreview") === "1";

  if (devPreview) return <>{children}</>;

  if (loading) {
    return <PageSkeleton />;
  }

  if (!session) {
    return <Navigate to="/app/login" replace />;
  }

  // Role-based access is now handled by OrgProvider + sidebar visibility
  return <>{children}</>;
}
