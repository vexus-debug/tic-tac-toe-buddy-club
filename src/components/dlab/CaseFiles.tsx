import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, FileText, Trash2, Upload, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useOrg } from "@/hooks/useOrg";
import { StlViewer } from "./StlViewer";

const BUCKET = "lab-case-files";

export function CaseFiles({ caseId }: { caseId: string }) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  const folder = `${orgId}/${caseId}`;
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const { data: files = [] } = useQuery({
    queryKey: ["case-files", folder],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET).list(folder, { sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      return (data || []).filter((f) => f.name !== ".emptyFolderPlaceholder");
    },
  });

  const signed = async (name: string) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(`${folder}/${name}`, 600);
    if (error) throw error;
    return data.signedUrl;
  };

  const upload = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    try {
      for (const f of Array.from(list)) {
        const safe = f.name.replace(/[^\w.\-]+/g, "_");
        const { error } = await supabase.storage.from(BUCKET).upload(`${folder}/${Date.now()}_${safe}`, f);
        if (error) throw error;
      }
      toast({ title: "Files uploaded" });
      qc.invalidateQueries({ queryKey: ["case-files", folder] });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally { setBusy(false); if (input.current) input.current.value = ""; }
  };

  const remove = async (name: string) => {
    if (!confirm("Remove this file?")) return;
    await supabase.storage.from(BUCKET).remove([`${folder}/${name}`]);
    qc.invalidateQueries({ queryKey: ["case-files", folder] });
  };

  const isStl = (n: string) => n.toLowerCase().endsWith(".stl");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Scans & files</p>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />{busy ? "Uploading…" : "Upload"}
        </Button>
        <input ref={input} type="file" multiple accept=".stl,.ply,.obj,.pdf,.jpg,.jpeg,.png,.zip" className="hidden" onChange={(e) => upload(e.target.files)} />
      </div>
      {preview && <StlViewer url={preview} />}
      {files.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">No files yet. Upload intraoral scans (STL), photos or the prescription.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {files.map((f) => (
            <li key={f.name} className="flex items-center gap-2 px-3 py-2 text-sm">
              {isStl(f.name) ? <Box className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
              <span className="min-w-0 flex-1 truncate">{f.name.replace(/^\d+_/, "")}</span>
              {isStl(f.name) && <Button size="sm" variant="ghost" onClick={async () => setPreview(await signed(f.name))}>View 3D</Button>}
              <Button size="icon" variant="ghost" aria-label="Download" onClick={async () => window.open(await signed(f.name), "_blank")}><Download className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => remove(f.name)}><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
