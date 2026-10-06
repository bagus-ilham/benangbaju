// Read-only audit: hitung URL gambar yang masih menunjuk ke Supabase Storage vs CDN (R2)
// Jalankan: node --env-file=.env.local scripts/audit-image-urls.mjs
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const targets = [
  ['product_images', ['url']],
  ['banners', ['image_url', 'image_mobile_url']],
  ['categories', ['image_url']],
  ['collections', ['image_url']],
  ['flash_sales', ['banner_url']],
  ['products', ['size_guide', 'care_guide']],
  ['review_media', ['url']],
]

for (const [table, cols] of targets) {
  const { data, error } = await supabase.from(table).select(cols.join(','))
  if (error) {
    console.log(`${table}: ERROR ${error.message}`)
    continue
  }
  for (const col of cols) {
    let sb = 0, cdn = 0, other = 0
    const samples = []
    for (const row of data) {
      const v = row[col]
      if (!v || typeof v !== 'string' || !v.startsWith('http')) continue
      if (v.includes('supabase.co/storage')) { sb++; if (samples.length < 2) samples.push(v) }
      else if (v.includes('cdn.benangbaju.com')) cdn++
      else other++
    }
    console.log(`${table}.${col}: supabase=${sb} cdn=${cdn} other=${other}`, samples)
  }
}

const { data: buckets } = await supabase.storage.listBuckets()
console.log('buckets:', buckets?.map((b) => `${b.name}(public=${b.public})`).join(', '))
