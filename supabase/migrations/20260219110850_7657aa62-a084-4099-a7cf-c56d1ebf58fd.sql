
-- Shop products table
CREATE TABLE public.shop_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  compare_at_price NUMERIC,
  category TEXT NOT NULL DEFAULT 'General',
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  stock INTEGER NOT NULL DEFAULT 0,
  sku TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  features TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active shop products"
  ON public.shop_products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage shop products"
  ON public.shop_products FOR ALL
  USING ((get_org_role(auth.uid(), org_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role])) OR is_super_admin(auth.uid()))
  WITH CHECK ((get_org_role(auth.uid(), org_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role])) OR is_super_admin(auth.uid()));

CREATE TRIGGER update_shop_products_updated_at
  BEFORE UPDATE ON public.shop_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Shop orders table
CREATE TABLE public.shop_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  shipping_address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can create shop orders"
  ON public.shop_orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Members can view shop orders"
  ON public.shop_orders FOR SELECT
  USING (has_org_access(auth.uid(), org_id));

CREATE POLICY "Admins can manage shop orders"
  ON public.shop_orders FOR ALL
  USING ((get_org_role(auth.uid(), org_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role, 'receptionist'::org_role])) OR is_super_admin(auth.uid()))
  WITH CHECK ((get_org_role(auth.uid(), org_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role, 'receptionist'::org_role])) OR is_super_admin(auth.uid()));

CREATE TRIGGER update_shop_orders_updated_at
  BEFORE UPDATE ON public.shop_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Shop order items table
CREATE TABLE public.shop_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.shop_products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  line_total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can create order items"
  ON public.shop_order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Members can view order items"
  ON public.shop_order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.shop_orders o
    WHERE o.id = shop_order_items.order_id AND has_org_access(auth.uid(), o.org_id)
  ));

CREATE POLICY "Admins can manage order items"
  ON public.shop_order_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.shop_orders o
    WHERE o.id = shop_order_items.order_id AND (
      (get_org_role(auth.uid(), o.org_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]))
      OR is_super_admin(auth.uid())
    )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shop_orders o
    WHERE o.id = shop_order_items.order_id AND (
      (get_org_role(auth.uid(), o.org_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]))
      OR is_super_admin(auth.uid())
    )
  ));
