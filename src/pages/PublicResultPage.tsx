import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileSearch, Printer, Search } from "lucide-react";

const db = supabase as any;

export default function PublicResultPage() {
  const [params, setParams] = useSearchParams();
  const [serial, setSerial] = useState(params.get("serial") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lab, setLab] = useState<any>(null);
  const [scan, setScan] = useState<any>(null);

  const lookup = async (value?: string) => {
    const s = (value ?? serial).trim();
    if (!s) return;
    setLoading(true);
    setError("");
    setLab(null);
    setScan(null);
    setParams({ serial: s });
    const [{ data: labData }, { data: scanData }] = await Promise.all([
      db.rpc("get_public_result", { _serial: s }),
      db.rpc("get_public_scan", { _serial: s }),
    ]);
    if (labData) setLab(labData);
    else if (scanData) setScan(scanData);
    else setError("No approved report was found for that serial number.");
    setLoading(false);
  };

  const report = lab || scan;

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="text-center print:hidden">
          <h1 className="text-2xl font-bold">Check your result</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the serial number printed on your receipt to view and print your report.
          </p>
        </div>

        <div className="flex gap-2 print:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="e.g. LAB-2026-00042"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookup()}
            />
          </div>
          <Button onClick={() => lookup()} disabled={loading}>{loading ? "Checking…" : "Check"}</Button>
        </div>

        {error && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <FileSearch className="mx-auto mb-2 h-6 w-6 opacity-40" />
              {error}
            </CardContent>
          </Card>
        )}

        {report && (
          <Card className="print:border-0 print:shadow-none">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{report.clinic_name}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Serial <span className="font-mono">{report.serial}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{report.status}</Badge>
                <Button size="sm" variant="outline" className="print:hidden" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p><span className="text-muted-foreground">Patient: </span>{lab ? lab.patient_name : scan.patient_name}</p>
                <p><span className="text-muted-foreground">Age / Sex: </span>{(lab ? lab.patient_age : scan.age) || "—"} / {(lab ? lab.patient_sex : scan.sex) || "—"}</p>
                {lab && <p><span className="text-muted-foreground">Specimen: </span>{lab.specimen || "—"}</p>}
                {lab && <p><span className="text-muted-foreground">Referred by: </span>{lab.referring_doctor || "—"}</p>}
                {scan && <p><span className="text-muted-foreground">Study: </span>{scan.modality} {scan.body_part || ""}</p>}
                <p>
                  <span className="text-muted-foreground">Date: </span>
                  {new Date(report.approved_at || report.completed_at || report.reported_at || Date.now()).toLocaleString()}
                </p>
              </div>

              {lab && (
                <div className="space-y-4">
                  {(lab.results || []).map((r: any, i: number) => (
                    <div key={i} className="rounded-md border p-3">
                      <p className="font-medium">{r.test_name}</p>
                      <div className="mt-2 space-y-1 text-sm">
                        {Object.entries(r.values || {}).map(([k, v]: any) => (
                          <div key={k} className="flex justify-between border-b border-border/40 py-1">
                            <span className="text-muted-foreground">{k}</span>
                            <span className="font-medium">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                      {r.comment && <p className="mt-2 text-xs text-muted-foreground">{r.comment}</p>}
                    </div>
                  ))}
                  {(lab.results || []).length === 0 && <p className="text-sm text-muted-foreground">No result lines recorded.</p>}
                </div>
              )}

              {scan && (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium">Findings</p>
                    <p className="whitespace-pre-wrap text-muted-foreground">{scan.findings || "—"}</p>
                  </div>
                  <div>
                    <p className="font-medium">Impression</p>
                    <p className="whitespace-pre-wrap text-muted-foreground">{scan.impression || "—"}</p>
                  </div>
                  <div>
                    <p className="font-medium">Recommendation</p>
                    <p className="whitespace-pre-wrap text-muted-foreground">{scan.recommendation || "—"}</p>
                  </div>
                </div>
              )}

              <p className="pt-4 text-center text-xs text-muted-foreground">
                This report is issued electronically. Please discuss the result with your doctor.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
