import { SupabaseClient } from '@supabase/supabase-js'
import { safeLogError } from '../logger'
import { createBrowserClient } from './client'

/**
 * Uploads an image file to Supabase Storage and returns its public URL.
 * @param file The file to upload
 * @param bucket The storage bucket name (defaults to 'products')
 */
export async function uploadImage(file: File, bucket: string = 'products'): Promise<string> {
  const supabase = createBrowserClient()
  const targetBucket = bucket.toLowerCase()

  // Generate unique filename with timestamp & random suffix to bypass CDN/edge cache on re-uploads
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const baseName = file.name.substring(0, file.name.lastIndexOf('.')).replace(/[^a-zA-Z0-9_-]/g, '_')
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const fileName = `${timestamp}_${randomSuffix}_${baseName}.${ext}`

  const { error } = await supabase.storage.from(targetBucket).upload(fileName, file, {
    cacheControl: '31536000',
    upsert: true,
  })

  if (error) {
    safeLogError('Storage upload error', error)
    throw new Error(
      'Gagal mengunggah gambar. Silakan periksa ukuran dan format gambar atau coba lagi nanti.'
    )
  }

  const { data: urlData } = supabase.storage.from(targetBucket).getPublicUrl(fileName)

  if (!urlData?.publicUrl) {
    throw new Error('Gagal mendapatkan URL publik dari file.')
  }

  return urlData.publicUrl
}

/**
 * Deletes an image from Supabase Storage using its public URL.
 * @param supabase The Supabase client instance
 * @param url The public URL of the image
 * @param bucket The storage bucket name (defaults to 'products')
 */
export async function deleteImageByUrl(
  supabase: SupabaseClient,
  url: string,
  bucket: string = 'products'
): Promise<void> {
  try {
    if (!url) return

    // Remove query parameters if present (e.g. ?v=123)
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
  } catch (err) {
    safeLogError('Error in deleteImageByUrl:', err)
  }
}
