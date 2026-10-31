import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Building2, Users, UserCheck, FileSpreadsheet, CalendarDays, CreditCard } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function downloadCSV(data: any[], filename: string) {
  if (!data.length) { toast({ title: "No data to export", variant: "destructive" }); return; }
  const headers = Object.keys(data[0]);
  const csv = [headers.join(","), ...data.map((row) => headers.map((h) => {
    const val = row[h];
    const str = val === null || val === undefined ? "" : String(val);
    return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
  }).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast({ title: `Exported ${data.length} rows to ${filename}.csv` });
}

export default function AdminDataExport() {
  const [loading, setLoading] = useState<string | null>(null);

  const exportData = async (table: string, label: string) => {
    setLoading(table);
    try {
      const { data, error } = await (supabase as any).from(table).select("*");
      if (error) throw error;
      downloadCSV(data || [], `${table}_export_${new Date().toISOString().slice(0, 10)}`);
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const exports = [
    { table: "organizations", label: "Clinics", icon: Building2, desc: "All clinic organizations", color: "text-blue-600", bg: "bg-blue-500/10" },
    { table: "profiles", label: "Users", icon: Users, desc: "All platform user profiles", color: "text-violet-600", bg: "bg-violet-500/10" },
    { table: "patients", label: "Patients", icon: UserCheck, desc: "All patients across clinics", color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { table: "appointments", label: "Appointments", icon: CalendarDays, desc: "All appointment records", color: "text-amber-600", bg: "bg-amber-500/10" },
    { table: "invoices", label: "Invoices", icon: CreditCard, desc: "All billing invoices", color: "text-pink-600", bg: "bg-pink-500/10" },
    { table: "clinic_subscriptions", label: "Subscriptions", icon: FileSpreadsheet, desc: "Clinic subscription data", color: "text-cyan-600", bg: "bg-cyan-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Data Export</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Export platform data to CSV files.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {exports.map((e) => (
          <Card key={e.table} className="glass-card hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className={`h-10 w-10 rounded-xl ${e.bg} flex items-center justify-center mb-3`}>
                <e.icon className={`h-5 w-5 ${e.color}`} />
              </div>
              <h3 className="font-semibold mb-1">{e.label}</h3>
              <p className="text-xs text-muted-foreground mb-4">{e.desc}</p>
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1"
                onClick={() => exportData(e.table, e.label)}
                disabled={loading === e.table}
              >
                <Download className="h-4 w-4" />
                {loading === e.table ? "Exporting..." : "Export CSV"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
