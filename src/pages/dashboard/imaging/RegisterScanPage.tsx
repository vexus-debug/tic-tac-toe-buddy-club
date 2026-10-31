import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useScanPatients, useSaveScanPatient, useCreateScan, MODALITIES } from "@/hooks/scan/useScan";
import { useOrg } from "@/hooks/useOrg";
import { Save } from "lucide-react";

export default function RegisterScanPage() {
  const navigate = useNavigate();
  const { basePath } = useOrg();
  const { data: patients = [] } = useScanPatients();
  const savePatient = useSaveScanPatient();
  const createScan = useCreateScan();

  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [patientId, setPatientId] = useState("");
  const [newPatient, setNewPatient] = useState({ full_name: "", age: "", sex: "", phone: "" });
  const [scan, setScan] = useState({
    modality: MODALITIES[0],
    body_part: "",
    clinical_indication: "",
    referring_doctor: "",
    is_urgent: false,
    price: 0,
  });
  const [makeInvoice, setMakeInvoice] = useState(true);

  const submit = async () => {
    let id = patientId;
    if (mode === "new") {
      if (!newPatient.full_name.trim()) return;
      id = await savePatient.mutateAsync(newPatient as any);
    }
    if (!id) return;
    createScan.mutate(
      { scan: { ...scan, scan_patient_id: id, price: Number(scan.price || 0) } as any, createInvoice: makeInvoice },
      { onSuccess: () => navigate(`${basePath}/imaging/scans`) }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Register Scan" description="Book a patient in for imaging">
        <Button size="sm" onClick={submit} disabled={createScan.isPending || savePatient.isPending}>
          <Save className="mr-2 h-4 w-4" /> Register
        </Button>
      </PageHeader>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Patient</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button size="sm" variant={mode === "existing" ? "default" : "outline"} onClick={() => setMode("existing")}>Existing</Button>
            <Button size="sm" variant={mode === "new" ? "default" : "outline"} onClick={() => setMode("new")}>New patient</Button>
          </div>

          {mode === "existing" ? (
            <div>
              <Label>Select patient</Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger><SelectValue placeholder="Choose a registered patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name} — {p.mrn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Full name</Label>
                <Input value={newPatient.full_name} onChange={(e) => setNewPatient({ ...newPatient, full_name: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={newPatient.phone} onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} />
              </div>
              <div>
                <Label>Age</Label>
                <Input value={newPatient.age} onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })} />
              </div>
              <div>
                <Label>Sex</Label>
                <Select value={newPatient.sex} onValueChange={(v) => setNewPatient({ ...newPatient, sex: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Study</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Modality</Label>
            <Select value={scan.modality} onValueChange={(v) => setScan({ ...scan, modality: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODALITIES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Body part</Label>
            <Input value={scan.body_part} onChange={(e) => setScan({ ...scan, body_part: e.target.value })} />
          </div>
          <div>
            <Label>Referring doctor</Label>
            <Input value={scan.referring_doctor} onChange={(e) => setScan({ ...scan, referring_doctor: e.target.value })} />
          </div>
          <div>
            <Label>Price</Label>
            <Input type="number" value={scan.price} onChange={(e) => setScan({ ...scan, price: Number(e.target.value) })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Clinical indication</Label>
            <Textarea rows={3} value={scan.clinical_indication} onChange={(e) => setScan({ ...scan, clinical_indication: e.target.value })} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm">Mark as urgent</span>
            <Switch checked={scan.is_urgent} onCheckedChange={(v) => setScan({ ...scan, is_urgent: v })} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm">Create invoice</span>
            <Switch checked={makeInvoice} onCheckedChange={setMakeInvoice} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
