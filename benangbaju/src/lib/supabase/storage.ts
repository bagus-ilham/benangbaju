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
 * Handles both CDN URLs (R2) and legacy Supabase URLs.
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
