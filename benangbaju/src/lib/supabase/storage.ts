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
  const fileName = `${Date.now()}_${cleanName}`
  
  const { data, error } = await supabase.storage
    .from(targetBucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (error) {
    console.error('Storage upload error details:', error)
    // Check for common errors like missing bucket or permission issues
    if (error.message.includes('Bucket not found') || (error as any).status === 404) {
      throw new Error(
        `Bucket "${targetBucket}" tidak ditemukan. Silakan buat bucket bernama "${targetBucket}" (dengan centang "Public") di dashboard Supabase Anda terlebih dahulu.`
      )
    }
    if (error.message.includes('row-level security') || error.message.includes('policy')) {
      throw new Error(
        `Gagal mengunggah. Pastikan bucket "${targetBucket}" memiliki policy RLS yang mengizinkan unggah (insert/select) untuk pengguna anonim/terautentikasi.`
      )
    }
    throw new Error(error.message || 'Gagal mengunggah gambar.')
  }

  const { data: urlData } = supabase.storage
    .from(targetBucket)
    .getPublicUrl(fileName)

  if (!urlData?.publicUrl) {
    throw new Error('Gagal mendapatkan URL publik dari file.')
  }

  return urlData.publicUrl
}
