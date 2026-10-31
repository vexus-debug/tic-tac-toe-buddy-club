import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function PatientImageThumb({ path, alt }: { path: string; alt?: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!path) return;
    if (path.startsWith("http")) { setUrl(path); return; }
    supabase.storage
      .from("patient-images")
      .createSignedUrl(path, 3600)
      .then(({ data }) => { if (active) setUrl(data?.signedUrl ?? null); });
    return () => { active = false; };
  }, [path]);

  if (!url) return <div className="w-full h-full bg-muted animate-pulse" />;
  return <img src={url} alt={alt || "Patient image"} className="w-full h-full object-cover" loading="lazy" />;
}
