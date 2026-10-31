import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { MarketingStatCard } from "@/components/dashboard/marketing/MarketingStatCard";
import { MarketingStatusBadge } from "@/components/dashboard/marketing/MarketingStatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageSquare, MousePointerClick, Users, Plus, ShieldCheck } from "lucide-react";
import { smsCampaigns, audienceSegments, campaignTemplates } from "@/data/marketing/mockMarketing";
import { format } from "date-fns";
import { toast } from "sonner";

export default function SmsBlastsPage() {
  const [tab, setTab] = useState("campaigns");

  const sent = smsCampaigns.filter((c) => c.status === "sent");
  const delivered = sent.reduce((a, c) => a + c.delivered, 0);
  const clicked = sent.reduce((a, c) => a + c.clicked, 0);
  const booked = sent.reduce((a, c) => a + c.booked, 0);
  const optOuts = smsCampaigns.reduce((a, c) => a + c.unsubscribed, 0);
  const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "0%");

  return (
    <div className="space-y-6">
      <PageHeader title="SMS Blasts" description="Short, high-open-rate messages for reminders and last-minute openings">
        <Button className="bg-secondary hover:bg-secondary/90" onClick={() => toast.info("SMS composer coming soon")}>
          <Plus className="mr-2 h-4 w-4" /> New SMS campaign
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MarketingStatCard index={0} icon={MessageSquare} label="Messages delivered" value={String(delivered)} hint="Last 30 days" />
        <MarketingStatCard index={1} icon={MousePointerClick} label="Click rate" value={pct(clicked, delivered)} hint={`${clicked} link taps`} />
        <MarketingStatCard index={2} icon={Users} label="Bookings driven" value={String(booked)} hint="Attributed" />
        <MarketingStatCard index={3} icon={ShieldCheck} label="Opt-outs" value={String(optOuts)} hint="STOP replies" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">All SMS campaigns</CardTitle>
              <CardDescription>Every message includes an opt-out line</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead className="text-right">Recipients</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Booked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {smsCampaigns.map((c) => {
                    const seg = audienceSegments.find((s) => s.id === c.segment_id);
                    const when = c.sent_at ?? c.scheduled_for;
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <p className="font-medium text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[320px]">{c.body}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{seg?.name ?? "—"}</TableCell>
                        <TableCell><MarketingStatusBadge status={c.status} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {when ? format(new Date(when), "d MMM yyyy, HH:mm") : "—"}
                        </TableCell>
                        <TableCell className="text-right">{c.recipients}</TableCell>
                        <TableCell className="text-right">{c.clicked || "—"}</TableCell>
                        <TableCell className="text-right">{c.booked || "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {audienceSegments.map((s) => (
              <Card key={s.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                    </div>
                    <span className="text-lg font-bold text-foreground">{s.size}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.tags.map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2">
            {campaignTemplates.filter((t) => t.channel === "sms").map((t) => (
              <Card key={t.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{t.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">{t.body.length} characters · 1 segment</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => toast.success(`Loaded "${t.name}"`)}>
                    Use template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
