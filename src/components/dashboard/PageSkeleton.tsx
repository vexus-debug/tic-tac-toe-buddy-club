import { Skeleton } from "@/components/ui/skeleton";

interface PageSkeletonProps {
  variant?: "dashboard" | "list" | "profile";
}

/** App-style placeholder shown while a dashboard page loads. */
export function PageSkeleton({ variant = "list" }: PageSkeletonProps) {
  return (
    <div className="space-y-6 animate-fade-in" aria-busy="true" aria-label="Loading">
      {variant === "profile" ? (
        <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-5">
          <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-1/2 rounded-md" />
            <Skeleton className="h-3 w-1/3 rounded-md" />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded-md" />
          <Skeleton className="h-4 w-72 max-w-full rounded-md" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-2xl border border-border/60 bg-card p-4">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
        ))}
      </div>

      {variant === "dashboard" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        {Array.from({ length: 6 }).map((_, r) => (
          <div key={r} className="flex items-center gap-3 border-b border-border/30 p-4 last:border-0">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/5 rounded-md" />
              <Skeleton className="h-3 w-1/4 rounded-md" />
            </div>
            <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
