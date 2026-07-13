export async function invokeWithRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: any
  for (let i = 0; i < retries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, i)))
      }
    }
  }
  throw lastError
}
