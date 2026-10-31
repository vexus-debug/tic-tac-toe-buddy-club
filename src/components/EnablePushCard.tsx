import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { enablePush, isPushEnabled, pushSupported } from "@/lib/pushClient";

const messages: Record<string, string> = {
  unsupported: "This browser can't show notifications. On iPhone, add Clinexus to your Home Screen first.",
  "open-in-new-tab": "Open the app in its own tab (or the installed app) to turn on notifications.",
  denied: "Notifications are blocked. Allow them in your browser or phone settings for this site.",
  "not-signed-in": "Please sign in first.",
  error: "Couldn't turn on notifications. Please try again.",
};

export function EnablePushCard() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    isPushEnabled().then(setEnabled).catch(() => setEnabled(false));
  }, []);

  if (enabled === null || enabled || !pushSupported()) return null;

  const onEnable = async () => {
    setBusy(true);
    const res = await enablePush();
    setBusy(false);
    if (res === "enabled") {
      setEnabled(true);
      toast({ title: "Notifications on", description: "You'll get Clinexus alerts on this device." });
    } else toast({ title: "Not enabled", description: messages[res], variant: "destructive" });
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <BellRing className="h-6 w-6 shrink-0 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Get alerts on this device</p>
          <p className="text-xs text-muted-foreground">Receive important Clinexus messages as phone notifications.</p>
        </div>
        <Button size="sm" onClick={onEnable} disabled={busy}>{busy ? "Enabling..." : "Turn on"}</Button>
      </CardContent>
    </Card>
  );
}
