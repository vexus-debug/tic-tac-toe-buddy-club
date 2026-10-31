import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  useScans, useUpdateScan, useDeleteScan, useScanImages, useUploadScanImage,
  useRealtimeScans, SCAN_STATUSES,
} from "@/hooks/scan/useScan";
import { useOrg } from "@/hooks/useOrg";
import { Link } from "react-router-dom";
import { Plus, ImagePlus, Trash2, ScanLine } from "lucide-react";

function ImagesPanel({ scanId }: { scanId: string }) {
  const { data: images = [] } = useScanImages(scanId);
  const upload = useUploadScanImage();
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate({ scanId, file });
            e.currentTarget.value = "";
          }}
        />
        <ImagePlus className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {images.map((img: any) => (
          <a key={img.id} href={img.url || "#"} target="_blank" rel="noreferrer" className="block">
            {img.url ? (
              <img src={img.url} alt={img.caption || "Scan image"} className="h-24 w-full rounded-md object-cover" />
            ) : (
              <div className="flex h-24 items-center justify-center rounded-md bg-muted text-xs">Image</div>
            )}
          </a>
        ))}
      </div>
      {images.length === 0 && <p className="text-xs text-muted-foreground">No images uploaded yet.</p>}
    </div>
  );
}

export default function ScansPage() {
  useRealtimeScans();
  const { basePath } = useOrg();
  const [status, setStatus] = useState<string>("all");
  const { data: scans = [] } = useScans(status === "all" ? undefined : { status });
  const update = useUpdateScan();
  const del = useDeleteScan();

  const [active, setActive] = useState<any>(null);
  const [report, setReport] = useState({ findings: "", impression: "", recommendation: "" });

  const openScan = (s: any) => {
    setActive(s);
    setReport({ findings: s.findings || "", impression: s.impression || "", recommendation: s.recommendation || "" });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Scans" description="Studies, reports and images">
        <Button asChild size="sm"><Link to={`${basePath}/imaging/register`}><Plus className="mr-2 h-4 w-4" /> Register Scan</Link></Button>
      </PageHeader>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {SCAN_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="space-y-2">
        {scans.map((s: any) => (
          <Card key={s.id} className="glass-card">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <button className="text-left" onClick={() => openScan(s)}>
                <p className="font-medium">
                  {s.scan_patients?.full_name || "Unknown patient"}
                  {s.is_urgent && <Badge variant="destructive" className="ml-2">Urgent</Badge>}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono">{s.serial}</span> · {s.modality} {s.body_part || ""} · {new Date(s.created_at).toLocaleString()}
                </p>
              </button>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{String(s.status).replace("_", " ")}</Badge>
                <Select value={s.status} onValueChange={(v) => update.mutate({ scan: s, patch: { status: v } as any })}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SCAN_STATUSES.map((st) => <SelectItem key={st} value={st} className="capitalize">{st.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="icon" variant="ghost" onClick={() => del.mutate(s)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {scans.length === 0 && (
          <Card className="glass-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              <ScanLine className="mx-auto mb-2 h-6 w-6 opacity-40" />
              No scans yet.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {active?.scan_patients?.full_name} · <span className="font-mono text-sm">{active?.serial}</span>
            </DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {active.modality} {active.body_part || ""} · {active.clinical_indication || "No indication noted"}
              </p>
              <div>
                <Label>Findings</Label>
                <Textarea rows={4} value={report.findings} onChange={(e) => setReport({ ...report, findings: e.target.value })} />
              </div>
              <div>
                <Label>Impression</Label>
                <Textarea rows={3} value={report.impression} onChange={(e) => setReport({ ...report, impression: e.target.value })} />
              </div>
              <div>
                <Label>Recommendation</Label>
                <Textarea rows={2} value={report.recommendation} onChange={(e) => setReport({ ...report, recommendation: e.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block">Images</Label>
                <ImagesPanel scanId={active.id} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => active && update.mutate({ scan: active, patch: report as any, action: "report_saved" })}
            >
              Save report
            </Button>
            <Button
              onClick={() =>
                active && update.mutate(
                  { scan: active, patch: { ...report, status: "reported" } as any, action: "reported" },
                  { onSuccess: () => setActive(null) }
                )
              }
            >
              Save &amp; mark reported
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
