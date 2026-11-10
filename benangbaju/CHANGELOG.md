# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added - Malaysia Market Step 4 (Tahap 4: Logistik, Kebijakan, Dokumen & Finishing)

- **Database & Migration (`sql_scripts/25_malaysia_step4_logistics_docs.sql`)**:
  - Seeded Zone 7 (`e1000000-0000-0000-0000-000000000007`) for East Malaysia (Sabah, Sarawak, W.P. Labuan) with realistic base and additional rates (Rp 140.000 / 0.5kg + Rp 45.000 / 0.5kg).
  - Added database trigger `trg_prevent_malaysia_return_requests` on `return_requests` to strictly enforce the Final Sale policy at the database level.
  - Added `market` column (`'ID' | 'MY'`) to `stock_notifications` table.
  - Updated RPC `create_order` to support the full Malaysian postal code range `01000–98999` and strict state/postcode cross-validation.
  - Updated RPC `get_analytics_data` with `p_country_code` parameter and R4 `total_myr` revenue aggregation.
  - Included transactional rollback script.
- **East Malaysia Expansion & Logistics Postcode Cross-Validation (B2-6)**:
  - Added `MALAYSIA_EAST_STATES` and `MALAYSIA_STATES` constants to `src/lib/constants.ts`.
  - Created validation utilities `validateMalaysiaPostalCode` (`01000–98999`) and `validateMalaysiaStatePostalCodeMatch` in `src/lib/utils/validation.ts`.
  - Updated `AddressModal.tsx` with Malaysian state selector dropdown and real-time state vs postcode matching validation.
  - Localized logistics copywriting across `PengirimanClient.tsx`, `CaraBelanjaClient.tsx`, `CustomerLayout.tsx`, and admin `ShippingModals.tsx` to document Semenanjung (3-7 working days) vs Sabah/Sarawak (5-10 working days).
- **Final Sale / Non-Return Policy Enforcement (B2-9)**:
  - Updated `ReturnClient.tsx` checking both order country code and shipping address country code to block return requests for Malaysian orders with polite, clear English microcopy and direct WhatsApp assistance link.
  - Database trigger guard prevents circumventing UI restrictions.
- **Commercial & Customer Invoices Generator (B2-11)**:
  - Created `invoice-generator.ts` with `generateCustomerInvoiceHtml` (bilingual English with R4 MYR snapshots) and `generateCommercialInvoiceHtml` (customs declaration compliant with RM de minimis and HS code 6204.42 / 6204.49 for modest apparel).
  - Added "Cetak Commercial Invoice" button in Admin Order Detail (`AdminOrderShippingPanel.tsx`) and resilient customer invoice fallback.
- **Bilingual Lifecycle Notifications & Restock Alerts (B4-1)**:
  - Updated `notification.service.ts` to support the complete order lifecycle in English for Malaysian customers (`pending_payment`, `processing`, `shipped`, `delivered`, `completed`, `cancelled`).
  - Added `market` tracking in `toggleStockNotificationAction` and restock dispatch in `inventory.repository.ts` sending English notifications to customers who signed up in MY market.
- **Finishing UI Polish (B4-2)**:
  - Localized `FloatingWhatsApp.tsx` with English pre-filled message ("Hi Benangbaju, I'm reaching out from Malaysia...") and tooltip.
  - Localized `ReviewSection.tsx` and `OrderReviewModal.tsx` into English for Malaysian customers while preserving Indonesian default.
- **Analytics Segmentation by Market (B4-3)**:
  - Updated `pixel.ts` adding `market: 'ID' | 'MY'` payload to Meta Pixel, Google Analytics 4, and TikTok Pixel events (with currency locked to IDR for ad platform normalization).
  - Updated `analytics.ts` and `useAdminDashboard.ts` supporting `marketFilter` (`ALL`, `ID`, `MY`) and `revenueMyr`.
  - Added Market selector filter (`Semua Pasar`, `🇮🇩 Indonesia Saja`, `🇲🇾 Malaysia Saja`) and RM revenue badge in `AdminAnalyticsPage`.
- **Automated Testing**:
  - Added test suite `src/lib/utils/__tests__/tahap4-logistics-docs.test.ts` (10 tests). Total project test suite: 21 test files, 133 tests passing (100%).


### Added - Malaysia Market Step 3 (Tahap 3: Promosi, Voucher, & Pembayaran Malaysia)

