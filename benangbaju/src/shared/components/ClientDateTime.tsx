'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react'
import { safeLogError } from '@/lib/logger'

interface ClientDateTimeProps {
  date: string | Date
  options?: Intl.DateTimeFormatOptions
  locale?: string
}

export function ClientDateTime({
  date,
  options,
  locale = 'id-ID',
}: ClientDateTimeProps): React.JSX.Element {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return empty placeholder during server-side rendering
    return <span className="opacity-0">...</span>
  }

  let formatted = ''
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    formatted = d.toLocaleString(locale, options)
  } catch (err) {
    safeLogError('ClientDateTime formatting error:', err)
    formatted = String(date)
  }

  return <span>{formatted}</span>
}
