import { PageHeader } from "@/components/dashboard/PageHeader";
import { MarketingStatCard } from "@/components/dashboard/marketing/MarketingStatCard";
import { MarketingStatusBadge } from "@/components/dashboard/marketing/MarketingStatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BadgePercent, Ticket, Plus, TrendingUp, Copy } from "lucide-react";
import { promotions } from "@/data/marketing/mockMarketing";
import { format } from "date-fns";
import { toast } from "sonner";

export default function PromotionsPage() {
  const active = promotions.filter((p) => p.active);
  const totalUsed = promotions.reduce((a, p) => a + p.used, 0);
  const capacity = promotions.reduce((a, p) => a + p.usage_limit, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Promotions & Offers" description="Create discount codes and seasonal offers, then track redemptions">
        <Button className="bg-secondary hover:bg-secondary/90" onClick={() => toast.info("Promo builder coming soon")}>
          <Plus className="mr-2 h-4 w-4" /> New promotion
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MarketingStatCard index={0} icon={Ticket} label="Active offers" value={String(active.length)} hint={`${promotions.length} total`} />
        <MarketingStatCard index={1} icon={BadgePercent} label="Redemptions" value={String(totalUsed)} hint="All time" trend="+9" />
        <MarketingStatCard index={2} icon={TrendingUp} label="Capacity used" value={`${Math.round((totalUsed / capacity) * 100)}%`} hint={`${capacity} total slots`} />
        <MarketingStatCard index={3} icon={BadgePercent} label="Slots remaining" value={String(capacity - totalUsed)} hint="Across active offers" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {promotions.map((p) => {
          const usedPct = Math.round((p.used / p.usage_limit) * 100);
          return (
            <Card key={p.id} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                  </div>
                  <MarketingStatusBadge status={p.active ? "active" : "expired"} />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[11px]">{p.code}</Badge>
                  <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-[11px]">{p.discount}</Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 ml-auto"
                    onClick={() => {
                      navigator.clipboard?.writeText(p.code);
                      toast.success(`Copied ${p.code}`);
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{p.used} of {p.usage_limit} used</span>
                    <span>{usedPct}%</span>
                  </div>
                  <Progress value={usedPct} className="mt-1.5 h-1.5" />
                </div>

                <p className="mt-3 text-[11px] text-muted-foreground">
                  {format(new Date(p.starts_at), "d MMM yyyy")} → {format(new Date(p.expires_at), "d MMM yyyy")}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
