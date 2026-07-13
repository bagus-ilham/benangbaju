/**
 * A safe logger utility to prevent sensitive data leakage to the client console or production logs,
 * while still providing structured observability.
 */
export function safeLogError(context: string, error: unknown, ...args: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    // Detailed error logging is safe in local development
    console.error(context, error, ...args)
  } else {
    // In production, output structured JSON logs for external observability tools (e.g. Datadog, ELK)
    // Mask sensitive details but log the error name, message (if safe), and context.
    const errObj =
      error instanceof Error
        ? { name: error.name, message: error.message }
        : { message: 'Unknown error type' }

    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        context,
        error: errObj,
        // Note: intentionally avoiding logging full stack traces or args that might contain PII
      })
    )
  }
}
