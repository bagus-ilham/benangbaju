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

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
}

const CUSTOMER_ALLOWED_FOLDERS = new Set(['returns', 'reviews', 'avatars'])
const ADMIN_ALLOWED_FOLDERS = new Set([
  'products',
  'banners',
  'categories',
  'collections',
  'flash-sales',
  'cms',
  'returns',
  'reviews',
  'avatars',
])

function hasValidImageMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false
  switch (mimeType) {
    case 'image/jpeg':
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
    case 'image/png':
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      )
    case 'image/gif': {
      const header = buffer.subarray(0, 6).toString('ascii')
      return header === 'GIF87a' || header === 'GIF89a'
    }
    case 'image/webp':
      return (
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
      )
    case 'image/avif':
      return buffer.subarray(4, 8).toString('ascii') === 'ftyp'
    default:
      return false
  }
}

export async function POST(request: NextRequest) {
  // 1. Verify user is authenticated and active
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (profile?.is_active === false) {
    return NextResponse.json({ error: 'Akun telah dinonaktifkan' }, { status: 403 })
  }

  const role = profile?.role?.toLowerCase()
  const isAdmin = role === 'admin' || role === 'staff'

  // 2. Parse form data & validate folder allowlist
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const rawFolder = ((formData.get('folder') as string) || '').trim().toLowerCase()
  const folder = rawFolder || (isAdmin ? 'products' : '')

  const allowedFolders = isAdmin ? ADMIN_ALLOWED_FOLDERS : CUSTOMER_ALLOWED_FOLDERS
  if (!folder || !allowedFolders.has(folder)) {
    return NextResponse.json({ error: 'Folder unggahan tidak diizinkan' }, { status: 403 })
  }

  if (!file || typeof file.arrayBuffer !== 'function') {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // 3. Validate file type, size, and magic bytes
  const ext = MIME_TO_EXT[file.type]
  if (!ext) {
    return NextResponse.json({ error: 'Tipe file tidak didukung' }, { status: 400 })
  }
  if (file.size === 0 || file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Ukuran file harus antara 1 byte hingga 5 MB' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  if (!hasValidImageMagicBytes(buffer, file.type)) {
    return NextResponse.json(
      { error: 'Isi file tidak sesuai dengan format gambar yang diizinkan' },
      { status: 400 }
    )
  }

  // 4. Generate unique filename using MIME-derived extension (never client filename extension)
  const lastDot = file.name.lastIndexOf('.')
  const rawBaseName = lastDot > 0 ? file.name.substring(0, lastDot) : file.name
  const baseName = rawBaseName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60) || 'image'
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const key = `${folder}/${timestamp}_${randomSuffix}_${baseName}.${ext}`

  // 5. Upload to R2
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      CacheControl: 'public, max-age=31536000',
    })
  )

  // 6. Return CDN URL (same structure as before: cdn.benangbaju.com/<folder>/<filename>)
  const publicUrl = `${CDN_BASE_URL}/${key}`
  return NextResponse.json({ url: publicUrl })
}

// DELETE endpoint for admin/staff cleanup
export async function DELETE(request: NextRequest) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  const role = profile?.role?.toLowerCase()
  if (profile?.is_active === false || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { url } = await request.json()
  if (typeof url !== 'string' || !url.startsWith(`${CDN_BASE_URL}/`)) {
    return NextResponse.json({ error: 'Invalid CDN URL' }, { status: 400 })
  }

  // Extract key from CDN URL and block traversal
  const key = url.slice(`${CDN_BASE_URL}/`.length)
  if (!key || key.includes('..') || key.startsWith('/') || key.includes('\\')) {
    return NextResponse.json({ error: 'Invalid asset key' }, { status: 400 })
  }

  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      })
    )
  } catch (err) {
    console.error('R2 delete error:', err)
    // Don't throw — best effort cleanup
  }

  return NextResponse.json({ success: true })
}
