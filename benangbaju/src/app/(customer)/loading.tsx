import React from 'react'
import { AuthLoading } from '@/shared/components/AuthLoading'

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center min-h-[60vh] bg-white">
      <AuthLoading message="Memuat halaman..." fullScreen={false} />
    </div>
  )
}
