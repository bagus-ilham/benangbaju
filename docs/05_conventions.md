# 📐 Coding Conventions — Benangbaju E-Commerce

> **Referensi:** [benangbaju_prd.md](file:///d:/Aulia%20Project/benangbaju_prd.md)

---

## 1. Bahasa & Framework

| Aspek | Standar |
|-------|---------|
| **Language** | TypeScript (strict mode) |
| **Frontend** | Next.js 16 (App Router) |
| **Backend** | Supabase (PostgreSQL, Edge Functions/Deno) |
| **CSS** | Tailwind CSS v4 |

---

## 2. Naming Conventions

### 2.1 Files & Folders

| Jenis | Convention | Contoh |
|-------|-----------|--------|
| **Components** | PascalCase | `ProductCard.tsx`, `HeroSection.tsx` |
| **Pages** | lowercase/kebab-case (Next.js) | `page.tsx`, `layout.tsx` |
| **Services** | camelCase | `products.ts`, `flashSales.ts` |
| **Stores (Zustand)** | camelCase + `Store` suffix | `authStore.ts`, `cartStore.ts` |
| **Hooks** | camelCase + `use` prefix | `useAuth.ts`, `useProducts.ts` |
| **Types** | PascalCase | `Product.ts`, `Order.ts` |
| **Schemas (Zod)** | camelCase + `Schema` suffix | `loginSchema`, `addressSchema` |
| **SQL Migrations** | numbered prefix + snake_case | `00001_create_profiles.sql` |
| **Edge Functions** | kebab-case folder | `midtrans-webhook/index.ts` |

### 2.2 Code

| Jenis | Convention | Contoh |
|-------|-----------|--------|
| **Variables** | camelCase | `productList`, `isLoading` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_UPLOAD_SIZE`, `ORDER_STATUS` |
| **Functions** | camelCase + verb prefix | `getProducts()`, `createOrder()` |
| **Components** | PascalCase | `<ProductCard />`, `<FlashSaleSection />` |
| **Interfaces/Types** | PascalCase | `Product`, `OrderItem` |
| **Enums** | PascalCase name, UPPER_SNAKE values | `OrderStatus.PENDING_PAYMENT` |
| **Database tables** | snake_case | `product_variants`, `order_items` |
| **Database columns** | snake_case | `is_active`, `created_at` |
| **RPC functions** | snake_case | `create_order`, `validate_voucher` |

### 2.3 CSS / Tailwind

| Jenis | Convention |
|-------|-----------|
| **Custom classes** | BEM-style jika perlu: `card__title`, `card--featured` |
| **Tailwind** | Prefer utility classes, group logically |
| **CSS Variables** | `--color-primary`, `--font-heading` |

---

## 3. Project Structure Rules

```
src/
├── app/           # Routes only (page.tsx, layout.tsx, loading.tsx, error.tsx)
├── components/    # UI components (no business logic)
├── services/      # Supabase query layer (data fetching/mutation)
├── stores/        # Zustand state management
├── hooks/         # Custom React hooks (combine services + stores)
├── lib/           # Utilities, configs, constants
├── types/         # TypeScript type definitions
└── schemas/       # Zod validation schemas
```

### Rules:
1. **Pages** hanya orchestrate — import components, call hooks/services
2. **Components** = pure UI, receive props, no direct Supabase calls
3. **Services** = Supabase query functions, return typed data
4. **Hooks** = bridge antara services + stores + components (React Query)
5. **Stores** = client-side state only (auth, cart, UI)

---

## 4. TypeScript Rules

```typescript
// ✅ DO: Use explicit types
const products: Product[] = await getProducts(filters)

// ✅ DO: Use Zod for runtime validation
const result = loginSchema.parse(formData)

// ✅ DO: Use const assertions for enums
const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PAID: 'paid',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const

// ❌ DON'T: Use `any`
// ❌ DON'T: Use `@ts-ignore` without comment
// ❌ DON'T: Mix Indonesian and English in variable names
```

### Type Generation
- Generate DB types: `npx supabase gen types typescript --local > src/types/database.ts`
- Re-run setiap schema migration berubah

---

## 5. Supabase Conventions

### 5.1 Client Usage

```typescript
// Browser (Client Component)
import { createBrowserClient } from '@/lib/supabase/client'
const supabase = createBrowserClient()

// Server (Server Component / Route Handler)
import { createServerClient } from '@/lib/supabase/server'
const supabase = await createServerClient()
```

### 5.2 RLS Policy Naming

```sql
-- Format: {action}_{table}_{who}
CREATE POLICY "select_profiles_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "select_profiles_admin" ON profiles FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);
CREATE POLICY "update_profiles_own" ON profiles FOR UPDATE USING (auth.uid() = id);
```

### 5.3 Migration Naming

```
{number}_{verb}_{domain}.sql

00001_create_profiles.sql
00002_create_categories.sql
00016_create_rls_policies.sql
00017_create_rpc_functions.sql
```

### 5.4 RPC Response Format

```sql
-- Selalu return JSON dengan format konsisten
RETURN jsonb_build_object(
  'success', true,
  'data', jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number
  )
);

