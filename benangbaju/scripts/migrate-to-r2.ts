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

// === STEP 5: Update URL di database ===
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

  // Validate env vars
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set')
    process.exit(1)
  }
  if (!R2_ENDPOINT || !R2_ACCESS_KEY || !R2_SECRET_KEY) {
    console.error('❌ R2 environment variables (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) are not set')
    process.exit(1)
  }

  const allUrls = await collectAllImageUrls()
  console.log(`📊 Found ${allUrls.length} image URLs to migrate\n`)

  // Filter hanya URL Supabase Storage
  const supabaseUrls = allUrls.filter((u) => u.url.startsWith(SUPABASE_STORAGE_PREFIX))
  console.log(`🔍 ${supabaseUrls.length} are Supabase Storage URLs (will migrate)\n`)

  const alreadyCdn = allUrls.filter((u) => u.url.startsWith(CDN_URL))
  if (alreadyCdn.length > 0) {
    console.log(`✅ ${alreadyCdn.length} already using CDN URLs (skipped)\n`)
  }

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
