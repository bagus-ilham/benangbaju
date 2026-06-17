# Benangbaju — Project Instructions

> File ini WAJIB dibaca oleh AI assistant di setiap sesi untuk menjaga konsistensi.
> Terakhir diupdate: 9 Juni 2026

---

## 🏷️ Identitas Project

- **Nama:** Benangbaju Store
- **Tagline:** Fashion Muslim Premium Indonesia
- **Tipe:** E-commerce platform (single brand, web-only)
- **Versi:** v1.0 (MVP)
- **Bahasa UI:** Bahasa Indonesia
- **Target User:** Wanita muslim Indonesia (customer) + Tim operasional (admin)

---

## 📚 Dokumen Referensi

Sebelum mengerjakan apapun, baca dokumen yang relevan:

| Dokumen | Path | Kapan Dibaca |
|---------|------|-------------|
| **PRD Lengkap** | `benangbaju_prd.md` | Saat butuh detail fitur, business rules, atau spesifikasi |
| **Project Structure** | `docs/01_project_structure.md` | Saat buat file/folder baru |
| **Database Schema** | `docs/02_database_schema.md` | Saat kerja dengan database, migrations, queries |
| **API Reference** | `docs/03_api_reference.md` | Saat buat/edit services, hooks, atau Edge Functions |
| **Sprint Plan** | `docs/04_sprint_plan.md` | Saat mulai task baru, cek prioritas |
| **Conventions** | `docs/05_conventions.md` | SELALU — naming, structure, coding style |
| **Environment Setup** | `docs/06_environment_setup.md` | Saat setup atau troubleshoot environment |
| **Deployment Guide** | `docs/07_deployment_guide.md` | Saat deploy atau konfigurasi production |

---

## 🏗️ Tech Stack (JANGAN DIGANTI tanpa approval)

### Backend (Supabase BaaS)
| Komponen | Teknologi |
|----------|-----------|
| Database | PostgreSQL (Supabase hosted) |
| Auth | Supabase Auth (Email+Password, Google OAuth) |
| Storage | Supabase Storage (S3-compatible) |
| Serverless | Supabase Edge Functions (Deno runtime) |
| Security | Row Level Security (RLS) per tabel per role |

### Frontend
| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | strict |
| Styling | Tailwind CSS | v4 |
| State | Zustand | v5 |
| Data Fetching | TanStack React Query | v5 |
| Supabase Client | @supabase/supabase-js | v2 |
| Forms | React Hook Form + Zod | v4 (Zod) |
| Animations | Framer Motion | v12 |
| Icons | Lucide React | latest |
| Notifications | react-hot-toast | latest |
| Payment | Midtrans Snap.js | latest |

### TIDAK DIGUNAKAN (jangan suggest)
- ❌ Express.js / custom backend
- ❌ MySQL / MongoDB
- ❌ Redis / BullMQ
- ❌ Prisma ORM (langsung pakai Supabase client)
- ❌ NextAuth.js (pakai Supabase Auth)
- ❌ Stripe (pakai Midtrans)
- ❌ Biteship (pakai custom shipping zones)
- ❌ shadcn/ui (kecuali user explicitly request)

---

## 📁 Struktur Folder

```
benangbaju/
├── src/
│   ├── app/                    # Next.js App Router (routes only)
│   │   ├── (auth)/             # Auth pages (masuk, daftar, etc.)
│   │   ├── (customer)/         # Customer pages (homepage, produk, etc.)
│   │   └── admin/              # Admin panel
│   ├── components/
│   │   ├── layout/             # Header, Footer, Sidebar
│   │   ├── shared/             # Button, Modal, Input, Card
│   │   ├── customer/           # Customer-specific
│   │   ├── product/            # ProductCard, Gallery, VariantPicker
│   │   ├── admin/              # Admin-specific
│   │   ├── home/               # Homepage sections
│   │   └── providers/          # SupabaseProvider, QueryProvider
│   ├── services/               # Supabase query layer (SEMUA DB calls di sini)
│   ├── stores/                 # Zustand stores
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities, Supabase client, constants
│   ├── types/                  # TypeScript type definitions
│   └── schemas/                # Zod validation schemas
├── supabase/
│   ├── migrations/             # SQL migration files (numbered)
│   └── functions/              # Edge Functions (Deno)
└── docs/                       # Project documentation
```

### Rules:
1. **Pages** (`app/`) = orchestrate saja, import components + call hooks
2. **Components** = pure UI, terima props, JANGAN panggil Supabase langsung
3. **Services** = SEMUA Supabase queries di sini, return typed data
4. **Hooks** = bridge services ↔ stores ↔ components (React Query)
5. **Stores** = client state only (auth, cart, UI)
6. Jangan buat file di luar struktur ini tanpa alasan jelas

