# Spesifikasi & Rencana Implementasi Pasar Malaysia (`MY`) — Benangbaju

> **Versi 2.1 (Final).** Menggabungkan aturan finansial & snapshot dari Versi 2 (Opus) dengan perbaikan rumus aritmetika sen bulat (bebas *floating-point bug*) dan penyelarasan Flash Sale di Tahap 1 sesuai struktur kode asli.

Dokumen ini merangkum fitur, aturan bisnis, dan perbaikan lintas tabel yang **disetujui** untuk pasar Malaysia (`MY`), dipisahkan secara tegas dari pasar Indonesia (`ID`).

---

## 0. Aturan Inti (Wajib Dipatuhi di Semua Fitur)

Aturan ini adalah fondasi. Semua fitur di bawah **harus** mengikuti aturan ini agar harga di katalog, keranjang, checkout, database, dan DOKU selalu sama.

### R1 — Rumus Harga Malaysia Berbasis Sen Bulat (Satu-satunya Sumber Kebenaran)

Mata uang transaksi di gateway tetap **IDR** (DOKU QRIS menagih Rupiah). Harga `RM` adalah **daftar harga resmi Malaysia** yang dihitung dalam satuan **sen bulat (`1 RM = 100 sen`)** agar 100% bebas selisih *floating-point* antara TypeScript dan PostgreSQL:

```
base_idr        = harga dasar varian (atau sale_price flash sale) dalam IDR
raw_sen         = ROUND((base_idr × (100 + my_price_markup_percent)) / myr_exchange_rate)
final_sen       = pembulatan sen sesuai my_price_rounding (lihat R2)
price_myr       = final_sen / 100
charged_idr     = base_idr                                      (jika markup = 0 dan rounding = 'none')
                = ROUND((final_sen × myr_exchange_rate) / 100)  (jika markup > 0 atau rounding != 'none')
```

Contoh (`myr_exchange_rate = 3600`, `my_price_markup_percent = 15`, `my_price_rounding = 'x.90'`):
- `base_idr = Rp 250.000`
- `raw_sen = ROUND((250000 × 115) / 3600) = 7986` sen (`RM 79.86`)
- `final_sen = 7990` sen (**`RM 79.90`**)
- `charged_idr = ROUND((7990 × 3600) / 100)` = **Rp 287.640**

- Rumus ini diimplementasikan **di satu helper TypeScript** ([`src/lib/utils/pricing.ts`](./src/lib/utils/pricing.ts) → `getMyPrice()`) **dan satu fungsi SQL** (`public.get_my_price(base_idr)`) dengan logika integer yang identik.
- Client, [`src/modules/orders/actions.ts`](./src/modules/orders/actions.ts), RPC `create_order` (pada kedua loop item), `validate_voucher`, dan komponen Flash Sale **wajib** memanggil helper/fungsi ini — dilarang menghitung manual.
- Disertai unit test yang membandingkan output TS vs rumus SQL untuk ≥ 50 sampel harga dan edge-case.

### R2 — Pembulatan Cantik (*Psychological Pricing*) Tanpa Bug Loncatan

- Setting baru `my_price_rounding`: `'none'` (default awal saat rilis) | `'x.90'` | `'whole'`.
- Pembulatan menggunakan pembagian integer pada `raw_sen` (bukan `CEIL` floating-point) sehingga angka yang sudah pas (misal `79.90` atau `80.00`) tidak meloncat ke Ringgit berikutnya:
  - `'none'`: `final_sen = raw_sen`
  - `'x.90'`: `final_sen = FLOOR((raw_sen + 9) / 100) * 100 + 90` (contoh: `7986 → 7990`, `7990 → 7990`, `7991 → 8090`)
  - `'whole'`: `final_sen = FLOOR((raw_sen + 99) / 100) * 100` (contoh: `7986 → 8000`, `8000 → 8000`)
- Pada ringkasan harga `RM` di UI ditampilkan catatan transparan: *"Charged in IDR via QRIS. Your bank's rate may differ slightly."*

### R3 — Tampilan Ikut Market, Tagihan Ikut Alamat

| Konteks | Penentu harga |
| :--- | :--- |
| Katalog, Flash Sale, Detail Produk, Keranjang | `market` aktif (`ID` / `MY`) |
| Checkout & pembuatan pesanan (server) | `country_code` **alamat pengiriman** yang dipilih |

