import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { createServerClient } from '@/lib/supabase/server'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
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
