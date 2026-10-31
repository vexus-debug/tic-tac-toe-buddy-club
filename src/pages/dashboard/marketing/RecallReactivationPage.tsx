import { PageHeader } from "@/components/dashboard/PageHeader";
import { MarketingStatCard } from "@/components/dashboard/marketing/MarketingStatCard";
import { MarketingStatusBadge } from "@/components/dashboard/marketing/MarketingStatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, PhoneCall, Mail, MessageSquare, CalendarClock } from "lucide-react";
import { recallSegments, lifecycleJourneys } from "@/data/marketing/mockMarketing";
import { toast } from "sonner";

const money = (n: number) => `₦${n.toLocaleString()}`;

export default function RecallReactivationPage() {
  const totalPatients = recallSegments.reduce((a, s) => a + s.count, 0);
  const totalValue = recallSegments.reduce((a, s) => a + s.potential_value, 0);
  const highUrgency = recallSegments.filter((s) => s.urgency === "high");

  return (
    <div className="space-y-6">
      <PageHeader title="Patient Recall & Reactivation" description="Bring lapsed and due patients back into the chair">
        <Button className="bg-secondary hover:bg-secondary/90" onClick={() => toast.success("Recall campaign started")}>
          <CalendarClock className="mr-2 h-4 w-4" /> Run recall campaign
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MarketingStatCard index={0} icon={Users} label="Patients to reach" value={totalPatients.toLocaleString()} hint={`${recallSegments.length} recall lists`} />
        <MarketingStatCard index={1} icon={DollarSign} label="Potential revenue" value={money(totalValue)} hint="If fully rebooked" />
        <MarketingStatCard index={2} icon={PhoneCall} label="High urgency lists" value={String(highUrgency.length)} hint="Act this week" />
        <MarketingStatCard index={3} icon={CalendarClock} label="Active journeys" value={String(lifecycleJourneys.filter((j) => j.active).length)} hint="Running automatically" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {recallSegments.map((s) => (
          <Card key={s.id} className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                </div>
                <MarketingStatusBadge status={s.urgency} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/60 p-2.5">
                  <p className="text-[11px] text-muted-foreground">Patients</p>
                  <p className="text-lg font-bold text-foreground">{s.count}</p>
                </div>
                <div className="rounded-lg border border-border/60 p-2.5">
                  <p className="text-[11px] text-muted-foreground">Potential value</p>
                  <p className="text-lg font-bold text-foreground">{money(s.potential_value)}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => toast.success(`Email queued for ${s.count} patients`)}>
                  <Mail className="mr-1.5 h-3.5 w-3.5" /> Email
                </Button>
                <Button size="sm" variant="outline" onClick={() => toast.success(`SMS queued for ${s.count} patients`)}>
                  <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> SMS
                </Button>
                <Button size="sm" variant="outline" onClick={() => toast.info("Call list exported")}>
                  <PhoneCall className="mr-1.5 h-3.5 w-3.5" /> Call list
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lifecycle journeys</CardTitle>
          <CardDescription>Automated follow-up sequences tied to patient events</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          {lifecycleJourneys.map((j) => (
            <div key={j.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{j.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {j.trigger} · {j.steps} steps · {j.enrolled} enrolled
                </p>
              </div>
              <MarketingStatusBadge status={j.active ? "active" : "draft"} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
