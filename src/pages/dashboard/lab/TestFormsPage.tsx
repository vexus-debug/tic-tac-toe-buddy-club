import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useTestForms, useRealtimeTestForms, TestForm } from "@/hooks/lab/useLab";
import { useOrg } from "@/hooks/useOrg";
import { Download, Plus, Printer, Search, FileText } from "lucide-react";

const STATUSES = ["all", "pending", "processing", "completed", "approved"];

function statusVariant(s: string) {
  if (s === "approved") return "default";
  if (s === "completed") return "secondary";
  return "outline";
}

export default function TestFormsPage({ defaultStatus = "all" }: { defaultStatus?: string }) {
  useRealtimeTestForms();
  const { basePath } = useOrg();
  const { data: forms = [], isLoading } = useTestForms();
  const [tab, setTab] = useState(defaultStatus);
  const [term, setTerm] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: forms.length };
    forms.forEach((f) => { c[f.status] = (c[f.status] || 0) + 1; });
    return c;
  }, [forms]);

  const filtered = useMemo(() => {
    return forms.filter((f) => {
      if (tab !== "all" && f.status !== tab) return false;
      if (term.trim()) {
        const t = term.toLowerCase();
        if (!`${f.serial} ${f.patient_name} ${f.referring_doctor || ""}`.toLowerCase().includes(t)) return false;
      }
      const d = new Date(f.created_at);
      if (from && d < new Date(from)) return false;
      if (to && d > new Date(`${to}T23:59:59`)) return false;
      return true;
    });
  }, [forms, tab, term, from, to]);

  const exportCsv = () => {
    const rows = [
      ["Serial", "Patient", "Age", "Sex", "Specimen", "Referring Doctor", "Status", "Amount", "Collected", "Completed"],
      ...filtered.map((f: TestForm) => [
        f.serial, f.patient_name, f.patient_age || "", f.patient_sex || "", f.specimen || "",
        f.referring_doctor || "", f.status, String(f.total_amount || 0),
        new Date(f.collected_at || f.created_at).toLocaleString(),
        f.completed_at ? new Date(f.completed_at).toLocaleString() : "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-forms-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Test Forms" description="All laboratory request forms">
        <Button size="sm" variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" /> CSV</Button>
        <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
        <Button asChild size="sm"><Link to={`${basePath}/diagnostics/forms/new`}><Plus className="mr-2 h-4 w-4" /> New Form</Link></Button>
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Button key={s} size="sm" variant={tab === s ? "default" : "outline"} onClick={() => setTab(s)} className="capitalize">
            {s} <span className="ml-2 opacity-70">{counts[s] || 0}</span>
          </Button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Serial, patient or doctor" value={term} onChange={(e) => setTerm(e.target.value)} />
        </div>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <Card className="glass-card">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/20 text-xs uppercase text-muted-foreground">
                <th className="py-2.5 px-4 text-left">Serial</th>
                <th className="py-2.5 px-4 text-left">Patient</th>
                <th className="py-2.5 px-4 text-left">Specimen</th>
                <th className="py-2.5 px-4 text-left">Doctor</th>
                <th className="py-2.5 px-4 text-left">Status</th>
                <th className="py-2.5 px-4 text-left">Amount</th>
                <th className="py-2.5 px-4 text-left">Collected</th>
                <th className="py-2.5 px-4" />
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={8} className="py-10 text-center text-muted-foreground">
                  <FileText className="mx-auto mb-2 h-6 w-6 opacity-40" /> No forms found.
                </td></tr>
              )}
              {filtered.map((f) => (
                <tr key={f.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                  <td className="py-2.5 px-4 font-mono text-xs">{f.serial}</td>
                  <td className="py-2.5 px-4">{f.patient_name}</td>
                  <td className="py-2.5 px-4 text-muted-foreground">{f.specimen || "—"}</td>
                  <td className="py-2.5 px-4 text-muted-foreground">{f.referring_doctor || "—"}</td>
                  <td className="py-2.5 px-4">
                    <Badge variant={statusVariant(f.status) as any} className="capitalize">{f.status}</Badge>
                  </td>
                  <td className="py-2.5 px-4">₦{Number(f.total_amount || 0).toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-xs text-muted-foreground">{new Date(f.collected_at || f.created_at).toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`${basePath}/diagnostics/forms/${f.serial}`}>Open</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
