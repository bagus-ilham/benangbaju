const baseUrl = (process.env.PA11Y_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

module.exports = {
  defaults: {
    standard: 'WCAG2AA',
    timeout: 60000,
    chromeLaunchConfig: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  },
  urls: [
    // Core Customer Pages
    `${baseUrl}/`,
    `${baseUrl}/cara-belanja`,
    `${baseUrl}/cart`,
    `${baseUrl}/checkout`,
    `${baseUrl}/daftar`,
    `${baseUrl}/flash-sale`,
    `${baseUrl}/kategori`,
    `${baseUrl}/kebijakan-privasi`,
    `${baseUrl}/koleksi`,
    `${baseUrl}/kontak`,
    `${baseUrl}/lupa-password`,
    `${baseUrl}/masuk`,
    `${baseUrl}/pengiriman`,
    `${baseUrl}/produk`,
    `${baseUrl}/reset-password`,
    `${baseUrl}/retur`,
    `${baseUrl}/search`,
    `${baseUrl}/syarat-ketentuan`,
    `${baseUrl}/tentang`,
    `${baseUrl}/wishlist`,

    // Sample Dynamic Category & Collection Pages
    `${baseUrl}/kategori/bye-bye-stock`,
    `${baseUrl}/kategori/curated-by-benangbaju`,
    `${baseUrl}/koleksi/two-way-top`,
    `${baseUrl}/koleksi/denim-days`,

    // Sample Dynamic Product Pages
    `${baseUrl}/produk/muse-shirt`,
    `${baseUrl}/produk/time-to-time-shirt`,

    // Authenticated Customer Pages (Note: audits login page redirect unless session cookie/headers are provided)
    `${baseUrl}/akun`,
    `${baseUrl}/akun/alamat`,
    `${baseUrl}/akun/notifikasi`,
    `${baseUrl}/pesanan`,
    `${baseUrl}/pesanan/ORD12345`,
    `${baseUrl}/pesanan/ORD12345/retur`,

    // Admin Dashboard Pages (Note: audits login page redirect unless session cookie/headers are provided)
    `${baseUrl}/admin`,
    `${baseUrl}/admin/analytics`,
    `${baseUrl}/admin/banner`,
    `${baseUrl}/admin/cms`,
    `${baseUrl}/admin/flash-sale`,
    `${baseUrl}/admin/kategori`,
    `${baseUrl}/admin/koleksi`,
    `${baseUrl}/admin/pelanggan`,
    `${baseUrl}/admin/pelanggan/1`,
    `${baseUrl}/admin/pengaturan`,
    `${baseUrl}/admin/pengiriman`,
    `${baseUrl}/admin/pesanan`,
    `${baseUrl}/admin/pesanan/ORD12345`,
    `${baseUrl}/admin/produk`,
    `${baseUrl}/admin/produk/1`,
    `${baseUrl}/admin/produk/tambah`,
    `${baseUrl}/admin/review`,
    `${baseUrl}/admin/stok-harga`,
    `${baseUrl}/admin/voucher`,
  ],
}
