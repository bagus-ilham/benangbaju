import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/siteUrl'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin', // Cegah akses ke panel admin
        '/admin/',
        '/akun', // Cegah akses ke profil pengguna
        '/akun/',
        '/cart', // Cegah keranjang belanja di-index
        '/checkout', // Cegah halaman pembayaran di-index
        '/api', // Cegah indexing endpoint API
        '/api/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
