-- =============================================================
-- Migration: 00006_create_rls_policies.sql
-- RLS Policies for Domain 1–4
-- =============================================================

-- -------------------------------------------------------
-- Enable RLS on all tables
-- -------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_attrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_marketplace_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_mutations ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- ===================== HELPER =====================

-- Admin check function (reusable)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ===================== PROFILES =====================

-- User can read own profile
CREATE POLICY "select_profiles_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admin can read all profiles
CREATE POLICY "select_profiles_admin" ON profiles
  FOR SELECT USING (public.is_admin());

-- User can update own profile (NOT role or is_active)
CREATE POLICY "update_profiles_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    AND is_active = (SELECT is_active FROM profiles WHERE id = auth.uid())
  );

-- Admin can update any profile
CREATE POLICY "update_profiles_admin" ON profiles
  FOR UPDATE USING (public.is_admin());

-- ===================== USER_ADDRESSES =====================

-- User can read own addresses
CREATE POLICY "select_user_addresses_own" ON user_addresses
  FOR SELECT USING (auth.uid() = user_id);

-- Admin can read all addresses
CREATE POLICY "select_user_addresses_admin" ON user_addresses
  FOR SELECT USING (public.is_admin());

-- User can insert own addresses
CREATE POLICY "insert_user_addresses_own" ON user_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User can update own addresses
CREATE POLICY "update_user_addresses_own" ON user_addresses
  FOR UPDATE USING (auth.uid() = user_id);

-- User can delete own addresses
CREATE POLICY "delete_user_addresses_own" ON user_addresses
  FOR DELETE USING (auth.uid() = user_id);

-- ===================== CATEGORIES =====================

-- Public read (anyone can see active categories)
CREATE POLICY "select_categories_public" ON categories
  FOR SELECT USING (true);

-- Admin can insert/update/delete
CREATE POLICY "insert_categories_admin" ON categories
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "update_categories_admin" ON categories
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "delete_categories_admin" ON categories
  FOR DELETE USING (public.is_admin());

-- ===================== COLLECTIONS =====================

-- Public read
CREATE POLICY "select_collections_public" ON collections
  FOR SELECT USING (true);

-- Admin CRUD
CREATE POLICY "insert_collections_admin" ON collections
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "update_collections_admin" ON collections
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "delete_collections_admin" ON collections
  FOR DELETE USING (public.is_admin());

-- ===================== COLLECTION_PRODUCTS =====================

-- Public read
CREATE POLICY "select_collection_products_public" ON collection_products
  FOR SELECT USING (true);

-- Admin CRUD
CREATE POLICY "insert_collection_products_admin" ON collection_products
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "delete_collection_products_admin" ON collection_products
  FOR DELETE USING (public.is_admin());

-- ===================== PRODUCTS =====================

-- Public read
CREATE POLICY "select_products_public" ON products
  FOR SELECT USING (true);

-- Admin CRUD
CREATE POLICY "insert_products_admin" ON products
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "update_products_admin" ON products
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "delete_products_admin" ON products
  FOR DELETE USING (public.is_admin());

-- ===================== PRODUCT_VARIANTS =====================

-- Public read
CREATE POLICY "select_product_variants_public" ON product_variants
  FOR SELECT USING (true);

-- Admin CRUD
CREATE POLICY "insert_product_variants_admin" ON product_variants
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "update_product_variants_admin" ON product_variants
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "delete_product_variants_admin" ON product_variants
  FOR DELETE USING (public.is_admin());

-- ===================== PRODUCT_VARIANT_ATTRS =====================

-- Public read
CREATE POLICY "select_product_variant_attrs_public" ON product_variant_attrs
  FOR SELECT USING (true);

-- Admin CRUD
CREATE POLICY "insert_product_variant_attrs_admin" ON product_variant_attrs
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "update_product_variant_attrs_admin" ON product_variant_attrs
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "delete_product_variant_attrs_admin" ON product_variant_attrs
  FOR DELETE USING (public.is_admin());

