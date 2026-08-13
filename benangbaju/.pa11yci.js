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
    `${baseUrl}/`,
    `${baseUrl}/produk`,
    `${baseUrl}/masuk`,
    `${baseUrl}/daftar`,
    `${baseUrl}/tentang`,
    `${baseUrl}/kontak`,
  ],
}
