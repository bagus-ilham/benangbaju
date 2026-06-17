-- =============================================================
-- Seed Data — Benangbaju E-Commerce (Sprint 1)
-- Run with: supabase db reset (auto-run seed.sql)
-- =============================================================

-- -------------------------------------------------------
-- 1. Categories
-- -------------------------------------------------------
INSERT INTO categories (id, name, slug, description, sort_order, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Hijab', 'hijab', 'Koleksi hijab premium dengan berbagai model dan bahan berkualitas', 1, true),
  ('a1000000-0000-0000-0000-000000000002', 'Gamis', 'gamis', 'Gamis syari dan modern untuk berbagai kesempatan', 2, true),
  ('a1000000-0000-0000-0000-000000000003', 'Mukena', 'mukena', 'Mukena travel dan premium dengan bahan adem', 3, true),
  ('a1000000-0000-0000-0000-000000000004', 'Khimar', 'khimar', 'Khimar instan dan bergo untuk aktivitas sehari-hari', 4, true),
  ('a1000000-0000-0000-0000-000000000005', 'Aksesori', 'aksesori', 'Inner hijab, bros, ciput, dan aksesori lainnya', 5, true)
ON CONFLICT (slug) DO NOTHING;

-- Sub-categories
INSERT INTO categories (id, parent_id, name, slug, description, sort_order, is_active) VALUES
  ('a1100000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Hijab Pashmina', 'hijab-pashmina', 'Hijab pashmina berbagai bahan', 1, true),
  ('a1100000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Hijab Segi Empat', 'hijab-segi-empat', 'Hijab segi empat premium', 2, true),
  ('a1100000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Hijab Instan', 'hijab-instan', 'Hijab instan praktis tanpa peniti', 3, true),
  ('a1100000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'Gamis Syari', 'gamis-syari', 'Gamis syari dengan set khimar', 1, true),
  ('a1100000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'Gamis Casual', 'gamis-casual', 'Gamis casual untuk sehari-hari', 2, true)
ON CONFLICT (slug) DO NOTHING;

-- -------------------------------------------------------
-- 2. Collections
-- -------------------------------------------------------
INSERT INTO collections (id, name, slug, description, sort_order, is_active) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'New Arrivals', 'new-arrivals', 'Koleksi terbaru Benangbaju', 1, true),
  ('b1000000-0000-0000-0000-000000000002', 'Best Seller', 'best-seller', 'Produk terlaris pilihan pelanggan', 2, true),
  ('b1000000-0000-0000-0000-000000000003', 'Edisi Lebaran 2026', 'edisi-lebaran-2026', 'Koleksi spesial Lebaran 2026', 3, true)
ON CONFLICT (slug) DO NOTHING;

-- -------------------------------------------------------
-- 3. Sample Products
-- -------------------------------------------------------

-- Product 1: Hijab Pashmina Crinkle
INSERT INTO products (id, category_id, name, slug, description, short_description, weight_gram, is_active, is_featured, meta_title, meta_description) VALUES
  ('c1000000-0000-0000-0000-000000000001',
   'a1100000-0000-0000-0000-000000000001',
   'Pashmina Crinkle Premium',
   'pashmina-crinkle-premium',
   'Pashmina crinkle premium dengan bahan berkualitas tinggi. Tekstur crinkle yang cantik memberikan volume alami tanpa perlu di-setrika. Bahan adem, ringan, dan tidak mudah kusut. Cocok untuk daily wear maupun acara formal.

Spesifikasi:
- Bahan: Cotton Crinkle Premium
- Ukuran: 180cm x 75cm
- Finishing: Laser cut edges
- Perawatan: Cuci tangan dengan air dingin',
   'Pashmina crinkle premium bahan cotton, adem dan tidak mudah kusut.',
   150,
   true, true,
   'Pashmina Crinkle Premium - Benangbaju',
   'Beli Pashmina Crinkle Premium berkualitas tinggi. Bahan cotton adem, tidak mudah kusut. Cocok untuk daily wear.')
ON CONFLICT (slug) DO NOTHING;

-- Variants for Product 1
INSERT INTO product_variants (id, product_id, sku, name, price, compare_price, stock, weight_gram, is_active) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'BB-PCR-DUSTYPINK', 'Dusty Pink', 89000, 125000, 50, 150, true),
  ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'BB-PCR-SAGE', 'Sage Green', 89000, 125000, 35, 150, true),
  ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'BB-PCR-MOCCA', 'Mocca', 89000, 125000, 40, 150, true),
  ('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'BB-PCR-BLACK', 'Black', 89000, 125000, 60, 150, true),
  ('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001', 'BB-PCR-NAVY', 'Navy', 89000, 125000, 45, 150, true)
ON CONFLICT (sku) DO NOTHING;

-- Variant Attrs for Product 1
INSERT INTO product_variant_attrs (variant_id, attr_name, attr_value) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Warna', 'Dusty Pink'),
  ('d1000000-0000-0000-0000-000000000002', 'Warna', 'Sage Green'),
  ('d1000000-0000-0000-0000-000000000003', 'Warna', 'Mocca'),
  ('d1000000-0000-0000-0000-000000000004', 'Warna', 'Black'),
  ('d1000000-0000-0000-0000-000000000005', 'Warna', 'Navy');

-- Images for Product 1
INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES
  ('c1000000-0000-0000-0000-000000000001', '/images/products/pashmina-crinkle-1.jpg', 'Pashmina Crinkle Premium - Dusty Pink', 0, true),
  ('c1000000-0000-0000-0000-000000000001', '/images/products/pashmina-crinkle-2.jpg', 'Pashmina Crinkle Premium - Detail Bahan', 1, false),
  ('c1000000-0000-0000-0000-000000000001', '/images/products/pashmina-crinkle-3.jpg', 'Pashmina Crinkle Premium - Model', 2, false);

-- Marketplace links for Product 1
INSERT INTO product_marketplace_links (product_id, platform, url, label, sort_order) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'shopee', 'https://shopee.co.id/benangbaju/pashmina-crinkle', 'Cek di Shopee', 0),
  ('c1000000-0000-0000-0000-000000000001', 'tiktok', 'https://tiktok.com/shop/benangbaju/pashmina-crinkle', 'Cek di TikTok Shop', 1);

