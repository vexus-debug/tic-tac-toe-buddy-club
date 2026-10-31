import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { MarketingStatCard } from "@/components/dashboard/marketing/MarketingStatCard";
import { MarketingStatusBadge } from "@/components/dashboard/marketing/MarketingStatusBadge";
import { ComingSoonCard } from "@/components/dashboard/marketing/ComingSoonCard";
import { useOrg } from "@/hooks/useOrg";
import {
  Mail, MessageSquare, CalendarRange, Star, Ticket, Megaphone, Users, TrendingUp,
  QrCode, Images, MapPin, Globe, BadgePercent, ArrowRight,
} from "lucide-react";
import { emailCampaigns, smsCampaigns, socialPosts, lifecycleJourneys } from "@/data/marketing/mockMarketing";
import { format } from "date-fns";

export default function MarketingOverviewPage() {
  const navigate = useNavigate();
  const { basePath } = useOrg();
  const go = (p: string) => navigate(`${basePath}/${p}`);

  const upcoming = [
    ...[...emailCampaigns, ...smsCampaigns]
      .filter((c) => c.status === "scheduled")
      .map((c) => ({ id: c.id, title: c.name, kind: c.channel === "email" ? "Email blast" : "SMS blast", when: c.scheduled_for!, status: c.status })),
    ...socialPosts
      .filter((p) => p.status === "scheduled")
      .map((p) => ({ id: p.id, title: p.caption, kind: `${p.platform} post`, when: p.scheduled_for, status: p.status })),
  ].sort((a, b) => a.when.localeCompare(b.when));

  const quickActions = [
    { label: "New email blast", icon: Mail, path: "marketing/email" },
    { label: "New SMS blast", icon: MessageSquare, path: "marketing/sms" },
    { label: "Plan a post", icon: CalendarRange, path: "marketing/social" },
    { label: "Request reviews", icon: Star, path: "marketing/reviews" },
    { label: "Create a promo", icon: Ticket, path: "marketing/promotions" },
    { label: "Fill the recall list", icon: Users, path: "marketing/recall" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing"
        description="Grow the practice: campaigns, content, reputation and offers in one place"
      >
        <Button className="bg-secondary hover:bg-secondary/90" onClick={() => go("marketing/email")}>
          <Megaphone className="mr-2 h-4 w-4" /> New campaign
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MarketingStatCard index={0} icon={Megaphone} label="Campaigns sent (30d)" value="7" hint="4 email · 3 SMS" trend="+2 vs last month" />
        <MarketingStatCard index={1} icon={Mail} label="Average open rate" value="61%" hint="Email only" trend="+4.2%" />
        <MarketingStatCard index={2} icon={Users} label="New patients from marketing" value="43" hint="Attributed this month" trend="+11" />
        <MarketingStatCard index={3} icon={Star} label="Average review score" value="4.7" hint="128 reviews" trend="+0.1" />
        <MarketingStatCard index={4} icon={BadgePercent} label="Promo redemptions" value="48" hint="3 active offers" trend="+9" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Scheduled next</CardTitle>
            <CardDescription>Campaigns and posts queued to go out</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {item.kind} · {format(new Date(item.when), "d MMM yyyy, HH:mm")}
                  </p>
                </div>
                <MarketingStatusBadge status={item.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick actions</CardTitle>
            <CardDescription>Start something in one click</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {quickActions.map((a) => (
              <Button key={a.path + a.label} variant="outline" className="justify-start" onClick={() => go(a.path)}>
                <a.icon className="mr-2 h-4 w-4 text-secondary" />
                {a.label}
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lifecycle journeys</CardTitle>
          <CardDescription>Automated sequences that run in the background</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          {lifecycleJourneys.map((j) => (
            <div key={j.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{j.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {j.trigger} · {j.steps} steps · {j.enrolled} patients
                </p>
              </div>
              <MarketingStatusBadge status={j.active ? "active" : "draft"} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-secondary" /> Also on the roadmap
        </h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ComingSoonCard icon={Globe} title="Offer landing pages" description="Publish campaign-specific pages on your public clinic site." />
          <ComingSoonCard icon={MapPin} title="Google Business sync" description="Post updates and pull reviews straight from your Google profile." />
          <ComingSoonCard icon={Images} title="Before & after gallery" description="Consent-flagged case photos ready to share." />
          <ComingSoonCard icon={QrCode} title="QR codes & print assets" description="In-clinic posters and cards that link to offers." />
          <ComingSoonCard icon={BadgePercent} title="Loyalty & membership plans" description="Promote a monthly care plan to regular patients." />
          <ComingSoonCard icon={Users} title="Consent & unsubscribe centre" description="One place to manage marketing consent per patient." />
        </div>
      </div>
    </div>
  );
}