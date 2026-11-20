import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { SupabaseClient } from '@supabase/supabase-js'
import { safeLogError } from '../logger'
import { CDN_BASE_URL } from '@/lib/constants'

const R2_BUCKET = process.env.R2_BUCKET_NAME || 'benangbaju-assets'

function getR2Client(): S3Client | null {
  if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    return null
  }
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  })
}

/**
 * Server-side image deletion helper.
 * Deletes R2 CDN assets directly via S3 SDK (avoiding relative fetch('/api/v1/upload') in Node.js)
 * and deletes legacy Supabase Storage assets via the provided Supabase client.
 */
export async function deleteImageByUrlServer(
  supabase: SupabaseClient,
  url: string,
  bucket: string = 'products'
): Promise<void> {
  try {
    if (!url) return

    if (url.startsWith(`${CDN_BASE_URL}/`)) {
      const key = url.slice(`${CDN_BASE_URL}/`.length)
      if (!key || key.includes('..') || key.startsWith('/') || key.includes('\\')) return

      const r2 = getR2Client()
      if (!r2) {
        safeLogError('R2 credentials missing for server-side delete', { key })
        return
      }

      await r2.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
        })
      )
    } else if (url.includes('supabase.co/storage')) {
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
    safeLogError('Error in deleteImageByUrlServer:', err)
  }
}
