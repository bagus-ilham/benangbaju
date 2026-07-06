/**
 * A safe logger utility to prevent sensitive data leakage to the client console or production logs.
 */
export function safeLogError(context: string, error: unknown, ...args: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    // Detailed error logging is safe in local development
    console.error(context, error, ...args)
  } else {
    // In production, mask the actual error object to prevent data leakage
    console.error(`${context}: [Error details masked in production]`)
  }
}
