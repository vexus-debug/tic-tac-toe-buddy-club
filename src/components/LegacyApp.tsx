import { lazy, Suspense, useEffect, useState } from "react";
import { PageSkeleton } from "@/components/PageSkeleton";

const LegacyApp = lazy(() => import("@/App"));

// Mounts the imported Clinexus app (react-router based) unchanged inside the
// TanStack Start shell. The legacy app is only rendered after mount, in its
// own commit: its BrowserRouter subscribes to the same window history as
// TanStack Router, and rendering it during the Transitioner's render pass
// triggers "cannot update a component while rendering a different component".
export function LegacyAppHost() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <PageSkeleton />;
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
      <LegacyApp />
    </Suspense>
  );
}
