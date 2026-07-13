'use client'

import { useEffect, useState } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

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
    <div className="bg-white min-h-screen">
      <SwaggerUI spec={spec} />
    </div>
  )
}
