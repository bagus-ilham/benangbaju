export function getProxiedImageUrl(originalUrl: string | null | undefined): string {
  if (!originalUrl) return '/images/placeholder.jpg'; // Gambar default jika URL kosong

  // URL asli Supabase Storage yang digunakan di aplikasi
  const SUPABASE_STORAGE_URL = 'https://jwvbzuoatffoxaahdwdx.supabase.co/storage/v1/object/public/produk';
  
  // URL Cloudflare CDN Anda (pilih salah satu sebagai yang utama)
  const WORKER_URL = 'https://cdn.benangbaju.com';

  // Jika URL-nya mengandung URL Supabase produk, ganti dengan URL Worker
  if (originalUrl.startsWith(SUPABASE_STORAGE_URL)) {
    return originalUrl.replace(SUPABASE_STORAGE_URL, WORKER_URL);
  }

  // Khusus environment development (localhost) Supabase storage fallback
  if (originalUrl.startsWith('http://127.0.0.1:54321/storage/v1/object/public/produk')) {
      return originalUrl;
  }

  return originalUrl;
}
