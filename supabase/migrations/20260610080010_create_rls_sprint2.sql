-- =============================================================
-- Migration: 20260610080010_create_rls_sprint2.sql
-- RLS Policies for Domain 5–12
-- =============================================================

-- -------------------------------------------------------
-- Enable RLS on all Sprint 2 tables
-- -------------------------------------------------------
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_shipping ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_zone_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_rating_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;

-- ===================== VOUCHERS =====================
-- Public can read active vouchers (for validation)
CREATE POLICY "select_vouchers_public" ON vouchers
  FOR SELECT USING (true);

CREATE POLICY "insert_vouchers_admin" ON vouchers
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "update_vouchers_admin" ON vouchers
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "delete_vouchers_admin" ON vouchers
  FOR DELETE USING (public.is_admin());

-- ===================== VOUCHER_USAGES =====================
CREATE POLICY "select_voucher_usages_own" ON voucher_usages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "select_voucher_usages_admin" ON voucher_usages
  FOR SELECT USING (public.is_admin());
-- Insert/update handled by RPC (SECURITY DEFINER)

-- ===================== FLASH_SALES =====================
CREATE POLICY "select_flash_sales_public" ON flash_sales
  FOR SELECT USING (true);
CREATE POLICY "insert_flash_sales_admin" ON flash_sales
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "update_flash_sales_admin" ON flash_sales
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "delete_flash_sales_admin" ON flash_sales
  FOR DELETE USING (public.is_admin());

-- ===================== FLASH_SALE_ITEMS =====================
CREATE POLICY "select_flash_sale_items_public" ON flash_sale_items
  FOR SELECT USING (true);
CREATE POLICY "insert_flash_sale_items_admin" ON flash_sale_items
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "update_flash_sale_items_admin" ON flash_sale_items
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "delete_flash_sale_items_admin" ON flash_sale_items
  FOR DELETE USING (public.is_admin());

-- ===================== ORDERS =====================
CREATE POLICY "select_orders_own" ON orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "select_orders_admin" ON orders
  FOR SELECT USING (public.is_admin());
CREATE POLICY "update_orders_admin" ON orders
  FOR UPDATE USING (public.is_admin());
-- Insert handled by RPC (SECURITY DEFINER)

-- ===================== ORDER_ITEMS =====================
CREATE POLICY "select_order_items_own" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );
CREATE POLICY "select_order_items_admin" ON order_items
  FOR SELECT USING (public.is_admin());

-- ===================== ORDER_SHIPPING =====================
CREATE POLICY "select_order_shipping_own" ON order_shipping
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_shipping.order_id AND orders.user_id = auth.uid())
  );
CREATE POLICY "select_order_shipping_admin" ON order_shipping
  FOR SELECT USING (public.is_admin());
CREATE POLICY "update_order_shipping_admin" ON order_shipping
  FOR UPDATE USING (public.is_admin());

-- ===================== PAYMENTS =====================
CREATE POLICY "select_payments_own" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.user_id = auth.uid())
  );
CREATE POLICY "select_payments_admin" ON payments
  FOR SELECT USING (public.is_admin());
-- Insert/update handled by Edge Function (service_role_key)

-- ===================== PAYMENT_LOGS =====================
CREATE POLICY "select_payment_logs_admin" ON payment_logs
  FOR SELECT USING (public.is_admin());
-- Insert handled by Edge Function (service_role_key)

-- ===================== SHIPPING_ZONES =====================
CREATE POLICY "select_shipping_zones_public" ON shipping_zones
  FOR SELECT USING (true);
CREATE POLICY "insert_shipping_zones_admin" ON shipping_zones
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "update_shipping_zones_admin" ON shipping_zones
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "delete_shipping_zones_admin" ON shipping_zones
  FOR DELETE USING (public.is_admin());

-- ===================== SHIPPING_ZONE_COVERAGE =====================
CREATE POLICY "select_shipping_zone_coverage_public" ON shipping_zone_coverage
  FOR SELECT USING (true);
CREATE POLICY "insert_shipping_zone_coverage_admin" ON shipping_zone_coverage
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "delete_shipping_zone_coverage_admin" ON shipping_zone_coverage
  FOR DELETE USING (public.is_admin());

-- ===================== SHIPPING_RATES =====================
CREATE POLICY "select_shipping_rates_public" ON shipping_rates
  FOR SELECT USING (true);
CREATE POLICY "insert_shipping_rates_admin" ON shipping_rates
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "update_shipping_rates_admin" ON shipping_rates
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "delete_shipping_rates_admin" ON shipping_rates
  FOR DELETE USING (public.is_admin());

-- ===================== DISTRICTS =====================
CREATE POLICY "select_districts_public" ON districts
  FOR SELECT USING (true);
CREATE POLICY "all_districts_admin" ON districts
  FOR ALL USING (public.is_admin());

-- ===================== PRODUCT_REVIEWS =====================
-- Public read approved reviews
CREATE POLICY "select_product_reviews_public" ON product_reviews
  FOR SELECT USING (status = 'approved' OR auth.uid() = user_id OR public.is_admin());
CREATE POLICY "insert_product_reviews_auth" ON product_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.id = order_item_id
        AND o.user_id = auth.uid()
    )
  );
-- Admin can update (moderate)
CREATE POLICY "update_product_reviews_admin" ON product_reviews
  FOR UPDATE USING (public.is_admin());

-- ===================== REVIEW_MEDIA =====================
CREATE POLICY "select_review_media_public" ON review_media
  FOR SELECT USING (true);
