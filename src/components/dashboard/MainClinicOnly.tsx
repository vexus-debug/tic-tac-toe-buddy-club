import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useOrg } from "@/hooks/useOrg";

/** Blocks pages that only the main clinic has (website, online shop). */
export function MainClinicOnly({ children }: { children: ReactNode }) {
  const { isBranch, basePath } = useOrg();
  if (isBranch) return <Navigate to={`${basePath}/dashboard`} replace />;
  return <>{children}</>;
}
