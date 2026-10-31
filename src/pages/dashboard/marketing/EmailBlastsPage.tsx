import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { MarketingStatCard } from "@/components/dashboard/marketing/MarketingStatCard";
import { MarketingStatusBadge } from "@/components/dashboard/marketing/MarketingStatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, MousePointerClick, Users, Plus, Send } from "lucide-react";
import { emailCampaigns, audienceSegments, campaignTemplates } from "@/data/marketing/mockMarketing";
import { format } from "date-fns";
import { toast } from "sonner";

export default function EmailBlastsPage() {
  const [tab, setTab] = useState("campaigns");

  const sent = emailCampaigns.filter((c) => c.status === "sent");
  const totalDelivered = sent.reduce((a, c) => a + c.delivered, 0);
  const totalOpened = sent.reduce((a, c) => a + c.opened, 0);
  const totalClicked = sent.reduce((a, c) => a + c.clicked, 0);
  const totalBooked = sent.reduce((a, c) => a + c.booked, 0);
  const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "0%");

  return (
    <div className="space-y-6">
      <PageHeader title="Email Blasts" description="Send targeted email campaigns to patient segments">
        <Button className="bg-secondary hover:bg-secondary/90" onClick={() => toast.info("Campaign composer coming soon")}>
          <Plus className="mr-2 h-4 w-4" /> New email campaign
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MarketingStatCard index={0} icon={Send} label="Emails delivered" value={String(totalDelivered)} hint="Last 30 days" />
        <MarketingStatCard index={1} icon={Mail} label="Open rate" value={pct(totalOpened, totalDelivered)} hint={`${totalOpened} opens`} />
        <MarketingStatCard index={2} icon={MousePointerClick} label="Click rate" value={pct(totalClicked, totalDelivered)} hint={`${totalClicked} clicks`} />
        <MarketingStatCard index={3} icon={Users} label="Bookings driven" value={String(totalBooked)} hint="Attributed" />
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
              <CardTitle className="text-base">All email campaigns</CardTitle>
              <CardDescription>Drafts, scheduled sends and past results</CardDescription>
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
                    <TableHead className="text-right">Opens</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Booked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailCampaigns.map((c) => {
                    const seg = audienceSegments.find((s) => s.id === c.segment_id);
                    const when = c.sent_at ?? c.scheduled_for;
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <p className="font-medium text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[260px]">{c.subject}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{seg?.name ?? "—"}</TableCell>
                        <TableCell><MarketingStatusBadge status={c.status} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {when ? format(new Date(when), "d MMM yyyy, HH:mm") : "—"}
                        </TableCell>
                        <TableCell className="text-right">{c.recipients}</TableCell>
                        <TableCell className="text-right">{c.opened || "—"}</TableCell>
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
            {campaignTemplates.filter((t) => t.channel === "email").map((t) => (
              <Card key={t.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                  </div>
                  <p className="text-xs font-medium text-foreground mt-2">{t.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line line-clamp-4">{t.body}</p>
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
