import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  scheduled: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  sending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  sent: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  published: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  needs_approval: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  expired: "bg-muted text-muted-foreground border-border",
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  issued: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  invited: "bg-muted text-muted-foreground border-border",
  booked: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  treated: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  high: "bg-red-500/10 text-red-500 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  low: "bg-muted text-muted-foreground border-border",
};

export function MarketingStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("capitalize font-medium", STYLES[status] ?? STYLES.draft)}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}