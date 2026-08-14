-- ==============================================================================
-- SCRIPT RESET DATA TESTING (PENJUALAN, RATING, & LOG)
-- ==============================================================================
-- PERHATIAN:
-- Script ini akan MENGHAPUS seluruh data transaksi testing, ulasan/rating,
-- keranjang belanja, serta log aktivitas.
-- 
-- DATA YANG AMAN (TIDAK DIHAPUS):
-- 1. Master Produk (products)
-- 2. Varian Produk (product_variants & product_variant_attrs)
-- 3. Galeri Foto Produk (product_images)
-- 4. Kategori & Koleksi (categories, collections, collection_products)
-- 5. User Profiles & Alamat (profiles, user_addresses)
-- 6. Pengaturan Banner, Setting Site, Ongkir, Voucher Master, Flash Sale Master
-- ==============================================================================

BEGIN;

-- 1. Hapus Data Retur Pembelian
TRUNCATE TABLE return_media CASCADE;
TRUNCATE TABLE return_items CASCADE;
TRUNCATE TABLE return_requests CASCADE;

-- 2. Hapus Data Pembayaran & Log Pembayaran
TRUNCATE TABLE payment_logs CASCADE;
TRUNCATE TABLE payments CASCADE;

-- 3. Hapus Data Pengiriman & Item Pesanan
TRUNCATE TABLE order_shipping CASCADE;
TRUNCATE TABLE voucher_usages CASCADE;
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;

-- 4. Hapus Data Keranjang & Lock Checkout
TRUNCATE TABLE cart_items CASCADE;
TRUNCATE TABLE carts CASCADE;
TRUNCATE TABLE checkout_locks CASCADE;

-- 5. Hapus Mutasi Stok (Log Histori Stok dari Testing)
TRUNCATE TABLE stock_mutations CASCADE;

-- 6. Hapus Data Rating & Ulasan Produk
TRUNCATE TABLE review_media CASCADE;
TRUNCATE TABLE review_replies CASCADE;
TRUNCATE TABLE product_reviews CASCADE;
TRUNCATE TABLE product_rating_summary CASCADE;

-- 7. Hapus Log Sistem & Aktivitas
TRUNCATE TABLE admin_activity_logs CASCADE;
TRUNCATE TABLE search_logs CASCADE;
TRUNCATE TABLE rate_limit_logs CASCADE;

-- 8. Hapus Notifikasi & Wishlist Testing
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE stock_notifications CASCADE;
TRUNCATE TABLE wishlist_items CASCADE;

-- 9. Reset Counter pada Tabel Master (Penggunaan Voucher & Terjual Flash Sale)
UPDATE vouchers SET used_count = 0;
UPDATE flash_sale_items SET sold_count = 0;

COMMIT;

-- Selesai. Data transaksi & testing bersih, data produk & katalog tetap utuh!
