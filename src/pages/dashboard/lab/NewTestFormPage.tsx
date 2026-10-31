import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useTestCategories, useLabTests, useCreateTestForm } from "@/hooks/lab/useLab";
import { LAB_TEST_MENU } from "@/config/labTestMenu";
import { useOrg } from "@/hooks/useOrg";
import { Save } from "lucide-react";

interface Selectable { key: string; test_id: string | null; name: string; category: string; price: number }

export default function NewTestFormPage() {
  const navigate = useNavigate();
  const { basePath } = useOrg();
  const { data: categories = [] } = useTestCategories();
  const { data: tests = [] } = useLabTests();
  const create = useCreateTestForm();

  const [form, setForm] = useState<any>({
    patient_name: "", patient_age: "", patient_sex: "", patient_phone: "",
    referring_doctor: "", referring_institution: "", specimen: "",
    billing_type: "patient", billing_entity: "", clinical_notes: "",
  });
  const [selected, setSelected] = useState<Record<string, Selectable>>({});
  const [makeInvoice, setMakeInvoice] = useState(true);

  const groups = useMemo(() => {
    if (tests.length && categories.length) {
      return categories.map((c) => ({
        name: c.name,
        items: tests
          .filter((t) => t.category_id === c.id && t.is_active !== false)
          .map<Selectable>((t) => ({ key: t.id, test_id: t.id, name: t.name, category: c.name, price: Number(t.price || 0) })),
      })).filter((g) => g.items.length);
    }
    return LAB_TEST_MENU.map((c) => ({
      name: c.name,
      items: c.tests.map<Selectable>((t) => ({ key: `${c.name}:${t.name}`, test_id: null, name: t.name, category: c.name, price: t.price || 0 })),
    }));
  }, [tests, categories]);

  const chosen = Object.values(selected);
  const total = chosen.reduce((s, i) => s + i.price, 0);

  const toggle = (item: Selectable) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[item.key]) delete next[item.key];
      else next[item.key] = item;
      return next;
    });
  };

  const submit = async () => {
    const created = await create.mutateAsync({
      form,
      items: chosen.map((c) => ({ test_id: c.test_id, test_name: c.name, category_name: c.category, price: c.price })),
      createInvoice: makeInvoice,
    });
    navigate(`${basePath}/diagnostics/forms/${created.serial}`);
  };

  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <PageHeader title="New Test Form" description="Serial is generated automatically on save">
        <Button size="sm" onClick={submit} disabled={!form.patient_name || chosen.length === 0 || create.isPending}>
          <Save className="mr-2 h-4 w-4" /> Create Form
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Patient & Request Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Patient Name *</Label>
              <Input value={form.patient_name} onChange={set("patient_name")} placeholder="Full name" />
            </div>
            <div className="space-y-1.5"><Label>Age</Label><Input value={form.patient_age} onChange={set("patient_age")} placeholder="e.g. 34" /></div>
            <div className="space-y-1.5">
              <Label>Sex</Label>
              <Select value={form.patient_sex} onValueChange={(v) => setForm((f: any) => ({ ...f, patient_sex: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.patient_phone} onChange={set("patient_phone")} /></div>
            <div className="space-y-1.5"><Label>Specimen</Label><Input value={form.specimen} onChange={set("specimen")} placeholder="Blood, Urine…" /></div>
            <div className="space-y-1.5"><Label>Referring Doctor</Label><Input value={form.referring_doctor} onChange={set("referring_doctor")} /></div>
            <div className="space-y-1.5"><Label>Referring Institution</Label><Input value={form.referring_institution} onChange={set("referring_institution")} /></div>
            <div className="space-y-1.5">
              <Label>Billing</Label>
              <Select value={form.billing_type} onValueChange={(v) => setForm((f: any) => ({ ...f, billing_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="clinic">Clinic</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Billing Entity</Label><Input value={form.billing_entity} onChange={set("billing_entity")} placeholder="Clinic / company name" /></div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Clinical Notes</Label>
              <Textarea value={form.clinical_notes} onChange={set("clinical_notes")} rows={3} />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2 rounded-lg border p-3">
              <Switch checked={makeInvoice} onCheckedChange={setMakeInvoice} />
              <div>
                <p className="text-sm font-medium">Create invoice</p>
                <p className="text-xs text-muted-foreground">Raises an unpaid invoice linked to this form.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card h-fit">
          <CardHeader><CardTitle className="text-base">Selected Tests ({chosen.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {chosen.length === 0 && <p className="text-sm text-muted-foreground">Pick tests from the menu below.</p>}
            {chosen.map((c) => (
              <div key={c.key} className="flex items-center justify-between text-sm border-b border-border/30 pb-1.5 last:border-0">
                <span className="truncate pr-2">{c.name}</span>
                <span className="shrink-0 text-muted-foreground">₦{c.price.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 font-semibold">
              <span>Total</span><span>₦{total.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Test Menu</CardTitle></CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((g) => (
            <div key={g.name} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary">{g.name}</p>
              {g.items.map((item) => (
                <label key={item.key} className="flex items-start gap-2 text-sm cursor-pointer">
                  <Checkbox checked={!!selected[item.key]} onCheckedChange={() => toggle(item)} className="mt-0.5" />
                  <span className="flex-1">{item.name}</span>
                  <span className="text-xs text-muted-foreground">₦{item.price.toLocaleString()}</span>
                </label>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
