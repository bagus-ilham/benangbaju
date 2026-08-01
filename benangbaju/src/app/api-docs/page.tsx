'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'

const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => <div className="p-10 text-center">Loading Swagger UI...</div>,
})

export default function ApiDocsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [spec, setSpec] = useState<any>(null)

  useEffect(() => {
    fetch('/api/docs')
      .then((res) => res.json())
      .then((data) => setSpec(data))
      .catch((err) => console.error('Failed to load API spec:', err))
  }, [])

  if (!spec) {
    return <div className="p-10 text-center">Loading API Documentation...</div>
  }

  return (
    <div className="bg-brand-cream min-h-screen">
      <SwaggerUI spec={spec} />
    </div>
  )
}
