import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Menggunakan env URL atau langsung hardcode ke domain produksi
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://benangbaju.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',      // Cegah akses ke panel admin
        '/admin/',
        '/akun',       // Cegah akses ke profil pengguna
        '/akun/',
        '/cart',       // Cegah keranjang belanja di-index
        '/checkout',   // Cegah halaman pembayaran di-index
        '/api',        // Cegah indexing endpoint API
        '/api/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
