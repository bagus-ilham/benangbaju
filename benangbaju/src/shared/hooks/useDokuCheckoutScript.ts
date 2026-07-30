import { useEffect, useState } from 'react'

export function useDokuCheckoutScript() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const scriptUrl =
      process.env.NEXT_PUBLIC_DOKU_CHECKOUT_JS_URL ||
      'https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js'
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${scriptUrl}"]`)

    if (existingScript) {
      setIsLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = scriptUrl
    script.async = true
    script.onload = () => setIsLoaded(true)
    script.onerror = () => setHasError(true)
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  return { isLoaded, hasError }
}
