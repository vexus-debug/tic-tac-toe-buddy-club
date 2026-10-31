import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { usePublicShopProduct, createPublicOrder } from "@/hooks/useShop";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft, Package, ShoppingCart, Minus, Plus, CheckCircle, Star, Shield, Truck,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export default function PublicProductPage() {
  const { slug, productId } = useParams<{ slug: string; productId: string }>();
  const { data: product, isLoading } = usePublicShopProduct(productId);
  const [qty, setQty] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });

  // Get clinic info for styling
  const { data: clinic } = useQuery({
    queryKey: ["public-clinic-info", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id, name, slug, logo_url, settings")
        .eq("slug", slug!)
        .is("parent_org_id", null)
        .maybeSingle();
      return data;
    },
  });

  const s = (clinic?.settings as any) || {};
  const primaryColor = s.primary_color || "#2563eb";

  const handleOrder = async () => {
    if (!form.name || !form.phone) {
      toast({ title: "Name and phone are required", variant: "destructive" });
      return;
    }
    if (!product || !clinic) return;
    setOrdering(true);
    try {
      const result = await createPublicOrder(
        clinic.id,
        { name: form.name, email: form.email, phone: form.phone, address: form.address },
        [{ product_id: product.id, product_name: product.name, quantity: qty, unit_price: Number(product.price) }]
      );
      setOrderNumber(result.order_number);
      setOrdered(true);
      toast({ title: "Order placed successfully!" });
    } catch (err: any) {
      toast({ title: "Order failed", description: err.message, variant: "destructive" });
    } finally {
      setOrdering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-5xl mx-auto pt-20 grid md:grid-cols-2 gap-10">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <Link to={`/site/${slug}/shop`}>
            <Button variant="outline">Back to Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  const inStock = product.stock > 0;
  const discount = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const gallery = Array.from(
    new Set([...(product.images || []), ...(product.image_url ? [product.image_url] : [])])
  );
  const activeImage = gallery[activeImageIndex] || gallery[0];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to={`/site/${slug}/shop`} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Shop</span>
          </Link>
          {clinic?.logo_url && <img src={clinic.logo_url} alt="" className="h-8 w-8 rounded-full object-cover" />}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          {/* Product Image */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="aspect-square rounded-2xl bg-gray-100 overflow-hidden relative">
              {activeImage ? (
                <img src={activeImage} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-20 w-20 text-gray-300" />
                </div>
              )}
              {discount > 0 && (
                <Badge className="absolute top-4 left-4 bg-red-500 text-white border-0 text-sm px-3 py-1">
                  {discount}% OFF
                </Badge>
              )}
            </div>

            {gallery.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {gallery.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setActiveImageIndex(i)}
                    aria-label={`View image ${i + 1} of ${gallery.length}`}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                      i === activeImageIndex ? "" : "border-transparent"
                    }`}
                    style={i === activeImageIndex ? { borderColor: primaryColor } : undefined}
                  >
                    <img src={url} alt={`${product.name} view ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Details */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">{product.category}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold" style={{ color: primaryColor }}>
                ₦{Number(product.price).toLocaleString()}
              </span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="text-lg text-gray-400 line-through">
                  ₦{Number(product.compare_at_price).toLocaleString()}
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            )}

            {product.features && product.features.length > 0 && (
              <ul className="space-y-2">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: primaryColor }} />
                    {f}
                  </li>
                ))}
              </ul>
            )}

            {/* Stock status */}
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${inStock ? "bg-green-500" : "bg-red-500"}`} />
              <span className={`text-sm font-medium ${inStock ? "text-green-600" : "text-red-500"}`}>
                {inStock ? `In Stock (${product.stock} available)` : "Out of Stock"}
              </span>
            </div>

            {/* Quantity + Buy */}
            {inStock && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Qty:</span>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      className="h-10 w-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      onClick={() => setQty(Math.max(1, qty - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="h-10 w-12 flex items-center justify-center text-sm font-semibold border-x border-gray-200">{qty}</span>
                    <button
                      className="h-10 w-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      onClick={() => setQty(Math.min(product.stock, qty + 1))}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-400">
                    Total: ₦{(Number(product.price) * qty).toLocaleString()}
                  </span>
                </div>
                <Button
                  className="w-full h-12 text-white text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => setCheckoutOpen(true)}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" /> Buy Now — ₦{(Number(product.price) * qty).toLocaleString()}
                </Button>
              </div>
            )}

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              {[
                { icon: Shield, label: "Genuine Product" },
                { icon: Truck, label: "Fast Delivery" },
                { icon: Star, label: "Top Quality" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="text-center">
                  <Icon className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                  <p className="text-[10px] text-gray-500 font-medium">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{ordered ? "Order Confirmed!" : "Complete Your Order"}</DialogTitle>
          </DialogHeader>
          {ordered ? (
            <div className="text-center py-6 space-y-4">
              <div className="h-16 w-16 rounded-full mx-auto flex items-center justify-center bg-green-50">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Thank you for your order!</p>
                <p className="text-sm text-gray-500 mt-1">Order number: <span className="font-mono font-bold">{orderNumber}</span></p>
                <p className="text-xs text-gray-400 mt-2">We'll reach out to confirm delivery details.</p>
              </div>
              <Button variant="outline" onClick={() => { setCheckoutOpen(false); setOrdered(false); }}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{product?.name}</p>
                    <p className="text-xs text-gray-500">Qty: {qty} × ₦{Number(product?.price).toLocaleString()}</p>
                  </div>
                  <p className="font-bold" style={{ color: primaryColor }}>
                    ₦{(Number(product?.price || 0) * qty).toLocaleString()}
                  </p>
                </div>
                <Input placeholder="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="Phone Number *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <Input placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input placeholder="Delivery Address (optional)" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCheckoutOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleOrder}
                  disabled={ordering}
                  className="text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {ordering ? "Placing Order..." : `Pay ₦${(Number(product?.price || 0) * qty).toLocaleString()}`}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