- Jika `country_code` alamat ≠ `market` aktif saat di halaman Checkout, sistem **otomatis menyamakan `market`** dengan negara alamat pengiriman dan menampilkan notifikasi: *"Harga disesuaikan dengan negara tujuan pengiriman."*
- Server **tidak pernah** mempercayai harga dari client; selalu menghitung ulang dari `country_code` alamat.

### R4 — Snapshot Kurs & Markup di Pesanan

Tabel `orders` dan `order_items` mendapat kolom baru yang diisi saat pesanan dibuat dan **tidak berubah lagi** walaupun Admin mengubah kurs/markup di kemudian hari:

| Tabel | Kolom Baru | Isi |
| :--- | :--- | :--- |
| `orders` | `exchange_rate_at_order` | Nilai `myr_exchange_rate` saat checkout (`NUMERIC(12,2)`) |
| `orders` | `markup_percent_at_order` | Nilai `my_price_markup_percent` saat checkout (`NUMERIC(5,2)`) |
| `orders` | `total_myr` | Total tagihan dalam `RM` saat checkout (`NUMERIC(12,2)`) |
| `order_items` | `unit_price_myr` | Harga satuan item dalam `RM` saat checkout (`NUMERIC(12,2)`) |

Invoice pelanggan, *Commercial Invoice* bea cukai, dan laporan historis **wajib** membaca dari kolom snapshot ini.

### R5 — Sinkronisasi Market Cookie (`bb_market`)

Cookie `bb_market` disinkronkan antara `src/proxy.ts` dan `marketStore.ts` tanpa memaksa halaman katalog statis menjadi *dynamic rendering* penuh, sehingga hidrasi client dan pembacaan server tetap konsisten dan cepat.

---

## 1. Ringkasan Fitur & Pembagian Tahap

| Kode | Fitur / Perbaikan | Modul / Tabel | Tahap | Status |
| :--- | :--- | :--- | :--- | :--- |
| **B1-1** | Mark-up Harga Global Malaysia + Snapshot Order (R1–R4) | `site_settings`, `orders`, `order_items`, RPC | 1 | ✅ Selesai |
| **B2-7** | Pembulatan Harga Cantik `RM` Berbasis Sen Bulat (R2) | `pricing.ts`, SQL | 1 | ✅ Selesai |
| **B3-1** | Reaktivitas Harga Keranjang (`base_idr`) & Perbaikan Re-order | `carts`, `cart_items`, `OrderDetailClient` | 1 | ✅ Selesai |
| **B2-1** | `RM` sebagai Harga Utama saat Mode `MY` (termasuk Flash Sale) | UI Katalog, Flash Sale, Cart, Checkout | 1 | ✅ Selesai |
| **B1-2** | Deskripsi Produk Bilingual + Auto-Translate (Gemini) | `products` | 2 | ✅ Selesai |
| **B2-2** | Geo-IP + Parameter `?market=MY` + Sinkronisasi Cookie (R5) | `proxy.ts`, `marketStore` | 2 | ✅ Selesai |
| **B2-4** | Pemisahan Link Marketplace (`ID` vs Shopee Malaysia) | `product_marketplace_links`, `site_settings` | 2 | ✅ Selesai |
| **B3-3** | Lokalisasi Profil/Registrasi & Badge Negara di Admin | `profiles` | 2 | ✅ Selesai |
| **B3-4** | Target Negara & Teks Bilingual pada Banner | `banners` | 2 | ✅ Selesai |
| **B2-13** | 5 Penyempurnaan Voucher `ID` vs `MY` | `vouchers` | 3 | ✅ Selesai |
| **B3-2** | Filter Target Negara Kampanye Flash Sale (`target_market`) | `flash_sales`, `FlashSaleSection` | 3 | ✅ Selesai |
| **B2-10** | Progress Bar Subsidi Ongkir Malaysia | `MiniCartDrawer`, `cart` | 3 | ✅ Selesai |
| **B2-5** | Info Bea Masuk/Pajak Malaysia (Netral) | Cart & Checkout | 3 | ✅ Selesai |
| **B2-12** | Panduan Pembayaran QRIS Cross-Border (DuitNow/TNG) | `PaymentMethodSelector` | 3 | ✅ Selesai |
| **B2-6** | Ekspansi East Malaysia (Sabah, Sarawak, Labuan) | `shipping_zones`, `user_addresses`, UI Statis | 4 | ✅ Selesai |
| **B2-9** | Kebijakan Final Sale (Non-Return) Malaysia | `return_requests`, `orders` | 4 | ✅ Selesai |
| **B2-11** | Commercial Invoice & Invoice Bilingual (dari Snapshot R4) | `orders`, Admin & Customer | 4 | ✅ Selesai |
| **B4-1** | Notifikasi Pesanan Bilingual (Email/WA/Restock) | `notification.service`, `stock_notifications` | 4 | ✅ Selesai |
| **B4-2** | Finishing UI: Sapaan WA & Ulasan Produk Bilingual | `FloatingWhatsApp`, `product_reviews` | 4 | ✅ Selesai |
| **B4-3** | Pemisahan Analitik per Market (`market` param) | `pixel.ts`, Admin Analytics | 4 | ✅ Selesai |
| *B2-3* | *Translasi Kategori & Nama Warna* | — | *Backlog* | *Backlog* |
| *B2-8* | *Konversi CM → Inci* | — | *Dilewati (Gambar)* | *Dilewati* |

