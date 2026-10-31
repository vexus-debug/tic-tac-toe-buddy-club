import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  useTestCategories, useLabTests, useSaveCategory, useDeleteCategory,
  useSaveTest, useDeleteTest, useSeedLabMenu, LabTest,
} from "@/hooks/lab/useLab";
import { LAB_TEST_MENU } from "@/config/labTestMenu";
import { Plus, Trash2, Pencil, Download } from "lucide-react";

export default function ManageTestsPage() {
  const { data: categories = [] } = useTestCategories();
  const { data: tests = [] } = useLabTests();
  const saveCategory = useSaveCategory();
  const deleteCategory = useDeleteCategory();
  const saveTest = useSaveTest();
  const deleteTest = useDeleteTest();
  const seed = useSeedLabMenu();

  const [catName, setCatName] = useState("");
  const [editing, setEditing] = useState<Partial<LabTest> | null>(null);

  const submitTest = () => {
    if (!editing?.name?.trim()) return;
    saveTest.mutate(
      {
        id: editing.id,
        name: editing.name,
        category_id: editing.category_id || null,
        unit: editing.unit || null,
        reference_range: editing.reference_range || null,
        price: Number(editing.price || 0),
        is_active: editing.is_active ?? true,
      },
      { onSuccess: () => setEditing(null) }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Manage Tests" description="Categories, analytes, reference ranges and pricing">
        {categories.length === 0 && (
          <Button size="sm" variant="outline" onClick={() => seed.mutate(LAB_TEST_MENU as any)} disabled={seed.isPending}>
            <Download className="mr-2 h-4 w-4" /> Import standard menu
          </Button>
        )}
        <Button size="sm" onClick={() => setEditing({ name: "", price: 0, category_id: categories[0]?.id })}>
          <Plus className="mr-2 h-4 w-4" /> New Test
        </Button>
      </PageHeader>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Categories</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="New category name" value={catName} onChange={(e) => setCatName(e.target.value)} />
            <Button
              onClick={() => {
                if (!catName.trim()) return;
                saveCategory.mutate({ name: catName.trim(), sort_order: categories.length } as any, {
                  onSuccess: () => setCatName(""),
                });
              }}
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Badge key={c.id} variant="outline" className="gap-2 py-1.5">
                {c.name}
                <button onClick={() => deleteCategory.mutate(c.id)} aria-label={`Delete ${c.name}`}>
                  <Trash2 className="h-3 w-3 opacity-60" />
                </button>
              </Badge>
            ))}
            {categories.length === 0 && <p className="text-sm text-muted-foreground">No categories yet.</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Tests ({tests.length})</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/20 text-xs uppercase text-muted-foreground">
                <th className="py-2.5 px-4 text-left">Test</th>
                <th className="py-2.5 px-4 text-left">Category</th>
                <th className="py-2.5 px-4 text-left">Unit</th>
                <th className="py-2.5 px-4 text-left">Reference</th>
                <th className="py-2.5 px-4 text-left">Price</th>
                <th className="py-2.5 px-4" />
              </tr>
            </thead>
            <tbody>
              {tests.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">No tests yet.</td></tr>
              )}
              {tests.map((t) => (
                <tr key={t.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                  <td className="py-2.5 px-4">{t.name}</td>
                  <td className="py-2.5 px-4 text-muted-foreground">
                    {categories.find((c) => c.id === t.category_id)?.name || "—"}
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground">{t.unit || "—"}</td>
                  <td className="py-2.5 px-4 text-muted-foreground">{t.reference_range || "—"}</td>
                  <td className="py-2.5 px-4">₦{Number(t.price || 0).toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteTest.mutate(t.id)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit test" : "New test"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Name</Label>
              <Input value={editing?.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={editing?.category_id || ""}
                onValueChange={(v) => setEditing({ ...editing, category_id: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Unit</Label>
                <Input value={editing?.unit || ""} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} />
              </div>
              <div>
                <Label>Price</Label>
                <Input type="number" value={editing?.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Reference range</Label>
              <Input
                placeholder="e.g. 3.5 - 5.5"
                value={editing?.reference_range || ""}
                onChange={(e) => setEditing({ ...editing, reference_range: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={submitTest} disabled={saveTest.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