-- Product 2: Gamis Ayana
INSERT INTO products (id, category_id, name, slug, description, short_description, weight_gram, is_active, is_featured, meta_title, meta_description) VALUES
  ('c1000000-0000-0000-0000-000000000002',
   'a1100000-0000-0000-0000-000000000004',
   'Gamis Ayana Set Khimar',
   'gamis-ayana-set-khimar',
   'Gamis Ayana set khimar dengan desain elegan dan detail renda halus. Bahan Wollycrepe premium yang jatuh dan tidak menerawang. Dilengkapi dengan khimar pet antem yang matching.

Spesifikasi:
- Bahan: Wollycrepe Premium
- Gamis: Busui friendly (resleting depan), tali pinggang, saku kanan-kiri
- Khimar: Pet antem, panjang sebatas dada
- Perawatan: Bisa dicuci mesin (gentle cycle)',
   'Gamis syari set khimar bahan wollycrepe premium, busui friendly.',
   650,
   true, true,
   'Gamis Ayana Set Khimar - Benangbaju',
   'Beli Gamis Ayana Set Khimar premium. Bahan wollycrepe, busui friendly, set khimar pet antem.')
ON CONFLICT (slug) DO NOTHING;

-- Variants for Product 2 (size + color)
INSERT INTO product_variants (id, product_id, sku, name, price, compare_price, stock, weight_gram, is_active) VALUES
  ('d2000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'BB-GAK-MAROON-S', 'Maroon - S', 285000, 350000, 20, 650, true),
  ('d2000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'BB-GAK-MAROON-M', 'Maroon - M', 285000, 350000, 25, 680, true),
  ('d2000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 'BB-GAK-MAROON-L', 'Maroon - L', 285000, 350000, 15, 700, true),
  ('d2000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000002', 'BB-GAK-DUSTYPINK-S', 'Dusty Pink - S', 285000, 350000, 18, 650, true),
  ('d2000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', 'BB-GAK-DUSTYPINK-M', 'Dusty Pink - M', 285000, 350000, 22, 680, true),
  ('d2000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002', 'BB-GAK-DUSTYPINK-L', 'Dusty Pink - L', 285000, 350000, 12, 700, true),
  ('d2000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000002', 'BB-GAK-ARMY-M', 'Army Green - M', 285000, 350000, 30, 680, true),
  ('d2000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000002', 'BB-GAK-ARMY-L', 'Army Green - L', 285000, 350000, 20, 700, true)
ON CONFLICT (sku) DO NOTHING;

-- Variant Attrs for Product 2
INSERT INTO product_variant_attrs (variant_id, attr_name, attr_value) VALUES
  ('d2000000-0000-0000-0000-000000000001', 'Warna', 'Maroon'),
  ('d2000000-0000-0000-0000-000000000001', 'Ukuran', 'S'),
  ('d2000000-0000-0000-0000-000000000002', 'Warna', 'Maroon'),
  ('d2000000-0000-0000-0000-000000000002', 'Ukuran', 'M'),
  ('d2000000-0000-0000-0000-000000000003', 'Warna', 'Maroon'),
  ('d2000000-0000-0000-0000-000000000003', 'Ukuran', 'L'),
  ('d2000000-0000-0000-0000-000000000004', 'Warna', 'Dusty Pink'),
  ('d2000000-0000-0000-0000-000000000004', 'Ukuran', 'S'),
  ('d2000000-0000-0000-0000-000000000005', 'Warna', 'Dusty Pink'),
  ('d2000000-0000-0000-0000-000000000005', 'Ukuran', 'M'),
  ('d2000000-0000-0000-0000-000000000006', 'Warna', 'Dusty Pink'),
  ('d2000000-0000-0000-0000-000000000006', 'Ukuran', 'L'),
  ('d2000000-0000-0000-0000-000000000007', 'Warna', 'Army Green'),
  ('d2000000-0000-0000-0000-000000000007', 'Ukuran', 'M'),
  ('d2000000-0000-0000-0000-000000000008', 'Warna', 'Army Green'),
  ('d2000000-0000-0000-0000-000000000008', 'Ukuran', 'L');

-- Images for Product 2
INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES
  ('c1000000-0000-0000-0000-000000000002', '/images/products/gamis-ayana-1.jpg', 'Gamis Ayana Set Khimar - Maroon', 0, true),
  ('c1000000-0000-0000-0000-000000000002', '/images/products/gamis-ayana-2.jpg', 'Gamis Ayana Set Khimar - Detail', 1, false);

-- Product 3: Mukena Travelling
INSERT INTO products (id, category_id, name, slug, description, short_description, weight_gram, is_active, is_featured, meta_title, meta_description) VALUES
  ('c1000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000003',
   'Mukena Travel Premium Parasut',
   'mukena-travel-premium-parasut',
   'Mukena travel premium dengan bahan parasut micro yang super ringan dan tidak menerawang. Dilengkapi tas travel matching. Mudah dilipat dan praktis dibawa bepergian.

Spesifikasi:
- Bahan: Parasut Micro Premium
- Berat: hanya 300 gram
- Termasuk: Tas travel matching
- Perawatan: Cuci tangan',
   'Mukena travel super ringan bahan parasut micro, lengkap dengan tas.',
   300,
   true, false,
   'Mukena Travel Premium Parasut - Benangbaju',
   'Beli Mukena Travel Premium bahan parasut micro. Super ringan hanya 300 gram, termasuk tas travel.')
ON CONFLICT (slug) DO NOTHING;

-- Variants for Product 3
INSERT INTO product_variants (id, product_id, sku, name, price, compare_price, stock, weight_gram, is_active) VALUES
  ('d3000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'BB-MTP-WHITE', 'Putih', 165000, 210000, 40, 300, true),
  ('d3000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 'BB-MTP-SOFTPINK', 'Soft Pink', 165000, 210000, 30, 300, true),
  ('d3000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 'BB-MTP-LILAC', 'Lilac', 165000, 210000, 25, 300, true)
ON CONFLICT (sku) DO NOTHING;

-- Variant Attrs for Product 3
INSERT INTO product_variant_attrs (variant_id, attr_name, attr_value) VALUES
  ('d3000000-0000-0000-0000-000000000001', 'Warna', 'Putih'),
  ('d3000000-0000-0000-0000-000000000002', 'Warna', 'Soft Pink'),
  ('d3000000-0000-0000-0000-000000000003', 'Warna', 'Lilac');

-- Images for Product 3
INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES
  ('c1000000-0000-0000-0000-000000000003', '/images/products/mukena-travel-1.jpg', 'Mukena Travel Premium Parasut - Putih', 0, true);

-- -------------------------------------------------------
-- 4. Collection Products (link products to collections)
-- -------------------------------------------------------
INSERT INTO collection_products (collection_id, product_id, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 1), -- Pashmina → New Arrivals
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 2), -- Gamis → New Arrivals
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 1), -- Pashmina → Best Seller
  ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 1), -- Gamis → Edisi Lebaran
  ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 2)  -- Mukena → Edisi Lebaran
ON CONFLICT DO NOTHING;

-- =============================================================
-- SPRINT 2 SEED DATA
-- =============================================================

-- -------------------------------------------------------
-- 5. Shipping Zones
-- -------------------------------------------------------
INSERT INTO shipping_zones (id, name, description, is_active) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'Pulau Jawa', 'Seluruh Pulau Jawa', true),
  ('e1000000-0000-0000-0000-000000000002', 'Sumatera', 'Seluruh Pulau Sumatera', true),
  ('e1000000-0000-0000-0000-000000000003', 'Kalimantan', 'Seluruh Pulau Kalimantan', true),
  ('e1000000-0000-0000-0000-000000000004', 'Sulawesi & Bali-NTB-NTT', 'Sulawesi, Bali, NTB, NTT', true),
  ('e1000000-0000-0000-0000-000000000005', 'Papua & Maluku', 'Papua dan Maluku', true)
ON CONFLICT DO NOTHING;

-- Zone Coverage
INSERT INTO shipping_zone_coverage (zone_id, province_name) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'DKI Jakarta'),
  ('e1000000-0000-0000-0000-000000000001', 'Jawa Barat'),
  ('e1000000-0000-0000-0000-000000000001', 'Jawa Tengah'),
  ('e1000000-0000-0000-0000-000000000001', 'Jawa Timur'),
  ('e1000000-0000-0000-0000-000000000001', 'DI Yogyakarta'),
  ('e1000000-0000-0000-0000-000000000001', 'Banten'),
  ('e1000000-0000-0000-0000-000000000002', 'Sumatera Utara'),
  ('e1000000-0000-0000-0000-000000000002', 'Sumatera Barat'),
  ('e1000000-0000-0000-0000-000000000002', 'Sumatera Selatan'),
  ('e1000000-0000-0000-0000-000000000002', 'Riau'),
  ('e1000000-0000-0000-0000-000000000002', 'Lampung'),
  ('e1000000-0000-0000-0000-000000000002', 'Aceh'),
  ('e1000000-0000-0000-0000-000000000002', 'Jambi'),
  ('e1000000-0000-0000-0000-000000000002', 'Bengkulu'),
  ('e1000000-0000-0000-0000-000000000002', 'Kepulauan Riau'),
  ('e1000000-0000-0000-0000-000000000002', 'Kepulauan Bangka Belitung'),
  ('e1000000-0000-0000-0000-000000000003', 'Kalimantan Barat'),
  ('e1000000-0000-0000-0000-000000000003', 'Kalimantan Timur'),
  ('e1000000-0000-0000-0000-000000000003', 'Kalimantan Selatan'),
  ('e1000000-0000-0000-0000-000000000003', 'Kalimantan Tengah'),
  ('e1000000-0000-0000-0000-000000000003', 'Kalimantan Utara'),
  ('e1000000-0000-0000-0000-000000000004', 'Sulawesi Selatan'),
  ('e1000000-0000-0000-0000-000000000004', 'Sulawesi Utara'),
  ('e1000000-0000-0000-0000-000000000004', 'Sulawesi Tengah'),
  ('e1000000-0000-0000-0000-000000000004', 'Sulawesi Tenggara'),
  ('e1000000-0000-0000-0000-000000000004', 'Gorontalo'),
  ('e1000000-0000-0000-0000-000000000004', 'Sulawesi Barat'),
  ('e1000000-0000-0000-0000-000000000004', 'Bali'),
  ('e1000000-0000-0000-0000-000000000004', 'Nusa Tenggara Barat'),
  ('e1000000-0000-0000-0000-000000000004', 'Nusa Tenggara Timur'),
  ('e1000000-0000-0000-0000-000000000005', 'Papua'),
  ('e1000000-0000-0000-0000-000000000005', 'Papua Barat'),
  ('e1000000-0000-0000-0000-000000000005', 'Maluku'),
  ('e1000000-0000-0000-0000-000000000005', 'Maluku Utara')