---

## 2. Konfirmasi Bisnis Pendukung (Dapat Berjalan Paralel)

Setting memiliki nilai default aman (`my_price_markup_percent = 0`, `my_price_rounding = 'none'`), sehingga pengembangan **Tahap 1 dapat langsung dikerjakan** sambil pemilik bisnis menentukan parameter operasional berikut:

| # | Parameter / Konfirmasi | Default Awal di Sistem | Memengaruhi |
| :--- | :--- | :--- | :--- |
| P1 | Besaran `my_price_markup_percent` & opsi pembulatan (`none` / `x.90` / `whole`) | `0%` & `none` (diatur via Admin) | B1-1, B2-7 |
| P2 | URL resmi toko **Shopee Malaysia** (`shopee_my_url`) | Kosong (diatur via Admin) | B2-4 |
| P3 | Tarif ongkir zona **Malaysia Timur** (Sabah/Sarawak/Labuan) | Diatur via Admin Pengiriman | B2-6 |
| P4 | Skema bea masuk/LVG Malaysia (DDU — ditanggung pembeli saat barang tiba vs DDP) | Teks info netral DDU | B2-5, B2-11 |

---

## 3. Tahap 1 — Mesin Harga Malaysia, Flash Sale Price Sync, & Checkout

### B1-1 + B2-7 — Mark-up Global, Pembulatan Cantik, & Snapshot Database
* **Migrasi SQL [`sql_scripts/22_malaysia_step2_pricing.sql`](./sql_scripts/22_malaysia_step2_pricing.sql):**
  * Seed setting `my_price_markup_percent` (`'0'`) dan `my_price_rounding` (`'none'`).
  * Membuat fungsi SQL `public.get_my_price(p_base_idr BIGINT, p_markup_percent NUMERIC, p_exchange_rate NUMERIC, p_rounding TEXT)` sesuai rumus R1 & R2.
  * Menambahkan kolom snapshot R4 pada `public.orders` (`exchange_rate_at_order`, `markup_percent_at_order`, `total_myr`) dan `public.order_items` (`unit_price_myr`).
  * Memperbarui RPC `public.create_order`:
    * Membaca `myr_exchange_rate`, `my_price_markup_percent`, dan `my_price_rounding` dari `site_settings`.
    * Pada **kedua loop item** (loop kalkulasi `v_subtotal` dan loop `INSERT INTO public.order_items`), mengambil harga dasar (`regular_price` atau `flash_sale_items.sale_price`), lalu jika `v_address_country = 'MY'` menghitung `charged_idr` dan `price_myr` via `public.get_my_price()`.
    * Menyimpan snapshot kurs, markup, `total_myr`, dan `unit_price_myr`.
* **Helper TypeScript & Pengaturan Admin:**
  * Membuat [`src/lib/utils/pricing.ts`](./src/lib/utils/pricing.ts) (`getMyPrice`, `getDisplayPrice`, `formatMYR`) dan mengekspornya di [`src/lib/utils/index.ts`](./src/lib/utils/index.ts).
  * Mengekspos `myPriceMarkupPercent` dan `myPriceRounding` di [`src/shared/hooks/useSiteSettings.ts`](./src/shared/hooks/useSiteSettings.ts).
  * Menambahkan input `my_price_markup_percent` dan `my_price_rounding` di [`src/app/admin/pengaturan/components/SettingsForm.tsx`](./src/app/admin/pengaturan/components/SettingsForm.tsx) lengkap dengan simulasi harga real-time.
  * Memperbarui [`src/modules/orders/actions.ts`](./src/modules/orders/actions.ts) (`createSecureOrderAction`) agar menghitung `serverSubtotal` menggunakan `getMyPrice()` ketika `address.country_code === 'MY'`.

