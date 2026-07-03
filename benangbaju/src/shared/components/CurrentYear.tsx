'use client'

import { useState } from 'react'

export function CurrentYear(): React.JSX.Element {
  const [year] = useState(() => new Date().getFullYear())

  return <>{year}</>
}
