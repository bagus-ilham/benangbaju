import { safeLogError } from './logger'

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_MIDTRANS_CLIENT_KEY',
  'NEXT_PUBLIC_MIDTRANS_SNAP_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_BASE_URL',
] as const

const serverEnvVars = ['MIDTRANS_SERVER_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'ERP_API_KEY'] as const

export function validateEnv(): void {
  const missing: string[] = requiredEnvVars.filter((key) => {
    const value = process.env[key]
    return !value || value.trim() === ''
  })

  // Validate server-only variables if running in Node environment
  if (typeof window === 'undefined') {
    const missingServer = serverEnvVars.filter((key) => {
      const value = process.env[key]
      return !value || value.trim() === ''
    })
    missing.push(...missingServer)
  }

  if (missing.length > 0) {
    const errorMessage =
      `❌ [Env Validation] Missing required environment variables:\n` +
      missing.map((key) => `   - ${key}`).join('\n') +
      `\n\nPlease check your .env.local file.`

    safeLogError('[Env Validation]', errorMessage)
    const hasMissingServer = serverEnvVars.some((key) => missing.includes(key))
    if (hasMissingServer) {
      // Throw error if server secrets are missing even during build
      throw new Error(errorMessage)
    } else {
      if (process.env.npm_lifecycle_event !== 'build') {
        throw new Error(errorMessage)
      }
    }
  }
}

// Automatically validate when imported in server-side context
if (typeof window === 'undefined') {
  validateEnv()
}