### B3-1 — Reaktivitas Harga Keranjang & Perbaikan Re-order
* [`src/modules/cart/stores/cartStore.ts`](./src/modules/cart/stores/cartStore.ts) dan [`src/modules/cart/cart.mapper.ts`](./src/modules/cart/cart.mapper.ts) selalu menyimpan **`base_idr`** (harga dasar IDR) pada `item.price` & `item.comparePrice`.
* [`src/modules/cart/cart.repository.ts`](./src/modules/cart/cart.repository.ts) & `cart.mapper.ts` juga memeriksa apakah varian memiliki promo Flash Sale aktif saat sinkronisasi keranjang.
* Tombol Re-order di [`src/app/(customer)/pesanan/[orderNumber]/OrderDetailClient.tsx`](./src/app/(customer)/pesanan/[orderNumber]/OrderDetailClient.tsx) mengambil harga dasar (`pv.price`), gambar, slug, dan stok terbaru langsung dari `product_variants` (bukan dari `order_items.price` lama yang sudah di-mark-up), serta memberi peringatan jika ada varian yang stoknya habis.

### B2-1 — `RM` sebagai Harga Utama saat Mode `MY` (Katalog, Flash Sale, Keranjang, Checkout)
* Memperbarui [`ProductCard.tsx`](./src/modules/products/components/ProductCard.tsx) (yang juga otomatis dipakai oleh [`FlashSaleSection.tsx`](./src/modules/flash-sales/components/FlashSaleSection.tsx)), [`ProductInfoSection.tsx`](./src/modules/products/components/ProductInfoSection.tsx), [`ProductStickyAction.tsx`](./src/modules/products/components/ProductStickyAction.tsx), [`MiniCartDrawer.tsx`](./src/shared/components/MiniCartDrawer.tsx), [`cart/page.tsx`](./src/app/(customer)/cart/page.tsx), [`checkout/page.tsx`](./src/app/(customer)/checkout/page.tsx), dan [`CheckoutSummaryCard.tsx`](./src/app/(customer)/checkout/components/CheckoutSummaryCard.tsx):
  * Saat mode `MY`: menampilkan **`RM XX.XX` sebagai harga utama (font besar/tebal)** dan `≈ Rp XXX.XXX` (nilai `chargedIdr`) sebagai informasi sekunder di bawahnya, dilengkapi catatan kurs R2.
  * Di [`checkout/page.tsx`](./src/app/(customer)/checkout/page.tsx): menerapkan aturan **R3** (menentukan harga dari `selectedAddress.country_code`, menyinkronkan `market` jika alamat ≠ market disertai toast info, dan meneruskan `displayItems` dengan harga yang sesuai ke `CheckoutSummaryCard`).

---

## 4. Tahap 2 — Konten Bilingual & Lokalisasi

### B1-2 — Deskripsi Produk Bilingual + Auto-Translate
* **Database:** kolom `short_description_en`, `description_en`, `care_guide_en` (nullable) di `products`.
* **Admin** ([`ProductGeneralInfoSection.tsx`](./src/modules/products/components/ProductGeneralInfoSection.tsx)): tab `🇮🇩 Indonesia` / `🇲🇾 English`, tombol **"Auto-Translate"**.
* **Mesin terjemahan:** Gemini API via server action, hasil masuk sebagai draf yang bisa diedit sebelum disimpan. *Bulk Translate* hanya mengisi produk yang field EN-nya masih kosong.
* **Customer:** [`ProductInfoSection.tsx`](./src/modules/products/components/ProductInfoSection.tsx) & [`ProductAccordionTabs.tsx`](./src/modules/products/components/ProductAccordionTabs.tsx) menampilkan versi EN saat `MY` (fallback ke ID jika kosong).

### B2-2 — Geo-IP, `?market=MY`, & Cookie Sync
* [`src/proxy.ts`](./src/proxy.ts): prioritas `?market=` → cookie `bb_market` → Geo-IP → default `ID`. Parameter `?market=` langsung memperbarui cookie (untuk link iklan Meta/TikTok Ads).