-- Error
RETURN jsonb_build_object(
  'success', false,
  'message', 'Stok tidak mencukupi',
  'code', 'STOCK_INSUFFICIENT'
);
```

---

## 6. React / Next.js Conventions

### 6.1 Component Structure

```typescript
// 1. Imports (grouped)
import { useState } from 'react'           // React
import { motion } from 'framer-motion'      // 3rd party
import { ProductCard } from '@/components'  // Internal
import type { Product } from '@/types'       // Types

// 2. Types/Interfaces
interface ProductGridProps {
  products: Product[]
  isLoading?: boolean
}

// 3. Component
export function ProductGrid({ products, isLoading }: ProductGridProps) {
  // hooks first
  // state second
  // effects third
  // handlers fourth
  // render
}
```

### 6.2 Data Fetching Pattern

```typescript
// Server Component (preferred for initial data)
// app/(customer)/produk/page.tsx
export default async function ProdukPage() {
  const supabase = await createServerClient()
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
  
  return <ProductGrid products={products ?? []} />
}

// Client Component (for interactive/realtime)
// components/product/ProductGrid.tsx
'use client'
export function ProductGrid({ initialProducts }: Props) {
  const { data } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => getProducts(filters),
    initialData: initialProducts,
  })
}
```

### 6.3 Error Handling

```typescript
// Service layer — throw descriptive errors
export async function createOrder(params: CreateOrderParams) {
  const { data, error } = await supabase.rpc('create_order', params)
  if (error) throw new Error(error.message)
  if (!data.success) throw new Error(data.message)
  return data.data
}

// Component layer — catch and show toast
try {
  const order = await createOrder(params)
  toast.success('Pesanan berhasil dibuat!')
} catch (error) {
  toast.error(error.message)
}
```

---

## 7. Git Conventions

### 7.1 Branch Naming

```
feature/{domain}-{description}    → feature/auth-login-page
fix/{domain}-{description}        → fix/cart-merge-duplicate
hotfix/{description}              → hotfix/checkout-crash
chore/{description}               → chore/update-dependencies
```

### 7.2 Commit Messages

```
feat(auth): implement Google OAuth login
fix(cart): prevent duplicate items on merge
chore(db): add migration for stock_notifications
docs: update API reference for create_order
style(product): fix mobile responsive grid
refactor(order): extract checkout validation
test(rpc): add create_order integration tests
```

### 7.3 PR Rules
- 1 PR = 1 feature / 1 fix
- PR description wajib menyertakan screenshot (untuk UI changes)
- Squash merge ke `main`

---

## 8. Formatting & Linting

```json
// .eslintrc.json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100
}
```

---

## 9. Environment Variables

| Prefix | Lokasi | Akses |
|--------|--------|-------|
| `NEXT_PUBLIC_*` | `.env.local` | Client + Server |
| No prefix | `.env.local` | Server only |
| Edge Function secrets | `supabase secrets set` | Edge Function only |

> [!CAUTION]
> **JANGAN** pernah expose `SUPABASE_SERVICE_ROLE_KEY` atau `MIDTRANS_SERVER_KEY` di `NEXT_PUBLIC_*`.

---

## 10. Bahasa

| Context | Bahasa |
|---------|--------|
| Code (variables, functions, comments) | **English** |
| UI text (labels, messages, placeholders) | **Bahasa Indonesia** |
| Database column names | **English** |
| Git commits | **English** |
| Documentation | **Bahasa Indonesia** (sesuai PRD) |
| Error messages (user-facing) | **Bahasa Indonesia** |
