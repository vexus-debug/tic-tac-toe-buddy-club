import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  useFrames, useSaveFrame, useDeleteFrame, useLenses, useSaveLens, useDeleteLens, useAdjustStock,
  FRAME_MATERIALS, type EyeFrame, type EyeLens,
} from "@/hooks/eye/useEyeOps";
import { LENS_TYPES, LENS_COATINGS } from "@/hooks/eye/useEye";
import { AlertTriangle, Minus, Plus, Trash2, Glasses, Search } from "lucide-react";

const ALL = "__all";
const n = (v: any) => (v === "" || v === null || v === undefined ? 0 : Number(v));

function StockControl({ qty, low, onChange }: { qty: number; low: boolean; onChange: (q: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => onChange(qty - 1)} aria-label="One less"><Minus className="h-3 w-3" /></Button>
      <span className={`w-8 text-center text-sm font-semibold ${low ? "text-destructive" : ""}`}>{qty}</span>
      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => onChange(qty + 1)} aria-label="One more"><Plus className="h-3 w-3" /></Button>
    </div>
  );
}

export default function FrameLensStockPage() {
  const { data: frames = [] } = useFrames();
  const { data: lenses = [] } = useLenses();
  const saveFrame = useSaveFrame(); const delFrame = useDeleteFrame();
  const saveLens = useSaveLens(); const delLens = useDeleteLens();
  const adjFrame = useAdjustStock("eye_frames"); const adjLens = useAdjustStock("eye_lens_stock");

  const [q, setQ] = useState("");
  const [brand, setBrand] = useState(ALL);
  const [colour, setColour] = useState(ALL);
  const [size, setSize] = useState(ALL);
  const [lowOnly, setLowOnly] = useState(false);

  const [frameForm, setFrameForm] = useState<Partial<EyeFrame> | null>(null);
  const [lensForm, setLensForm] = useState<Partial<EyeLens> | null>(null);

  const uniq = (k: keyof EyeFrame) => Array.from(new Set(frames.map((f) => f[k]).filter(Boolean))) as string[];
  const brands = uniq("brand"), colours = uniq("colour"), sizes = uniq("size");

  const lowFrames = frames.filter((f) => f.quantity <= f.reorder_level);
  const lowLenses = lenses.filter((l) => l.quantity <= l.reorder_level);

  const visibleFrames = useMemo(() => frames.filter((f) => {
    const t = q.toLowerCase();
    if (t && ![f.brand, f.model, f.colour, f.sku].join(" ").toLowerCase().includes(t)) return false;
    if (brand !== ALL && f.brand !== brand) return false;
    if (colour !== ALL && f.colour !== colour) return false;
    if (size !== ALL && f.size !== size) return false;
    if (lowOnly && f.quantity > f.reorder_level) return false;
    return true;
  }), [frames, q, brand, colour, size, lowOnly]);

  const byBrand = useMemo(() => {
    const m = new Map<string, EyeFrame[]>();
    visibleFrames.forEach((f) => m.set(f.brand, [...(m.get(f.brand) || []), f]));
    return Array.from(m.entries());
  }, [visibleFrames]);

  const submitFrame = async () => {
    if (!frameForm?.brand) return;
    await saveFrame.mutateAsync({ ...frameForm, quantity: n(frameForm.quantity), reorder_level: n(frameForm.reorder_level ?? 2),
      cost_price: n(frameForm.cost_price), sell_price: n(frameForm.sell_price) });
    setFrameForm(null);
  };
  const submitLens = async () => {
    if (!lensForm?.lens_type) return;
    await saveLens.mutateAsync({ ...lensForm, quantity: n(lensForm.quantity), reorder_level: n(lensForm.reorder_level ?? 4),
      cost_price: n(lensForm.cost_price), sell_price: n(lensForm.sell_price) });
    setLensForm(null);
  };

  const ff = (k: keyof EyeFrame, v: any) => setFrameForm((f) => ({ ...f, [k]: v }));
  const lf = (k: keyof EyeLens, v: any) => setLensForm((f) => ({ ...f, [k]: v }));
  const stockValue = frames.reduce((s, f) => s + f.quantity * n(f.sell_price), 0) + lenses.reduce((s, l) => s + l.quantity * n(l.sell_price), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Frames & Lenses" description="Shop-floor stock of frames and lenses, with low-stock alerts" />

      <div className="grid gap-3 sm:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Frames in stock</p><p className="text-2xl font-semibold">{frames.reduce((s, f) => s + f.quantity, 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Lens pairs in stock</p><p className="text-2xl font-semibold">{lenses.reduce((s, l) => s + l.quantity, 0)}</p></CardContent></Card>
        <Card className={lowFrames.length + lowLenses.length ? "border-destructive/50" : ""}><CardContent className="p-4"><p className="text-xs text-muted-foreground">Low-stock items</p><p className="text-2xl font-semibold text-destructive">{lowFrames.length + lowLenses.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Stock value (selling)</p><p className="text-2xl font-semibold">₦{stockValue.toLocaleString()}</p></CardContent></Card>
      </div>

      {(lowFrames.length > 0 || lowLenses.length > 0) && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-wrap items-start gap-2 p-4 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="font-medium">Reorder soon:</span>
            {lowFrames.map((f) => <Badge key={f.id} variant="destructive">{f.brand} {f.model} {f.colour} ({f.quantity})</Badge>)}
            {lowLenses.map((l) => <Badge key={l.id} variant="destructive">{l.lens_type} {l.lens_index} ({l.quantity})</Badge>)}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="frames">
        <TabsList><TabsTrigger value="frames">Frames</TabsTrigger><TabsTrigger value="lenses">Lenses</TabsTrigger></TabsList>

        <TabsContent value="frames" className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="relative min-w-[180px] flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search brand, model, code…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {[["Brand", brand, setBrand, brands], ["Colour", colour, setColour, colours], ["Size", size, setSize, sizes]].map(([label, val, set, opts]: any) => (
              <Select key={label} value={val} onValueChange={set}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder={label} /></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>All {label.toLowerCase()}s</SelectItem>{opts.map((o: string) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            ))}
            <Button variant={lowOnly ? "default" : "outline"} onClick={() => setLowOnly(!lowOnly)}>Low stock only</Button>
            <Button onClick={() => setFrameForm({ reorder_level: 2, quantity: 1 })}><Plus className="mr-1 h-4 w-4" /> Add frame</Button>
          </div>

          {byBrand.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No frames yet. Add your first frame to start tracking stock.</p>}
          {byBrand.map(([b, items]) => (
            <div key={b} className="space-y-2">
              <p className="text-sm font-semibold">{b} <span className="text-muted-foreground">· {items.reduce((s, i) => s + i.quantity, 0)} pcs</span></p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((f) => {
                  const low = f.quantity <= f.reorder_level;
                  return (
                    <Card key={f.id} className={low ? "border-destructive/50" : ""}>
                      <CardContent className="space-y-2 p-3">
                        <button className="w-full text-left" onClick={() => setFrameForm(f)}>
                          <p className="flex items-center gap-1.5 text-sm font-medium"><Glasses className="h-3.5 w-3.5" /> {f.model || "—"}</p>
                          <p className="text-xs text-muted-foreground">{[f.colour, f.size, f.material].filter(Boolean).join(" · ") || "No details"}</p>
                        </button>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">₦{n(f.sell_price).toLocaleString()}</span>
                          {low && <Badge variant="destructive" className="text-[10px]">Low</Badge>}
                          <StockControl qty={f.quantity} low={low} onChange={(qty) => adjFrame.mutate({ id: f.id, quantity: qty })} />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="lenses" className="space-y-3">
          <div className="flex justify-end"><Button onClick={() => setLensForm({ reorder_level: 4, quantity: 1 })}><Plus className="mr-1 h-4 w-4" /> Add lens stock</Button></div>
          {lenses.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No lens stock yet.</p>}
          {LENS_TYPES.concat(lenses.map((l) => l.lens_type).filter((t) => !LENS_TYPES.includes(t))).filter((t, i, a) => a.indexOf(t) === i).map((type) => {
            const items = lenses.filter((l) => l.lens_type === type);
            if (!items.length) return null;
            return (
              <Card key={type}><CardContent className="space-y-2 p-3">
                <p className="text-sm font-semibold">{type}</p>
                {items.map((l) => {
                  const low = l.quantity <= l.reorder_level;
                  return (
                    <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/40 px-3 py-2">
                      <button className="flex-1 text-left text-sm" onClick={() => setLensForm(l)}>
                        {[l.lens_index && `Index ${l.lens_index}`, l.coating, l.power_range].filter(Boolean).join(" · ") || "Standard"}
                        <span className="ml-2 text-xs text-muted-foreground">₦{n(l.sell_price).toLocaleString()}</span>
                      </button>
                      {low && <Badge variant="destructive" className="text-[10px]">Low</Badge>}
                      <StockControl qty={l.quantity} low={low} onChange={(qty) => adjLens.mutate({ id: l.id, quantity: qty })} />
                    </div>
                  );
                })}
              </CardContent></Card>
            );
          })}
        </TabsContent>
      </Tabs>

      <Dialog open={!!frameForm} onOpenChange={(o) => !o && setFrameForm(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{frameForm?.id ? "Edit frame" : "Add frame"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Brand *</Label><Input value={frameForm?.brand || ""} onChange={(e) => ff("brand", e.target.value)} /></div>
            <div><Label>Model</Label><Input value={frameForm?.model || ""} onChange={(e) => ff("model", e.target.value)} /></div>
            <div><Label>Colour</Label><Input value={frameForm?.colour || ""} onChange={(e) => ff("colour", e.target.value)} /></div>
            <div><Label>Size (e.g. 52-18-140)</Label><Input value={frameForm?.size || ""} onChange={(e) => ff("size", e.target.value)} /></div>
            <div><Label>Material</Label>
              <Select value={frameForm?.material || ""} onValueChange={(v) => ff("material", v)}>
                <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>{FRAME_MATERIALS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Code / SKU</Label><Input value={frameForm?.sku || ""} onChange={(e) => ff("sku", e.target.value)} /></div>
            <div><Label>Cost price</Label><Input type="number" value={frameForm?.cost_price ?? ""} onChange={(e) => ff("cost_price", e.target.value)} /></div>
            <div><Label>Selling price</Label><Input type="number" value={frameForm?.sell_price ?? ""} onChange={(e) => ff("sell_price", e.target.value)} /></div>
            <div><Label>Quantity</Label><Input type="number" value={frameForm?.quantity ?? ""} onChange={(e) => ff("quantity", e.target.value)} /></div>
            <div><Label>Alert when at or below</Label><Input type="number" value={frameForm?.reorder_level ?? ""} onChange={(e) => ff("reorder_level", e.target.value)} /></div>
          </div>
          <DialogFooter className="gap-2">
            {frameForm?.id && <Button variant="ghost" onClick={() => { delFrame.mutate(frameForm.id!); setFrameForm(null); }}><Trash2 className="mr-1 h-4 w-4" /> Remove</Button>}
            <Button onClick={submitFrame} disabled={!frameForm?.brand || saveFrame.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!lensForm} onOpenChange={(o) => !o && setLensForm(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{lensForm?.id ? "Edit lens stock" : "Add lens stock"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Lens type *</Label>
              <Select value={lensForm?.lens_type || ""} onValueChange={(v) => lf("lens_type", v)}>
                <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>{LENS_TYPES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Index (e.g. 1.56)</Label><Input value={lensForm?.lens_index || ""} onChange={(e) => lf("lens_index", e.target.value)} /></div>
            <div><Label>Coating</Label>
              <Select value={lensForm?.coating || ""} onValueChange={(v) => lf("coating", v)}>
                <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>{LENS_COATINGS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Power range</Label><Input placeholder="-6.00 to +4.00" value={lensForm?.power_range || ""} onChange={(e) => lf("power_range", e.target.value)} /></div>
            <div><Label>Supplier</Label><Input value={lensForm?.supplier || ""} onChange={(e) => lf("supplier", e.target.value)} /></div>
            <div><Label>Selling price</Label><Input type="number" value={lensForm?.sell_price ?? ""} onChange={(e) => lf("sell_price", e.target.value)} /></div>
            <div><Label>Cost price</Label><Input type="number" value={lensForm?.cost_price ?? ""} onChange={(e) => lf("cost_price", e.target.value)} /></div>
            <div><Label>Quantity (pairs)</Label><Input type="number" value={lensForm?.quantity ?? ""} onChange={(e) => lf("quantity", e.target.value)} /></div>
            <div><Label>Alert when at or below</Label><Input type="number" value={lensForm?.reorder_level ?? ""} onChange={(e) => lf("reorder_level", e.target.value)} /></div>
          </div>
          <DialogFooter className="gap-2">
            {lensForm?.id && <Button variant="ghost" onClick={() => { delLens.mutate(lensForm.id!); setLensForm(null); }}><Trash2 className="mr-1 h-4 w-4" /> Remove</Button>}
            <Button onClick={submitLens} disabled={!lensForm?.lens_type || saveLens.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
