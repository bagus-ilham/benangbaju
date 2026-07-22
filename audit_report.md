# Benangbaju — Full Feature Audit Report

> **Project**: Benangbaju (single-brand fashion e-commerce)
> **Stack**: Next.js 16.2 (App Router + Turbopack) + Supabase (PostgreSQL + Edge Functions + Storage) + TailwindCSS 4 + Zustand + React Query + Zod + DOKU Payment Gateway
> **Business model**: Single-brand fashion D2C e-commerce, Bandung-based streetwear brand, est. 2021
> **Audit date**: 2026-07-22 — Read-only pass, verified against actual implementation

---

## Section 1: Feature Inventory (What Exists Today)

### AUTH Domain
- **Email/password registration** — Complete. Route `/daftar`, Supabase Auth.
- **Email/password login** — Complete. Route `/masuk`.
- **Forgot password flow** — Complete. Route `/lupa-password`.
- **Password reset flow** — Complete. Route `/reset-password`.
- **Google OAuth sign-in** — Complete. `@react-oauth/google` dependency, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` env var, CSP allows `accounts.google.com`.
- **Auth state management** — Complete. Zustand store (`authStore.ts`) with persist middleware, `SupabaseProvider.tsx` listens to `onAuthStateChange`.
- **Role-based access** — Complete. `profiles.role` column (`customer` | `admin`). `requireAuth()` and `requireAdmin()` guards in [auth-guard.ts](file:///d:/Aulia%20Project/benangbaju/src/lib/auth-guard.ts).
- **Rate limiting on auth routes** — Complete. Middleware in [proxy.ts](file:///d:/Aulia%20Project/benangbaju/src/proxy.ts) limits `/masuk`, `/daftar`, `/lupa-password`, `/reset-password` to 5 req/min via `check_rate_limit` RPC.
- **Guest checkout** — NOT supported. Login is required before checkout (`requireAuth` on `createSecureOrderAction`).

### CATALOG / PRODUCTS Domain
- **Product listing with filters** — Complete. Filters by category slug, collection slug, search query, price range (min/max), product IDs. Sort: newest, featured, price-low, price-high, popular.
- **Product detail page** — Complete. Route `/produk/[slug]`. Includes description, short_description, size_guide, care_guide, meta SEO fields, variant attrs, marketplace links, rating summary.
- **Multi-variant products** — Complete. `product_variants` table with `product_variant_attrs` for named attributes (e.g. color, size). Variants have own SKU, price, compare_price, stock, weight.
- **Compare price / strike-through pricing** — Complete. `compare_price` column on variants; UI renders strikethrough.
- **Product images with sort order & primary flag** — Complete. `product_images` table, `is_primary`, `sort_order`, optional `variant_id` assignment.
- **Marketplace links** — Complete. `product_marketplace_links` table stores external links (Shopee, Tokopedia, etc.) per product.
- **Product rating summary** — Complete. `product_rating_summary` materialized table with avg_rating, total_reviews, breakdown by star, with_media_count.
- **Related products** — Complete. Fetched by same `category_id`, excluding current product.
- **Recently viewed products** — Complete. Client-side Zustand store (`recentlyViewedStore.ts`), persisted to localStorage, max 10 items. Rendered in `RecentlyViewedSection` on homepage.
- **Featured products** — Complete. `is_featured` boolean flag on products, sortable.
- **Product SEO** — Complete. `meta_title`, `meta_description` fields on products table and used in `generateMetadata`.
- **Full-text search** — Partial. `search_vector` column exists in DB schema, but product search in repository uses `ilike` on `name` only (not full-text search). Search overlay (`SearchOverlay.tsx`) is a rich UI component. Search logs table exists but **no code writes to `search_logs`**.
- **Admin product CRUD** — Complete. Create/update via transactional RPCs (`admin_create_product`, `admin_update_product`). Delete is hard delete. Toggle active/featured status.
- **Admin product image management via Supabase Storage** — Complete. `ProductImageManager.tsx` with CDN URL support.

### CATEGORIES Domain
- **Hierarchical categories** — Complete. `categories` table has `parent_id` self-referencing FK. Repository fetches all categories and code handles parent/child filtering.
- **Category listing page** — Complete. Route `/kategori`, `/kategori/[slug]`.
- **Admin category CRUD** — Complete. Service/repo/actions all wired.

### COLLECTIONS Domain
- **Curated product collections** — Complete. `collections` table with `collection_products` junction table. Has `starts_at`/`ends_at` for time-bounded collections.
- **Collection listing page** — Complete. Route `/koleksi`, `/koleksi/[slug]`.
- **Homepage spotlight collections** — Complete. `site_settings` keys `homepage_spotlight_collection_1` / `_2` configure which collections appear on homepage.
- **Admin collection CRUD** — Complete.

### CART Domain
- **Client-side cart** — Complete. Zustand store (`cartStore.ts`) with localStorage persistence (`benangbaju-cart`). Guest users get a local-only cart.
- **Server-side cart sync** — Complete. When authenticated, cart syncs to `carts`/`cart_items` tables via server actions. Merge or replace modes.
- **Debounced sync** — Complete. 1-second debounce on `debouncedSyncCart`.
- **Cart drawer (mini cart)** — Complete. `MiniCartDrawer.tsx` — slide-out drawer showing current items.
- **Stock-aware quantity limits** — Complete. `Math.min(quantity, stock)` enforced.
- **Cart page** — Complete. Route `/cart`.

### CHECKOUT / ORDERS Domain
- **Multi-step checkout** — Complete. Route `/checkout` with `CheckoutProgressBar`. Steps: address selection → shipping method → order summary → payment.
- **Checkout lock (double-submit prevention)** — Complete. `checkout_locks` table with TTL cleanup via `cleanup_checkout_locks` RPC. Database-backed idempotency.
- **TOCTOU mitigation** — Complete. Cart re-verified right before order creation in [actions.ts](file:///d:/Aulia%20Project/benangbaju/src/modules/orders/actions.ts#L178-L207).
- **Server-side shipping cost verification** — Complete. Client-provided shipping cost is overridden by server-calculated rate.
- **Order creation via RPC** — Complete. `create_order` database function handles atomic order creation, stock deduction, cart clearing.
- **Order notes** — Complete. Customer can add notes during checkout (max 200 chars); displayed in admin order detail.
- **Order listing with status filter** — Complete. Route `/pesanan`. Tabs for all/pending_payment/processing/shipped/completed/cancelled.
- **Order detail view** — Complete. Route `/pesanan/[orderNumber]`.
- **Order cancellation** — Complete. `cancel_order` RPC with reason. Customer-facing and admin-facing.
- **Delivery confirmation** — Complete. `confirm_delivery` RPC.
- **Lazy expired order cancellation** — Complete. `lazy_cancel_expired_orders` RPC called per-user on page load.
- **Order status state machine** — Complete. Terminal states (cancelled, completed, refunded) block further transitions. Validated in [order.repository.ts](file:///d:/Aulia%20Project/benangbaju/src/modules/orders/order.repository.ts#L194-L208).

### PAYMENT Domain
- **DOKU payment integration** — Complete. Payment token generation via Supabase Edge Function `generate-payment`. DOKU Checkout JS loaded dynamically via `useDokuCheckoutScript`.
- **Payment status checking** — Complete. `check-payment-status` Edge Function.
- **Payment logging** — Complete. `payment_logs` table stores raw payloads per event.
- **Idempotent payment requests** — Complete. `Idempotency-Key` header sent with `payment_{orderNumber}`.
- **Payment retry** — Complete. `invokeWithRetry` utility wraps Edge Function calls.

> [!WARNING]
> **Midtrans legacy artifacts**: The `payments` table still has columns named `midtrans_transaction_id`, `midtrans_order_id`, `midtrans_response` in the schema doc. A migration script exists at [08_midtrans_to_doku_migration.sql](file:///d:/Aulia%20Project/benangbaju/sql_scripts/08_midtrans_to_doku_migration.sql) to rename them, but the `supabase_schema.txt` still shows old names — unclear if migration has been applied. Order mapper in [order.mapper.ts](file:///d:/Aulia%20Project/benangbaju/src/modules/orders/order.mapper.ts#L69) has fallback: `p.gateway_order_id || p.midtrans_order_id`.

### SHIPPING Domain
- **Zone-based shipping rates** — Complete. `shipping_zones` → `shipping_zone_coverage` (province-level) → `shipping_rates` (per zone, per courier, weight-based pricing with base_price + price_per_kg).
- **District-level address resolution** — Complete. `districts` table with province, city, district, postal code, and `zone_id` FK.
- **User address management** — Complete. CRUD + set default. Route `/akun/alamat`.
- **District search** — Complete. Autocomplete search for addresses.
- **Shipping rate calculation** — Complete. `calculate_shipping_rates` RPC.
- **Admin shipping zone management** — Complete. CRUD for zones, zone coverage, rates.

### VOUCHER / DISCOUNT Domain
- **Voucher system** — Complete. Supports percentage and fixed discount types. Fields: `min_purchase`, `max_discount`, `usage_limit`, `usage_per_user`, `used_count`, `is_hidden`, `starts_at`, `expires_at`.
- **Voucher validation** — Complete. Server-side via `validateVoucher` RPC.
- **Voucher usage tracking** — Complete. `voucher_usages` table.
- **Admin voucher CRUD** — Complete.

### REVIEWS Domain
- **Customer review submission** — Complete. Tied to `order_item_id` for verified purchase. Supports title, body, rating (1–5), anonymous flag.
- **Review media upload** — Complete. `review_media` table, supports images and videos.
- **Review moderation** — Complete. Status: pending → approved / rejected / hidden. Admin UI in `/admin/review`.
- **Admin reply to reviews** — Complete. `review_replies` table, one reply per review (upsert on `review_id`).
- **Rating summary** — Complete. Pre-computed `product_rating_summary` table.
- **Pinned reviews** — Schema only. `is_pinned` boolean exists in DB but no UI to pin/unpin.
- **Helpful count** — Schema only. `helpful_count` column exists but no "was this helpful?" UI/action.

### WISHLIST Domain
- **Wishlist** — Complete. Zustand store (client-side) + DB sync for authenticated users via `wishlist_items` table. Toggle, clear, sync actions.
- **Wishlist page** — Complete. Route `/wishlist`. Shows saved products with "move all to cart" action.
- **Variant-level wishlist** — Partial. DB table has `variant_id` column, but store tracks only `product_id`.

### FLASH SALES Domain
- **Flash sale events** — Complete. `flash_sales` table with `starts_at`/`ends_at`, `is_active`, banner_url.
- **Flash sale items** — Complete. `flash_sale_items` with original_price, sale_price, discount_percent, quota, sold_count per variant.
- **Customer flash sale page** — Complete. Route `/flash-sale`, `FlashSaleSection` on homepage.
- **Admin flash sale CRUD** — Complete.

### BANNERS / CMS Domain
- **Homepage hero banners** — Complete. Position-based: `homepage_hero`, `mid_banner`. `starts_at`/`ends_at` for scheduling. Active flag.
- **Mid-page banners** — Complete. Filtered by `position === 'mid_banner'` on homepage.
- **Mobile-specific banner images** — Complete. `image_mobile_url` column.
- **Trust strip** — Complete. `TrustStrip` component on homepage.
- **Admin banner CRUD** — Complete.
- **URL redirects** — Complete. `redirects` table with from_path, to_path, status_code. Admin CMS UI.
- **Landing pages** — Partial. DB table exists, admin CRUD service/repo fully wired, admin CMS page has "Landing Pages" tab. But **no customer-facing route** renders landing page content from the DB.

### NOTIFICATIONS Domain
- **In-app notifications** — Complete. `notifications` table with type, title, message, is_read, data (JSONB).
- **User notification page** — Complete. Route `/akun/notifikasi`.
- **Mark read / mark all read** — Complete.
- **Notification templates** — Complete backend. Admin CRUD for `notification_templates` (name, subject, html_body). But **no code sends notifications using templates** — the template system is wired for admin CRUD but not for actual notification dispatch.

### RETURN / REFUND Domain
- **Return request submission** — Complete. `return_requests` table with reason, customer_notes, refund bank details.
- **Return items** — Complete. `return_items` table links specific order items to return request.
- **Return media** — Complete. `return_media` table for evidence photos.
- **Admin return management** — Complete. View requests, approve/reject/complete with admin notes and refund amount.
- **Return policy page** — Complete. Static content at `/retur`.

### USER ACCOUNT Domain
- **Profile page** — Complete. Route `/akun`.
- **Address management** — Complete. Route `/akun/alamat`.
- **Notification center** — Complete. Route `/akun/notifikasi`.
- **Admin customer management** — Complete. List customers, view detail, toggle active status.
- **Admin staff management** — Complete. Create staff accounts (with 12+ char password validation), update role/status, delete.

### ADMIN DASHBOARD / ANALYTICS Domain
- **Dashboard summary** — Complete. Revenue, active orders, completed orders, customer count, low stock warnings (< 5), recent orders, recent admin activity logs.
- **Quick stock update** — Complete. Inline stock editing from dashboard.
- **Analytics page** — Complete. Revenue trends chart (Recharts), top products, voucher usage stats, abandoned carts count.
- **Admin activity logs** — Complete. `admin_activity_logs` table, auto-logged on admin actions (product CRUD, review moderation, notification template changes).
- **Revenue dashboard RPC** — Complete. `get_dashboard_revenue`, `get_analytics_data` RPCs.

### ERP / EXTERNAL INTEGRATION Domain
- **Bulk stock sync API** — Complete. `POST /api/v1/inventory/sync` with API key auth (timing-safe comparison), accepts `{ updates: [{ sku, stock }] }`, calls `bulk_update_stock` RPC.
- **Stock mutations ledger** — Complete. `stock_mutations` table tracks in/out/adjustment/reserved/released with qty_before/qty_after.

### INFRASTRUCTURE / SECURITY
- **Middleware-level rate limiting** — Complete. Auth routes (5/min), API v1 (60/min). DB-backed via `rate_limit_logs` table + RPC.
- **Security headers** — Complete. CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, CORP.
- **Supabase RLS** — Assumed active (standard Supabase setup).
- **API versioning** — Complete. `/api/v1/` prefix, `x-api-version: 1.0` header.
- **OpenAPI/Swagger docs** — Complete. Route `/api-docs` with `swagger-ui-react`.

### SEO
- **Dynamic sitemap** — Complete. Products, categories, collections dynamically included.
- **robots.txt** — Complete. Blocks admin, account, cart, checkout, API.
- **JSON-LD structured data** — Complete. Organization + WebSite + SearchAction on homepage.
- **OpenGraph / Twitter meta** — Complete. Global + per-page metadata.

### UI / UX
- **Desktop mega-menu navigation** — Complete. `DesktopNavbar`, `MegaMenuNavItem`.
- **Mobile hamburger menu** — Complete. `MobileMenuDrawer`, `MobileMenuAccordionItem`.
- **Mobile bottom navigation bar** — Complete. `MobileBottomNav.tsx`.
- **Search overlay** — Complete. `SearchOverlay.tsx` (14KB, rich UI).
- **Scroll-to-top button** — Complete.
- **Scroll progress bar** — Complete.
- **Floating WhatsApp button** — Complete. `FloatingWhatsApp.tsx`.
- **View transitions** — Enabled. `experimental.viewTransition: true` in Next config.
- **Framer Motion animations** — Complete. Used throughout catalog and page transitions.
- **Custom toast notifications** — Complete. `CustomToast.tsx` with `react-hot-toast`.
- **Static info pages** — Complete. `/tentang`, `/kontak`, `/cara-belanja`, `/pengiriman`, `/retur`, `/syarat-ketentuan`, `/kebijakan-privasi`.

### TESTING
- **Vitest setup** — Present. `vitest.config.ts` configured. Test directories in `src/__tests__/`, `src/modules/cart/__tests__/`, `src/modules/orders/__tests__/`, `src/modules/products/__tests__/`, `src/modules/shipping/__tests__/`, `src/modules/vouchers/__tests__/`, `src/lib/__tests__/`.

---

## Section 2: Anomalies & Dead Code

### Critical Issues

- **Cart sync error in production** — Observed in dev server output: `Error syncing cart: { code: '42P10', message: 'there is no unique or exclusion constraint matching the ON CONFLICT specification' }`. The `upsertItems` in [cart.repository.ts](file:///d:/Aulia%20Project/benangbaju/src/modules/cart/cart.repository.ts) uses an upsert, but the `cart_items` table may be missing the required unique constraint on `(cart_id, variant_id)`. This is a **data integrity bug**.

- **Midtrans → DOKU migration incomplete** — The `payments` table schema file still shows `midtrans_*` column names. Migration SQL exists but `supabase_schema.txt` is stale or migration wasn't applied. The [order.mapper.ts](file:///d:/Aulia%20Project/benangbaju/src/modules/orders/order.mapper.ts#L69) has a fragile fallback (`p.gateway_order_id || p.midtrans_order_id`). The Next.js CSP still references `app.sandbox.midtrans.com` and `app.midtrans.com` in [next.config.ts](file:///d:/Aulia%20Project/benangbaju/next.config.ts#L78-L79).

### Dead/Orphaned Code

- **`stock_notifications` table** — Exists in DB schema with `is_notified`, `notified_at` fields. **Zero references** in application code outside auto-generated types. No UI, no action, no service touches it.

- **`search_logs` table** — Exists in DB schema. **Zero writes** anywhere in the codebase. The search functionality uses `ilike` queries but never logs searches.

- **`search_vector` column** — Products table has a `search_vector` column (for PostgreSQL tsvector full-text search), but product search uses `ilike` on `name` only. Full-text search is **not implemented**.

- **`payment_logs.midtrans_order_id`** — Schema still shows Midtrans column name. Likely should be `gateway_order_id`.

- **Landing pages customer route** — Admin can CRUD landing pages, but there is **no customer-facing `[slug]` route** to actually render them. The entire landing page feature is wired backend-only.

- **Notification templates dispatch** — Admin can create/edit/delete notification templates, but **no code actually uses these templates to send notifications**. The templates sit in the DB unused.

- **Review `helpful_count`** — Column exists in DB, fetched in review queries, but no "was this helpful?" button or increment action exists.

- **Review `is_pinned`** — Column exists, fetched in admin review list, but no admin UI to pin/unpin reviews.

- **Wishlist `variant_id`** — DB `wishlist_items` table has a `variant_id` FK, but the Zustand store only tracks `product_id`. Variant-level wishlisting is **not implemented**.

### Inconsistencies

- **`ORDER_STATUS.PAID` constant defined but not used** — [constants.ts](file:///d:/Aulia%20Project/benangbaju/src/lib/constants.ts#L5) defines `PAID = 'paid'` but the order flow jumps `pending_payment` → `processing`. No code ever sets status to `paid`.

- **`ORDER_STATUS.REFUNDED` constant** — Defined in constants, used as a terminal state check in repository, but no action or flow sets an order to `refunded` status. Returns set `completed` status, not `refunded`.

- **Missing React keys warning** — Dev server output shows "Each child in a list should have a unique key prop" from `PageContainer` / `ProductDetailPage`. Not a feature issue but indicates sloppy rendering.

- **`favicon.ico.bak`** — Backup file sitting in `/app/` directory. Should be cleaned up.

- **Google Analytics placeholder IDs** — `GA_MEASUREMENT_ID` and `GTM_CONTAINER_ID` default to `G-XXXXXXX` / `GTM-XXXXXXX` in layout. If not set in env, GA/GTM will fail silently.

- **`scripts/fix-admin-order.js` and `scripts/refactor.js`** — Maintenance scripts left in repo. Should be evaluated for removal.

### Security Observations

- **Admin dashboard uses `createBrowserClient()` for direct Supabase writes** — The admin dashboard page ([admin/page.tsx](file:///d:/Aulia%20Project/benangbaju/src/app/admin/page.tsx#L18)) creates a browser-side Supabase client and directly updates `product_variants` stock. This bypasses the server action pattern used elsewhere and may bypass RLS depending on policy configuration.

- **`CSP unsafe-inline unsafe-eval`** — Both are allowed in the script-src directive. While necessary for some integrations (DOKU, Google), this is a broad allowance.

---

## Section 3: Recommended Features

### Priority: HIGH (High Impact, Low-Medium Effort)

- **Feature: Fix cart upsert constraint bug**
  - Why: Active runtime error observed (`42P10` — no unique constraint for ON CONFLICT). Cart sync fails for logged-in users. Found in dev server output and traces to [cart.repository.ts](file:///d:/Aulia%20Project/benangbaju/src/modules/cart/cart.repository.ts) `upsertItems()`.
  - Effort: S
  - Dependency: DB migration to add `UNIQUE(cart_id, variant_id)` on `cart_items`.
  - Priority: **HIGH** — this is a production-breaking bug.

- **Feature: Wire notification template dispatch**
  - Why: Notification templates admin CRUD exists at [notification.service.ts](file:///d:/Aulia%20Project/benangbaju/src/modules/notifications/notification.service.ts#L23-L50), but nothing uses them to send actual notifications. The `notifications` table supports arbitrary types, so templated notifications on order status changes (paid, shipped, delivered) would be a quick win.
  - Effort: M
  - Dependency: Supabase Edge Function or DB trigger to render template and insert into `notifications` table.
  - Priority: **HIGH** — templates are already built, just need to plug them in.

- **Feature: Implement search logging**
  - Why: `search_logs` table exists (schema line 410–417) with `query`, `results_count`, `user_id` columns but **zero writes** anywhere. The `SearchOverlay.tsx` and `/search` page both perform searches but never log them. This is wasted analytics potential.
  - Effort: S
  - Dependency: One server action to insert into `search_logs` after search.
  - Priority: **HIGH** — trivial effort, high analytics value for understanding customer intent.

- **Feature: Clean up Midtrans legacy artifacts**
  - Why: CSP still allows Midtrans domains ([next.config.ts](file:///d:/Aulia%20Project/benangbaju/next.config.ts#L78-L79)). Payment columns still use `midtrans_*` names in schema. Order mapper has fragile fallback. This creates confusion and widens the attack surface.
  - Effort: S
  - Dependency: Verify migration `08_midtrans_to_doku_migration.sql` has been applied; update CSP; update schema file.
  - Priority: **HIGH** — security and code hygiene.

### Priority: MEDIUM (Moderate Impact, Medium Effort)

- **Feature: Render customer-facing landing pages**
  - Why: Admin can CRUD landing pages ([cms.service.ts](file:///d:/Aulia%20Project/benangbaju/src/modules/cms/cms.service.ts#L27-L46)), `landing_pages` table has `slug`, `content` (JSONB), `meta_title`, `meta_description`. But no customer-facing route exists. This is 80% built.
  - Effort: M
  - Dependency: Create `/(customer)/[slug]/page.tsx` that fetches landing page by slug and renders JSONB content. Add to sitemap.
  - Priority: **MEDIUM** — unlocks marketing page capabilities without code for every campaign.

- **Feature: Full-text search using search_vector**
  - Why: `products.search_vector` column exists in the schema (line 269). Currently search uses `ilike` on `name` only ([product.repository.ts](file:///d:/Aulia%20Project/benangbaju/src/modules/products/product.repository.ts#L77)), which misses description matches and is slower at scale.
  - Effort: M
  - Dependency: Populate `search_vector` via DB trigger (likely already exists in init SQL). Update repository to use `textSearch` or `phraseto_tsquery`.
  - Priority: **MEDIUM** — improves search quality significantly.

- **Feature: "Was this helpful?" on reviews**
  - Why: `product_reviews.helpful_count` column exists (schema line 64), is fetched and rendered in review UI. But there's no increment action or button. Adding a "helpful" vote button is a quick UX win.
  - Effort: S
  - Dependency: One server action + RPC to atomically increment. Rate-limit votes per user.
  - Priority: **MEDIUM** — improves social proof and review quality signal.

- **Feature: Admin pin/unpin reviews**
  - Why: `product_reviews.is_pinned` column exists (schema line 62), is fetched in admin review list. No admin UI to toggle it, and no customer-facing sort by pinned. Pinning best reviews improves conversion.
  - Effort: S
  - Dependency: Add toggle button in admin review page; sort pinned reviews first in customer view.
  - Priority: **MEDIUM** — quick win for curating social proof.

- **Feature: Stock notification ("notify me when back in stock")**
  - Why: `stock_notifications` table exists with `user_id`, `variant_id`, `is_notified`, `notified_at` (schema lines 198–207). **Zero application code** references it. This is a common D2C feature that captures demand for OOS products.
  - Effort: M
  - Dependency: Button on product detail page for OOS variants; background job or DB trigger to send notification when stock increases.
  - Priority: **MEDIUM** — captures lost demand.

### Priority: LOW (Nice to Have, or Larger Effort)

- **Feature: Guest checkout**
  - Why: Currently login is enforced before checkout (`requireAuth` in [actions.ts](file:///d:/Aulia%20Project/benangbaju/src/modules/orders/actions.ts#L124)). Guest checkout would reduce friction for first-time buyers. The cart already works locally for guests.
  - Effort: L
  - Dependency: Major refactor — order creation, shipping, and payment flows all assume `user_id`. Would need a "guest" account flow or deferred registration.
  - Priority: **LOW** — significant effort, and forced registration captures customer data.

- **Feature: Order notes visibility in customer order detail**
  - Why: The `orders.notes` column is writable at checkout and visible in admin order detail ([admin/pesanan/[orderNumber]/page.tsx](file:///d:/Aulia%20Project/benangbaju/src/app/admin/pesanan/%5BorderNumber%5D/page.tsx#L208-L211)). But the customer order detail page does **not display** the notes the customer submitted. Minor UX gap.
  - Effort: S
  - Dependency: Add `order.notes` display in `OrderDetailClient.tsx`.
  - Priority: **LOW** — trivial effort but low impact.

- **Feature: Variant-level wishlisting**
  - Why: DB `wishlist_items` has `variant_id` FK (schema line 165–166), but the Zustand store only tracks `product_id`. If a user wants a specific size/color, this isn't captured.
  - Effort: M
  - Dependency: Update wishlist store, toggle action, and wishlist page to handle variant selection.
  - Priority: **LOW** — product-level wishlist is sufficient for most fashion use cases.

- **Feature: Admin analytics export**
  - Why: Analytics dashboard shows revenue trends, top products, voucher usage in the UI. But there's no CSV/Excel export capability. Common admin need.
  - Effort: M
  - Dependency: Generate CSV server-side or client-side from existing data.
  - Priority: **LOW** — useful for reporting but not critical.

---

## Section 4: Open Questions

> [!IMPORTANT]
> **1. Has the Midtrans → DOKU migration SQL been applied to production?**
> The file [08_midtrans_to_doku_migration.sql](file:///d:/Aulia%20Project/benangbaju/sql_scripts/08_midtrans_to_doku_migration.sql) renames `midtrans_*` columns, but `supabase_schema.txt` still shows old names. If the migration HAS been applied, the schema file is stale and should be regenerated. If it HAS NOT been applied, the order mapper's fallback logic is actively necessary.

> [!IMPORTANT]
> **2. Are there Supabase Edge Functions not visible in this codebase?**
> Order creation calls `generate-payment` and `check-payment-status` Edge Functions, and there's a `bulk_update_stock` RPC plus many other RPCs (`create_order`, `cancel_order`, `confirm_delivery`, `lazy_cancel_expired_orders`, `check_rate_limit`, `get_dashboard_revenue`, `get_analytics_data`, `calculate_shipping_rates`). These are all server-side. Are these defined in a separate `supabase/functions/` directory not included in this workspace?

> [!WARNING]
> **3. Is the admin dashboard's direct Supabase client usage intentional?**
> [admin/page.tsx line 18](file:///d:/Aulia%20Project/benangbaju/src/app/admin/page.tsx#L18) creates a `createBrowserClient()` and directly updates `product_variants` stock. This bypasses server actions and may not be covered by RLS. Is this a deliberate shortcut or should it be migrated to a server action?

> **4. What is the expected behavior for the `PAID` order status?**
> `ORDER_STATUS.PAID` is defined in constants but never set by any code path. The flow goes `pending_payment` → `processing` (presumably after payment webhook). Should this constant be removed, or is there a planned use?

> **5. Are the `scripts/fix-admin-order.js` and `scripts/refactor.js` still needed?**
> These appear to be one-time maintenance scripts. Should they be removed from the repo?

> **6. Is `image_mobile_url` on banners actively used?**
> The field exists and is in the admin banner form, but I need to verify the `HeroSection` component actually uses it for responsive image rendering or if it falls back to `image_url`.