ON CONFLICT DO NOTHING;

-- Shipping Rates
INSERT INTO shipping_rates (zone_id, courier_name, price_per_kg, min_weight_gram, base_price, etd_days_min, etd_days_max, is_active) VALUES
  -- Pulau Jawa
  ('e1000000-0000-0000-0000-000000000001', 'JNE REG', 9000, 1000, 9000, 1, 3, true),
  ('e1000000-0000-0000-0000-000000000001', 'JNE YES', 18000, 1000, 18000, 1, 1, true),
  ('e1000000-0000-0000-0000-000000000001', 'J&T Express', 9000, 1000, 9000, 1, 3, true),
  ('e1000000-0000-0000-0000-000000000001', 'SiCepat REG', 9000, 1000, 9000, 1, 2, true),
  -- Sumatera
  ('e1000000-0000-0000-0000-000000000002', 'JNE REG', 15000, 1000, 15000, 2, 5, true),
  ('e1000000-0000-0000-0000-000000000002', 'J&T Express', 14000, 1000, 14000, 2, 4, true),
  ('e1000000-0000-0000-0000-000000000002', 'SiCepat REG', 14000, 1000, 14000, 2, 4, true),
  -- Kalimantan
  ('e1000000-0000-0000-0000-000000000003', 'JNE REG', 20000, 1000, 20000, 3, 6, true),
  ('e1000000-0000-0000-0000-000000000003', 'J&T Express', 18000, 1000, 18000, 3, 5, true),
  -- Sulawesi & Bali-NTB-NTT
  ('e1000000-0000-0000-0000-000000000004', 'JNE REG', 22000, 1000, 22000, 3, 7, true),
  ('e1000000-0000-0000-0000-000000000004', 'J&T Express', 20000, 1000, 20000, 3, 6, true),
  -- Papua & Maluku
  ('e1000000-0000-0000-0000-000000000005', 'JNE REG', 45000, 1000, 45000, 5, 14, true)
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------
-- 6. Sample Districts (minimal for development)
-- -------------------------------------------------------
INSERT INTO districts (province_name, city_name, district_name, postal_code, zone_id) VALUES
  ('DKI Jakarta', 'Jakarta Selatan', 'Kebayoran Baru', '12110', 'e1000000-0000-0000-0000-000000000001'),
  ('DKI Jakarta', 'Jakarta Selatan', 'Tebet', '12810', 'e1000000-0000-0000-0000-000000000001'),
  ('DKI Jakarta', 'Jakarta Pusat', 'Menteng', '10310', 'e1000000-0000-0000-0000-000000000001'),
  ('DKI Jakarta', 'Jakarta Pusat', 'Tanah Abang', '10250', 'e1000000-0000-0000-0000-000000000001'),
  ('Jawa Barat', 'Bandung', 'Coblong', '40132', 'e1000000-0000-0000-0000-000000000001'),
  ('Jawa Barat', 'Bandung', 'Lengkong', '40261', 'e1000000-0000-0000-0000-000000000001'),
  ('Jawa Barat', 'Bogor', 'Bogor Tengah', '16124', 'e1000000-0000-0000-0000-000000000001'),
  ('Jawa Tengah', 'Semarang', 'Semarang Tengah', '50136', 'e1000000-0000-0000-0000-000000000001'),
  ('Jawa Timur', 'Surabaya', 'Gubeng', '60281', 'e1000000-0000-0000-0000-000000000001'),
  ('DI Yogyakarta', 'Yogyakarta', 'Gondokusuman', '55225', 'e1000000-0000-0000-0000-000000000001'),
  ('Sumatera Utara', 'Medan', 'Medan Kota', '20111', 'e1000000-0000-0000-0000-000000000002'),
  ('Sumatera Barat', 'Padang', 'Padang Barat', '25118', 'e1000000-0000-0000-0000-000000000002'),
  ('Bali', 'Denpasar', 'Denpasar Selatan', '80228', 'e1000000-0000-0000-0000-000000000004'),
  ('Sulawesi Selatan', 'Makassar', 'Makassar', '90111', 'e1000000-0000-0000-0000-000000000004'),
  ('Kalimantan Timur', 'Samarinda', 'Samarinda Kota', '75112', 'e1000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------
-- 7. Site Settings
-- -------------------------------------------------------
INSERT INTO site_settings (key, value, type, "group", label) VALUES
  -- General
  ('store_name', 'Benangbaju', 'text', 'general', 'Nama Toko'),
  ('store_tagline', 'Fashion Muslim Premium Indonesia', 'text', 'general', 'Tagline'),
  ('store_address', 'Jakarta, Indonesia', 'text', 'general', 'Alamat Toko'),
  ('store_phone', '08123456789', 'text', 'general', 'Nomor Telepon'),
  ('store_email', 'cs@benangbaju.com', 'text', 'general', 'Email'),
  ('store_whatsapp', '628123456789', 'text', 'general', 'WhatsApp'),
  ('store_logo_url', '/images/logo.png', 'image', 'general', 'Logo'),
  ('store_favicon_url', '/images/favicon.ico', 'image', 'general', 'Favicon'),
  -- SEO
  ('seo_title', 'Benangbaju — Fashion Muslim Premium Indonesia', 'text', 'seo', 'SEO Title'),
  ('seo_description', 'Belanja hijab, gamis, mukena, dan aksesori muslim premium dengan harga terbaik. Gratis ongkir Pulau Jawa.', 'text', 'seo', 'SEO Description'),
  ('seo_keywords', 'hijab premium, gamis syari, mukena travel, fashion muslim, busana muslim', 'text', 'seo', 'SEO Keywords'),
  ('seo_og_image', '/images/og-image.jpg', 'image', 'seo', 'OG Image'),
  -- Social
  ('social_instagram', 'https://instagram.com/benangbaju', 'text', 'social', 'Instagram'),
  ('social_tiktok', 'https://tiktok.com/@benangbaju', 'text', 'social', 'TikTok'),
  ('social_facebook', '', 'text', 'social', 'Facebook'),
  ('social_youtube', '', 'text', 'social', 'YouTube'),
  -- Shipping
  ('shipping_free_threshold', '300000', 'number', 'shipping', 'Free Ongkir Minimum (Rp)'),
  ('shipping_free_zones', '["e1000000-0000-0000-0000-000000000001"]', 'json', 'shipping', 'Free Ongkir Zones'),
  -- Payment
  ('payment_expiry_hours', '24', 'number', 'payment', 'Batas Waktu Pembayaran (jam)')
ON CONFLICT (key) DO NOTHING;

-- -------------------------------------------------------
-- 8. Notification Templates
-- -------------------------------------------------------
INSERT INTO notification_templates (name, subject, html_body, is_active) VALUES
  ('order_created', 'Pesanan Anda #{{order_number}} Berhasil Dibuat',
   '<h2>Pesanan Berhasil Dibuat!</h2><p>Halo {{customer_name}},</p><p>Pesanan Anda <strong>#{{order_number}}</strong> berhasil dibuat dengan total <strong>Rp {{total_amount}}</strong>.</p><p>Silakan lakukan pembayaran dalam <strong>24 jam</strong> agar pesanan tidak otomatis dibatalkan.</p><p>Terima kasih telah berbelanja di Benangbaju!</p><br><p>— Tim Benangbaju</p>', true),

  ('payment_success', 'Pembayaran Pesanan #{{order_number}} Berhasil',
   '<h2>Pembayaran Berhasil!</h2><p>Halo {{customer_name}},</p><p>Pembayaran untuk pesanan <strong>#{{order_number}}</strong> sebesar <strong>Rp {{total_amount}}</strong> telah kami terima.</p><p>Pesanan Anda sedang diproses dan akan segera dikirim.</p><br><p>— Tim Benangbaju</p>', true),

  ('order_shipped', 'Pesanan #{{order_number}} Sedang Dikirim!',
   '<h2>Pesanan Sedang Dikirim!</h2><p>Halo {{customer_name}},</p><p>Pesanan <strong>#{{order_number}}</strong> telah dikirim via <strong>{{courier_name}}</strong>.</p><p>Nomor Resi: <strong>{{tracking_number}}</strong></p><p>Silakan lacak pengiriman Anda melalui website kurir.</p><br><p>— Tim Benangbaju</p>', true),

  ('order_delivered', 'Pesanan #{{order_number}} Telah Sampai',
   '<h2>Pesanan Telah Diterima!</h2><p>Halo {{customer_name}},</p><p>Pesanan <strong>#{{order_number}}</strong> telah sampai.</p><p>Jika Anda puas dengan pesanan, jangan lupa berikan review ya! ⭐</p><p>Jika ada masalah, Anda dapat mengajukan retur dalam 7 hari.</p><br><p>— Tim Benangbaju</p>', true),

  ('order_cancelled', 'Pesanan #{{order_number}} Dibatalkan',
   '<h2>Pesanan Dibatalkan</h2><p>Halo {{customer_name}},</p><p>Pesanan <strong>#{{order_number}}</strong> telah dibatalkan.</p><p>Alasan: {{cancel_reason}}</p><p>Silakan buat pesanan baru jika Anda masih ingin berbelanja.</p><br><p>— Tim Benangbaju</p>', true)
ON CONFLICT (name) DO NOTHING;

-- -------------------------------------------------------
-- 9. Sample Banners
-- -------------------------------------------------------
INSERT INTO banners (title, subtitle, image_url, link_url, position, sort_order, is_active) VALUES
  ('Koleksi Lebaran 2026', 'Tampil cantik & syari di Hari Raya', '/images/banners/banner-lebaran.jpg', '/koleksi/edisi-lebaran-2026', 'homepage_hero', 1, true),
  ('Flash Sale Jumat!', 'Diskon hingga 50% setiap hari Jumat', '/images/banners/banner-flash-sale.jpg', '/flash-sale', 'homepage_hero', 2, true),
  ('New Arrivals', 'Koleksi terbaru minggu ini', '/images/banners/banner-new-arrivals.jpg', '/koleksi/new-arrivals', 'homepage_hero', 3, true)
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------
-- 10. Sample Voucher
-- -------------------------------------------------------
INSERT INTO vouchers (code, name, discount_type, value, min_purchase, max_discount, usage_limit, usage_per_user, is_active, starts_at, expires_at) VALUES
  ('WELCOME10', 'Welcome Discount 10%', 'percentage', 10, 100000, 50000, 100, 1, true, '2026-01-01 00:00:00+07', '2026-12-31 23:59:59+07'),
  ('FREEONGKIR', 'Free Ongkir Jawa', 'fixed', 15000, 150000, NULL, 500, 3, true, '2026-01-01 00:00:00+07', '2026-12-31 23:59:59+07')
ON CONFLICT (code) DO NOTHING;
