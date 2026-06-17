# 📁 Project Structure — Benangbaju E-Commerce

> **Referensi:** [benangbaju_prd.md](file:///d:/Aulia%20Project/benangbaju_prd.md)

---

## Root Structure

```
benangbaju/
├── .env.local                        # Frontend env vars
├── .env.example                      # Template env
├── next.config.ts                    # Next.js config
├── tailwind.config.ts                # Tailwind CSS v4 config
├── tsconfig.json                     # TypeScript config
├── package.json
│
├── public/                           # Static assets
│   ├── favicon.ico
│   ├── logo.svg
│   └── images/
│
├── src/
│   ├── proxy.ts                      # Next.js 16 Proxy entrypoint (middleware)
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Homepage redirect
│   │   ├── sitemap.ts                # Dynamic sitemap
│   │   ├── robots.ts                 # Robots.txt
│   │   │
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── masuk/page.tsx
│   │   │   ├── daftar/page.tsx
│   │   │   ├── lupa-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   │
│   │   ├── (customer)/               # Customer route group
│   │   │   ├── layout.tsx            # Customer layout (header+footer)
│   │   │   ├── page.tsx              # Homepage
│   │   │   ├── produk/
│   │   │   │   ├── page.tsx          # Katalog produk
│   │   │   │   └── [slug]/page.tsx   # Detail produk
│   │   │   ├── kategori/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── koleksi/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── flash-sale/page.tsx
│   │   │   ├── search/page.tsx
│   │   │   ├── cart/page.tsx
│   │   │   ├── checkout/page.tsx
│   │   │   ├── pesanan/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [orderNumber]/page.tsx
│   │   │   ├── akun/
│   │   │   │   ├── page.tsx
│   │   │   │   └── alamat/page.tsx
│   │   │   ├── wishlist/page.tsx
│   │   │   ├── tentang/page.tsx
│   │   │   ├── kontak/page.tsx
│   │   │   ├── cara-belanja/page.tsx
│   │   │   ├── pengiriman/page.tsx
│   │   │   ├── retur/page.tsx
│   │   │   ├── syarat-ketentuan/page.tsx
│   │   │   └── kebijakan-privasi/page.tsx
│   │   │
│   │   └── admin/                    # Admin route group
│   │       ├── layout.tsx            # Admin layout (sidebar+topbar)
│   │       ├── page.tsx              # Dashboard
│   │       ├── produk/
│   │       ├── pesanan/
│   │       ├── kategori/
│   │       ├── koleksi/
│   │       ├── voucher/
│   │       ├── flash-sale/
│   │       ├── banner/
│   │       ├── review/
│   │       ├── stok/
│   │       ├── pengiriman/
│   │       ├── cms/
│   │       ├── pelanggan/
│   │       ├── pengaturan/
│   │       ├── retur/
│   │       └── activity-logs/
│   │
│   ├── components/
│   │   ├── layout/                   # Header, Footer, Navigation, Sidebar
│   │   ├── shared/                   # Button, Modal, Card, Input, etc.
│   │   ├── customer/                 # Customer-specific components
│   │   ├── product/                  # ProductCard, Gallery, VariantPicker
│   │   ├── admin/                    # Admin-specific components
│   │   ├── home/                     # Homepage sections
│   │   └── providers/                # SupabaseProvider, QueryProvider
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser Supabase client
│   │   │   ├── server.ts             # Server/RSC Supabase client
│   │   │   └── middleware.ts          # Supabase auth middleware
│   │   ├── midtrans/
│   │   │   └── snap.ts               # Midtrans Snap.js loader
│   │   ├── utils/
│   │   │   ├── format.ts             # Currency, date formatting
│   │   │   ├── shipping.ts           # Shipping calculation helpers
│   │   │   └── validation.ts         # Shared validation helpers
│   │   └── constants.ts              # App constants
│   │
│   ├── services/                     # Supabase query layer
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   ├── categories.ts
│   │   ├── collections.ts
│   │   ├── banners.ts
│   │   ├── cart.ts
│   │   ├── orders.ts
│   │   ├── shipping.ts
│   │   ├── vouchers.ts
│   │   ├── flashSales.ts
│   │   ├── reviews.ts
│   │   ├── notifications.ts
│   │   ├── users.ts
│   │   ├── admin.ts
│   │   └── cms.ts
│   │
│   ├── stores/                       # Zustand stores
│   │   ├── authStore.ts
│   │   ├── cartStore.ts
│   │   ├── wishlistStore.ts
│   │   ├── uiStore.ts
│   │   └── recentlyViewedStore.ts
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useCart.ts
│   │   ├── useProducts.ts
│   │   └── ...
│   │
│   ├── types/                        # TypeScript types
│   │   ├── database.ts               # Supabase generated types
│   │   ├── product.ts
│   │   ├── order.ts
│   │   ├── user.ts
│   │   └── ...
│   │
│   └── schemas/                      # Zod validation schemas
│       ├── auth.ts
│       ├── product.ts
│       ├── order.ts
│       ├── address.ts
│       └── ...
│
├── supabase/                         # Supabase project
│   ├── config.toml                   # Supabase local config
│   ├── seed.sql                      # Seed data
│   │
│   ├── migrations/                   # Database migrations
│   │   ├── 00001_create_profiles.sql
│   │   ├── 00002_create_categories.sql
│   │   ├── 00003_create_products.sql
│   │   ├── 00004_create_inventory.sql
│   │   ├── 00005_create_cart_wishlist.sql
│   │   ├── 00006_create_promotions.sql
│   │   ├── 00007_create_orders.sql
│   │   ├── 00008_create_payments.sql
│   │   ├── 00009_create_shipping.sql
│   │   ├── 00010_create_reviews.sql
│   │   ├── 00011_create_admin_cms.sql
│   │   ├── 00012_create_notifications.sql
│   │   ├── 00013_create_returns.sql
│   │   ├── 00014_create_search.sql
│   │   ├── 00015_create_stock_notifications.sql
│   │   ├── 00016_create_rls_policies.sql
│   │   ├── 00017_create_rpc_functions.sql
│   │   ├── 00018_create_triggers.sql
│   │   └── 00019_create_indexes.sql
│   │
│   └── functions/                    # Edge Functions (Deno)
│       ├── midtrans-webhook/
│       │   └── index.ts
│       ├── generate-payment/
│       │   └── index.ts
│       ├── send-email/
│       │   └── index.ts
│       └── generate-invoice/
│           └── index.ts
│
├── tests/
│   ├── unit/                         # Vitest unit tests
│   ├── integration/                  # RPC + RLS tests
│   ├── e2e/                          # Playwright E2E tests
│   └── fixtures/                     # Test seed data
│
└── docs/                             # Project documentation
    ├── 01_project_structure.md
    ├── 02_database_schema.md
    ├── 03_api_reference.md
    ├── 04_sprint_plan.md
    ├── 05_conventions.md
    ├── 06_environment_setup.md
    └── 07_deployment_guide.md
```

---

## Catatan Arsitektur

1. **App Router (Next.js 16)** — menggunakan route groups `(auth)`, `(customer)`, `admin/` untuk pemisahan layout
2. **Supabase** — semua backend logic ada di folder `supabase/` (migrations, edge functions)
3. **Services Layer** — `src/services/` sebagai abstraksi query ke Supabase, dipanggil dari hooks/components
4. **State Management** — Zustand stores di `src/stores/` dengan persist ke localStorage
5. **Types** — Auto-generated dari Supabase CLI (`supabase gen types`) + manual types
