import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";

export interface ShopProduct {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category: string;
  image_url: string | null;
  images: string[];
  stock: number;
  sku: string | null;
  is_active: boolean;
  features: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ShopOrder {
  id: string;
  org_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string | null;
  payment_status: string;
  shipping_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: ShopOrderItem[];
}

export interface ShopOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

// ─── Dashboard hooks (org-scoped) ───
export function useShopProducts() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["shop-products", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("shop_products")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ShopProduct[];
    },
  });
}

export function useCreateShopProduct() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (product: Omit<ShopProduct, "id" | "org_id" | "created_at" | "updated_at">) => {
      const { error } = await (supabase as any)
        .from("shop_products")
        .insert({ ...product, org_id: currentOrg?.org_id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shop-products"] }),
  });
}

export function useUpdateShopProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ShopProduct> & { id: string }) => {
      const { error } = await (supabase as any)
        .from("shop_products")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shop-products"] }),
  });
}

export function useDeleteShopProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("shop_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shop-products"] }),
  });
}

export function useShopOrders() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["shop-orders", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("shop_orders")
        .select("*, shop_order_items(*)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((o: any) => ({
        ...o,
        items: o.shop_order_items || [],
      })) as ShopOrder[];
    },
  });
}

export function useUpdateShopOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ShopOrder> & { id: string }) => {
      const { error } = await (supabase as any)
        .from("shop_orders")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shop-orders"] }),
  });
}

export function useShopRevenue() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["shop-revenue", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("shop_orders")
        .select("total, status, created_at")
        .eq("org_id", orgId)
        .in("status", ["confirmed", "delivered", "completed"]);
      if (error) throw error;
      const total = (data || []).reduce((s: number, o: any) => s + Number(o.total), 0);
      const count = (data || []).length;
      return { total, count };
    },
  });
}

// ─── Public hooks (no auth needed) ───
export function usePublicShopProducts(orgId: string | undefined) {
  return useQuery({
    queryKey: ["public-shop-products", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("shop_products")
        .select("*")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .gt("stock", 0)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ShopProduct[];
    },
  });
}

export function usePublicShopProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ["public-shop-product", productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("shop_products")
        .select("*")
        .eq("id", productId)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as ShopProduct | null;
    },
  });
}

export async function createPublicOrder(
  orgId: string,
  customer: { name: string; email?: string; phone?: string; address?: string },
  items: { product_id: string; product_name: string; quantity: number; unit_price: number }[]
) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const orderNumber = `SH-${Date.now().toString(36).toUpperCase()}`;

  const { data: order, error: orderErr } = await (supabase as any)
    .from("shop_orders")
    .insert({
      org_id: orgId,
      order_number: orderNumber,
      customer_name: customer.name,
      customer_email: customer.email || null,
      customer_phone: customer.phone || null,
      shipping_address: customer.address || null,
      subtotal,
      total: subtotal,
      status: "pending",
      payment_status: "pending",
    })
    .select("id")
    .single();

  if (orderErr) throw orderErr;

  const orderItems = items.map((i) => ({
    order_id: order.id,
    product_id: i.product_id,
    product_name: i.product_name,
    quantity: i.quantity,
    unit_price: i.unit_price,
    line_total: i.quantity * i.unit_price,
  }));

  const { error: itemsErr } = await (supabase as any)
    .from("shop_order_items")
    .insert(orderItems);
  if (itemsErr) throw itemsErr;

  // Decrement stock
  for (const item of items) {
    await (supabase as any).rpc("", {}).catch(() => {});
    // Use update to decrement
    const { data: prod } = await (supabase as any)
      .from("shop_products")
      .select("stock")
      .eq("id", item.product_id)
      .single();
    if (prod) {
      await (supabase as any)
        .from("shop_products")
        .update({ stock: Math.max(0, prod.stock - item.quantity) })
        .eq("id", item.product_id);
    }
  }

  return { order_number: orderNumber, order_id: order.id };
}
