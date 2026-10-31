import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/** Make a storage-safe object key: no spaces, accents or special characters. */
export function sanitizeFileName(name: string) {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "file";
  const ext = (dot > 0 ? name.slice(dot + 1) : "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
  return ext ? `${base}.${ext.toLowerCase()}` : base;
}

/** Open a document stored in the private clinic-documents bucket. */
export async function openPatientDocument(path: string) {
  const { data, error } = await supabase.storage
    .from("clinic-documents")
    .createSignedUrl(path, 60 * 10);
  if (error || !data?.signedUrl) {
    toast({ title: "Could not open document", description: error?.message, variant: "destructive" });
    return;
  }
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}
