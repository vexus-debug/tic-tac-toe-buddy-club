import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Upload, Trash2, Tag, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

const db = supabase as any;

export type Contact = {
  id: string; email: string; first_name: string | null; last_name: string | null; phone: string | null;
  clinic_name: string | null; city: string | null; specialty: string | null; tags: string[]; status: string;
  notes: string | null; emails_sent: number; opens: number; clicks: number;
  last_contacted_at: string | null; last_engaged_at: string | null; created_at: string;
};

export const CONTACT_STATUSES = ["new", "contacted", "engaged", "lead", "customer", "unsubscribed", "bounced"] as const;
export const SPECIALTIES = ["dental", "eye", "diagnostic", "dental_lab", "general", "other"];
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  new: "outline", contacted: "secondary", engaged: "default", lead: "default", customer: "default", unsubscribed: "destructive", bounced: "destructive",
};

/** Loads every contact (paged past the 1000-row limit). */
export async function fetchAllContacts(): Promise<Contact[]> {
  const out: Contact[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("outreach_contacts").select("*").order("created_at", { ascending: false }).range(from, from + 999);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

export const contactsQuery = { queryKey: ["outreach-contacts"], queryFn: fetchAllContacts };

/** Turns parsed CSV rows into contact rows (lowercased email, split name). */
export function toContactRows(rows: Record<string, string>[], extraTags: string[] = []) {
  const m = new Map<string, Record<string, unknown>>();
  for (const r of rows) {
    const email = r.email.toLowerCase();
    const [fn, ...ln] = (r.name ?? "").split(" ");
    m.set(email, {
      email,
      first_name: r.first_name || fn || null,
      last_name: r.last_name || ln.join(" ") || null,
      phone: r.phone || null, clinic_name: r.clinic_name || r.clinic || null, city: r.city || null,
      specialty: r.specialty || r.type || null,
      tags: [...new Set([...(r.tags ? r.tags.split("|").map((t) => t.trim()).filter(Boolean) : []), ...extraTags])],
    });
  }
  return [...m.values()];
}

/** Adds new contacts and fills blanks on existing ones without overwriting their status or history. */
export async function importContacts(rows: Record<string, unknown>[]) {
  let added = 0, updated = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const emails = chunk.map((r) => r.email as string);
    const { data: existing } = await db.from("outreach_contacts").select("*").in("email", emails);
    const byEmail = new Map<string, Contact>((existing ?? []).map((c: Contact) => [c.email, c]));
    const { data: u } = await supabase.auth.getUser();
    const fresh = chunk.filter((r) => !byEmail.has(r.email as string)).map((r) => ({ ...r, created_by: u.user?.id }));
    if (fresh.length) { const { error } = await db.from("outreach_contacts").insert(fresh); if (error) throw error; added += fresh.length; }
    for (const r of chunk) {
      const c = byEmail.get(r.email as string); if (!c) continue;
      const patch: Record<string, unknown> = {};
      for (const k of ["first_name", "last_name", "phone", "clinic_name", "city", "specialty"] as const) if (!c[k] && r[k]) patch[k] = r[k];
      const tags = [...new Set([...(c.tags ?? []), ...((r.tags as string[]) ?? [])])];
      if (tags.length !== (c.tags ?? []).length) patch.tags = tags;
      if (Object.keys(patch).length) { await db.from("outreach_contacts").update(patch).eq("id", c.id); updated++; }
    }
  }
  return { added, updated };
}

export default function OutreachContacts({ parseAudience }: { parseAudience: (raw: string) => Record<string, string>[] }) {
  const qc = useQueryClient();
  const { data: contacts = [], isLoading } = useQuery(contactsQuery);
  const [status, setStatus] = useState("all");
  const [tag, setTag] = useState("all");
  const [specialty, setSpecialty] = useState("all");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [editing, setEditing] = useState<Partial<Contact> | null>(null);
  const [bulkTag, setBulkTag] = useState("");

  const allTags = useMemo(() => [...new Set(contacts.flatMap((c) => c.tags ?? []))].sort(), [contacts]);
  const counts = useMemo(() => {
    const m: Record<string, number> = { all: contacts.length };
    for (const c of contacts) m[c.status] = (m[c.status] ?? 0) + 1;
    return m;
  }, [contacts]);
  const list = useMemo(() => contacts.filter((c) =>
    (status === "all" || c.status === status) && (tag === "all" || c.tags?.includes(tag)) &&
    (specialty === "all" || c.specialty === specialty) &&
    (!search || [c.email, c.first_name, c.last_name, c.clinic_name, c.city].some((v) => v?.toLowerCase().includes(search.toLowerCase())))
  ), [contacts, status, tag, specialty, search]);
  const refresh = () => qc.invalidateQueries({ queryKey: ["outreach-contacts"] });

  const bulk = async (patch: (c: Contact) => Record<string, unknown> | null, msg: string) => {
    const targets = contacts.filter((c) => picked.has(c.id));
    for (const c of targets) { const p = patch(c); if (p) await db.from("outreach_contacts").update(p).eq("id", c.id); }
    toast({ title: msg }); setPicked(new Set()); refresh();
  };
  const bulkDelete = async () => {
    if (!confirm(`Delete ${picked.size} contact(s)? Their campaign history stays.`)) return;
    const ids = [...picked];
    for (let i = 0; i < ids.length; i += 200) await db.from("outreach_contacts").delete().in("id", ids.slice(i, i + 200));
    toast({ title: "Contacts deleted" }); setPicked(new Set()); refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {["all", ...CONTACT_STATUSES].map((s) => (
          <Button key={s} size="sm" variant={s === status ? "default" : "outline"} className="capitalize h-8" onClick={() => setStatus(s)}>
            {s} <span className="ml-1.5 text-xs opacity-70">{counts[s] ?? 0}</span>
          </Button>
        ))}
      </div>
      <Card><CardContent className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Input className="max-w-xs" placeholder="Search name, email, clinic, city…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={tag} onValueChange={setTag}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Tag" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All tags</SelectItem>{allTags.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={specialty} onValueChange={setSpecialty}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All types</SelectItem>{SPECIALTIES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => setEditing({ tags: [], status: "new" })}><UserPlus className="h-4 w-4 mr-1" />Add contact</Button>
          <Button onClick={() => setImporting(true)}><Upload className="h-4 w-4 mr-1" />Import CSV</Button>
        </div>
        {picked.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted p-2 text-sm">
            <b>{picked.size} selected</b>
            <Input className="h-8 w-40" placeholder="Tag name" value={bulkTag} onChange={(e) => setBulkTag(e.target.value)} />
            <Button size="sm" variant="outline" disabled={!bulkTag.trim()} onClick={() => bulk((c) => ({ tags: [...new Set([...(c.tags ?? []), bulkTag.trim()])] }), "Tag added")}><Tag className="h-3.5 w-3.5 mr-1" />Add tag</Button>
            <Button size="sm" variant="outline" disabled={!bulkTag.trim()} onClick={() => bulk((c) => ({ tags: (c.tags ?? []).filter((t) => t !== bulkTag.trim()) }), "Tag removed")}>Remove tag</Button>
            <Select onValueChange={(s) => bulk(() => ({ status: s }), `Marked as ${s}`)}>
              <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Set status" /></SelectTrigger>
              <SelectContent>{CONTACT_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={bulkDelete}><Trash2 className="h-3.5 w-3.5 mr-1 text-destructive" />Delete</Button>
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="w-8"><Checkbox checked={list.length > 0 && list.every((c) => picked.has(c.id))} onCheckedChange={(v) => setPicked(v ? new Set(list.map((c) => c.id)) : new Set())} /></TableHead>
              <TableHead>Contact</TableHead><TableHead>Clinic</TableHead><TableHead>Status</TableHead><TableHead>Tags</TableHead>
              <TableHead>Sent / Opens / Clicks</TableHead><TableHead>Last contacted</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {list.slice(0, 500).map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setEditing(c)}>
                  <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={picked.has(c.id)} onCheckedChange={(v) => { const n = new Set(picked); v ? n.add(c.id) : n.delete(c.id); setPicked(n); }} /></TableCell>
                  <TableCell><p className="font-medium">{[c.first_name, c.last_name].filter(Boolean).join(" ") || "—"}</p><p className="text-xs text-muted-foreground">{c.email}</p></TableCell>
                  <TableCell><p className="text-sm">{c.clinic_name ?? "—"}</p><p className="text-xs text-muted-foreground capitalize">{[c.specialty?.replace("_", " "), c.city].filter(Boolean).join(" · ")}</p></TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[c.status] ?? "outline"} className="capitalize">{c.status}</Badge></TableCell>
                  <TableCell><div className="flex flex-wrap gap-1 max-w-48">{(c.tags ?? []).map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}</div></TableCell>
                  <TableCell className="text-sm">{c.emails_sent} / {c.opens} / {c.clicks}</TableCell>
                  <TableCell className="text-xs">{c.last_contacted_at ? format(new Date(c.last_contacted_at), "MMM d, yyyy") : "Never"}</TableCell>
                </TableRow>
              ))}
              {list.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">{isLoading ? "Loading…" : "No contacts here yet. Import a CSV to get started."}</TableCell></TableRow>}
            </TableBody>
          </Table>
          {list.length > 500 && <p className="text-xs text-muted-foreground p-2">Showing 500 of {list.length}. Narrow with search or filters.</p>}
        </div>
      </CardContent></Card>

      {importing && <ImportDialog parseAudience={parseAudience} onClose={() => { setImporting(false); refresh(); }} />}
      {editing && <ContactDialog initial={editing} onClose={() => { setEditing(null); refresh(); }} />}
    </div>
  );
}

function ImportDialog({ parseAudience, onClose }: { parseAudience: (raw: string) => Record<string, string>[]; onClose: () => void }) {
  const [raw, setRaw] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const rows = useMemo(() => toContactRows(parseAudience(raw), tags.split(",").map((t) => t.trim()).filter(Boolean)), [raw, tags, parseAudience]);
  const run = async () => {
    setBusy(true);
    try { const r = await importContacts(rows); toast({ title: `${r.added} new contact(s) added`, description: `${r.updated} existing contact(s) updated.` }); onClose(); }
    catch (e) { toast({ title: "Import failed", description: (e as Error).message, variant: "destructive" }); }
    finally { setBusy(false); }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Import contacts</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Columns: email, name (or first_name, last_name), phone, clinic_name, city, specialty, tags (separate with |). Existing emails are matched, not duplicated.</p>
        <Input type="file" accept=".csv,text/csv,text/plain" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setRaw(await f.text()); }} />
        <Textarea rows={8} value={raw} onChange={(e) => setRaw(e.target.value)} className="font-mono text-xs" placeholder={"email,name,clinic_name,city,specialty\nada@clinic.ng,Ada Obi,Bright Smile Dental,Lagos,dental"} />
        <div><Label>Tag everyone in this import (comma separated)</Label><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Lagos-Dentists, Expo-2026" /></div>
        <div className="flex justify-between items-center">
          <Badge>{rows.length} valid contact(s)</Badge>
          <Button disabled={busy || !rows.length} onClick={run}>Import</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContactDialog({ initial, onClose }: { initial: Partial<Contact>; onClose: () => void }) {
  const [c, setC] = useState<Partial<Contact>>(initial);
  const [tagInput, setTagInput] = useState("");
  const set = (k: keyof Contact, v: unknown) => setC((p) => ({ ...p, [k]: v }));
  const { data: history = [] } = useQuery({
    queryKey: ["outreach-contact-history", c.id], enabled: !!c.id,
    queryFn: async () => ((await db.from("outreach_recipients").select("id,status,sent_at,open_count,click_count,outreach_campaigns(name)").eq("contact_id", c.id).order("created_at", { ascending: false })).data ?? []) as any[],
  });
  const save = async () => {
    const email = c.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast({ title: "Enter a valid email", variant: "destructive" }); return; }
    const payload = { email, first_name: c.first_name || null, last_name: c.last_name || null, phone: c.phone || null, clinic_name: c.clinic_name || null,
      city: c.city || null, specialty: c.specialty || null, tags: c.tags ?? [], status: c.status ?? "new", notes: c.notes || null };
    const { error } = c.id ? await db.from("outreach_contacts").update(payload).eq("id", c.id) : await db.from("outreach_contacts").insert(payload);
    if (error) { toast({ title: "Could not save", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Contact saved" }); onClose();
  };
  const remove = async () => { if (!c.id || !confirm("Delete this contact?")) return; await db.from("outreach_contacts").delete().eq("id", c.id); onClose(); };
  const field = (k: keyof Contact, label: string) => <div><Label>{label}</Label><Input value={(c[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} /></div>;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{c.id ? "Contact" : "Add contact"}</DialogTitle></DialogHeader>
        <div className="grid sm:grid-cols-2 gap-3">
          {field("email", "Email")}{field("phone", "Phone")}{field("first_name", "First name")}{field("last_name", "Last name")}
          {field("clinic_name", "Clinic")}{field("city", "City")}
          <div><Label>Type</Label>
            <Select value={c.specialty ?? ""} onValueChange={(v) => set("specialty", v)}>
              <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
              <SelectContent>{SPECIALTIES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select></div>
          <div><Label>Status</Label>
            <Select value={c.status ?? "new"} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CONTACT_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select></div>
          <div className="sm:col-span-2"><Label>Tags</Label>
            <div className="flex flex-wrap gap-1 mb-2">{(c.tags ?? []).map((t) => <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => set("tags", (c.tags ?? []).filter((x) => x !== t))}>{t} ×</Badge>)}</div>
            <Input value={tagInput} placeholder="Type a tag and press Enter" onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && tagInput.trim()) { e.preventDefault(); set("tags", [...new Set([...(c.tags ?? []), tagInput.trim()])]); setTagInput(""); } }} /></div>
          <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={3} value={c.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></div>
        </div>
        {c.id && (
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">Campaign history</h3>
            {history.length === 0 ? <p className="text-xs text-muted-foreground">Not emailed yet.</p> : history.map((h) => (
              <p key={h.id} className="text-xs"><b>{h.outreach_campaigns?.name ?? "Campaign"}</b> · <span className="capitalize">{h.status}</span> · {h.open_count} opens · {h.click_count} clicks {h.sent_at ? `· ${format(new Date(h.sent_at), "MMM d")}` : ""}</p>
            ))}
          </div>
        )}
        <div className="flex justify-between pt-2 border-t">
          {c.id ? <Button variant="ghost" onClick={remove}><Trash2 className="h-4 w-4 mr-1 text-destructive" />Delete</Button> : <span />}
          <Button onClick={save}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
