import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Lock, PenLine, FilePlus2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isNoteLocked, noteUnlocksIn } from "@/lib/noteLock";

export function NoteLockControls({ note, canEdit }: { note: any; canEdit: boolean }) {
  const qc = useQueryClient();
  const { user } = useAuth() as any;
  const locked = isNoteLocked(note);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [content, setContent] = useState("");
  const [signature, setSignature] = useState("");

  const { data: addenda = [] } = useQuery({
    queryKey: ["note_addenda", note.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("clinical_note_addenda").select("*").eq("note_id", note.id).order("created_at");
      if (error) throw error;
      return data || [];
    },
  });

  const sign = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("clinical_notes")
        .update({ signed_at: new Date().toISOString(), signed_by: user?.id }).eq("id", note.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clinical_notes"] }); toast({ title: "Note signed and locked" }); },
    onError: (e: any) => toast({ title: "Could not sign", description: e.message, variant: "destructive" }),
  });

  const addAddendum = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("clinical_note_addenda").insert({
        note_id: note.id, org_id: note.org_id, author_id: user?.id,
        author_name: signature.trim(), reason: reason.trim(), content: content.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["note_addenda", note.id] });
      setOpen(false); setReason(""); setContent(""); setSignature("");
      toast({ title: "Signed addendum added" });
    },
    onError: (e: any) => toast({ title: "Could not add addendum", description: e.message, variant: "destructive" }),
  });

  const hrs = noteUnlocksIn(note);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {locked ? (
          <Badge variant="secondary" className="gap-1"><Lock className="h-3 w-3" />
            {note.signed_at ? `Signed ${new Date(note.signed_at).toLocaleString()}` : "Locked (24h passed)"}
          </Badge>
        ) : (
          <Badge variant="outline">Editable · locks in {hrs}h</Badge>
        )}
        {canEdit && !locked && (
          <Button size="sm" variant="outline" className="h-7 text-xs" disabled={sign.isPending} onClick={() => sign.mutate()}>
            <PenLine className="mr-1 h-3 w-3" /> Finalize & sign
          </Button>
        )}
        {canEdit && locked && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setOpen(true)}>
            <FilePlus2 className="mr-1 h-3 w-3" /> Add addendum
          </Button>
        )}
      </div>

      {addenda.length > 0 && (
        <div className="space-y-2 border-l-2 border-muted pl-3">
          {addenda.map((a: any) => (
            <div key={a.id} className="text-sm">
              <p className="text-xs text-muted-foreground">
                Addendum · {new Date(a.created_at).toLocaleString()} · signed by {a.author_name || "clinician"} · reason: {a.reason}
              </p>
              <p className="whitespace-pre-wrap">{a.content}</p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add signed addendum</DialogTitle>
            <DialogDescription>The original note stays unchanged. Addenda are permanent and can't be edited.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Reason for amendment</Label>
              <Input maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Late entry, correction of tooth number" /></div>
            <div className="space-y-1"><Label className="text-xs">Addendum</Label>
              <Textarea maxLength={4000} rows={4} value={content} onChange={(e) => setContent(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Type your full name to sign</Label>
              <Input maxLength={120} value={signature} onChange={(e) => setSignature(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!reason.trim() || !content.trim() || !signature.trim() || addAddendum.isPending} onClick={() => addAddendum.mutate()}>
              Sign & add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
