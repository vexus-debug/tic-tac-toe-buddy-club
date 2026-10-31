import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { toast } from "@/hooks/use-toast";

export interface LedgerEntry {
  id: string;
  inventory_id: string;
  transaction_type: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  reference: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  other_org_id: string | null;
  transfer_id: string | null;
  balance_before: number | null;
  balance_after: number | null;
  item_name: string;
  item_category: string;
  item_unit: string;
  user_name: string;
  other_branch: string | null;
}

export const MOVEMENT_LABELS: Record<string, string> = {
  purchase: "Restock / Purchase",
  usage: "Used",
  adjustment: "Adjustment / Write-off",
  return: "Returned to stock",
  transfer_out: "Transferred out",
  transfer_in: "Transferred in",
};

export const isInbound = (t: string) => ["purchase", "return", "transfer_in"].includes(t);

export function useBranchOptions() {
  const { currentOrg, mainOrgId } = useOrg();
  const root = currentOrg?.parent_org_id || mainOrgId || currentOrg?.org_id;
  return useQuery({
    queryKey: ["inventory-branch-options", root],
    enabled: !!root,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("organizations")
        .select("id, name, parent_org_id")
        .or(`id.eq.${root},parent_org_id.eq.${root}`);
      return ((data || []) as { id: string; name: string; parent_org_id: string | null }[]);
    },
  });
}

export function useInventoryLedger(opts: { from?: string; to?: string; inventoryId?: string } = {}) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  const branches = useBranchOptions();
  return useQuery({
    queryKey: ["inventory-ledger", orgId, opts.from, opts.to, opts.inventoryId, branches.data?.length],
    enabled: !!orgId,
    queryFn: async () => {
      let q = (supabase as any)
        .from("inventory_transactions")
        .select("*, inventory(name, category, unit)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (opts.from) q = q.gte("created_at", `${opts.from}T00:00:00`);
      if (opts.to) q = q.lte("created_at", `${opts.to}T23:59:59`);
      if (opts.inventoryId) q = q.eq("inventory_id", opts.inventoryId);
      const { data, error } = await q;
      if (error) throw error;
      const rows = data || [];
      const userIds = Array.from(new Set(rows.map((r: any) => r.created_by).filter(Boolean)));
      let names: Record<string, string> = {};
      if (userIds.length) {
        const { data: profs } = await (supabase as any).from("profiles").select("id, full_name").in("id", userIds);
        (profs || []).forEach((p: any) => { names[p.id] = p.full_name || "Staff"; });
      }
      const branchNames: Record<string, string> = {};
      (branches.data || []).forEach((b) => { branchNames[b.id] = b.name; });
      return rows.map((r: any) => ({
        ...r,
        item_name: r.inventory?.name || "Deleted item",
        item_category: r.inventory?.category || "—",
        item_unit: r.inventory?.unit || "",
        user_name: r.created_by ? names[r.created_by] || "Staff" : "System",
        other_branch: r.other_org_id ? branchNames[r.other_org_id] || "Other branch" : null,
      })) as LedgerEntry[];
    },
  });
}

export function useTransferStock() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: { inventory_id: string; target_org_id: string; quantity: number; notes?: string }) => {
      const { error } = await (supabase as any).rpc("transfer_inventory_stock", {
        p_source_org_id: currentOrg?.org_id,
        p_inventory_id: input.inventory_id,
        p_target_org_id: input.target_org_id,
        p_quantity: input.quantity,
        p_notes: input.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["inventory-ledger"] });
      qc.invalidateQueries({ queryKey: ["inventory-transactions"] });
      toast({ title: "Stock transferred" });
    },
    onError: (e: any) => toast({ title: "Transfer failed", description: e.message, variant: "destructive" }),
  });
}

// ---------- download helpers ----------
export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  a.download = filename;
  a.click();
}

export function printReport(title: string, subtitle: string, headers: string[], rows: (string | number | null | undefined)[][], summary: [string, string][] = []) {
  const esc = (s: any) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<html><head><title>${esc(title)}</title><style>
    body{font-family:system-ui,sans-serif;padding:24px;color:#111}h1{margin:0;font-size:20px}p{margin:4px 0 16px;color:#555;font-size:12px}
    .sum{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px}.sum div{border:1px solid #ddd;border-radius:6px;padding:8px 12px;font-size:12px}.sum b{display:block;font-size:15px}
    table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #ddd;padding:5px 6px;text-align:left}th{background:#f3f3f3}
  </style></head><body><h1>${esc(title)}</h1><p>${esc(subtitle)} · Generated ${new Date().toLocaleString()}</p>
  <div class="sum">${summary.map(([k, v]) => `<div>${esc(k)}<b>${esc(v)}</b></div>`).join("")}</div>
  <table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>
  ${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>
  <script>setTimeout(()=>window.print(),300)</script></body></html>`);
  w.document.close();
}
