import { PageHeader } from "@/components/dashboard/PageHeader";
import { MarketingStatCard } from "@/components/dashboard/marketing/MarketingStatCard";
import { MarketingStatusBadge } from "@/components/dashboard/marketing/MarketingStatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, Share2, Gift, MessageSquare, Send } from "lucide-react";
import { patientReviews, referrals } from "@/data/marketing/mockMarketing";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ReviewsReferralsPage() {
  const avg = (patientReviews.reduce((a, r) => a + r.rating, 0) / patientReviews.length).toFixed(1);
  const unanswered = patientReviews.filter((r) => !r.replied).length;
  const treated = referrals.filter((r) => r.status === "treated").length;
  const pendingRewards = referrals.filter((r) => r.reward_status === "pending").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Reviews & Referrals" description="Grow word of mouth: collect reviews and reward patients who refer">
        <Button className="bg-secondary hover:bg-secondary/90" onClick={() => toast.success("Review requests queued")}>
          <Send className="mr-2 h-4 w-4" /> Request reviews
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MarketingStatCard index={0} icon={Star} label="Average rating" value={avg} hint={`${patientReviews.length} recent reviews`} trend="+0.1" />
        <MarketingStatCard index={1} icon={MessageSquare} label="Awaiting reply" value={String(unanswered)} hint="Respond within 48h" />
        <MarketingStatCard index={2} icon={Share2} label="Referrals converted" value={String(treated)} hint={`${referrals.length} total referrals`} />
        <MarketingStatCard index={3} icon={Gift} label="Rewards pending" value={String(pendingRewards)} hint="To be issued" />
      </div>

      <Tabs defaultValue="reviews">
        <TabsList>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2">
            {patientReviews.map((r) => (
              <Card key={r.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{r.patient_name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={i < r.rating ? "h-3.5 w-3.5 fill-amber-400 text-amber-400" : "h-3.5 w-3.5 text-muted-foreground"}
                          />
                        ))}
                        <span className="ml-1 text-[11px] text-muted-foreground capitalize">{r.source.replace("_", " ")}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {r.featured && <Badge variant="outline" className="text-[10px]">Featured</Badge>}
                      <span className="text-[11px] text-muted-foreground">{format(new Date(r.created_at), "d MMM")}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">{r.comment}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={r.replied ? "outline" : "default"}
                      className={r.replied ? "" : "bg-secondary hover:bg-secondary/90"}
                      onClick={() => toast.info(r.replied ? "Reply already sent" : "Reply composer coming soon")}
                    >
                      {r.replied ? "Replied" : "Reply"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toast.success("Added to website testimonials")}>
                      Feature on site
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="referrals" className="mt-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Referral programme</CardTitle>
              <CardDescription>Track who referred whom and what reward is owed</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Referred patient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reward</TableHead>
                    <TableHead>Reward status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-foreground">{r.referrer_name}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-[10px]">{r.referral_code}</Badge></TableCell>
                      <TableCell>{r.referred_name}</TableCell>
                      <TableCell><MarketingStatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.reward}</TableCell>
                      <TableCell><MarketingStatusBadge status={r.reward_status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(r.created_at), "d MMM yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
