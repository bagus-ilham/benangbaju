import { useEffect, useState } from 'react'

export function useDokuCheckoutScript() {
  const [isLoaded, setIsLoaded] = useState(() => {
    return typeof window !== 'undefined' && Boolean(window.loadJokulCheckout)
  })
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.loadJokulCheckout) {
      return
    }

    const scriptUrl =
      process.env.NEXT_PUBLIC_DOKU_CHECKOUT_JS_URL ||
      'https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js'
    
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${scriptUrl}"]`)

    if (existingScript) {
      const handleLoad = () => setIsLoaded(true)
      const handleError = () => setHasError(true)
      existingScript.addEventListener('load', handleLoad)
      existingScript.addEventListener('error', handleError)
      return () => {
        existingScript.removeEventListener('load', handleLoad)
        existingScript.removeEventListener('error', handleError)
      }
    }

    const script = document.createElement('script')
    script.src = scriptUrl
    script.async = true
    script.onload = () => setIsLoaded(true)
    script.onerror = () => setHasError(true)
    document.head.appendChild(script)
  }, [])

  return { isLoaded, hasError }
}
