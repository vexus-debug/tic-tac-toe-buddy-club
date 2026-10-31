import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePublicShopProducts, type ShopProduct } from "@/hooks/useShop";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingBag, Search, ArrowLeft, Package, Filter,
} from "lucide-react";
import { motion } from "framer-motion";

export default function PublicShopPage() {
  const { slug } = useParams<{ slug: string }>();
  const [clinic, setClinic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("organizations")
      .select("id, name, slug, logo_url, settings")
      .eq("slug", slug)
        .is("parent_org_id", null)
      .maybeSingle()
      .then(({ data }) => {
        setClinic(data);
        setLoading(false);
      });
  }, [slug]);

  const { data: products = [], isLoading: productsLoading } = usePublicShopProducts(clinic?.id);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((p) => p.category))],
    [products]
  );

  const filtered = useMemo(() => {
    let list = products;
    if (selectedCategory !== "All") list = list.filter((p) => p.category === selectedCategory);
    if (search) list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [products, selectedCategory, search]);

  const s = clinic?.settings || {};
  const primaryColor = s.primary_color || "#2563eb";
  const accentColor = s.accent_color || "#1d4ed8";

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-6xl mx-auto pt-20 space-y-6">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500 text-lg">Clinic not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/site/${slug}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            {clinic.logo_url && <img src={clinic.logo_url} alt="" className="h-8 w-8 rounded-full object-cover" />}
            <div>
              <span className="font-bold text-gray-900 text-sm">{clinic.name}</span>
              <span className="text-xs text-gray-400 ml-2">Shop</span>
            </div>
          </div>
          <Link to={`/site/${slug}`}>
            <Button variant="outline" size="sm">Back to Site</Button>
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <section
        className="py-16 px-4"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
      >
        <div className="max-w-6xl mx-auto text-center text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ShoppingBag className="h-10 w-10 mx-auto mb-4 opacity-80" />
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Our Shop</h1>
            <p className="text-white/80 max-w-md mx-auto">
              Premium dental care products recommended by our specialists
            </p>
          </motion.div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white border-gray-200 h-11"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? "text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                }`}
                style={selectedCategory === cat ? { backgroundColor: primaryColor } : {}}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No products available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link to={`/site/${slug}/shop/${product.id}`}>
                  <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white cursor-pointer h-full">
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <Badge className="absolute top-3 left-3 bg-red-500 text-white text-[10px] border-0">
                          {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}% OFF
                        </Badge>
                      )}
                      {product.stock <= 3 && product.stock > 0 && (
                        <Badge className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] border-0">
                          Only {product.stock} left
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{product.category}</p>
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold" style={{ color: primaryColor }}>
                          ₦{Number(product.price).toLocaleString()}
                        </span>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span className="text-sm text-gray-400 line-through">
                            ₦{Number(product.compare_at_price).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-100 bg-white py-6 text-center">
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} {clinic.name}. Powered by Clinexus</p>
      </footer>
    </div>
  );
}
