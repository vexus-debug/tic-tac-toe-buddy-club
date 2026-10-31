import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { toast } from "@/hooks/use-toast";

const db = supabase as any;

/** Builds links between clinic dashboard pages, e.g. clinicPath("suppliers"). */
export function useClinicPath() {
  const { slug } = useParams();
  return (page: string) => `/app/clinic/${slug}/${page}`;
}

export function makeOrderNumber() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `PO-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export interface POLine {
  id?: string;
  inventory_id: string | null;
  item_name: string;
  quantity: number;
  unit_cost: number;
  received_qty?: number;
}

function invalidateSupply(qc: ReturnType<typeof useQueryClient>) {
  ["purchase-orders", "po-items", "all-po-items", "inventory", "inventory-transactions", "inventory-cost-analytics", "supplier-stats", "supply-alerts"].forEach((k) =>
    qc.invalidateQueries({ queryKey: [k] }),
  );
}

export function usePurchaseOrderItems(poId?: string | null) {
  return useQuery({
    queryKey: ["po-items", poId],
    enabled: !!poId,
    queryFn: async () => {
      const { data, error } = await db.from("purchase_order_items").select("*").eq("po_id", poId).order("created_at");
      if (error) throw error;
      return (data || []) as (POLine & { id: string; po_id: string; total: number; received_qty: number })[];
    },
  });
}

/** All PO lines for the clinic (for open-order and price-history lookups). */
export function useAllPurchaseOrderItems() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["all-po-items", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db
        .from("purchase_order_items")
        .select("*, purchase_orders!inner(id, org_id, order_number, status, order_date, supplier_id)")
        .eq("purchase_orders.org_id", orgId);
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

export function useSavePurchaseOrder() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      order_number: string;
      supplier_id: string | null;
      expected_date: string | null;
      notes: string | null;
      tax: number;
      status?: string;
      lines: POLine[];
    }) => {
      const lines = input.lines.filter((l) => l.item_name.trim() && l.quantity > 0);
      if (!lines.length) throw new Error("Add at least one item");
      const subtotal = lines.reduce((s, l) => s + l.quantity * l.unit_cost, 0);
      const header = {
        order_number: input.order_number,
        supplier_id: input.supplier_id,
        expected_date: input.expected_date,
        notes: input.notes,
        tax: input.tax,
        subtotal,
        total: subtotal + input.tax,
        ...(input.status ? { status: input.status } : {}),
      };
      let poId = input.id;
      if (poId) {
        const { error } = await db.from("purchase_orders").update(header).eq("id", poId);
        if (error) throw error;
        const { error: delErr } = await db.from("purchase_order_items").delete().eq("po_id", poId);
        if (delErr) throw delErr;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { data, error } = await db
          .from("purchase_orders")
          .insert({ ...header, status: input.status || "draft", org_id: currentOrg?.org_id, created_by: u.user?.id })
          .select("id")
          .single();
        if (error) throw error;
        poId = data.id;
      }
      const { error: itemErr } = await db.from("purchase_order_items").insert(
        lines.map((l) => ({ po_id: poId, inventory_id: l.inventory_id, item_name: l.item_name.trim(), quantity: l.quantity, unit_cost: l.unit_cost, total: l.quantity * l.unit_cost })),
      );
      if (itemErr) throw itemErr;
      return poId;
    },
    onSuccess: () => {
      invalidateSupply(qc);
      toast({ title: "Purchase order saved" });
    },
    onError: (e: any) => toast({ title: "Could not save order", description: e.message, variant: "destructive" }),
  });
}

export function useReceivePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ poId, lines }: { poId: string; lines: { item_id: string; qty: number }[] }) => {
      const { data, error } = await db.rpc("receive_purchase_order", { p_po_id: poId, p_lines: lines });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (status) => {
      invalidateSupply(qc);
      toast({ title: status === "received" ? "Order fully received" : "Delivery recorded", description: "Stock and costs were updated." });
    },
    onError: (e: any) => toast({ title: "Could not receive order", description: e.message, variant: "destructive" }),
  });
}

/** Creates one draft PO per supplier for the given low-stock items. */
export function useCreateReorderDrafts() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (items: any[]) => {
      const groups: Record<string, any[]> = {};
      items.forEach((i) => {
        const k = i.preferred_supplier_id || "none";
        (groups[k] ||= []).push(i);
      });
      const { data: u } = await supabase.auth.getUser();
      let count = 0;
      for (const [supplierId, list] of Object.entries(groups)) {
        const lines = list.map((i) => {
          const qty = Math.max(1, Number(i.reorder_qty) || Math.max(Number(i.min_stock) * 2 - Number(i.quantity), 1));
          return { inventory_id: i.id, item_name: i.name, quantity: qty, unit_cost: Number(i.unit_cost || 0), total: qty * Number(i.unit_cost || 0) };
        });
        const subtotal = lines.reduce((s, l) => s + l.total, 0);
        const { data, error } = await db
          .from("purchase_orders")
          .insert({ org_id: currentOrg?.org_id, order_number: makeOrderNumber(), supplier_id: supplierId === "none" ? null : supplierId, status: "draft", subtotal, tax: 0, total: subtotal, notes: "Auto-created from low stock", created_by: u.user?.id })
          .select("id")
          .single();
        if (error) throw error;
        const { error: e2 } = await db.from("purchase_order_items").insert(lines.map((l) => ({ ...l, po_id: data.id })));
        if (e2) throw e2;
        count++;
      }
      return count;
    },
    onSuccess: (n) => {
      invalidateSupply(qc);
      toast({ title: `${n} draft purchase order${n === 1 ? "" : "s"} created` });
    },
    onError: (e: any) => toast({ title: "Could not create orders", description: e.message, variant: "destructive" }),
  });
}

export interface SupplierStats {
  orders: number;
  openOrders: number;
  totalSpend: number;
  onTimeRate: number | null;
  avgLeadDays: number | null;
  lastOrder: string | null;
  itemCount: number;
}

export function useSupplierStats() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["supplier-stats", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [{ data: pos }, { data: inv }] = await Promise.all([
        db.from("purchase_orders").select("id, supplier_id, status, order_date, expected_date, received_date, total").eq("org_id", orgId),
        db.from("inventory").select("id, preferred_supplier_id").eq("org_id", orgId),
      ]);
      const stats: Record<string, SupplierStats> = {};
      const get = (id: string) => (stats[id] ||= { orders: 0, openOrders: 0, totalSpend: 0, onTimeRate: null, avgLeadDays: null, lastOrder: null, itemCount: 0 });
      const onTime: Record<string, [number, number]> = {};
      const lead: Record<string, number[]> = {};
      (pos || []).forEach((p: any) => {
        if (!p.supplier_id || p.status === "cancelled") return;
        const s = get(p.supplier_id);
        s.orders++;
        if (["draft", "ordered", "partial"].includes(p.status)) s.openOrders++;
        if (p.status === "received" || p.status === "partial") s.totalSpend += Number(p.total || 0);
        if (!s.lastOrder || p.order_date > s.lastOrder) s.lastOrder = p.order_date;
        if (p.received_date) {
          const ot = (onTime[p.supplier_id] ||= [0, 0]);
          ot[1]++;
          if (!p.expected_date || p.received_date <= p.expected_date) ot[0]++;
          (lead[p.supplier_id] ||= []).push((new Date(p.received_date).getTime() - new Date(p.order_date).getTime()) / 86400000);
        }
      });
      Object.entries(onTime).forEach(([id, [ok, n]]) => (get(id).onTimeRate = Math.round((ok / n) * 100)));
      Object.entries(lead).forEach(([id, l]) => (get(id).avgLeadDays = Math.round(l.reduce((a, b) => a + b, 0) / l.length)));
      (inv || []).forEach((i: any) => i.preferred_supplier_id && get(i.preferred_supplier_id).itemCount++);
      return stats;
    },
  });
}

/** Shared counts for header alerts: low stock, expiring soon, overdue orders. */
export function useSupplyAlerts() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["supply-alerts", orgId],
    enabled: !!orgId,
    staleTime: 60_000,
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const soon = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
      const [{ data: inv }, { data: pos }] = await Promise.all([
        db.from("inventory").select("quantity, min_stock, expiry_date").eq("org_id", orgId),
        db.from("purchase_orders").select("id").eq("org_id", orgId).in("status", ["ordered", "partial"]).lt("expected_date", today),
      ]);
      const items = inv || [];
      return {
        lowStock: items.filter((i: any) => i.quantity <= i.min_stock).length,
        expiring: items.filter((i: any) => i.expiry_date && i.expiry_date <= soon && i.quantity > 0).length,
        overdue: (pos || []).length,
      };
    },
  });
}

export const fmtNaira = (n: number) => `₦${Math.round(Number(n) || 0).toLocaleString()}`;