### B2-4 — Shopee Indonesia vs Shopee Malaysia
* [`ProductMarketplaceLinks.tsx`](./src/modules/products/components/ProductMarketplaceLinks.tsx): opsi platform **`Shopee Malaysia`** (`shopee_my`) + deteksi otomatis dari domain `shopee.com.my`.
* [`MarketplaceLinks.tsx`](./src/modules/products/components/MarketplaceLinks.tsx): mode `ID` → hanya link Indonesia; mode `MY` → hanya Shopee Malaysia (*"Buy on Shopee Malaysia"*).
* Setting `shopee_my_url`; ikon Shopee di [`Footer.tsx`](./src/shared/components/Footer.tsx) berganti URL sesuai market.

### B3-3 & B3-4 — Profil, Registrasi, & Banner per Market
* [`daftar/page.tsx`](./src/app/(auth)/daftar/page.tsx) & [`akun/page.tsx`](./src/app/(customer)/akun/page.tsx): placeholder `+6012...` saat `MY` dan lokalisasi label.
* [`admin/pelanggan/page.tsx`](./src/app/admin/pelanggan/page.tsx): badge `🇮🇩`/`🇲🇾` + tautan `wa.me`.
* Kolom `target_market` (`ALL` | `ID` | `MY`) di [`BannerFormModal.tsx`](./src/app/admin/banner/components/BannerFormModal.tsx) & [`HeroSection.tsx`](./src/modules/banners/components/HeroSection.tsx).

---

## 5. Tahap 3 — Promosi, Voucher & Pembayaran

* **B2-13 (5 Poin Voucher `ID` vs `MY`):** Fallback negara di checkout (`selectedAddress?.country_code || market`), tampilan potongan & `Min. Spend` dalam `RM`, validasi `min_purchase` terhadap subtotal mark-up, kalkulator preview `RM ⇄ Rp` di `VoucherFormModal.tsx`, dan tab filter negara di `admin/voucher/page.tsx`.
* **B3-2 (Target Negara Flash Sale):** Kolom `target_market` (`ALL` | `ID` | `MY`) pada `flash_sales` + filter di `FlashSaleSection.tsx` dan server.
* **B2-10 (Progress Bar Subsidi Ongkir Malaysia):** Progress bar dalam `RM` di `MiniCartDrawer.tsx` & `cart/page.tsx`.
* **B2-5 (Info Bea Masuk/Pajak RM 500 Netral):** Kotak informasi netral saat subtotal `MY` mendekati/melebihi RM 500 (*"Orders above RM 500 may be subject to Malaysian import duty and taxes upon arrival"*).
* **B2-12 (Panduan Visual QRIS Cross-Border):** Panduan langkah scan via **Touch 'n Go, Maybank MAE, CIMB Octo, DuitNow QR** di `PaymentMethodSelector.tsx`.

---

## 6. Tahap 4 — Logistik, Kebijakan, Dokumen & Finishing

* **B2-6 (East Malaysia):** Membuka kode pos `87000–98999`, menambah `Sabah`, `Sarawak`, `WP Labuan`, memisahkan zona Malaysia Barat vs Timur, serta memperbarui teks di `PengirimanClient.tsx` & `CaraBelanjaClient.tsx`.
* **B2-9 (Final Sale Malaysia):** Penegakan non-return untuk pesanan `MY` di UI dan penolakan di server `return_requests`.
* **B2-11 (Commercial Invoice & Invoice Bilingual):** Cetak *Commercial Invoice* bea cukai di `AdminOrderShippingPanel.tsx` dan invoice pelanggan bilingual di `OrderDetailClient.tsx` menggunakan data snapshot **R4**.
* **B4-1, B4-2, B4-3:** Template notifikasi bilingual (`notification.service.ts` & `stock_notifications`), pesan pre-filled EN di `FloatingWhatsApp.tsx`, lokalisasi `product_reviews`, serta parameter `market` pada `pixel.ts`.

---

## 7. Pengujian, Deploy & Rollback

* **Unit test:** Kesamaan hasil `getMyPrice()` (TypeScript) dengan rumus `public.get_my_price()` (SQL) untuk ≥ 50 sampel harga dan seluruh mode pembulatan (`none`, `x.90`, `whole`).
* **Rilis aman:** `my_price_markup_percent` default `0` dan `my_price_rounding` default `none`, sehingga deploy Tahap 1 tidak mengubah harga sampai Admin mengaktifkannya.
* **Migrasi SQL:** Setiap script `22_...` dilengkapi blok rollback mengikuti [`docs/ROLLBACK.md`](./docs/ROLLBACK.md).
