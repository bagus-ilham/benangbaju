'use client'

import { useState, useEffect } from 'react'

export function CurrentYear() {
  const [year, setYear] = useState<number>(2026)
  
  useEffect(() => {
    setYear(new Date().getFullYear())
  }, [])
  
  return <>{year}</>
}