- **Database & Migration (`sql_scripts/24_malaysia_step3_promotions_payment.sql`)**:
  - Added `target_market` (`'ALL'`, `'ID'`, `'MY'`) column to `flash_sales` table with check constraint and index.
  - Seeded `free_shipping_threshold_idr` (Rp 500.000) and `free_shipping_threshold_myr` (RM 150) in `site_settings`.
  - Updated RPC `admin_create_flash_sale` and `admin_update_flash_sale` to persist `target_market`.
  - Updated RPC `create_order` to enforce flash sale country targeting `(fs.target_market = 'ALL' OR fs.target_market = v_address_country)` on both subtotal & items loops.
  - Updated RPC `validate_voucher` with bilingual English error messages and dynamic RM minimum purchase estimation for Malaysia orders.
  - Included transactional rollback script.
- **Voucher ID vs MY (B2-13)**:
  - Validates `min_purchase` for Malaysia against marked-up `chargedIdr` so customers reach thresholds based on what they actually pay.
  - Real-time `≈ RM` estimation under `Nilai Potongan`, `Minimal Belanja`, and `Maksimal Potongan` in admin `VoucherFormModal.tsx`.
  - Added Malaysia Quick-Fill Flat RM buttons (`RM 10`, `RM 15`, `RM 20`, `RM 30`, `RM 50`) converting to exact IDR at the current store exchange rate.
  - Added Country Filter tabs in admin voucher management (`Semua`, `🌐 Global (ID & MY)`, `🇮🇩 Khusus ID`, `🇲🇾 Khusus MY`).
  - Fixed discount & min spend display in `CheckoutSummaryCard.tsx` to render in `RM` when `market === 'MY'`, with localized buttons (`Apply` / `Remove`).
  - Localized voucher toast notifications in `checkout/page.tsx`.
- **Target Market Flash Sale (B3-2)**:
  - Enforced `target_market` in `FlashSaleRepository`, `FlashSaleService`, `actions.ts`, and `createSecureOrderAction`.
  - Added `target_market` selector (`ALL`, `ID`, `MY`) and live RM preview in admin `FlashSaleFormModal.tsx`.
  - Added market badges (`🌐 ALL`, `🇮🇩 ID`, `🇲🇾 MY`) in `FlashSaleListTable.tsx`.
  - Filtered customer-facing `FlashSaleSection.tsx` to reactively show/hide flash sales matching current customer market (`ALL` or active market).
- **Free Shipping Progress Bar & De Minimis Customs Notice (B2-10 & B2-5)**:
  - Activated dynamic Free Shipping progress bar in `MiniCartDrawer.tsx` and `cart/page.tsx`:
    - In `MY` mode: tracks `totalMyr` against `freeShippingThresholdMyr` (RM 150) with English microcopy (`Add RM XX.XX more for Free Shipping to Malaysia` / `🎉 Free Shipping to Malaysia Unlocked`).
    - In `ID` mode: tracks `subtotal` against `freeShippingThresholdIdr` (Rp 500.000).
  - Added De Minimis customs notice card in `MiniCartDrawer.tsx`, `cart/page.tsx`, and `CheckoutSummaryCard.tsx` when `isMY && totalMyr >= 450` (neutral, non-alarming advisory regarding Malaysian Royal Customs RM 500 threshold and SST).
  - Added threshold configuration fields and live conversion previews in admin `SettingsForm.tsx`.
- **DuitNow QR / Cross-Border QRIS Visual Guidance (B2-12)**:
  - Redesigned payment selector card in `PaymentMethodSelector.tsx` for Malaysia checkout into a 4-step visual flow (1. Open Bank/E-Wallet, 2. Scan DuitNow QR, 3. Real-time MYR Rate, 4. Instant Verification).
  - Upgraded payment instructions in `OrderPaymentSection.tsx` for both direct QRIS display and hosted payment sessions with clear 4-step instructions in English/Indonesian.
- **Automated Testing**:
  - Added test suite `src/modules/promotions/__tests__/tahap3-promotions.test.ts` (10 tests) covering flash sale target market filtering, free shipping calculations, De Minimis thresholds, and voucher conversions. All 20 test files (122 tests) passing.

### Added - Malaysia Market Step 2 (Tahap 2: Konten Bilingual, Shopee Malaysia, & Lokalisasi Market)

- **Database & Migration (`sql_scripts/23_malaysia_step2_localization.sql`)**:
  - Added bilingual columns `short_description_en`, `description_en`, `care_guide_en` to `products` table.
  - Updated RPCs `public.admin_create_product` and `public.admin_update_product` to persist bilingual product fields.
  - Added `target_market` (`'ALL'`, `'ID'`, `'MY'`), `title_en`, and `subtitle_en` columns to `banners` table with fallback safety.
  - Seeded `shopee_my_url` setting in `site_settings`.
