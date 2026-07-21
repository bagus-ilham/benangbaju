import { useEffect } from 'react'

export function useDokuCheckoutScript() {
  useEffect(() => {
    const scriptUrl =
      process.env.NEXT_PUBLIC_DOKU_CHECKOUT_JS_URL ||
      'https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js'
    const existingScript = document.querySelector(`script[src="${scriptUrl}"]`)

    if (!existingScript) {
      const script = document.createElement('script')
      script.src = scriptUrl
      script.async = true
      document.body.appendChild(script)
    }
  }, [])
}