-- ===================== PRODUCT_IMAGES =====================

-- Public read
CREATE POLICY "select_product_images_public" ON product_images
  FOR SELECT USING (true);

-- Admin CRUD
CREATE POLICY "insert_product_images_admin" ON product_images
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "update_product_images_admin" ON product_images
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "delete_product_images_admin" ON product_images
  FOR DELETE USING (public.is_admin());

-- ===================== PRODUCT_MARKETPLACE_LINKS =====================

-- Public read
CREATE POLICY "select_product_marketplace_links_public" ON product_marketplace_links
  FOR SELECT USING (true);

-- Admin CRUD
CREATE POLICY "insert_product_marketplace_links_admin" ON product_marketplace_links
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "update_product_marketplace_links_admin" ON product_marketplace_links
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "delete_product_marketplace_links_admin" ON product_marketplace_links
  FOR DELETE USING (public.is_admin());

-- ===================== STOCK_MUTATIONS =====================

-- Admin only (read + insert)
CREATE POLICY "select_stock_mutations_admin" ON stock_mutations
  FOR SELECT USING (public.is_admin());

CREATE POLICY "insert_stock_mutations_admin" ON stock_mutations
  FOR INSERT WITH CHECK (public.is_admin());

-- ===================== CARTS =====================

-- User can read own cart
CREATE POLICY "select_carts_own" ON carts
  FOR SELECT USING (
    auth.uid() = user_id
    OR (user_id IS NULL AND session_id IS NOT NULL) -- guest carts readable by anyone with session
  );

-- User can insert own cart
CREATE POLICY "insert_carts_auth" ON carts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR (user_id IS NULL AND session_id IS NOT NULL)
  );

-- User can update own cart
CREATE POLICY "update_carts_own" ON carts
  FOR UPDATE USING (
    auth.uid() = user_id
    OR (user_id IS NULL AND session_id IS NOT NULL)
  );

-- User can delete own cart
CREATE POLICY "delete_carts_own" ON carts
  FOR DELETE USING (
    auth.uid() = user_id
    OR (user_id IS NULL AND session_id IS NOT NULL)
  );

-- Admin can manage all carts
CREATE POLICY "all_carts_admin" ON carts
  FOR ALL USING (public.is_admin());

-- ===================== CART_ITEMS =====================

-- User can read items of own cart
CREATE POLICY "select_cart_items_own" ON cart_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND (carts.user_id = auth.uid() OR (carts.user_id IS NULL AND carts.session_id IS NOT NULL))
    )
  );

-- User can insert items to own cart
CREATE POLICY "insert_cart_items_own" ON cart_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND (carts.user_id = auth.uid() OR (carts.user_id IS NULL AND carts.session_id IS NOT NULL))
    )
  );

-- User can update items of own cart
CREATE POLICY "update_cart_items_own" ON cart_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND (carts.user_id = auth.uid() OR (carts.user_id IS NULL AND carts.session_id IS NOT NULL))
    )
  );

-- User can delete items from own cart
CREATE POLICY "delete_cart_items_own" ON cart_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND (carts.user_id = auth.uid() OR (carts.user_id IS NULL AND carts.session_id IS NOT NULL))
    )
  );

-- Admin can manage all cart items
CREATE POLICY "all_cart_items_admin" ON cart_items
  FOR ALL USING (public.is_admin());

-- ===================== WISHLIST_ITEMS =====================

-- User can read own wishlist
CREATE POLICY "select_wishlist_items_own" ON wishlist_items
  FOR SELECT USING (auth.uid() = user_id);

-- User can insert to own wishlist
CREATE POLICY "insert_wishlist_items_own" ON wishlist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User can delete from own wishlist
CREATE POLICY "delete_wishlist_items_own" ON wishlist_items
  FOR DELETE USING (auth.uid() = user_id);

-- Admin can read all wishlists
CREATE POLICY "select_wishlist_items_admin" ON wishlist_items
  FOR SELECT USING (public.is_admin());