---

## ✍️ Naming Conventions

### Files & Folders
| Jenis | Format | Contoh |
|-------|--------|--------|
| Components | PascalCase | `ProductCard.tsx` |
| Pages | lowercase (Next.js) | `page.tsx`, `layout.tsx` |
| Services | camelCase | `products.ts`, `flashSales.ts` |
| Stores | camelCase + Store | `authStore.ts`, `cartStore.ts` |
| Hooks | use + PascalCase | `useAuth.ts`, `useProducts.ts` |
| Types | PascalCase | `Product.ts`, `Order.ts` |
| Zod Schemas | camelCase + Schema | `loginSchema`, `addressSchema` |
| SQL Migrations | `{NNNNN}_{verb}_{domain}.sql` | `00001_create_profiles.sql` |
| Edge Functions | kebab-case folder | `midtrans-webhook/index.ts` |

### Code
| Jenis | Format | Contoh |
|-------|--------|--------|
| Variables | camelCase | `productList`, `isLoading` |
| Constants | UPPER_SNAKE | `MAX_UPLOAD_SIZE`, `ORDER_STATUS` |
| Functions | camelCase + verb | `getProducts()`, `createOrder()` |
| Components | PascalCase | `<ProductCard />` |
| Types/Interfaces | PascalCase | `Product`, `OrderItem` |
| DB tables | snake_case | `product_variants`, `order_items` |
| DB columns | snake_case | `is_active`, `created_at` |
| RPC functions | snake_case | `create_order`, `validate_voucher` |

### Bahasa
| Context | Bahasa |
|---------|--------|
| Code (var, func, comments) | **English** |
| UI text (labels, messages) | **Bahasa Indonesia** |
| DB column names | **English** |
| Git commits | **English** |
| Error messages (user-facing) | **Bahasa Indonesia** |
| Dokumentasi | **Bahasa Indonesia** |

---

## 🗄️ Database Rules

### Schema
- **Total:** ~38 tabel, 12 domain (lihat `docs/02_database_schema.md`)
- **UUID** untuk semua primary key
- **TIMESTAMPTZ** untuk semua timestamp
- **NUMERIC(15,2)** untuk semua field harga/uang
- **snake_case** untuk semua nama tabel dan kolom
- **Soft delete** menggunakan `is_active` boolean (BUKAN delete row)

### RLS (Row Level Security)
- SEMUA tabel WAJIB punya RLS policy
- Pattern:
  - Public read: `SELECT` untuk anon
  - User own data: `auth.uid() = user_id`
  - Admin: `auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')`
- Policy naming: `{action}_{table}_{who}` → `select_profiles_own`

### Migrations
- File numbered: `00001_`, `00002_`, dst.
- Satu domain per migration file
- SELALU include `IF NOT EXISTS` untuk safety
- JANGAN edit migration yang sudah di-push ke production

### RPC Response Format
```sql
-- Success
RETURN jsonb_build_object('success', true, 'data', jsonb_build_object(...));

-- Error
RETURN jsonb_build_object('success', false, 'message', '...', 'code', 'ERROR_CODE');
```

---

## ⚛️ Frontend Rules

### Component Pattern
```typescript
// 1. Imports (grouped: React → 3rd party → internal → types)
// 2. Interface/Types
// 3. Component function
// 4. Export
```

### Data Fetching
- **Server Components** (preferred): langsung panggil Supabase server client
- **Client Components**: pakai React Query + services layer
- JANGAN panggil Supabase langsung dari components — pakai `services/`

### State Management
| Store | Key localStorage | Data |
|-------|-----------------|------|
| `authStore` | `benangbaju-auth` | user, isAuthenticated |
| `cartStore` | `benangbaju-cart` | items, sessionId |
| `wishlistStore` | — (memory) | productIds |
| `uiStore` | — (memory) | drawers, modals |
| `recentlyViewedStore` | `benangbaju-recently-viewed` | product array (max 10) |

### Error Handling
```typescript
// Service: throw error
export async function createOrder(params) {
  const { data, error } = await supabase.rpc('create_order', params)
  if (error) throw new Error(error.message)
  if (!data.success) throw new Error(data.message)
  return data.data
}

// Component: catch + toast
try {
  await createOrder(params)
  toast.success('Pesanan berhasil dibuat!')
} catch (error) {
  toast.error(error.message)
}
```

---

## 🔐 Security Rules (WAJIB DIPATUHI)

