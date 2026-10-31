import { Wrench } from "lucide-react";

/** Marketing pages stay in maintenance mode while this flag is on. */
export const MAINTENANCE_ENABLED = true;

export function isUnderMaintenance(_now: Date = new Date()) {
  return MAINTENANCE_ENABLED;
}

export function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Wrench className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <h1 className="mb-3 text-3xl font-bold tracking-tight">Under maintenance</h1>
        <p className="text-muted-foreground">
          We're making some improvements to this page. It will be back online soon.
          Thanks for your patience.
        </p>
      </div>
    </main>
  );
}

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  if (isUnderMaintenance()) return <MaintenancePage />;
  return <>{children}</>;
}

export default MaintenanceGate;
