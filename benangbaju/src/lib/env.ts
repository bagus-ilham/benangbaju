const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_MIDTRANS_CLIENT_KEY',
  'NEXT_PUBLIC_MIDTRANS_SNAP_URL',
  'NEXT_PUBLIC_APP_URL',
] as const

export function validateEnv() : void {
  const missing = requiredEnvVars.filter((key) => {
    const value = process.env[key]
    return !value || value.trim() === ''
  })

  if (missing.length > 0) {
    const errorMessage =
      `❌ [Env Validation] Missing required environment variables:\n` +
      missing.map((key) => `   - ${key}`).join('\n') +
      `\n\nPlease check your .env.local file.`

    console.error(errorMessage)
    throw new Error(errorMessage)
  }
}

// Automatically validate when imported in server-side context
if (typeof window === 'undefined') {
  validateEnv()
}
