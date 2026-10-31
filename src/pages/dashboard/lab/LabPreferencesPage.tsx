import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useLabSettings, useSaveLabSettings } from "@/hooks/lab/useLab";
import { Save } from "lucide-react";

export default function LabPreferencesPage() {
  const { data: settings } = useLabSettings();
  const save = useSaveLabSettings();

  const [form, setForm] = useState({
    serial_prefix: "LAB",
    sla_hours: 24,
    require_approval: true,
    report_header: "",
    report_footer: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        serial_prefix: settings.serial_prefix || "LAB",
        sla_hours: settings.sla_hours ?? 24,
        require_approval: settings.require_approval ?? true,
        report_header: settings.report_header || "",
        report_footer: settings.report_footer || "",
      });
    }
  }, [settings]);

  return (
    <div className="space-y-6">
      <PageHeader title="Lab Preferences" description="Serials, turnaround targets and report layout">
        <Button size="sm" onClick={() => save.mutate(form)} disabled={save.isPending}>
          <Save className="mr-2 h-4 w-4" /> Save
        </Button>
      </PageHeader>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Workflow</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Serial prefix</Label>
            <Input value={form.serial_prefix} onChange={(e) => setForm({ ...form, serial_prefix: e.target.value })} />
          </div>
          <div>
            <Label>Turnaround target (hours)</Label>
            <Input
              type="number"
              value={form.sla_hours}
              onChange={(e) => setForm({ ...form, sla_hours: Number(e.target.value) })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
            <div>
              <p className="text-sm font-medium">Require approval before release</p>
              <p className="text-xs text-muted-foreground">Completed results must be approved before patients can view them.</p>
            </div>
            <Switch
              checked={form.require_approval}
              onCheckedChange={(v) => setForm({ ...form, require_approval: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Report layout</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label>Report header</Label>
            <Textarea
              rows={3}
              placeholder="Lab name, address, phone"
              value={form.report_header}
              onChange={(e) => setForm({ ...form, report_header: e.target.value })}
            />
          </div>
          <div>
            <Label>Report footer</Label>
            <Textarea
              rows={3}
              placeholder="Disclaimer, signature line"
              value={form.report_footer}
              onChange={(e) => setForm({ ...form, report_footer: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
