import { PageHeader } from "@/components/dashboard/PageHeader";
import { MarketingStatCard } from "@/components/dashboard/marketing/MarketingStatCard";
import { MarketingStatusBadge } from "@/components/dashboard/marketing/MarketingStatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Instagram, Facebook, Twitter, MapPin, Video, Plus, Heart, Eye, CalendarRange, Lightbulb } from "lucide-react";
import { socialPosts, contentIdeas } from "@/data/marketing/mockMarketing";
import type { SocialPlatform } from "@/data/marketing/types";
import { format } from "date-fns";
import { toast } from "sonner";

const PLATFORM_ICON: Record<SocialPlatform, any> = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Video,
  x: Twitter,
  google: MapPin,
};

export default function SocialContentPage() {
  const scheduled = socialPosts.filter((p) => p.status === "scheduled");
  const published = socialPosts.filter((p) => p.status === "published");
  const needsApproval = socialPosts.filter((p) => p.status === "needs_approval");
  const reach = published.reduce((a, p) => a + (p.reach ?? 0), 0);
  const engagement = published.reduce((a, p) => a + (p.likes ?? 0) + (p.comments ?? 0), 0);

  const renderPost = (p: (typeof socialPosts)[number]) => {
    const Icon = PLATFORM_ICON[p.platform];
    return (
      <Card key={p.id} className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Icon className="h-4 w-4 text-secondary" />
              </div>
              <div>
                <p className="text-xs font-semibold capitalize text-foreground">{p.platform}</p>
                <p className="text-[11px] text-muted-foreground">{format(new Date(p.scheduled_for), "d MMM, HH:mm")}</p>
              </div>
            </div>
            <MarketingStatusBadge status={p.status} />
          </div>
          <p className="text-sm text-foreground mt-3">{p.caption}</p>
          {p.hashtags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.hashtags.map((h) => (
                <Badge key={h} variant="outline" className="text-[10px]">{h}</Badge>
              ))}
            </div>
          )}
          {p.status === "published" && (
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {p.likes}</span>
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {p.reach}</span>
              <span>{p.comments} comments</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Social Content Planner" description="Plan, approve and schedule posts across your social channels">
        <Button className="bg-secondary hover:bg-secondary/90" onClick={() => toast.info("Post composer coming soon")}>
          <Plus className="mr-2 h-4 w-4" /> Plan a post
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MarketingStatCard index={0} icon={CalendarRange} label="Scheduled posts" value={String(scheduled.length)} hint="Queued to publish" />
        <MarketingStatCard index={1} icon={Eye} label="Reach (published)" value={reach.toLocaleString()} hint="Last 30 days" />
        <MarketingStatCard index={2} icon={Heart} label="Engagements" value={String(engagement)} hint="Likes + comments" />
        <MarketingStatCard index={3} icon={Lightbulb} label="Awaiting approval" value={String(needsApproval.length)} hint="Needs a review" />
      </div>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="ideas">Content ideas</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {socialPosts.filter((p) => p.status !== "published").map(renderPost)}
          </div>
        </TabsContent>

        <TabsContent value="published" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{published.map(renderPost)}</div>
        </TabsContent>

        <TabsContent value="ideas" className="mt-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Content idea bank</CardTitle>
              <CardDescription>Starting points you can turn into a post in seconds</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {contentIdeas.map((i) => (
                <div key={i.id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{i.title}</p>
                    <Badge variant="outline" className="text-[10px]">{i.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{i.caption}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {i.hashtags.map((h) => (
                      <Badge key={h} variant="outline" className="text-[10px]">{h}</Badge>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => toast.success(`Drafted "${i.title}"`)}>
                    Turn into post
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
