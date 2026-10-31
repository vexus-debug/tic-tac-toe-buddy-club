import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useScanActivity } from "@/hooks/scan/useScan";
import { History } from "lucide-react";

export default function ScanActivityPage() {
  const { data: logs = [] } = useScanActivity();

  return (
    <div className="space-y-6">
      <PageHeader title="Imaging Activity" description="Everything that happened in the imaging department" />

      <div className="space-y-2">
        {logs.map((l: any) => (
          <Card key={l.id} className="glass-card">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium capitalize">{String(l.action).replace(/_/g, " ")}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono">{l.serial || "—"}</span> · {new Date(l.created_at).toLocaleString()}
                </p>
              </div>
              {l.details && Object.keys(l.details).length > 0 && (
                <Badge variant="outline" className="max-w-xs truncate">
                  {Object.entries(l.details).map(([k, v]) => `${k}: ${v}`).join(", ")}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
        {logs.length === 0 && (
          <Card className="glass-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              <History className="mx-auto mb-2 h-6 w-6 opacity-40" />
              No activity recorded yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
