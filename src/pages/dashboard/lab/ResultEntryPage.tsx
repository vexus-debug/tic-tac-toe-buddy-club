import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  useTestFormBySerial, useFormItems, useFormResults, useSaveResults,
  useFormAdminAction, useResultAuditLog, useLabSettings,
} from "@/hooks/lab/useLab";
import { getTemplate, isOutOfRange } from "@/config/testTemplates";
import { useOrg } from "@/hooks/useOrg";
import { toast } from "@/hooks/use-toast";
import { Printer, Save, CheckCircle2, ShieldCheck, RotateCcw, Trash2, Lock } from "lucide-react";

type Values = Record<string, Record<string, any>>;

export default function ResultEntryPage() {
  const { serial } = useParams<{ serial: string }>();
  const { currentOrg } = useOrg();
  const isAdmin = currentOrg?.role === "owner" || (currentOrg?.role === "admin" || currentOrg?.role === "manager");

  const { data: form } = useTestFormBySerial(serial);
  const { data: items = [] } = useFormItems(form?.id);
  const { data: saved = [] } = useFormResults(form?.id);
  const { data: audit = [] } = useResultAuditLog(form?.id);
  const { data: settings } = useLabSettings();
  const save = useSaveResults();
  const admin = useFormAdminAction();

  const [values, setValues] = useState<Values>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const draftKey = `lab-draft:${serial}`;

  // Load DB results, then a newer localStorage draft if present
  useEffect(() => {
    if (!form) return;
    const v: Values = {};
    const c: Record<string, string> = {};
    saved.forEach((r) => {
      if (!r.item_id) return;
      v[r.item_id] = r.values || {};
      c[r.item_id] = r.comment || "";
    });
    let dbTime = 0;
    saved.forEach((r) => { dbTime = Math.max(dbTime, new Date(r.updated_at || 0).getTime()); });
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const d = JSON.parse(raw);
        if ((d.savedAt || 0) > dbTime) {
          setValues(d.values || v);
          setComments(d.comments || c);
          toast({ title: "Draft restored", description: "A newer local draft was loaded." });
          return;
        }
      }
    } catch { /* ignore */ }
    setValues(v);
    setComments(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form?.id, saved.length]);

  // Auto-save draft
  useEffect(() => {
    if (!form || form.is_locked) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(draftKey, JSON.stringify({ values, comments, savedAt: Date.now() })); } catch { /* ignore */ }
    }, 800);
    return () => clearTimeout(t);
  }, [values, comments, form, draftKey]);

  const setField = (itemId: string, key: string, val: any) =>
    setValues((prev) => ({ ...prev, [itemId]: { ...(prev[itemId] || {}), [key]: val } }));

  const flagged = useMemo(() => {
    let n = 0;
    items.forEach((it) => {
      getTemplate(it.test_name).forEach((f) => {
        if (isOutOfRange(f, values[it.id]?.[f.key])) n++;
      });
    });
    return n;
  }, [items, values]);

  const persist = async (status: "processing" | "completed") => {
    if (!form) return;
    await save.mutateAsync({
      form,
      status,
      results: items.map((it) => ({
        item_id: it.id, test_name: it.test_name,
        values: values[it.id] || {}, comment: comments[it.id] || "",
      })),
    });
    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
  };

  if (!form) {
    return <div className="p-6 text-muted-foreground">Loading form…</div>;
  }

  const locked = form.is_locked;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Result Entry — ${form.serial}`}
        description={`${form.patient_name} • ${form.patient_age || "—"} • ${form.patient_sex || "—"} • ${form.specimen || "no specimen"}`}
        badge={<Badge className="capitalize">{form.status}</Badge>}
      >
        <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
        <Button size="sm" variant="outline" disabled={locked || save.isPending} onClick={() => persist("processing")}>
          <Save className="mr-2 h-4 w-4" /> Save Draft
        </Button>
        <Button size="sm" disabled={locked || save.isPending} onClick={() => persist("completed")}>
          <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Completed
        </Button>
      </PageHeader>

      {locked && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <Lock className="h-4 w-4 text-amber-500" /> This form is approved and locked. Reopen it to make changes.
        </div>
      )}
      {flagged > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {flagged} value{flagged > 1 ? "s" : ""} outside the reference range.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((it) => {
            const fields = getTemplate(it.test_name);
            return (
              <Card key={it.id} className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{it.test_name}</CardTitle>
                  {it.category_name && <p className="text-xs text-muted-foreground">{it.category_name}</p>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {fields.map((f) => {
                      const val = values[it.id]?.[f.key] ?? "";
                      const bad = isOutOfRange(f, val);
                      return (
                        <div key={f.key} className="space-y-1">
                          <Label className="text-xs">
                            {f.label} {f.unit && <span className="text-muted-foreground">({f.unit})</span>}
                          </Label>
                          {f.type === "select" ? (
                            <Select value={String(val)} onValueChange={(v) => setField(it.id, f.key, v)} disabled={locked}>
                              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {(f.options || []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              disabled={locked}
                              type={f.type === "text" ? "text" : "number"}
                              value={val}
                              onChange={(e) => setField(it.id, f.key, e.target.value)}
                              className={bad ? "border-destructive text-destructive" : ""}
                            />
                          )}
                          {f.range && <p className={`text-[11px] ${bad ? "text-destructive" : "text-muted-foreground"}`}>Ref: {f.range}</p>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Comment</Label>
                    <Textarea
                      rows={2} disabled={locked}
                      value={comments[it.id] || ""}
                      onChange={(e) => setComments((c) => ({ ...c, [it.id]: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {items.length === 0 && <p className="text-sm text-muted-foreground">No tests on this form.</p>}
        </div>

        <div className="space-y-4">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Report Preview</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold">{currentOrg?.org_name}</p>
                <p className="text-xs text-muted-foreground">Serial {form.serial}</p>
              </div>
              {items.map((it) => (
                <div key={it.id}>
                  <p className="font-medium">{it.test_name}</p>
                  {getTemplate(it.test_name).map((f) => {
                    const v = values[it.id]?.[f.key];
                    if (v === undefined || v === "") return null;
                    const bad = isOutOfRange(f, v);
                    return (
                      <div key={f.key} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{f.label}</span>
                        <span className={bad ? "font-semibold text-destructive" : ""}>{v} {f.unit || ""}</span>
                      </div>
                    );
                  })}
                  {comments[it.id] && <p className="text-[11px] italic text-muted-foreground">{comments[it.id]}</p>}
                </div>
              ))}
              {settings?.report_footer && <p className="pt-2 text-[11px] text-muted-foreground">{settings.report_footer}</p>}
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">Admin Actions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Reason (for reopen / delete)" value={reason} onChange={(e) => setReason(e.target.value)} />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={locked} onClick={() => admin.mutate({ form, action: "approve" })}>
                    <ShieldCheck className="mr-2 h-4 w-4" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" disabled={!reason} onClick={() => admin.mutate({ form, action: "reopen", reason })}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Reopen
                  </Button>
                  <Button size="sm" variant="destructive" disabled={!reason} onClick={() => admin.mutate({ form, action: "delete", reason })}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Audit Trail</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {audit.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
              {audit.map((a: any) => (
                <div key={a.id} className="text-xs border-b border-border/30 pb-1.5 last:border-0">
                  <span className="capitalize font-medium">{String(a.action).replace("_", " ")}</span>
                  {a.reason && <span className="text-muted-foreground"> — {a.reason}</span>}
                  <div className="text-[11px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