CREATE POLICY "insert_review_media_auth" ON review_media
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM product_reviews WHERE product_reviews.id = review_media.review_id AND product_reviews.user_id = auth.uid())
  );

-- ===================== REVIEW_REPLIES =====================
CREATE POLICY "select_review_replies_public" ON review_replies
  FOR SELECT USING (true);
CREATE POLICY "insert_review_replies_admin" ON review_replies
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "update_review_replies_admin" ON review_replies
  FOR UPDATE USING (public.is_admin());

-- ===================== PRODUCT_RATING_SUMMARY =====================
CREATE POLICY "select_product_rating_summary_public" ON product_rating_summary
  FOR SELECT USING (true);
-- Updates handled by trigger (SECURITY DEFINER)

-- ===================== BANNERS =====================
CREATE POLICY "select_banners_public" ON banners
  FOR SELECT USING (true);
CREATE POLICY "insert_banners_admin" ON banners
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "update_banners_admin" ON banners
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "delete_banners_admin" ON banners
  FOR DELETE USING (public.is_admin());

-- ===================== LANDING_PAGES =====================
CREATE POLICY "select_landing_pages_public" ON landing_pages
  FOR SELECT USING (true);
CREATE POLICY "insert_landing_pages_admin" ON landing_pages
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "update_landing_pages_admin" ON landing_pages
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "delete_landing_pages_admin" ON landing_pages
  FOR DELETE USING (public.is_admin());

-- ===================== REDIRECTS =====================
CREATE POLICY "select_redirects_public" ON redirects
  FOR SELECT USING (true);
CREATE POLICY "insert_redirects_admin" ON redirects
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "update_redirects_admin" ON redirects
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "delete_redirects_admin" ON redirects
  FOR DELETE USING (public.is_admin());

-- ===================== SITE_SETTINGS =====================
CREATE POLICY "select_site_settings_public" ON site_settings
  FOR SELECT USING (true);
CREATE POLICY "update_site_settings_admin" ON site_settings
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "insert_site_settings_admin" ON site_settings
  FOR INSERT WITH CHECK (public.is_admin());

-- ===================== ADMIN_ACTIVITY_LOGS =====================
CREATE POLICY "select_admin_activity_logs_admin" ON admin_activity_logs
  FOR SELECT USING (public.is_admin());
CREATE POLICY "insert_admin_activity_logs_admin" ON admin_activity_logs
  FOR INSERT WITH CHECK (public.is_admin());

-- ===================== NOTIFICATION_TEMPLATES =====================
CREATE POLICY "select_notification_templates_admin" ON notification_templates
  FOR SELECT USING (public.is_admin());
CREATE POLICY "insert_notification_templates_admin" ON notification_templates
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "update_notification_templates_admin" ON notification_templates
  FOR UPDATE USING (public.is_admin());

-- ===================== NOTIFICATIONS =====================
CREATE POLICY "select_notifications_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "update_notifications_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- Insert handled by triggers/RPC (SECURITY DEFINER)
CREATE POLICY "select_notifications_admin" ON notifications
  FOR SELECT USING (public.is_admin());

-- ===================== RETURN_REQUESTS =====================
CREATE POLICY "select_return_requests_own" ON return_requests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_return_requests_own" ON return_requests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_id AND orders.user_id = auth.uid()
    )
  );
CREATE POLICY "select_return_requests_admin" ON return_requests
  FOR SELECT USING (public.is_admin());
CREATE POLICY "update_return_requests_admin" ON return_requests
  FOR UPDATE USING (public.is_admin());

-- ===================== RETURN_ITEMS =====================
CREATE POLICY "select_return_items_own" ON return_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM return_requests WHERE return_requests.id = return_items.return_request_id AND return_requests.user_id = auth.uid())
  );
CREATE POLICY "insert_return_items_own" ON return_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM return_requests WHERE return_requests.id = return_items.return_request_id AND return_requests.user_id = auth.uid())
  );
CREATE POLICY "select_return_items_admin" ON return_items
  FOR SELECT USING (public.is_admin());

-- ===================== RETURN_MEDIA =====================
CREATE POLICY "select_return_media_own" ON return_media
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM return_requests WHERE return_requests.id = return_media.return_request_id AND return_requests.user_id = auth.uid())
  );
CREATE POLICY "insert_return_media_own" ON return_media
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM return_requests WHERE return_requests.id = return_media.return_request_id AND return_requests.user_id = auth.uid())
  );
CREATE POLICY "select_return_media_admin" ON return_media
  FOR SELECT USING (public.is_admin());

-- ===================== STOCK_NOTIFICATIONS =====================
CREATE POLICY "select_stock_notifications_own" ON stock_notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_stock_notifications_own" ON stock_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_stock_notifications_own" ON stock_notifications
  FOR DELETE USING (auth.uid() = user_id);

-- ===================== SEARCH_LOGS =====================
-- Insert open for any user (auth optional)
CREATE POLICY "insert_search_logs_public" ON search_logs
  FOR INSERT WITH CHECK (true);
CREATE POLICY "select_search_logs_admin" ON search_logs
  FOR SELECT USING (public.is_admin());

-- ===================== RATE_LIMIT_LOGS =====================
-- Managed by SECURITY DEFINER functions only
-- No direct user access
CREATE POLICY "all_rate_limit_logs_admin" ON rate_limit_logs
  FOR ALL USING (public.is_admin());
