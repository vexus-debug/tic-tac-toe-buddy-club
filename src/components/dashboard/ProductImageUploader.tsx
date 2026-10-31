import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ImagePlus, Loader2, Star, X } from "lucide-react";

interface ProductImageUploaderProps {
  orgId?: string;
  images: string[];
  onChange: (images: string[]) => void;
}

/**
 * Multi-image upload for shop products. Files are stored in the existing public
 * `clinic-logos` bucket under `{orgId}/shop/...`; the first image is the primary one.
 */
export function ProductImageUploader({ orgId, images, onChange }: ProductImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    if (!orgId) {
      toast({ title: "No clinic selected", variant: "destructive" });
      return;
    }

    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          toast({ title: `${file.name} is not an image`, variant: "destructive" });
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: `${file.name} is larger than 5MB`, variant: "destructive" });
          continue;
        }
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${orgId}/shop/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("clinic-logos")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("clinic-logos").getPublicUrl(path);
        uploaded.push(urlData.publicUrl);
      }
      if (uploaded.length > 0) {
        onChange([...images, ...uploaded]);
        toast({ title: `${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded` });
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (index: number) => onChange(images.filter((_, i) => i !== index));
  const makePrimary = (index: number) => {
    const next = [...images];
    const [picked] = next.splice(index, 1);
    onChange([picked, ...next]);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {images.map((url, i) => (
          <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border group">
            <img src={url} alt={`Product image ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute bottom-0 inset-x-0 bg-primary/85 text-primary-foreground text-[9px] text-center py-0.5">
                Primary
              </span>
            )}
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
              {i !== 0 && (
                <button
                  type="button"
                  onClick={() => makePrimary(i)}
                  title="Make primary"
                  className="rounded-md bg-background/90 p-1 text-foreground"
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => removeAt(i)}
                title="Remove image"
                className="rounded-md bg-background/90 p-1 text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="h-20 w-20 rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-primary transition-colors disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          <span className="text-[10px]">{uploading ? "Uploading" : "Add"}</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
      <p className="text-[11px] text-muted-foreground">
        Upload up to 5MB per image. The first image is shown as the product thumbnail.
      </p>
    </div>
  );
}