- **Bilingual Products & AI Auto-Translate (B1-2)**:
  - Added `src/modules/products/translate.actions.ts` (`translateProductContentAction`) utilizing Gemini API (`gemini-2.5-flash`) with modest fashion lexicon to auto-translate descriptions from Indonesian to English.
  - Added tab switcher (🇮🇩 Bahasa Indonesia / 🇲🇾 English) and "✨ Auto-Translate via AI" button in admin `ProductGeneralInfoSection.tsx`.
  - Updated `product.repository.ts`, `ProductInfoSection.tsx`, and `ProductAccordionTabs.tsx` to automatically render English descriptions when browsing with `market === 'MY'`, with seamless fallback to Indonesian.
- **Geo-IP & Parameter `?market=MY` (B2-2)**:
  - Updated `src/proxy.ts` middleware with priority cascading: `?market=MY/ID` query parameter sets 1-year `bb_market` cookie -> existing `bb_market` cookie -> Geo-IP detection (`x-vercel-ip-country` / `cf-ipcountry`).
  - Added client-side URL query parameter synchronization during hydration in `marketStore.ts`.
  - Added proxy unit test coverage for `?market=MY` and `?market=ID` parameter handling in `src/__tests__/proxy.test.ts`.
- **Shopee Malaysia & Marketplace Links (B2-4)**:
  - Added `shopee_my` platform support in `ProductMarketplaceLinks.tsx`, auto-detecting `shopee.com.my` links with localized label "Buy on Shopee Malaysia".
  - Market-aware filtering in `MarketplaceLinks.tsx`: hides Indonesian platforms (Tokopedia, Shopee ID, TikTok Shop ID) when viewing in `MY` market, displaying only Shopee Malaysia.
  - Added `shopee_my_url` field in Admin Settings (`SettingsForm.tsx`) and hook `useSiteSettings.ts`.
  - Updated customer `Footer.tsx` to link Shopee icon directly to Shopee Malaysia store when active market is `MY`.
- **Customer & Profile Localization (B3-3)**:
  - Updated registration form (`daftar/page.tsx`) with international phone placeholder `+6012xxxxxxxx` and bilingual microcopy.
  - Updated profile editing (`EditProfileForm.tsx`) with Malaysian phone placeholder `+60123456789`.
  - Added Malaysian customer badges (🇲🇾 MY / 🇮🇩 ID) and direct international WhatsApp formatting in Admin Customer Management (`src/app/admin/pelanggan/page.tsx` and `adminCustomer.repository.ts`).
- **Target Market Banners & Multilingual Hero Slides (B3-4)**:
  - Added `target_market` selector (`ALL`, `ID`, `MY`) and English bilingual fields (`title_en`, `subtitle_en`) in Admin Banner Management (`BannerFormModal.tsx`, `BannerListTable.tsx`, `admin/banner/page.tsx`).
  - Updated customer `HeroSection.tsx` and `MidBannerSection.tsx` with dynamic client-side market filtering and bilingual heading display based on `marketStore`.

### Added - Malaysia Market Step 2 (Tahap 1: Pricing Engine, Cart & Checkout Sync)

- **Pricing Engine**: Added `src/lib/utils/pricing.ts` providing integer-sen single source of truth calculations (`getMyPrice`, `roundSen`, `formatMYR`, `getDisplayPrice`).
- **Database & Migration**: Created `sql_scripts/22_malaysia_step2_pricing.sql` containing:
  - Settings seed for `my_price_markup_percent` and `my_price_rounding` in `site_settings`.
  - Snapshot columns `exchange_rate_at_order`, `markup_percent_at_order`, `total_myr` in `orders` and `unit_price_myr` in `order_items` (Rule R4).
  - PostgreSQL function `public.get_my_price` mirroring integer-sen rounding.
  - Updated RPC `public.create_order` applying Malaysia price mark-up on both subtotal loop and order items loop.
- **Admin Settings**: Added input fields and real-time live preview simulation for Malaysia mark-up and psychological rounding (`none`, `x.90`, `whole`) in `SettingsForm.tsx`.
- **Checkout & Cart Sync**:
  - Aligned server subtotal calculation in `createSecureOrderAction` to include Malaysia price mark-up when shipping country is `MY`.
  - Implemented Rule R3 in `checkout/page.tsx` (auto-sync market store with shipping destination address country with informative toast, without cyclic locks).
  - Preserved Flash Sale active promotion prices in cart repository and mapper (`base_idr` as sale price, `comparePrice` as original price).
  - Exact 1-sen synchronization in `CheckoutSummaryCard` item subtotal summation for Malaysia orders.
  - Primary `RM` display with secondary `Rp` charged IDR note across `ProductCard` (including `FlashSaleSection`), `ProductInfoSection`, `ProductStickyAction`, `MiniCartDrawer`, `cart/page.tsx`, and `CheckoutSummaryCard`.
