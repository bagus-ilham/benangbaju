# 🔌 API Reference — Benangbaju E-Commerce

> **Referensi:** [benangbaju_prd.md](file:///d:/Aulia%20Project/benangbaju_prd.md) — Bagian 25
> **Backend:** Supabase (PostgreSQL + Edge Functions)
> **Client:** `@supabase/supabase-js` v2

---

## Daftar Isi

1. [Supabase Client Queries (Public)](#1-public-queries-anon-key)
2. [Supabase Client Queries (Protected)](#2-protected-queries-auth-required)
3. [PostgreSQL RPC Functions](#3-postgresql-rpc-functions)
4. [Admin Queries](#4-admin-queries-role--admin)
5. [Supabase Edge Functions](#5-supabase-edge-functions)
6. [Response Format](#6-response-format)
7. [Error Codes](#7-error-codes)

---

## 1. Public Queries (Anon Key)

> RLS: Public read. Tidak perlu auth.

| Resource | Operation | Filter/Join | Keterangan |
|----------|-----------|-------------|-----------|
| `products` | SELECT | `is_active=true`, category, collection, search, sort, range | List & detail produk |
| `categories` | SELECT | `is_active=true`, sort_order | List kategori aktif |
| `collections` | SELECT | `is_active=true`, starts_at/ends_at | List koleksi aktif + products |
| `banners` | SELECT | `is_active=true`, position, starts_at/ends_at | Banner per posisi |
| `flash_sales` + `flash_sale_items` | SELECT | `is_active=true`, starts_at ≤ now ≤ ends_at | Flash sale aktif |
| `product_reviews` | SELECT | `status='approved'`, product_id, rating, with_media | Review per produk |
| `shipping_zones` | SELECT | `is_active=true` | Zona aktif |
| `shipping_rates` | SELECT | zone_id, `is_active=true` | Tarif per zona |
| `districts` | SELECT | ILIKE search (city, district) | Data kecamatan |
| `site_settings` | SELECT | All | Setting publik toko |
| `product_rating_summary` | SELECT | product_id | Summary rating |

### Contoh Query — Listing Produk

```typescript
// List produk dengan filter & pagination
const { data, error, count } = await supabase
  .from('products')
  .select(`
    id, name, slug, is_featured, created_at,
    categories!inner(name, slug),
    product_variants!inner(price, compare_price, stock, is_active),
    product_images!inner(url, alt_text)
  `, { count: 'exact' })
  .eq('is_active', true)
  .eq('product_variants.is_active', true)
  .eq('product_images.is_primary', true)
  .order('created_at', { ascending: false })
  .range(0, 19)
```

### Contoh Query — Detail Produk

```typescript
const { data, error } = await supabase
  .from('products')
  .select(`
    *,
    categories(name, slug),
    product_variants(*, product_variant_attrs(*)),
    product_images(*),
    product_marketplace_links(*),
    product_rating_summary(*)
  `)
  .eq('slug', slug)
  .eq('is_active', true)
  .single()
```

### Contoh Query — Search Autocomplete

```typescript
const { data } = await supabase
  .from('products')
  .select('id, name, slug, categories(name)')
  .eq('is_active', true)
  .ilike('name', `%${query}%`)
  .limit(8)
```

### Contoh Query — Full-Text Search

```typescript
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true)
  .textSearch('search_vector', query, { type: 'websearch', config: 'indonesian' })
```

---

## 2. Protected Queries (Auth Required)

> RLS: `auth.uid()` = user_id

| Resource | Operation | Guard | Keterangan |
|----------|-----------|-------|-----------|
| `profiles` | SELECT / UPDATE | Own profile | name, phone, avatar_url |
| `user_addresses` | CRUD | Own addresses | + zone_id mapping |
| `carts` + `cart_items` | CRUD | Own cart / guest by session_id | |
| `wishlist_items` | CRUD | Own wishlist | |
| `orders` | SELECT | Own orders | + items, shipping, payment |
| `notifications` | SELECT / UPDATE (is_read) | Own notifications | |
| `product_reviews` | INSERT | Must own order_item + delivered | 1 per order_item |
| `return_requests` + `return_items` | INSERT / SELECT | Own orders | |
| `stock_notifications` | INSERT / DELETE | Own subscriptions | |

### Contoh — Cart Operations

```typescript
// Get or create cart
const { data: cart } = await supabase
  .from('carts')
  .select('*, cart_items(*, product_variants(*, products(name, slug, product_images(*))))')
  .eq('user_id', userId)
  .single()

// Add to cart (upsert)
const { error } = await supabase
  .from('cart_items')
  .upsert({ cart_id: cartId, variant_id: variantId, quantity: qty })
```

### Contoh — Wishlist

```typescript
// Toggle wishlist
const { data: existing } = await supabase
  .from('wishlist_items')
  .select('id')
  .eq('user_id', userId)
  .eq('product_id', productId)
  .single()

if (existing) {
  await supabase.from('wishlist_items').delete().eq('id', existing.id)
} else {
  await supabase.from('wishlist_items').insert({ user_id: userId, product_id: productId })
}
```

---

## 3. PostgreSQL RPC Functions

> Dipanggil via `supabase.rpc('function_name', params)`

### `create_order`

| Aspek | Detail |
|-------|--------|
| **Dipanggil oleh** | Frontend (checkout) |
| **Input** | `{ user_id, address_id, voucher_code?, courier_name, shipping_cost, notes? }` |
| **Proses** | Atomic transaction: validate cart → validate voucher → validate shipping → insert order + items + shipping → deduct stock → clear cart |
| **Output** | `{ success: true, data: { order_id, order_number, total_amount, status } }` |
| **Error cases** | Cart kosong, stok tidak cukup, voucher invalid, fraud check (>3 cancel/24h) |

### `cancel_order`

| Aspek | Detail |
|-------|--------|
| **Dipanggil oleh** | Frontend / Admin |
| **Input** | `{ order_id, cancel_reason? }` |
| **Guard** | Status must be `pending_payment` |
| **Proses** | Update status → cancelled, restore stock (`released` mutation) |
| **Output** | `{ success: true }` |

### `validate_voucher`

| Aspek | Detail |
|-------|--------|
| **Input** | `{ code, subtotal, user_id }` |
| **Validasi** | Active, not expired, quota, per-user limit, min_purchase |
| **Output** | `{ valid: true, voucher_id, code, discount_amount, final_total }` |

### `calculate_shipping`

| Aspek | Detail |
|-------|--------|
| **Input** | `{ zone_id, weight_gram }` |
| **Output** | Array of `{ courier_name, price, etd_min, etd_max }` |

### `adjust_stock`

| Aspek | Detail |
|-------|--------|
| **Dipanggil oleh** | Admin panel |
| **Input** | `{ variant_id, qty, note, admin_id }` |
| **Proses** | Update stock + insert `stock_mutations` (type: 'adjustment') |

### `lazy_cancel_expired_orders`

| Aspek | Detail |
|-------|--------|
| **Dipanggil oleh** | Frontend (saat user buka halaman pesanan) |
| **Input** | `{ user_id }` |
| **Proses** | Find orders where `status='pending_payment'` AND `created_at` > 24h → cancel each + restore stock |

---

## 4. Admin Queries (Role = 'admin')

> RLS: `auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')`

| Resource | Operations | Keterangan |
|----------|-----------|-----------|
| `products` + relations | CRUD | Full product management |
| `categories` | CRUD | Hierarchical categories |
| `collections` + `collection_products` | CRUD | Collection management |
| `orders` | UPDATE status | + input tracking number |
| `vouchers` | CRUD | |
| `flash_sales` + `flash_sale_items` | CRUD | |
| `banners` | CRUD | Desktop + mobile images |
| `product_reviews` | UPDATE status | Moderate: approve/reject/hide |
| `review_replies` | INSERT / UPDATE | 1 reply per review |
| `shipping_zones` + `shipping_rates` + `shipping_zone_coverage` | CRUD | |
| `landing_pages` + `redirects` | CRUD | CMS |
| `site_settings` | UPDATE | Store settings |
| `profiles` | UPDATE is_active | Activate/deactivate customers |
| `admin_activity_logs` | SELECT | Audit trail |
| `return_requests` | UPDATE | Approve/reject/complete |
| `notification_templates` | CRUD | Email templates |

### Admin — Update Order Status

```typescript
// Update status + activity log
const { error } = await supabase
  .from('orders')
  .update({ status: 'shipped', updated_at: new Date().toISOString() })
  .eq('id', orderId)

// Insert activity log
await supabase.from('admin_activity_logs').insert({
  admin_id: adminId,
  action: 'update_order_status',
  resource_type: 'order',
  resource_id: orderId,
  old_data: { status: 'processing' },
  new_data: { status: 'shipped' },
  ip_address: clientIp,
})
```

---

## 5. Supabase Edge Functions

### `POST /functions/v1/generate-payment`

| Aspek | Detail |
|-------|--------|
| **Trigger** | Customer klik "Bayar Sekarang" |
| **Input** | `{ order_number }` |
| **Guard** | Order status = `pending_payment`, user = owner |
| **Proses** | Fetch order data → build Midtrans Snap params → `snap.createTransaction()` |
| **Output** | `{ token, redirect_url }` |
| **Error** | Order not found, wrong status, Midtrans API error |

### `POST /functions/v1/midtrans-webhook`

| Aspek | Detail |
|-------|--------|
| **Trigger** | Midtrans callback (server-to-server) |
| **Security** | SHA-512 signature verification |
| **Proses** | Validate signature → check idempotency → map status → update order + payment → restore stock (if cancelled) → send email |
| **Status Mapping** | settlement/capture-accept → `processing`, expire/cancel/deny → `cancelled` |

### `POST /functions/v1/send-email`

| Aspek | Detail |
|-------|--------|
| **Input** | `{ to, template, data }` |
| **Proses** | Fetch template from `notification_templates` → render HTML → Nodemailer SMTP |
| **Templates** | order_placed, payment_success, payment_failed, order_shipped, order_cancelled |

### `POST /functions/v1/generate-invoice`

| Aspek | Detail |
|-------|--------|
| **Trigger** | After payment success (called by midtrans-webhook) |
| **Proses** | Fetch order data → generate PDF → upload to Supabase Storage → update `payments.invoice_url` |
| **Storage** | `invoices/{order_number}.pdf` (private bucket) |

---

## 6. Response Format

Semua RPC function dan Edge Function menggunakan format response konsisten:

```typescript
// ✅ Success
{ 
  success: true, 
  data: { ... } 
}

// ❌ Error
{ 
  success: false, 
  message: "Pesan error yang ditampilkan ke user", 
  code?: "ERROR_CODE" 
}
```

---

## 7. Error Codes

| Code | HTTP | Deskripsi |
|------|------|-----------|
| `CART_EMPTY` | 400 | Cart kosong saat checkout |
| `STOCK_INSUFFICIENT` | 400 | Stok tidak mencukupi |
| `VOUCHER_INVALID` | 400 | Voucher tidak valid |
| `VOUCHER_EXPIRED` | 400 | Voucher kadaluarsa |
| `VOUCHER_QUOTA_EXCEEDED` | 400 | Kuota voucher habis |
| `VOUCHER_USER_LIMIT` | 400 | User sudah pakai voucher |
| `VOUCHER_MIN_PURCHASE` | 400 | Belum memenuhi min. belanja |
| `FRAUD_DETECTED` | 403 | >3 cancel dalam 24 jam |
| `ORDER_NOT_FOUND` | 404 | Order tidak ditemukan |
| `ORDER_WRONG_STATUS` | 400 | Status order tidak sesuai |
| `UNAUTHORIZED` | 401 | Belum login |
| `FORBIDDEN` | 403 | Tidak punya akses |
| `RATE_LIMIT` | 429 | Too many requests |
| `SIGNATURE_INVALID` | 400 | Midtrans signature mismatch |
| `RETURN_EXPIRED` | 400 | Batas waktu retur lewat |
| `RETURN_EXISTS` | 400 | Sudah ada request retur aktif |
| `PAYMENT_ERROR` | 500 | Midtrans API error |
