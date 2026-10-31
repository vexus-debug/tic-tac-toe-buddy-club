import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Zap, Clock, Server, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface HealthCheck {
  name: string;
  status: "ok" | "error" | "checking";
  latency?: number;
  error?: string;
}

export default function AdminHealthMonitoring() {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);

  const runChecks = async () => {
    setChecking(true);
    const results: HealthCheck[] = [];

    // Database check
    try {
      const start = performance.now();
      await supabase.from("organizations").select("id", { count: "exact", head: true });
      results.push({ name: "Database", status: "ok", latency: Math.round(performance.now() - start) });
    } catch (err: any) {
      results.push({ name: "Database", status: "error", error: err.message });
    }

    // Auth check
    try {
      const start = performance.now();
      await supabase.auth.getSession();
      results.push({ name: "Authentication", status: "ok", latency: Math.round(performance.now() - start) });
    } catch (err: any) {
      results.push({ name: "Authentication", status: "error", error: err.message });
    }

    // Storage check
    try {
      const start = performance.now();
      await supabase.storage.listBuckets();
      results.push({ name: "Storage", status: "ok", latency: Math.round(performance.now() - start) });
    } catch (err: any) {
      results.push({ name: "Storage", status: "error", error: err.message });
    }

    // Edge function check
    try {
      const start = performance.now();
      const res = await supabase.functions.invoke("admin-user-actions", {
        body: { action: "ping" },
      });
      const latency = Math.round(performance.now() - start);
      // Even a 400 means the function is responding
      results.push({ name: "Edge Functions", status: "ok", latency });
    } catch (err: any) {
      results.push({ name: "Edge Functions", status: "error", error: err.message });
    }

    // Realtime check
    try {
      const start = performance.now();
      const channel = supabase.channel("health-check");
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.unsubscribe();
        }
      });
      results.push({ name: "Realtime", status: "ok", latency: Math.round(performance.now() - start) });
    } catch (err: any) {
      results.push({ name: "Realtime", status: "error", error: err.message });
    }

    setChecks(results);
    setLastChecked(new Date());
    setChecking(false);
  };

  useEffect(() => { runChecks(); }, []);

  const allOk = checks.length > 0 && checks.every((c) => c.status === "ok");
  const hasErrors = checks.some((c) => c.status === "error");
  const avgLatency = checks.filter((c) => c.latency).reduce((sum, c) => sum + (c.latency || 0), 0) / Math.max(checks.filter((c) => c.latency).length, 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Health Monitoring</h1>
          <p className="text-sm text-muted-foreground mt-0.5">System status and service health checks.</p>
        </div>
        <Button size="sm" variant="outline" onClick={runChecks} disabled={checking} className="gap-1">
          <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <Card className={`glass-card border-l-4 ${allOk ? "border-l-emerald-500" : hasErrors ? "border-l-destructive" : "border-l-amber-500"}`}>
        <CardContent className="p-5 flex items-center gap-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${allOk ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
            {allOk ? <CheckCircle className="h-6 w-6 text-emerald-600" /> : <XCircle className="h-6 w-6 text-destructive" />}
          </div>
          <div>
            <h2 className="text-lg font-bold">{allOk ? "All Systems Operational" : hasErrors ? "Issues Detected" : "Checking..."}</h2>
            <p className="text-sm text-muted-foreground">
              Avg latency: {Math.round(avgLatency)}ms
              {lastChecked && ` • Last checked: ${lastChecked.toLocaleTimeString()}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Service Checks */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {checks.map((check) => (
          <Card key={check.name} className="glass-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{check.name}</span>
                </div>
                <Badge className={`text-[10px] ${check.status === "ok" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                  {check.status === "ok" ? "Healthy" : "Error"}
                </Badge>
              </div>
              {check.latency && (
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className={`font-mono ${check.latency > 500 ? "text-amber-600" : "text-emerald-600"}`}>{check.latency}ms</span>
                </div>
              )}
              {check.error && <p className="text-xs text-destructive mt-1">{check.error}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
