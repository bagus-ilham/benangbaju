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

  // Clean file name to prevent issues with special characters
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const fileName = `${crypto.randomUUID()}_${cleanName}`

  const { error } = await supabase.storage.from(targetBucket).upload(fileName, file, {
    cacheControl: '3600',
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

    // Extract file name from URL: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<filename>
    const urlParts = url.split('/')
    const fileName = urlParts[urlParts.length - 1]

    if (!fileName) return

    const { error } = await supabase.storage.from(bucket).remove([fileName])
    if (error) {
      safeLogError(`Failed to delete image ${fileName} from ${bucket}:`, error.message)
    }
  } catch (err) {
    safeLogError('Error in deleteImageByUrl:', err)
  }
}
