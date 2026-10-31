import { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, FileText, Search, Trash2, Calendar } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useClinicDocuments, useUploadClinicDocument, useDeleteClinicDocument } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

const docCategories = ["license", "certificate", "contract", "policy", "other"];

export default function DocumentsPage() {
  const { data: documents = [] } = useClinicDocuments();
  const { user } = useAuth();
  const uploadDoc = useUploadClinicDocument();
  const deleteDoc = useDeleteClinicDocument();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [form, setForm] = useState({ title: "", category: "other", expiryDate: "", notes: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const filePickerOpenRef = useRef(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const dialogOpen = searchParams.get("action") === "upload";
  const setDialogOpen = (open: boolean) => {
    if (!open && filePickerOpenRef.current) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (open) next.set("action", "upload");
      else next.delete("action");
      return next;
    }, { replace: true });
  };

  const filtered = documents.filter((d: any) => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || d.category === catFilter;
    return matchSearch && matchCat;
  });

  const expiringSoon = documents.filter((d: any) => {
    if (!d.expiry_date) return false;
    const diff = new Date(d.expiry_date).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  });

  const handleUpload = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    if (!selectedFile || !form.title) return;
    uploadDoc.mutate({
      file: selectedFile,
      title: form.title,
      category: form.category,
      expiryDate: form.expiryDate || undefined,
      notes: form.notes,
      userId: user?.id,
    }, {
      onSuccess: () => {
        setDialogOpen(false);
        setForm({ title: "", category: "other", expiryDate: "", notes: "" });
        setSelectedFile(null);
      },
    });
  };

  return (
    <div className="space-y-6">
       <PageHeader title="Documents" description="Manage clinic licenses, certificates, and policies">
        <Button type="button" onClick={(e) => { e.preventDefault(); setDialogOpen(true); }} className="bg-secondary hover:bg-secondary/90" data-tour="documents-upload">
          <Upload className="mr-2 h-4 w-4" /> Upload Document
        </Button>
      </PageHeader>

      {expiringSoon.length > 0 && (
        <Card className="border-amber-200 bg-amber-50" data-tour="documents-expiring">
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-medium text-amber-800">{expiringSoon.length} document(s) expiring within 30 days</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 flex-wrap" data-tour="documents-filters">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {docCategories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3" data-tour="documents-list">
        {filtered.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No documents found.</CardContent></Card>
        ) : filtered.map((doc: any) => (
          <motion.div key={doc.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass-card">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center"><FileText className="h-5 w-5" /></div>
                    <div>
                      <p className="font-medium text-sm">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] capitalize">{doc.category}</Badge>
                        {doc.expiry_date && (
                          <span className="text-[10px] text-muted-foreground">Expires: {doc.expiry_date}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteDoc.mutate(doc.id)} data-tour="documents-delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">File *</Label>
               <Input
                 ref={fileRef}
                 type="file"
                 accept="application/pdf,image/png,image/jpeg"
                 onPointerDown={() => { filePickerOpenRef.current = true; }}
                 onClick={() => { filePickerOpenRef.current = true; }}
                 {...({ onCancel: () => { filePickerOpenRef.current = false; } } as Record<string, unknown>)}
                 onChange={(e) => {
                   setSelectedFile(e.target.files?.[0] || null);
                   window.setTimeout(() => { filePickerOpenRef.current = false; }, 250);
                 }}
               />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{docCategories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Expiry Date</Label><Input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs">Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={(e) => { e.preventDefault(); setDialogOpen(false); }}>Cancel</Button>
            <Button type="button" onClick={handleUpload} className="bg-secondary hover:bg-secondary/90" disabled={uploadDoc.isPending || !selectedFile}>
              {uploadDoc.isPending ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
