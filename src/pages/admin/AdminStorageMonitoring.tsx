import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HardDrive, Image, FileText, Building2 } from "lucide-react";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";

function useStorageData() {
  return useQuery({
    queryKey: ["admin-storage-monitoring"],
    queryFn: async () => {
      const [images, documents, clinicDocs, orgs] = await Promise.all([
        supabase.from("patient_images").select("org_id, id"),
        supabase.from("patient_documents").select("org_id, id"),
        supabase.from("clinic_documents").select("org_id, id"),
        supabase.from("organizations").select("id, name"),
      ]);

      const orgMap = new Map<string, { name: string; images: number; documents: number; clinicDocs: number }>();
      (orgs.data || []).forEach((o) => orgMap.set(o.id, { name: o.name, images: 0, documents: 0, clinicDocs: 0 }));

      (images.data || []).forEach((i) => { const o = orgMap.get(i.org_id); if (o) o.images++; });
      (documents.data || []).forEach((d) => { const o = orgMap.get(d.org_id); if (o) o.documents++; });
      (clinicDocs.data || []).forEach((d) => { const o = orgMap.get(d.org_id); if (o) o.clinicDocs++; });

      const clinics = Array.from(orgMap.entries()).map(([id, data]) => ({
        id,
        ...data,
        total: data.images + data.documents + data.clinicDocs,
      })).sort((a, b) => b.total - a.total);

      return {
        totalImages: (images.data || []).length,
        totalDocuments: (documents.data || []).length,
        totalClinicDocs: (clinicDocs.data || []).length,
        clinics,
      };
    },
  });
}

export default function AdminStorageMonitoring() {
  const { data } = useStorageData();
  const d = data || { totalImages: 0, totalDocuments: 0, totalClinicDocs: 0, clinics: [] };
  const totalFiles = d.totalImages + d.totalDocuments + d.totalClinicDocs;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Storage Monitoring</h1>
        <p className="text-sm text-muted-foreground mt-0.5">File and storage usage across all clinics.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Files", value: totalFiles, icon: HardDrive, color: "text-blue-600", bg: "bg-blue-500/10" },
          { label: "Patient Images", value: d.totalImages, icon: Image, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: "Patient Documents", value: d.totalDocuments, icon: FileText, color: "text-violet-600", bg: "bg-violet-500/10" },
          { label: "Clinic Documents", value: d.totalClinicDocs, icon: FileText, color: "text-amber-600", bg: "bg-amber-500/10" },
        ].map((s, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-5">
              <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className="text-2xl font-bold"><AnimatedCounter value={s.value} /></p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Usage per Clinic</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground text-xs">Clinic</th>
                  <th className="py-2.5 px-4 text-right font-medium text-muted-foreground text-xs">Images</th>
                  <th className="py-2.5 px-4 text-right font-medium text-muted-foreground text-xs">Patient Docs</th>
                  <th className="py-2.5 px-4 text-right font-medium text-muted-foreground text-xs">Clinic Docs</th>
                  <th className="py-2.5 px-4 text-right font-medium text-muted-foreground text-xs">Total</th>
                </tr>
              </thead>
              <tbody>
                {d.clinics.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">No data</td></tr>
                ) : d.clinics.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" /> {c.name}
                    </td>
                    <td className="py-3 px-4 text-right">{c.images}</td>
                    <td className="py-3 px-4 text-right">{c.documents}</td>
                    <td className="py-3 px-4 text-right">{c.clinicDocs}</td>
                    <td className="py-3 px-4 text-right font-bold">{c.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
