'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { safeLogError } from '@/lib/logger'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    safeLogError('Uncaught component error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 border border-red-100 bg-red-50 text-red-700 text-xs font-sans rounded-none">
            <h4 className="font-semibold uppercase tracking-wider mb-1">Komponen Bermasalah</h4>
            <p>Gagal memuat komponen ini secara aman.</p>
          </div>
        )
      )
    }

    return this.props.children
  }
}