- **Order Views & Snapshot Utilization**:
  - Integrated order snapshots (`total_myr`, `unit_price_myr`, `exchange_rate_at_order`, `markup_percent_at_order`) in `OrderDetailClient.tsx`, `OrderPaymentSection.tsx`, `OrderItemsList.tsx`, and Admin order panels (`AdminOrderPaymentPanel.tsx`, `AdminOrdersTable.tsx`).
- **Re-order Fix**: Updated `handleReorder` in `OrderDetailClient.tsx` to fetch fresh variant pricing, stocks, and details from database instead of stale order item prices.
- **Testing**: Added unit test suite `pricing.test.ts` covering 11 test cases and 60 random price samples.

### Added

- **Security**: Atomic rate limit RPC via `atomic_rate_limit.sql` to prevent race conditions in `proxy.ts`. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Security**: Transactional `replace_cart_items` RPC via `cart_replace_transaction.sql` for safe cart replacements. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Security**: RLS policy for `return_requests` via `return_requests_rls.sql` to protect bank data. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Security**: `getUser()` enforcement over `getSession()` in `admin-log.repository.ts`. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Security**: Removed signature leak logging in `midtrans-webhook`. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Observability**: Structured JSON logging in production via `logger.ts`. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Observability**: Created `docs/runbook.md` for Incident and Disaster Recovery. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Architecture**: Merged `actions/checkout.ts` into `actions.ts` for consistency. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Architecture**: Unified `benangbaju/.env.example` and removed root clone. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Schema**: Added `created_at` and `updated_at` to `order_shipping`. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Schema**: Casted monetary columns to `numeric` in `product_variants`, `flash_sale_items`, `shipping_rates`. ([#42](https://github.com/aulia/benangbaju/pull/42))

### Changed

- **Optimization**: Resolved N+1 query problem in `product.repository.ts` by removing serial fetches. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Optimization**: Extracted cart mapping logic in `cart.service.ts` to `mapDbCartItemToLocal`. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Bugfix**: Improved TOCTOU mitigation in checkout to check `variant_id` identity. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Bugfix**: Fixed `p_voucher_code` bug where empty string `""` became `undefined`. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Bugfix**: Refactored `voucher.repository.ts` to return raw data and removed `ApiResponse` mixing. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Security**: Tightened `next.config.ts` CSP by removing broad wildcards (`https://*`). ([#42](https://github.com/aulia/benangbaju/pull/42))

### Added (Previous)

- **Security**: Added PostgreSQL `CHECK` constraints via `add_check_constraints.sql` for money and dates. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Security**: Upgraded CSP in `next.config.ts` (removed `unsafe-eval`). ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Idempotency**: Added unique constraint via `webhook_idempotency.sql` to prevent duplicate payment webhooks. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Automation**: Added PostgreSQL trigger via `product_rating_trigger.sql` for auto-calculating review summaries. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **DX**: Added comprehensive `.env.example`. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **DX**: Added npm `setup`, `db:reset`, and `db:types` scripts. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Architecture**: Added standardized `components/`, `hooks/`, `actions/` structure across modules. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Utils**: Added unified `formatRupiah` in `src/shared/utils/currency.ts`. ([#42](https://github.com/aulia/benangbaju/pull/42))

### Changed

- **Rate Limiting**: Migrated from memory-based to Edge (Supabase) in `rate_limit.sql` and `proxy.ts`. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Security**: Hardened inventory sync API (`src/proxy.ts`) using `crypto.timingSafeEqual` to prevent timing attacks. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Resilience**: Added a 10-second global fetch timeout to Supabase Client and Server instances to fail fast during outages. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Bugfix**: Fixed 0-stock evaluation bug in `cart.service.ts` using `??` instead of `||`. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Bugfix**: Fixed `order.repository.ts` undefined variables mapping for Supabase RPCs. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Bugfix**: Added type casting validation in `order.service.ts` to prevent silent RPC failures. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Cleanup**: Moved JS scripts to `scripts/` directory. ([#42](https://github.com/aulia/benangbaju/pull/42))

### Removed

- **Type Safety**: Purged `any` types from Dashboard components and Supabase parsers. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Cleanup**: Removed unused Supabase client initializations in API routes to save edge resources. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Cleanup**: Removed dead backward compatibility exports from `product.service.ts`. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Dependencies**: Removed `ts-morph` from `devDependencies`. ([#42](https://github.com/aulia/benangbaju/pull/42))
