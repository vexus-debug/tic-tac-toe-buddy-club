import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, Edit2, X, DollarSign, TrendingUp } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useLabAllocationRules, useUpdateLabAllocationRules, useLabRevenueSummary } from "@/hooks/useLabAllocation";

const fmt = (v: number) =>
  "₦" + v.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function LabSettingsPage() {
  const { data: rules = [], isLoading } = useLabAllocationRules();
  const { data: summary } = useLabRevenueSummary();
  const updateRules = useUpdateLabAllocationRules();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, number>>({});
  const total = useMemo(() => Object.values(draft).reduce((s, v) => s + (v || 0), 0), [draft]);

  useEffect(() => {
    if (rules.length > 0 && !editing) {
      const m: Record<string, number> = {};
      rules.forEach((r: any) => (m[r.id] = Number(r.percentage)));
      setDraft(m);
    }
  }, [rules, editing]);

  const handleSave = () => {
    const arr = Object.entries(draft).map(([id, percentage]) => ({ id, percentage }));
    updateRules.mutate(arr, { onSuccess: () => setEditing(false) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lab Settings</h1>
        <p className="text-sm text-muted-foreground">Manage lab revenue allocation — independent from clinic allocations</p>
      </div>

      {/* Lab Revenue Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{fmt(summary?.totalRevenue ?? 0)}</p>
              <p className="text-xs text-muted-foreground">Total Lab Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-600">{fmt(summary?.monthRevenue ?? 0)}</p>
              <p className="text-xs text-muted-foreground">This Month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xl font-bold text-destructive">{fmt(summary?.outstanding ?? 0)}</p>
              <p className="text-xs text-muted-foreground">Outstanding</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lab Allocation Rules */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Lab Allocation Rules
            </CardTitle>
            <CardDescription>
              Configure how lab revenue is distributed. These are independent from clinic allocation rules.
            </CardDescription>
          </div>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Edit2 className="h-4 w-4 mr-1.5" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={total !== 100 || updateRules.isPending}>
                <Save className="h-4 w-4 mr-1.5" /> Save
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {editing && total !== 100 && (
            <div className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Total must equal 100%. Currently: {total}%
            </div>
          )}
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right w-24">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule: any) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.category}</TableCell>
                    <TableCell className="text-right">
                      {editing ? (
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          className="w-20 ml-auto text-right h-8"
                          value={draft[rule.id] ?? ""}
                          onChange={(e) => setDraft((p) => ({ ...p, [rule.id]: Number(e.target.value) }))}
                        />
                      ) : (
                        <Badge variant="secondary">{rule.percentage}%</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {editing && (
                  <TableRow className="border-t-2">
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={total === 100 ? "default" : "destructive"}>{total}%</Badge>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
