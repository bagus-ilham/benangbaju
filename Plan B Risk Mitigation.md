# 🛡️ Plan B — Solusi Risiko Migrasi R2

> Dokumen ini berisi solusi detail untuk setiap risiko yang muncul dari migrasi Supabase Storage → Cloudflare R2.

---

## Daftar Risiko & Solusi

| # | Risiko | Tingkat | Solusi |
|---|--------|---------|--------|
| 1 | Perlu update upload flow (admin & customer) | ⚠️ Medium | Adapter pattern — 1 file berubah, 0 komponen berubah |
| 2 | Perlu migrasi gambar existing | ⚠️ Medium | Script otomatis + fallback di CDN Worker |
| 3 | Supabase RLS tidak berlaku di R2 | 🟡 Low | Signed URLs untuk file private (invoices) |

---

## Risiko 1: Update Upload Flow

### Analisis Dampak

Saat ini `uploadImage()` dari [storage.ts](file:///d:/Aulia%20Project/benangbaju/src/lib/supabase/storage.ts) digunakan di **12 tempat** across **8 file**:

| File | Bucket | Konteks |
|------|--------|---------|
| `BannerFormModal.tsx` | `banners` | Admin upload banner (desktop + mobile) |
| `CollectionFormModal.tsx` | `banners` | Admin upload gambar koleksi |
| `FlashSaleFormModal.tsx` | `banners` | Admin upload banner flash sale |
| `CategoryFormModal.tsx` | `products` | Admin upload gambar kategori |
| `ProductImageManager.tsx` | `products` | Admin upload gambar produk |
| `ProductVariantsSection.tsx` | `products` | Admin upload gambar varian |
| `ProductGeneralInfoSection.tsx` | `products` | Admin upload size guide |
| `OrderReviewModal.tsx` | `products` | Customer upload foto review |
| `ReturnClient.tsx` | `products` | Customer upload foto retur |

Dan `deleteImageByUrl()` digunakan di **6 repository** (banner, product, category, collection, flash-sale).

### Solusi: Adapter Pattern

**Prinsip**: Ubah **hanya 1 file** (`storage.ts`) → semua 12 tempat yang mengimport otomatis ikut berubah. **Zero changes** di komponen.

#### Step 1: Buat API Route untuk R2 Upload

```typescript
// src/app/api/v1/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { createServerClient } from '@/lib/supabase/server'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,           // https://<account_id>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const R2_BUCKET = process.env.R2_BUCKET_NAME || 'benangbaju-assets'
const CDN_BASE_URL = 'https://cdn.benangbaju.com'

export async function POST(request: NextRequest) {
  // 1. Verify user is authenticated
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse form data
  const formData = await request.formData()
  const file = formData.get('file') as File
  const folder = (formData.get('folder') as string) || 'products'

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // 3. Validate file type & size
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Tipe file tidak didukung' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) { // Max 5 MB
    return NextResponse.json({ error: 'Ukuran file melebihi 5 MB' }, { status: 400 })
  }

  // 4. Generate unique filename
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const baseName = file.name
    .substring(0, file.name.lastIndexOf('.'))
    .replace(/[^a-zA-Z0-9_-]/g, '_')
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const key = `${folder}/${timestamp}_${randomSuffix}_${baseName}.${ext}`

  // 5. Upload to R2
  const buffer = Buffer.from(await file.arrayBuffer())
  await r2Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: file.type,
    CacheControl: 'public, max-age=31536000',
  }))

  // 6. Return CDN URL (same structure as before: cdn.benangbaju.com/<folder>/<filename>)
  const publicUrl = `${CDN_BASE_URL}/${key}`
  return NextResponse.json({ url: publicUrl })
}

// DELETE endpoint for cleanup
export async function DELETE(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { url } = await request.json()
  if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

  // Extract key from CDN URL
  const key = url.replace(`${CDN_BASE_URL}/`, '')

  try {
    await r2Client.send(new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    }))
  } catch (err) {
    console.error('R2 delete error:', err)
    // Don't throw — best effort cleanup
  }

  return NextResponse.json({ success: true })
}
```

#### Step 2: Update storage.ts (Satu-satunya File yang Berubah)

```typescript
// src/lib/supabase/storage.ts — UPDATED
import { SupabaseClient } from '@supabase/supabase-js'
import { safeLogError } from '../logger'

const CDN_BASE_URL = 'https://cdn.benangbaju.com'

/**
 * Uploads an image file to R2 via API route and returns its CDN URL.
 * Drop-in replacement — same signature, same return type.
 */
export async function uploadImage(file: File, bucket: string = 'products'): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', bucket.toLowerCase())

  const res = await fetch('/api/v1/upload', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    safeLogError('R2 upload error', errorData)
    throw new Error(
      errorData.error || 'Gagal mengunggah gambar. Silakan coba lagi nanti.'
    )
  }

  const data = await res.json()
  return data.url
}

/**
 * Deletes an image from R2 via API route.
 * Drop-in replacement — same signature.
 */
export async function deleteImageByUrl(
  supabase: SupabaseClient,
  url: string,
  bucket: string = 'products'
): Promise<void> {
  try {
    if (!url) return

    // Handle both CDN URLs and legacy Supabase URLs
    if (url.includes(CDN_BASE_URL)) {
      // New R2 image — delete via API
      await fetch('/api/v1/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      }).catch(() => {})
    } else if (url.includes('supabase.co/storage')) {
      // Legacy Supabase image — delete from Supabase Storage
      const cleanUrl = url.split('?')[0]
      const bucketMarker = `/${bucket}/`
      const markerIndex = cleanUrl.indexOf(bucketMarker)
      let filePath = ''
      if (markerIndex !== -1) {
        filePath = cleanUrl.substring(markerIndex + bucketMarker.length)
      } else {
        const urlParts = cleanUrl.split('/')
        filePath = urlParts[urlParts.length - 1]
      }
      const decodedFilePath = decodeURIComponent(filePath)
      if (!decodedFilePath) return

      const { error } = await supabase.storage.from(bucket).remove([decodedFilePath])
      if (error) {
        safeLogError(`Failed to delete image ${decodedFilePath} from ${bucket}:`, error.message)
      }
    }
  } catch (err) {
    safeLogError('Error in deleteImageByUrl:', err)
  }
}
```

> [!IMPORTANT]
> **Zero perubahan di komponen** — semua 12 tempat yang mengimport `uploadImage` dan `deleteImageByUrl` tetap bekerja karena signature function tidak berubah. Upload baru masuk R2, gambar lama di Supabase tetap bisa di-delete.

#### Step 3: Environment Variables Baru

```env
# === Cloudflare R2 ===
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<your_r2_access_key>
R2_SECRET_ACCESS_KEY=<your_r2_secret_key>
R2_BUCKET_NAME=benangbaju-assets
```

#### Step 4: Install Dependency

```bash
npm install @aws-sdk/client-s3
```

---

## Risiko 2: Migrasi Gambar Existing

### Masalah
Database (`product_images.url`, `banners.image_url`, dll) menyimpan URL Supabase Storage. Gambar-gambar ini harus:
1. Di-copy ke R2
2. URL di database di-update (opsional, karena CDN Worker sudah fallback)

### Solusi A: CDN Worker Fallback (Zero Downtime, Tanpa Update DB)

CDN Worker yang sudah ada di Plan B **otomatis fallback ke Supabase** jika file belum ada di R2. Artinya:

- ✅ Gambar lama tetap bisa diakses
- ✅ Tidak perlu update URL di database
- ✅ Zero downtime

Gambar lama → CDN Worker → not in R2 → fallback fetch Supabase → serve ke user

**Kelemahan**: Gambar lama tetap generate Supabase egress. Tapi karena CDN Worker cache 30 hari, setiap gambar hanya di-fetch **1x dari Supabase** lalu di-cache.

### Solusi B: Script Migrasi Otomatis (Recommended — Migrasi Penuh)

Script Node.js yang:
1. Query semua URL gambar dari database
2. Download dari Supabase Storage
3. Upload ke R2
4. (Opsional) Update URL di database

```typescript
// scripts/migrate-to-r2.ts
import { createClient } from '@supabase/supabase-js'
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'

// === CONFIG ===
const SUPABASE_URL = 'https://jwvbzuoatffoxaahdwdx.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const R2_ENDPOINT = process.env.R2_ENDPOINT!
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET = process.env.R2_BUCKET_NAME || 'benangbaju-assets'

const SUPABASE_STORAGE_PREFIX = `${SUPABASE_URL}/storage/v1/object/public`

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const r2 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY },
})

// === STEP 1: Kumpulkan semua URL gambar dari database ===
async function collectAllImageUrls(): Promise<
  Array<{ table: string; column: string; id: string; url: string }>
> {
  const urls: Array<{
    table: string
    column: string
    id: string
    url: string
  }> = []

  // product_images
  const { data: prodImages } = await supabase
    .from('product_images')
    .select('id, url')
  prodImages?.forEach((row) => {
    if (row.url) urls.push({ table: 'product_images', column: 'url', id: row.id, url: row.url })
  })

  // banners (image_url + image_mobile_url)
  const { data: banners } = await supabase
    .from('banners')
    .select('id, image_url, image_mobile_url')
  banners?.forEach((row) => {
    if (row.image_url)
      urls.push({ table: 'banners', column: 'image_url', id: row.id, url: row.image_url })
    if (row.image_mobile_url)
      urls.push({
        table: 'banners',
        column: 'image_mobile_url',
        id: row.id,
        url: row.image_mobile_url,
      })
  })

  // categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, image_url')
  categories?.forEach((row) => {
    if (row.image_url)
      urls.push({ table: 'categories', column: 'image_url', id: row.id, url: row.image_url })
  })

  // collections
  const { data: collections } = await supabase
    .from('collections')
    .select('id, image_url')
  collections?.forEach((row) => {
    if (row.image_url)
      urls.push({ table: 'collections', column: 'image_url', id: row.id, url: row.image_url })
  })

  // flash_sales
  const { data: flashSales } = await supabase
    .from('flash_sales')
    .select('id, banner_url')
  flashSales?.forEach((row) => {
    if (row.banner_url)
      urls.push({ table: 'flash_sales', column: 'banner_url', id: row.id, url: row.banner_url })
  })

  // products (size_guide, care_guide — jika berupa URL gambar)
  const { data: products } = await supabase
    .from('products')
    .select('id, size_guide, care_guide')
  products?.forEach((row) => {
    if (row.size_guide && row.size_guide.startsWith('http'))
      urls.push({ table: 'products', column: 'size_guide', id: row.id, url: row.size_guide })
    if (row.care_guide && row.care_guide.startsWith('http'))
      urls.push({ table: 'products', column: 'care_guide', id: row.id, url: row.care_guide })
  })

  // review_media
  const { data: reviewMedia } = await supabase
    .from('review_media')
    .select('id, url')
  reviewMedia?.forEach((row) => {
    if (row.url) urls.push({ table: 'review_media', column: 'url', id: row.id, url: row.url })
  })

  return urls
}

// === STEP 2: Extract R2 key dari Supabase URL ===
function extractR2Key(supabaseUrl: string): string | null {
  // URL: https://xxx.supabase.co/storage/v1/object/public/products/filename.jpg
  // R2 key: products/filename.jpg
  if (!supabaseUrl.startsWith(SUPABASE_STORAGE_PREFIX)) return null
  return supabaseUrl.replace(`${SUPABASE_STORAGE_PREFIX}/`, '')
}

// === STEP 3: Check apakah file sudah ada di R2 ===
async function existsInR2(key: string): Promise<boolean> {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

// === STEP 4: Download dari Supabase & Upload ke R2 ===
async function migrateFile(url: string, r2Key: string): Promise<boolean> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`  ❌ Failed to download: ${url} (${response.status})`)
      return false
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType =
      response.headers.get('content-type') || 'application/octet-stream'

    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: r2Key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000',
      })
    )

    return true
  } catch (err) {
    console.error(`  ❌ Migration failed for: ${url}`, err)
    return false
  }
}

// === STEP 5 (Opsional): Update URL di database ===
const CDN_URL = 'https://cdn.benangbaju.com'

async function updateDatabaseUrl(
  table: string,
  column: string,
  id: string,
  oldUrl: string,
  r2Key: string
) {
  const newUrl = `${CDN_URL}/${r2Key}`
  const { error } = await supabase
    .from(table)
    .update({ [column]: newUrl })
    .eq('id', id)

  if (error) {
    console.error(`  ⚠️ Failed to update ${table}.${column} id=${id}:`, error.message)
  }
}

// === MAIN ===
async function main() {
  console.log('🚀 Starting migration: Supabase Storage → Cloudflare R2\n')

  const allUrls = await collectAllImageUrls()
  console.log(`📊 Found ${allUrls.length} image URLs to migrate\n`)

  // Filter hanya URL Supabase Storage
  const supabaseUrls = allUrls.filter((u) => u.url.startsWith(SUPABASE_STORAGE_PREFIX))
  console.log(`🔍 ${supabaseUrls.length} are Supabase Storage URLs (will migrate)\n`)

  let migrated = 0
  let skipped = 0
  let failed = 0

  for (const item of supabaseUrls) {
    const r2Key = extractR2Key(item.url)
    if (!r2Key) {
      skipped++
      continue
    }

    // Check if already in R2
    if (await existsInR2(r2Key)) {
      console.log(`  ⏭️  Already in R2: ${r2Key}`)
      // Still update DB URL even if already migrated
      await updateDatabaseUrl(item.table, item.column, item.id, item.url, r2Key)
      skipped++
      continue
    }

    console.log(`  📦 Migrating: ${r2Key}`)
    const success = await migrateFile(item.url, r2Key)

    if (success) {
      // Update database URL to CDN
      await updateDatabaseUrl(item.table, item.column, item.id, item.url, r2Key)
      migrated++
    } else {
      failed++
    }

    // Rate limiting: kecilkan beban
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.log('\n✅ Migration complete!')
  console.log(`  📦 Migrated: ${migrated}`)
  console.log(`  ⏭️  Skipped (already exists): ${skipped}`)
  console.log(`  ❌ Failed: ${failed}`)
}

main().catch(console.error)
```

#### Cara Menjalankan Script

```bash
# Install dependency
npm install @aws-sdk/client-s3

# Jalankan migrasi (pastikan env variables sudah di-set)
npx tsx scripts/migrate-to-r2.ts
```

#### Safety Net: Rollback Strategy

Jika migrasi gagal atau ada masalah:

1. **CDN Worker sudah punya fallback** ke Supabase → gambar tetap bisa diakses
2. **Database backup** otomatis Supabase → bisa restore URL lama
3. Script bisa dijalankan ulang (idempotent — skip file yang sudah ada di R2)

---

## Risiko 3: Supabase RLS Tidak Berlaku di R2

### Analisis Bucket

| Bucket | Akses | Perlu RLS? |
|--------|-------|------------|
| `products` | Public | ❌ Tidak (gambar produk memang publik) |
| `banners` | Public | ❌ Tidak (banner hero memang publik) |
| `categories` | Public | ❌ Tidak |
| `collections` | Public | ❌ Tidak |
| `invoices` | **Private** | ✅ **Ya** — hanya pemilik order boleh lihat |

### Solusi untuk Bucket `invoices` (Private)

**Jangan migrasi invoices ke R2** — biarkan tetap di Supabase Storage karena:
1. Invoice jarang diakses (hanya saat user buka detail pesanan)
2. Egress-nya sangat kecil (file HTML < 50 KB)
3. RLS Supabase sudah melindunginya

**Atau**, jika tetap ingin di R2, gunakan **signed URLs via API route**:

```typescript
// src/app/api/v1/invoices/[orderNumber]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createServerClient } from '@/lib/supabase/server'

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params

  // 1. Verify user is authenticated
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Verify user owns this order (RLS equivalent)
  const { data: order } = await supabase
    .from('orders')
    .select('id, user_id')
    .eq('order_number', orderNumber)
    .single()

  if (!order || order.user_id !== user.id) {
    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // 3. Generate short-lived signed URL (5 menit)
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: `invoices/${orderNumber}.html`,
  })

  const signedUrl = await getSignedUrl(r2, command, { expiresIn: 300 })

  return NextResponse.json({ url: signedUrl })
}
```

**Update di client** ([OrderDetailClient.tsx](file:///d:/Aulia%20Project/benangbaju/src/app/(customer)/pesanan/[orderNumber]/OrderDetailClient.tsx)):

```typescript
// Ganti direct Supabase Storage access dengan API route
const res = await fetch(`/api/v1/invoices/${order.order_number}`)
const { url } = await res.json()
window.open(url, '_blank')
```

---

## 📋 Checklist Testing

Sebelum deploy ke production, pastikan test berikut:

### Upload Flow
- [ ] Admin upload gambar produk baru → URL di database = CDN URL
- [ ] Admin upload banner → URL = CDN URL
- [ ] Admin upload gambar kategori → URL = CDN URL
- [ ] Admin upload gambar koleksi → URL = CDN URL
- [ ] Admin upload banner flash sale → URL = CDN URL
- [ ] Customer upload foto review → URL = CDN URL
- [ ] Customer upload foto retur → URL = CDN URL

### Delete Flow
- [ ] Admin hapus gambar produk → file terhapus dari R2
- [ ] Admin hapus banner → file terhapus dari R2
- [ ] Admin hapus kategori → file terhapus dari R2
- [ ] Delete gambar Supabase lama → file terhapus dari Supabase Storage

### Display (CDN Worker)
- [ ] Gambar baru (R2) tampil via `cdn.benangbaju.com`
- [ ] Gambar lama (Supabase, belum migrasi) tetap tampil via fallback
- [ ] Gambar lama (sudah migrasi ke R2) tampil dari R2

### Security
- [ ] Invoice hanya bisa diakses oleh pemilik order
- [ ] Invoice bisa diakses oleh admin
- [ ] Unauthorized user dapat 403

### Performance
- [ ] Homepage load time ≤ 3 detik
- [ ] Product page load time ≤ 2 detik
- [ ] Supabase egress dashboard menunjukkan penurunan

---

## 🔄 Rollback Strategy

Jika ada masalah setelah migrasi:

### Level 1: Quick Rollback (5 menit)
```typescript
// storage.ts — revert ke Supabase
// Cukup restore file storage.ts dari git:
// git checkout HEAD -- src/lib/supabase/storage.ts
```

### Level 2: CDN Worker Rollback (2 menit)
```javascript
// Kembalikan CDN Worker ke versi lama (Supabase-only):
const targetUrl = `${SUPABASE_URL}/storage/v1/object/public${url.pathname}`;
// Hapus R2 lookup logic
```

### Level 3: Database URL Rollback
```sql
-- Rollback URL di database dari CDN ke Supabase (jika Step 5 migrasi dijalankan)
UPDATE product_images
SET url = REPLACE(url, 'https://cdn.benangbaju.com/', 'https://jwvbzuoatffoxaahdwdx.supabase.co/storage/v1/object/public/')
WHERE url LIKE 'https://cdn.benangbaju.com/%';

-- Repeat untuk tabel lain (banners, categories, collections, etc.)
```

> [!TIP]
> Karena CDN Worker punya **fallback ke Supabase**, rollback Level 1 sudah cukup untuk mengembalikan semua fungsi upload. Gambar yang sudah di-R2 tetap bisa diakses, dan upload baru akan masuk Supabase lagi.