1. **`SUPABASE_SERVICE_ROLE_KEY`** → HANYA di Edge Functions. JANGAN PERNAH di frontend.
2. **`MIDTRANS_SERVER_KEY`** → HANYA di Edge Functions. JANGAN di `NEXT_PUBLIC_*`.
3. **`SMTP_PASS`** → Gunakan App Password, BUKAN password email asli.
4. **`.env.local`** → JANGAN commit ke git.
5. Semua input user WAJIB divalidasi: Zod di frontend + PostgreSQL constraints di backend.
6. Race condition stok → gunakan PostgreSQL `FOR UPDATE` lock di RPC.
7. Midtrans webhook → WAJIB validasi SHA-512 signature.
8. Admin routes → guard di middleware + RLS policy `role = 'admin'`.

---

## 🚢 Shipping System

Benangbaju menggunakan **custom shipping zones** (BUKAN API kurir eksternal):
- Admin set zona (Pulau Jawa, Luar Jawa, dll)
- Tarif per kg per zona per kurir
- Tracking number diinput manual oleh admin
- Kalkulasi: `ongkir = max(base_price, ceil(weight_kg) × price_per_kg)`

---

## 💳 Payment Flow

1. Customer submit checkout → RPC `create_order` (atomic)
2. Customer klik "Bayar" → Edge Function `generate-payment` → Midtrans Snap token
3. Frontend: `snap.pay(token)` → Midtrans popup
4. Midtrans webhook → Edge Function `midtrans-webhook` → update order status
5. Settlement → status `processing`, email konfirmasi
6. Expired → status `cancelled`, restore stock

---

## 📦 Order Status Flow

```
pending_payment → processing → shipped → delivered
       ↓              ↓
   cancelled      (admin update)
       ↓
   refunded (via return request)
```

- `pending_payment` → bisa cancel (customer/auto setelah 24h)
- `processing` → admin proses pesanan
- `shipped` → admin input resi
- `delivered` → customer konfirmasi / admin konfirmasi
- `cancelled` → stock di-restore

---

## 🏃 Sprint Saat Ini

**Sprint 1 — API Foundation** (fokus Supabase backend)
- Setup Supabase project
- Database migrations domain 1–4 (User, Katalog, Inventori, Cart)
- RLS policies
- Core RPC functions
- Seed data

> Lihat detail lengkap di `docs/04_sprint_plan.md`

---

## ⚠️ Out of Scope (v1.0)

JANGAN build fitur-fitur ini:
- COD (Cash on Delivery)
- Live chat widget
- Loyalty points / rewards
- Multi-bahasa (i18n)
- Mobile app
- Affiliate / referral
- Subscription / pre-order
- Multi-admin role (cukup 1 role admin)
- Bulk import CSV
- Advanced analytics
- Marketplace sync
- AR try-on

---

## 🔄 Workflow Saat Develop

```bash
# Start development
supabase start          # Terminal 1: Supabase local
npm run dev             # Terminal 2: Next.js

# Database changes
supabase migration new {name}     # Buat migration
# Edit file di supabase/migrations/
supabase db push                  # Apply
supabase gen types typescript --local > src/types/database.ts  # Regen types

# Edge Functions
supabase functions new {name}     # Buat
supabase functions serve {name}   # Dev
supabase functions deploy {name}  # Deploy

# Reset database
supabase db reset                 # Drop + recreate + seed
```

---

## 📋 Checklist Sebelum Commit

- [ ] Tidak ada `any` di TypeScript
- [ ] Tidak ada `console.log` (gunakan `console.warn`/`console.error` jika perlu)
- [ ] Semua tabel baru punya RLS policy
- [ ] Error state di-handle (loading, empty, error)
- [ ] Mobile responsive (min 375px)
- [ ] Variable naming konsisten (lihat Naming Conventions)
- [ ] Secrets tidak di-expose di frontend

---

## 💡 Tips untuk AI Assistant

1. **Baca file yang relevan DULU** sebelum edit — jangan asumsi isi file.
2. **Ikuti struktur folder** — jangan buat file di tempat yang salah.
3. **Pakai Bahasa Indonesia** untuk UI text dan error messages user-facing.
4. **Pakai English** untuk code, variables, comments, dan git commits.
5. **Cek PRD** (`benangbaju_prd.md`) untuk detail business rules yang spesifik.
6. **Jangan suggest tech stack lain** — semua sudah ditentukan di PRD.
7. **Gunakan Supabase client** — JANGAN raw SQL dari frontend.
8. **RPC untuk operasi kompleks** — checkout, cancel order, stock adjustment.
9. **Snapshot data di order_items** — nama produk, harga, SKU di-copy saat order dibuat.
10. **Lazy cancel** — tidak ada cron job, expired orders di-cancel saat halaman dibuka.
