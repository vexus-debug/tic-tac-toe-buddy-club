import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, BellRing } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EnablePushCard } from "@/components/EnablePushCard";

function Inbox() {
  const { id } = useParams();
  const { data: list = [], isLoading } = useQuery({
    queryKey: ["push-inbox"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("push_messages").select("id,title,body,created_at").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data as { id: string; title: string; body: string; created_at: string }[];
    },
  });
  const current = id ? list.find((m) => m.id === id) : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur">
        <Link to={id ? "/app/inbox" : "/app/select-clinic"} className="text-muted-foreground hover:text-foreground" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-base font-semibold text-foreground">{id ? "Message" : "Notifications"}</h1>
      </header>
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : current ? (
          <Card>
            <CardContent className="space-y-3 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><BellRing className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{current.title}</h2>
                  <p className="text-xs text-muted-foreground">{format(new Date(current.created_at), "PPP p")}</p>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{current.body}</p>
            </CardContent>
          </Card>
        ) : id ? (
          <p className="text-sm text-muted-foreground">This message isn't available.</p>
        ) : (
          <>
            <EnablePushCard />
            {list.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
            {list.map((m) => (
              <Link key={m.id} to={`/app/inbox/${m.id}`} className="block rounded-lg border border-border bg-card p-4 hover:bg-accent/30">
                <p className="text-sm font-semibold text-foreground">{m.title}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{m.body}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{format(new Date(m.created_at), "PP p")}</p>
              </Link>
            ))}
          </>
        )}
      </main>
    </div>
  );
}

export default function InboxMessagePage() {
  return <ProtectedRoute><Inbox /></ProtectedRoute>;
}
